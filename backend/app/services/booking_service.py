"""Booking lifecycle: create, read (role-scoped), cancel, transition, confirm,
report. All identity is resolved server-side from the auth token (user.id)."""
from uuid import UUID

from app.database import get_supabase
from . import audit_service
from .booking_status_service import assert_transition, can_transition
from .errors import NotFoundError, ForbiddenError, InvalidTransitionError, AlreadyConfirmedError, InvalidOperationError
from .booking_notifications import notify_booking_created

# Booking numbers like PN-1001. Counter lives in booking_number seed; we derive
# from an existing max as a string so no extra table is needed.
_BOOKING_PREFIX = "PN"


def _next_booking_number(db) -> str:
    # Derive from the max valid "PN-####" number present; tolerate malformed
    # rows (e.g. "PN--1000") by ignoring anything that doesn't match.
    import re
    res = db.table("bookings").select("booking_number").order("created_at", desc=True).limit(50).execute()
    nums = []
    for row in res.data or []:
        m = re.fullmatch(f"{_BOOKING_PREFIX}-(\\d+)", row.get("booking_number") or "")
        if m:
            nums.append(int(m.group(1)))
    return f"{_BOOKING_PREFIX}-{(max(nums) + 1) if nums else 1001}"


def _customer_row(db, user_id: str) -> dict | None:
    """Customers table may not have a row for the user yet — create on demand."""
    res = db.table("customers").select("*").eq("id", user_id).execute()
    if res.data:
        return res.data[0]
    prof = db.table("profiles").select("email").eq("id", user_id).single().execute()
    email = prof.data.get("email") if prof.data else None
    db.table("customers").upsert({"id": user_id, "email": email}).execute()
    res = db.table("customers").select("*").eq("id", user_id).execute()
    return res.data[0] if res.data else None


def create_booking(user_id: str, user_role: str, data: dict) -> dict:
    db = get_supabase()
    customer = _customer_row(db, user_id)
    if not customer:
        raise NotFoundError("Customer profile not found")

    booking = {
        "booking_number": _next_booking_number(db),
        "customer_id": user_id,
        "service_type": data["service_type"],
        "title": data["title"],
        "description": data.get("description", ""),
        "urgency": data.get("urgency", "medium"),
        "status": "pending",
        "address": data.get("address", ""),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "preferred_date": str(data["preferred_date"]) if data.get("preferred_date") else None,
        "preferred_start_time": str(data["preferred_start_time"]) if data.get("preferred_start_time") else None,
        "preferred_end_time": str(data["preferred_end_time"]) if data.get("preferred_end_time") else None,
        "ai_diagnosis": data.get("ai_diagnosis") or {},
    }

    diag = booking["ai_diagnosis"]
    booking["estimated_duration_minutes"] = diag.get("estimated_duration_minutes")
    booking["estimated_cost"] = _estimated_cost_from_diagnosis(diag)

    res = db.table("bookings").insert(booking).execute()
    if not res.data:
        raise InvalidOperationError("Failed to create booking")
    row = res.data[0]
    audit_service.record(user_id, "booking_created", "booking", row["id"], None, {"status": "pending"})
    audit_service.record_status(str(row["id"]), None, "pending", actor_id=user_id, actor_role=user_role)

    # Enqueue booking created notification (async, fire-and-forget)
    try:
        import asyncio
        asyncio.create_task(notify_booking_created(row["id"]))
    except RuntimeError:
        # No event loop running (e.g., in tests) - skip notification
        pass

    return row


def _estimated_cost_from_diagnosis(diag: dict) -> float:
    cost = diag.get("cost_estimation") or {}
    total = cost.get("total_plumber_npr") or cost.get("total_hardware_npr")
    try:
        return float(total) if total is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def get_booking(db, booking_id: str, user_id: str, role: str) -> dict:
    res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not res.data:
        raise NotFoundError("Booking not found")
    row = res.data[0]
    if role not in ("admin", "editor"):
        if str(row["customer_id"]) != user_id and str(row.get("assigned_plumber_id") or "") != user_id:
            raise NotFoundError("Booking not found")
    return row


def list_bookings(db, user_id: str, role: str, status: str | None = None) -> list[dict]:
    query = db.table("bookings").select("*")
    if role not in ("admin", "editor"):
        query = query.eq("customer_id", user_id)
    if status:
        query = query.eq("status", status)
    res = query.order("created_at", desc=True).execute()
    return res.data


