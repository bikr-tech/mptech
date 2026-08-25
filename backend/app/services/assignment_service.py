"""Admin assignment / reassignment / scheduling.

Guards (spec §12):
  plumber exists → active → required skills → no schedule conflict
  → within service radius → workload acceptable
The final assignment writes bookings.assigned_plumber_id, creates the work_order,
and transitions scheduled→assigned. Double-booking is refused even if two admins
race (DB trigger reject_booking_overlap_trigger is the hard backstop)."""
from datetime import datetime, timedelta

from app.database import get_supabase
from . import audit_service, booking_service
from .booking_status_service import assert_transition
from .errors import NotFoundError, PlumberUnavailableError, ScheduleConflictError, InvalidOperationError
from .plumber_matching_service import verify_assignment
from .booking_notifications import notify_booking_assigned, notify_booking_scheduled

DEFAULT_TRAVEL_BUFFER_MIN = 30


def _window_from(booking: dict, start=None, end=None):
    """Resolve an explicit window, else the booking's preferred date/time."""
    if start and end:
        return start, end
    date = booking.get("preferred_date")
    s = booking.get("preferred_start_time")
    e = booking.get("preferred_end_time")
    if not (date and s and e):
        return None, None
    s = f"{s.hour:02d}:{s.minute:02d}" if hasattr(s, "hour") else str(s)
    e = f"{e.hour:02d}:{e.minute:02d}" if hasattr(e, "hour") else str(e)
    return datetime.fromisoformat(f"{date}T{s}"), datetime.fromisoformat(f"{date}T{e}")


def assign(db, booking_id: str, plumber_id: str, actor_id: str, actor_role: str,
           scheduled_start_at=None, scheduled_end_at=None) -> dict:
    if str(booking_id) == str(plumber_id):
        raise InvalidOperationError("Invalid assignment.")
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        raise NotFoundError("Booking not found")
    booking = booking_res.data[0]

    if booking["status"] in ("completed", "customer_confirmed", "cancelled", "rejected"):
        raise InvalidOperationError("Cannot assign a closed booking.")

    ok, msg = verify_assignment(db, booking, plumber_id)
    if not ok:
        raise PlumberUnavailableError(msg)

    start, end = _window_from(booking, scheduled_start_at, scheduled_end_at)
    if start and end and _schedule_conflict(db, plumber_id, start, end, str(booking_id)):
        raise ScheduleConflictError()

    if booking["status"] == "pending":
        assert_transition(booking["status"], "admin_review")
        db.table("bookings").update({"status": "admin_review", "updated_at": audit_service.utcnow_iso()}) \
            .eq("id", booking_id).execute()
        booking["status"] = "admin_review"
    if booking["status"] == "admin_review":
        assert_transition(booking["status"], "scheduled")
        db.table("bookings").update({"status": "scheduled", "updated_at": audit_service.utcnow_iso()}) \
            .eq("id", booking_id).execute()
        booking["status"] = "scheduled"

    assert_transition(booking["status"], "assigned")

    now = audit_service.utcnow_iso()
    db.table("bookings").update({
        "assigned_plumber_id": plumber_id,
        "status": "assigned",
        "updated_at": now,
    }).eq("id", booking_id).execute()

    # Create the work order (assigned status) — idempotent per booking (UNIQUE booking_id).
    wo_res = db.table("work_orders").select("id").eq("booking_id", booking_id).execute()
    if wo_res.data:
        db.table("work_orders").update({
            "assigned_plumber_id": plumber_id,
            "status": "assigned",
            "scheduled_start_at": start.isoformat() if start else None,
            "scheduled_end_at": end.isoformat() if end else None,
            "updated_at": now,
        }).eq("id", wo_res.data[0]["id"]).execute()
        work_order_id = wo_res.data[0]["id"]
    else:
        wo_res = db.table("work_orders").insert({
            "booking_id": booking_id,
            "assigned_plumber_id": plumber_id,
            "title": booking.get("title", ""),
            "description": booking.get("description", ""),
            "priority": _priority_from_urgency(booking.get("urgency", "medium")),
            "status": "assigned",
            "scheduled_start_at": start.isoformat() if start else None,
            "scheduled_end_at": end.isoformat() if end else None,
        }).execute()
        if not wo_res.data:
            raise InvalidOperationError("Failed to create work order")
        work_order_id = wo_res.data[0]["id"]

    audit_service.record(actor_id, "booking_assigned", "booking", booking_id,
                         {"assigned_plumber_id": None}, {"assigned_plumber_id": plumber_id})
    audit_service.record_status(booking_id, "scheduled", "assigned", actor_id, actor_role)
    plumber_name = booking_service.get_assigned_plumber_name(db, plumber_id)

    # Enqueue assignment notifications (async, fire-and-forget)
    try:
        import asyncio
        asyncio.create_task(notify_booking_assigned(booking_id, plumber_id, start, end))
    except RuntimeError:
        pass

    return {
        "booking_id": booking_id,
        "booking_number": booking.get("booking_number"),
        "plumber_id": plumber_id,
        "plumber_name": plumber_name,
        "status": "assigned",
        "work_order_id": work_order_id,
    }


