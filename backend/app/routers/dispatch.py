"""Admin dispatch: queue, detail, recommendations, assign/reassign/schedule,
forced status, dashboard, plumber roster + availability. All admin-only."""
from datetime import date, datetime

from fastapi import APIRouter, Depends, Query

from app.database import get_supabase, require_booking_schema
from app.middleware.auth_middleware import require_admin
from app.schemas.assignment import AssignIn, ReassignIn, ScheduleIn, AssignOut
from app.schemas.booking import StatusChange
from app.schemas.plumber import PlumberOut, PlumberRecommendation
from app.services import assignment_service, booking_service, plumber_matching_service
from app.services.errors import NotFoundError, ValidationAppError

router = APIRouter(prefix="/api/admin", tags=["dispatch"], dependencies=[Depends(require_booking_schema)])

_ACTIVE_STATUSES = ("scheduled", "assigned", "accepted", "en_route", "arrived", "in_progress", "awaiting_approval")


@router.get("/bookings")
def admin_bookings(status: str | None = Query(default=None), q: str | None = None,
                   user=Depends(require_admin)):
    db = get_supabase()
    query = db.table("bookings").select("*")
    if status:
        query = query.eq("status", status)
    res = query.order("created_at", desc=True).limit(100).execute()
    rows = res.data or []
    if q:
        ql = q.lower()
        rows = [b for b in rows if ql in (b.get("title") or "").lower()
                or ql in (b.get("booking_number") or "").lower()
                or ql in (b.get("address") or "").lower()]
    return rows


@router.get("/bookings/{booking_id}")
def admin_booking(booking_id: str, user=Depends(require_admin)):
    db = get_supabase()
    booking = booking_service.get_booking(db, booking_id, user.user.id, "admin")
    work = db.table("work_orders").select("*").eq("booking_id", booking_id).execute().data
    work_detail = None
    if work:
        from app.services.work_order_service import get_work_order_detail
        work_detail = get_work_order_detail(db, str(work[0]["id"]), user.user.id, "admin")
    plumber_name = booking_service.get_assigned_plumber_name(db, booking.get("assigned_plumber_id"))
    customer = db.table("customers").select("*").eq("id", booking["customer_id"]).execute().data
    return {
        "booking": booking,
        "work_order": work_detail,
        "plumber_name": plumber_name,
        "customer": customer[0] if customer else None,
        "timeline": booking_service.get_timeline(db, booking_id),
    }


@router.get("/plumbers/recommended", response_model=list[PlumberRecommendation])
def recommended_plumbers(booking_id: str, user=Depends(require_admin)):
    db = get_supabase()
    booking = booking_service.get_booking(db, booking_id, user.user.id, "admin")
    return plumber_matching_service.recommend(db, booking)


@router.post("/bookings/{booking_id}/assign", response_model=AssignOut)
def assign_plumber(booking_id: str, body: AssignIn, user=Depends(require_admin)):
    db = get_supabase()
    return assignment_service.assign(db, booking_id, str(body.plumber_id), user.user.id, "admin",
                                     body.scheduled_start_at, body.scheduled_end_at)


@router.post("/bookings/{booking_id}/reassign")
def reassign_plumber(booking_id: str, body: ReassignIn, user=Depends(require_admin)):
    db = get_supabase()
    return assignment_service.reassign(db, booking_id, str(body.plumber_id), user.user.id, "admin",
                                       body.scheduled_start_at, body.scheduled_end_at)


@router.post("/bookings/{booking_id}/schedule")
def schedule_booking(booking_id: str, body: ScheduleIn, user=Depends(require_admin)):
    db = get_supabase()
    return assignment_service.schedule(db, booking_id, body.scheduled_start_at, body.scheduled_end_at,
                                       user.user.id, "admin")


@router.post("/bookings/{booking_id}/status")
def admin_status(booking_id: str, body: StatusChange, user=Depends(require_admin)):
    db = get_supabase()
    booking = booking_service.get_booking(db, booking_id, user.user.id, "admin")
    return booking_service.transition_booking(db, booking, body.to_status, user.user.id, "admin")


@router.post("/bookings/{booking_id}/cancel")
def admin_cancel(booking_id: str, user=Depends(require_admin)):
    db = get_supabase()
    booking = booking_service.get_booking(db, booking_id, user.user.id, "admin")
    return booking_service.cancel_booking(db, booking, user.user.id, "admin", "Cancelled by admin")


@router.get("/dashboard")
def dashboard(user=Depends(require_admin)):
    db = get_supabase()
    counts: dict[str, int] = {}
    for label, statuses in (
        ("pending", ["pending"]),
        ("unassigned", ["pending", "admin_review"]),
        ("today", ["scheduled"]),
        ("active", list(_ACTIVE_STATUSES)),
        ("completed", ["completed", "customer_confirmed"]),
        ("cancelled", ["cancelled"]),
        ("rejected", ["rejected"]),
    ):
        query = db.table("bookings").select("id")
        if len(statuses) == 1:
            query = query.eq("status", statuses[0])
        else:
            query = query.in_("status", statuses)
        counts[label] = len(query.execute().data)
    return counts


@router.get("/plumbers", response_model=list[PlumberOut])
def admin_plumbers(user=Depends(require_admin)):
    db = get_supabase()
    return db.table("plumbers").select("*").order("created_at").execute().data


@router.post("/plumbers/{plumber_id}/verify")
def verify_plumber(plumber_id: str, user=Depends(require_admin)):
    """Activate a pending plumber. Only from 'pending' → 'available'."""
    from app.services import audit_service
    db = get_supabase()
    res = db.table("plumbers").select("*").eq("id", plumber_id).execute()
    if not res.data:
        raise NotFoundError("Plumber not found")
    pl = res.data[0]
    if pl.get("status") != "pending":
        raise ValidationAppError("Only a pending plumber can be verified.")
    now = audit_service.utcnow_iso()
    db.table("plumbers").update({"status": "available", "updated_at": now}).eq("id", plumber_id).execute()
    audit_service.record(user.user.id, "plumber_verified", "plumber", plumber_id,
                         {"status": "pending"}, {"status": "available"})
    return {"id": plumber_id, "status": "available"}


@router.get("/plumbers/{plumber_id}/availability")
def plumber_availability(plumber_id: str, on_date: date | None = Query(default=None),
                         user=Depends(require_admin)):
    db = get_supabase()
    query = db.table("plumber_availability").select("*").eq("plumber_id", plumber_id)
    if on_date:
        query = query.eq("date", on_date.isoformat())
    res = query.order("date").execute()
    return {"plumber_id": plumber_id, "availability": res.data}
