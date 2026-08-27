"""Customer booking endpoints. Identity is resolved from the JWT; a customer can
only ever see/act on their own bookings (IDOR guard via booking_service)."""
from fastapi import APIRouter, Depends, Query

from app.database import get_supabase, require_booking_schema
from app.middleware.auth_middleware import get_current_user, require_customer_or_admin
from app.schemas.booking import BookingCreate, BookingOut, BookingCancelIn, StatusChange
from app.schemas.additional_work import AdditionalWorkDecisionIn
from app.services import booking_service, additional_work_service
from app.services.booking_status_service import assert_transition
from app.services.errors import NotFoundError, InvalidOperationError

router = APIRouter(prefix="/api/bookings", tags=["bookings"], dependencies=[Depends(require_booking_schema)])


def _role_of(db, user_id: str) -> str:
    prof = db.table("profiles").select("role").eq("id", user_id).single().execute()
    return prof.data.get("role") if prof.data else "viewer"


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(body: BookingCreate, user=Depends(require_customer_or_admin)):
    db = get_supabase()
    return booking_service.create_booking(user.user.id, _role_of(db, user.user.id), body.model_dump())


@router.get("", response_model=list[BookingOut])
def list_bookings(status: str | None = Query(default=None), user=Depends(require_customer_or_admin)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    return booking_service.list_bookings(db, user.user.id, role, status)


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: str, user=Depends(require_customer_or_admin)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    return booking_service.get_booking(db, booking_id, user.user.id, role)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: str, body: BookingCancelIn, user=Depends(require_customer_or_admin)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    booking = booking_service.get_booking(db, booking_id, user.user.id, role)
    if role not in ("admin", "editor") and str(booking["customer_id"]) != user.user.id:
        raise NotFoundError("Booking not found")
    return booking_service.cancel_booking(db, booking, user.user.id, role, body.reason)


@router.post("/{booking_id}/confirm-completion", response_model=BookingOut)
def confirm_completion(booking_id: str, user=Depends(require_customer_or_admin)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    booking = booking_service.get_booking(db, booking_id, user.user.id, role)
    if role not in ("admin", "editor") and str(booking["customer_id"]) != user.user.id:
        raise NotFoundError("Booking not found")
    return booking_service.confirm_completion(db, booking, user.user.id, role)


@router.get("/{booking_id}/timeline")
def booking_timeline(booking_id: str, user=Depends(require_customer_or_admin)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    booking_service.get_booking(db, booking_id, user.user.id, role)
    return booking_service.get_timeline(db, booking_id)


@router.get("/{booking_id}/report")
def booking_report(booking_id: str, user=Depends(require_customer_or_admin)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    booking = booking_service.get_booking(db, booking_id, user.user.id, role)
    return booking_service.get_report(db, booking)


@router.post("/{booking_id}/approve-additional")
def approve_additional(booking_id: str, body: AdditionalWorkDecisionIn, user=Depends(require_customer_or_admin)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    booking_service.get_booking(db, booking_id, user.user.id, role)
    reqs = db.table("additional_work_requests").select("id").eq("booking_id", booking_id) \
        .eq("status", "pending").execute().data
    if not reqs:
        raise NotFoundError("No pending additional work request for this booking.")
    return additional_work_service.approve(db, reqs[0]["id"], user.user.id, role)


@router.post("/{booking_id}/reject-additional")
def reject_additional(booking_id: str, body: AdditionalWorkDecisionIn, user=Depends(require_customer_or_admin)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    booking_service.get_booking(db, booking_id, user.user.id, role)
    reqs = db.table("additional_work_requests").select("id").eq("booking_id", booking_id) \
        .eq("status", "pending").execute().data
    if not reqs:
        raise NotFoundError("No pending additional work request for this booking.")
    return additional_work_service.reject(db, reqs[0]["id"], user.user.id, role, body.reason)