def reassign(db, booking_id: str, plumber_id: str, actor_id: str, actor_role: str,
             scheduled_start_at=None, scheduled_end_at=None) -> dict:
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        raise NotFoundError("Booking not found")
    booking = booking_res.data[0]
    if booking["status"] not in ("scheduled", "assigned", "accepted", "en_route", "arrived"):
        raise InvalidOperationError("Booking cannot be reassigned in its current state.")

    ok, msg = verify_assignment(db, booking, plumber_id)
    if not ok:
        raise PlumberUnavailableError(msg)

    start, end = _window_from(booking, scheduled_start_at, scheduled_end_at)
    if start and end and _schedule_conflict(db, plumber_id, start, end, str(booking_id)):
        raise ScheduleConflictError()

    now = audit_service.utcnow_iso()
    old = booking.get("assigned_plumber_id")
    db.table("bookings").update({
        "assigned_plumber_id": plumber_id,
        "updated_at": now,
    }).eq("id", booking_id).execute()
    db.table("work_orders").update({
        "assigned_plumber_id": plumber_id,
        "scheduled_start_at": start.isoformat() if start else None,
        "scheduled_end_at": end.isoformat() if end else None,
        "updated_at": now,
    }).eq("booking_id", booking_id).execute()

    audit_service.record(actor_id, "booking_reassigned", "booking", booking_id,
                         {"assigned_plumber_id": old}, {"assigned_plumber_id": plumber_id})
    plumber_name = booking_service.get_assigned_plumber_name(db, plumber_id)

    # Enqueue reassignment notifications
    try:
        import asyncio
        asyncio.create_task(notify_booking_assigned(booking_id, plumber_id, start, end))
    except RuntimeError:
        pass

    return {"booking_id": booking_id, "plumber_id": plumber_id, "plumber_name": plumber_name, "status": booking["status"]}


def schedule(db, booking_id: str, scheduled_start_at, scheduled_end_at, actor_id: str, actor_role: str) -> dict:
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        raise NotFoundError("Booking not found")
    booking = booking_res.data[0]

    if booking["status"] not in ("pending", "admin_review", "scheduled", "assigned"):
        raise InvalidOperationError("Booking cannot be scheduled in its current state.")

    if booking["status"] == "pending":
        db.table("bookings").update({"status": "admin_review", "updated_at": audit_service.utcnow_iso()}) \
            .eq("id", booking_id).execute()
        booking["status"] = "admin_review"
    if booking["status"] == "admin_review":
        db.table("bookings").update({"status": "scheduled", "updated_at": audit_service.utcnow_iso()}) \
            .eq("id", booking_id).execute()
        booking["status"] = "scheduled"

    now = audit_service.utcnow_iso()
    db.table("bookings").update({
        "status": "scheduled",
        "preferred_date": scheduled_start_at.date().isoformat(),
        "preferred_start_time": scheduled_start_at.time().isoformat()[:8],
        "preferred_end_time": scheduled_end_at.time().isoformat()[:8],
        "updated_at": now,
    }).eq("id", booking_id).execute()

    wo_res = db.table("work_orders").select("id").eq("booking_id", booking_id).execute()
    if wo_res.data:
        db.table("work_orders").update({
            "scheduled_start_at": scheduled_start_at.isoformat(),
            "scheduled_end_at": scheduled_end_at.isoformat(),
            "updated_at": now,
        }).eq("id", wo_res.data[0]["id"]).execute()

    audit_service.record(actor_id, "booking_scheduled", "booking", booking_id,
                         None, {"scheduled_start_at": scheduled_start_at.isoformat(),
                                "scheduled_end_at": scheduled_end_at.isoformat()})
    audit_service.record_status(booking_id, booking["status"], "scheduled", actor_id, actor_role)

    # Enqueue scheduling notifications
    is_reschedule = booking["status"] == "scheduled"
    try:
        import asyncio
        asyncio.create_task(notify_booking_scheduled(booking_id, scheduled_start_at, scheduled_end_at, is_reschedule))
    except RuntimeError:
        pass

    return {"booking_id": booking_id, "status": "scheduled",
            "scheduled_start_at": scheduled_start_at.isoformat(), "scheduled_end_at": scheduled_end_at.isoformat()}


def _notify_plumber(db, booking: dict, plumber_id: str, start, end) -> None:
    """Legacy email function - kept for backward compatibility but notifications now handled by booking_notifications."""
    pass


def _naive(dt) -> datetime | None:
    """Strip tzinfo so comparisons against naive preferred datetimes match."""
    if dt is None:
        return None
    return dt.replace(tzinfo=None) if dt.tzinfo else dt


def _notify_customer(db, booking: dict, start, end) -> None:
    """Legacy email function - kept for backward compatibility but notifications now handled by booking_notifications."""
    pass


def _priority_from_urgency(urgency: str) -> str:
    return {"low": "low", "medium": "normal", "high": "high", "emergency": "emergency"}.get(urgency, "normal")


def _schedule_conflict(db, plumber_id, start, end, exclude_booking_id):
    from .availability_service import schedule_conflict as _sc
    return _sc(db, plumber_id, start, end, exclude_booking_id)