def transition_booking(db, booking: dict, to_status: str, actor_id: str, actor_role: str) -> dict:
    from_status = booking["status"]
    assert_transition(from_status, to_status)
    now = audit_service.utcnow_iso()
    data: dict = {"status": to_status, "updated_at": now}
    if to_status == "completed" and not booking.get("actual_end_at"):
        data["actual_end_at"] = now
    res = db.table("bookings").update(data).eq("id", booking["id"]).execute()
    if not res.data:
        raise InvalidOperationError("Failed to update booking status")
    updated = res.data[0]
    audit_service.record(actor_id, f"booking_{to_status}", "booking", booking["id"],
                         {"status": from_status}, {"status": to_status})
    audit_service.record_status(str(booking["id"]), from_status, to_status, actor_id=actor_id, actor_role=actor_role)
    return updated


def cancel_booking(db, booking: dict, actor_id: str, actor_role: str, reason: str = "") -> dict:
    if not can_transition(booking["status"], "cancelled"):
        raise InvalidOperationError("Booking can only be cancelled before work is in progress")
    return transition_booking(db, booking, "cancelled", actor_id, actor_role)


def confirm_completion(db, booking: dict, actor_id: str, actor_role: str) -> dict:
    if booking["status"] == "customer_confirmed":
        raise AlreadyConfirmedError("Booking already confirmed")
    if booking["status"] != "completed":
        raise InvalidTransitionError(booking["status"], "customer_confirmed")
    res = db.table("bookings").update({
        "status": "customer_confirmed",
        "customer_confirmed_at": audit_service.utcnow_iso(),
        "updated_at": audit_service.utcnow_iso(),
    }).eq("id", booking["id"]).execute()
    if not res.data:
        raise InvalidOperationError("Failed to confirm booking")
    updated = res.data[0]
    audit_service.record(actor_id, "customer_confirmed", "booking", booking["id"],
                         {"status": "completed"}, {"status": "customer_confirmed"})
    audit_service.record_status(str(booking["id"]), "completed", "customer_confirmed", actor_id, actor_role)
    return updated


def get_timeline(db, booking_id: str) -> list[dict]:
    res = db.table("booking_status_history").select("*").eq("booking_id", booking_id).order("created_at").execute()
    return res.data


def get_report(db, booking: dict) -> dict:
    """Completion report: tasks, materials, labor, photos, notes, additional
    work, and the final amount. All money figures come from the DB (totals were
    computed server-side at write time)."""
    work_res = db.table("work_orders").select("*").eq("booking_id", booking["id"]).execute()
    work = work_res.data[0] if work_res.data else None
    wo_id = work["id"] if work else None

    tasks = db.table("work_order_tasks").select("*").eq("work_order_id", wo_id).order("position").execute().data if wo_id else []
    materials = db.table("work_order_materials").select("*").eq("work_order_id", wo_id).execute().data if wo_id else []
    labor = db.table("work_order_labor").select("*").eq("work_order_id", wo_id).execute().data if wo_id else []
    photos = db.table("work_order_photos").select("*").eq("work_order_id", wo_id).execute().data if wo_id else []
    notes = db.table("work_order_notes").select("*").eq("work_order_id", wo_id).order("created_at").execute().data if wo_id else []
    additional = db.table("additional_work_requests").select("*").eq("booking_id", booking["id"]).execute().data if wo_id else []

    total_materials = sum(_num(m["total_price"]) for m in materials)
    total_labor = sum(_num(m["total"]) for m in labor)
    additional_total = sum(_num(a["estimated_cost"]) for a in additional if a["status"] == "approved")

    return {
        "booking": booking,
        "work_order": work,
        "tasks": tasks,
        "materials": materials,
        "labor": labor,
        "photos": photos,
        "notes": notes,
        "additional_work": additional,
        "totals": {
            "materials": total_materials,
            "labor": total_labor,
            "additional_work": additional_total,
            "estimated": _num(booking.get("estimated_cost")),
            "final_amount": total_materials + total_labor + additional_total,
        },
    }


def _num(v) -> float:
    try:
        return float(v) if v is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def get_assigned_plumber_name(db, plumber_id) -> str | None:
    if not plumber_id:
        return None
    res = db.table("plumbers").select("name").eq("id", plumber_id).single().execute()
    return res.data.get("name") if res.data else None
