"""Additional work requests + customer approval (spec §25/§26).

Only the plumber assigned to the work order may request. Only the booking's
customer may approve/reject. Approval creates the task on the work order.
Unapproved work can never be billed (completion report only sums approved
additional work)."""
from app.database import get_supabase
from . import audit_service
from .errors import NotFoundError, ForbiddenError, InvalidOperationError, DuplicateActionError


def request_additional_work(db, work_order_id: str, actor_id: str, actor_role: str, data: dict) -> dict:
    wo_res = db.table("work_orders").select("*").eq("id", work_order_id).execute()
    if not wo_res.data:
        raise NotFoundError("Work order not found")
    wo = wo_res.data[0]
    if actor_role == "plumber":
        if str(wo.get("assigned_plumber_id") or "") != str(actor_id):
            raise ForbiddenError("You are not assigned to this work order.")
    elif actor_role != "admin":
        raise ForbiddenError("Only the assigned plumber can request additional work.")

    res = db.table("additional_work_requests").insert({
        "work_order_id": work_order_id,
        "booking_id": wo["booking_id"],
        "requested_by": actor_id,
        "description": data["description"],
        "estimated_cost": data.get("estimated_cost", 0),
        "status": "pending",
    }).execute()
    if not res.data:
        raise InvalidOperationError("Failed to create additional work request")
    audit_service.record(actor_id, "additional_work_requested", "additional_work", res.data[0]["id"])
    return res.data[0]


def _get_request(db, request_id: str) -> dict:
    res = db.table("additional_work_requests").select("*").eq("id", request_id).execute()
    if not res.data:
        raise NotFoundError("Additional work request not found")
    return res.data[0]


def _assert_customer(db, booking_id: str, actor_id: str) -> dict:
    b_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not b_res.data:
        raise NotFoundError("Booking not found")
    booking = b_res.data[0]
    if str(booking["customer_id"]) != str(actor_id):
        raise ForbiddenError("You do not own this booking.")
    return booking


def approve(db, request_id: str, actor_id: str, actor_role: str, reason: str = "") -> dict:
    req = _get_request(db, request_id)
    if req["status"] == "approved":
        raise DuplicateActionError("Additional work already approved.")
    if req["status"] == "rejected":
        raise InvalidOperationError("Additional work was rejected.")

    booking = _assert_customer(db, req["booking_id"], actor_id)
    now = audit_service.utcnow_iso()
    res = db.table("additional_work_requests").update({
        "status": "approved", "approved_at": now, "approved_by": actor_id, "updated_at": now,
    }).eq("id", request_id).execute()

    # Approved additional work becomes a task on the work order. The customer is
    # approving, not managing the WO — the task is added as a system action
    # (role=admin bypasses the plumber-ownership guard; audit below records who).
    from .work_order_service import add_task
    add_task(db, req["work_order_id"], {
        "title": req["description"][:200] or "Additional work",
        "description": f"Additional work (approved by customer): {req['description']}",
        "estimated_minutes": None,
    }, str(req.get("requested_by") or actor_id), "admin")

    # Booking may move to awaiting_approval → in_progress when approved.
    if booking["status"] == "awaiting_approval":
        from .booking_status_service import assert_transition
        assert_transition("awaiting_approval", "in_progress")
        db.table("bookings").update({"status": "in_progress", "updated_at": now}).eq("id", booking["id"]).execute()

    audit_service.record(actor_id, "additional_work_approved", "additional_work", request_id,
                         {"status": "pending"}, {"status": "approved"})
    return res.data[0]


def reject(db, request_id: str, actor_id: str, actor_role: str, reason: str = "") -> dict:
    req = _get_request(db, request_id)
    if req["status"] in ("approved", "rejected"):
        raise DuplicateActionError("Additional work already decided.")
    _assert_customer(db, req["booking_id"], actor_id)
    now = audit_service.utcnow_iso()
    res = db.table("additional_work_requests").update({
        "status": "rejected", "rejected_at": now, "rejection_reason": reason, "updated_at": now,
    }).eq("id", request_id).execute()
    audit_service.record(actor_id, "additional_work_rejected", "additional_work", request_id,
                         {"status": "pending"}, {"status": "rejected", "reason": reason})
    return res.data[0]
