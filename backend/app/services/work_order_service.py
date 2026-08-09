"""Work order lifecycle + money. ALL totals are computed here (server-side) —
a client-sent total is ignored (spec §23/§24)."""
from app.database import get_supabase
from . import audit_service
from .errors import NotFoundError, ForbiddenError, InvalidOperationError, DuplicateActionError

# Booking-status → work-order-status for the plumber action endpoints.
JOB_ACTION_TRANSITIONS = {
    "accept": ("assigned", "accepted", "accepted"),
    "reject": ("assigned", "rejected", "rejected"),
    "en-route": ("accepted", "en_route", "en_route"),
    "arrived": ("en_route", "arrived", "arrived"),
    "start": ("arrived", "in_progress", "in_progress"),
    "complete": ("in_progress", "completed", "completed"),
    "pause": ("in_progress", "in_progress", "paused"),
    "resume": ("in_progress", "in_progress", "in_progress"),
}


def _num(v) -> float:
    try:
        return float(v) if v is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def get_work_order(db, wo_id: str, user_id: str | None = None, role: str | None = None) -> dict:
    res = db.table("work_orders").select("*").eq("id", wo_id).execute()
    if not res.data:
        raise NotFoundError("Work order not found")
    wo = res.data[0]
    if role not in ("admin", "editor"):
        if str(wo.get("assigned_plumber_id") or "") != str(user_id or ""):
            raise NotFoundError("Work order not found")
    return wo


def get_work_order_detail(db, wo_id: str, user_id: str | None = None, role: str | None = None) -> dict:
    wo = get_work_order(db, wo_id, user_id, role)
    wid = str(wo["id"])
    tasks = db.table("work_order_tasks").select("*").eq("work_order_id", wid).order("position").execute().data
    materials = db.table("work_order_materials").select("*").eq("work_order_id", wid).execute().data
    labor = db.table("work_order_labor").select("*").eq("work_order_id", wid).execute().data
    notes = db.table("work_order_notes").select("*").eq("work_order_id", wid).order("created_at").execute().data
    photos = db.table("work_order_photos").select("*").eq("work_order_id", wid).execute().data
    additional = db.table("additional_work_requests").select("*").eq("work_order_id", wid).execute().data
    timeline = db.table("booking_status_history").select("*").eq("booking_id", wo["booking_id"]).order("created_at").execute().data

    total_materials = sum(_num(m["total_price"]) for m in materials)
    total_labor = sum(_num(l["total"]) for l in labor)
    additional_total = sum(_num(a["estimated_cost"]) for a in additional if a["status"] == "approved")

    return {
        **wo,
        "tasks": tasks,
        "materials": materials,
        "labor": labor,
        "notes": notes,
        "photos": photos,
        "additional_work": additional,
        "timeline": timeline,
        "totals": {
            "materials": total_materials,
            "labor": total_labor,
            "additional_work": additional_total,
            "final_amount": total_materials + total_labor + additional_total,
        },
    }


def list_plumber_jobs(db, plumber_id: str) -> list[dict]:
    """All bookings assigned to this plumber (with their work order)."""
    bookings = db.table("bookings").select("*").eq("assigned_plumber_id", plumber_id) \
        .order("created_at", desc=True).execute().data
    wos = db.table("work_orders").select("*").eq("assigned_plumber_id", plumber_id).execute().data
    wo_by_booking = {str(w["booking_id"]): w for w in wos}
    out = []
    for b in bookings:
        wo = wo_by_booking.get(str(b["id"]))
        out.append({
            "booking": b,
            "work_order": wo,
            "task_counts": _task_counts(db, wo["id"] if wo else None),
        })
    return out


def _task_counts(db, wo_id: str | None) -> dict:
    if not wo_id:
        return {"total": 0, "completed": 0}
    tasks = db.table("work_order_tasks").select("status").eq("work_order_id", wo_id).execute().data
    return {"total": len(tasks), "completed": sum(1 for t in tasks if t["status"] == "completed")}


def create_work_order(db, booking_id: str, assigned_plumber_id: str, title: str, description: str, priority: str = "normal") -> dict:
    res = db.table("work_orders").insert({
        "booking_id": booking_id,
        "assigned_plumber_id": assigned_plumber_id,
        "title": title,
        "description": description,
        "priority": priority,
        "status": "assigned",
    }).execute()
    if not res.data:
        raise InvalidOperationError("Failed to create work order")
    return res.data[0]


def add_task(db, wo_id: str, data: dict, actor_id: str, actor_role: str) -> dict:
    get_work_order(db, wo_id, actor_id, actor_role)
    max_pos = db.table("work_order_tasks").select("position").eq("work_order_id", wo_id) \
        .order("position", desc=True).limit(1).execute()
    position = (max_pos.data[0]["position"] + 1) if max_pos.data else 0
    res = db.table("work_order_tasks").insert({
        "work_order_id": wo_id,
        "title": data["title"],
        "description": data.get("description", ""),
        "priority": data.get("priority", "normal"),
        "estimated_minutes": data.get("estimated_minutes"),
        "status": "pending",
        "position": position,
    }).execute()
    if not res.data:
        raise InvalidOperationError("Failed to add task")
    audit_service.record(actor_id, "task_added", "work_order_task", res.data[0]["id"])
    return res.data[0]


def reorder_tasks(db, wo_id: str, task_ids: list[str], actor_id: str, actor_role: str) -> dict:
    get_work_order(db, wo_id, actor_id, actor_role)
    for pos, tid in enumerate(task_ids):
        db.table("work_order_tasks").update({"position": pos, "updated_at": audit_service.utcnow_iso()}) \
            .eq("id", str(tid)).eq("work_order_id", wo_id).execute()
    audit_service.record(actor_id, "tasks_reordered", "work_order", wo_id, None, {"order": task_ids})
    return {"ok": True, "order": task_ids}


def add_material(db, wo_id: str, data: dict, actor_id: str, actor_role: str) -> dict:
    get_work_order(db, wo_id, actor_id, actor_role)
    quantity = _num(data.get("quantity", 1))
    unit_price = _num(data.get("unit_price", 0))
    total_price = quantity * unit_price  # server-computed; client total ignored
    res = db.table("work_order_materials").insert({
        "work_order_id": wo_id,
        "name": data["name"],
        "description": data.get("description", ""),
        "quantity": quantity,
        "unit": data.get("unit", "pcs"),
        "unit_price": unit_price,
        "total_price": total_price,
        "notes": data.get("notes", ""),
    }).execute()
    if not res.data:
        raise InvalidOperationError("Failed to add material")
    audit_service.record(actor_id, "material_added", "work_order_material", res.data[0]["id"], None, {"total_price": total_price})
    return res.data[0]


def add_labor(db, wo_id: str, plumber_id: str, data: dict, actor_id: str, actor_role: str) -> dict:
    get_work_order(db, wo_id, actor_id, actor_role)
    hours = _num(data.get("hours", 0))
    rate = _num(data.get("rate", 0))
    total = hours * rate  # server-computed
    res = db.table("work_order_labor").insert({
        "work_order_id": wo_id,
        "plumber_id": plumber_id,
        "hours": hours,
        "rate": rate,
        "total": total,
        "notes": data.get("notes", ""),
    }).execute()
    if not res.data:
        raise InvalidOperationError("Failed to add labor")
    audit_service.record(actor_id, "labor_added", "work_order_labor", res.data[0]["id"], None, {"total": total})
    return res.data[0]


def add_note(db, wo_id: str, plumber_id: str, data: dict, actor_id: str, actor_role: str) -> dict:
    get_work_order(db, wo_id, actor_id, actor_role)
    res = db.table("work_order_notes").insert({
        "work_order_id": wo_id,
        "task_id": str(data["task_id"]) if data.get("task_id") else None,
        "plumber_id": plumber_id,
        "note": data["note"],
    }).execute()
    if not res.data:
        raise InvalidOperationError("Failed to add note")
    return res.data[0]


def add_photo(db, wo_id: str, uploaded_by: str, data: dict, actor_id: str, actor_role: str) -> dict:
    get_work_order(db, wo_id, actor_id, actor_role)
    if data.get("photo_type") not in ("before", "during", "after"):
        raise InvalidOperationError("photo_type must be before, during, or after.")
    res = db.table("work_order_photos").insert({
        "work_order_id": wo_id,
        "task_id": str(data["task_id"]) if data.get("task_id") else None,
        "uploaded_by": uploaded_by,
        "photo_type": data["photo_type"],
        "storage_path": data["storage_path"],
        "caption": data.get("caption", ""),
    }).execute()
    if not res.data:
        raise InvalidOperationError("Failed to add photo")
    return res.data[0]


def apply_job_action(db, booking, work_order, action: str, actor_id: str, actor_role: str) -> dict:
    """Drive the booking + work-order state machine for plumber actions."""
    from .booking_status_service import assert_transition
    from .errors import InvalidTransitionError

    # booking must be in {expected_booking} → {new_status} for this action.
    PLANS = {
        "accept":   ("assigned",    "accepted"),
        "reject":   ("assigned",    "rejected"),
        "en-route": ("accepted",    "en_route"),
        "arrived":  ("en_route",    "arrived"),
        "start":    ("arrived",     "in_progress"),
        "complete": ("in_progress", "completed"),  # awaiting_approval allowed too
        "pause":    (None,          None),
        "resume":   (None,          None),
    }
    expected_from, new_status = PLANS[action]
    if action == "complete" and booking["status"] == "awaiting_approval":
        expected_from = "awaiting_approval"

    WO_TO = {
        "accept": "accepted", "reject": "cancelled", "en-route": "accepted",
        "arrived": "accepted", "start": "in_progress", "pause": "paused",
        "resume": "in_progress", "complete": "completed",
    }
    wo_to = WO_TO[action]

    if expected_from is not None:
        if booking["status"] != expected_from:
            raise InvalidTransitionError(booking["status"], new_status)
        assert_transition(booking["status"], new_status)

    now = audit_service.utcnow_iso()
    wo_upd = {"status": wo_to, "updated_at": now}
    if action == "start" and not work_order.get("actual_start_at"):
        wo_upd["actual_start_at"] = now
    if action == "complete":
        wo_upd["actual_end_at"] = now
    db.table("work_orders").update(wo_upd).eq("id", work_order["id"]).execute()

    if action == "reject":
        db.table("bookings").update({"status": "rejected", "updated_at": now}).eq("id", booking["id"]).execute()
        audit_service.record_status(str(booking["id"]), booking["status"], "rejected", actor_id, actor_role)
        return {"booking_status": "rejected", "action": action}

    if action in ("pause", "resume"):
        return {"booking_status": booking["status"], "action": action}

    db.table("bookings").update({"status": new_status, "updated_at": now}).eq("id", booking["id"]).execute()
    audit_service.record(actor_id, f"plumber_{action}", "booking", booking["id"],
                         {"status": booking["status"]}, {"status": new_status})
    audit_service.record_status(str(booking["id"]), booking["status"], new_status, actor_id, actor_role)

    return {"booking_status": new_status, "action": action}


def complete_work_order(db, wo_id: str, actor_id: str, actor_role: str, completion_notes: str = "") -> dict:
    wo = get_work_order(db, wo_id, actor_id, actor_role)
    if wo["status"] == "completed":
        raise DuplicateActionError("Work order already completed.")
    if wo["status"] != "in_progress":
        raise InvalidOperationError("Work order must be in progress to complete.")

    pending = db.table("work_order_tasks").select("id").eq("work_order_id", wo_id) \
        .in_("status", ["pending", "in_progress", "blocked"]).execute()
    if pending.data:
        raise InvalidOperationError(f"{len(pending.data)} task(s) not completed.")

    now = audit_service.utcnow_iso()
    db.table("work_orders").update({
        "status": "completed", "completion_notes": completion_notes,
        "actual_end_at": now, "updated_at": now,
    }).eq("id", wo_id).execute()

    booking_res = db.table("bookings").select("*").eq("id", wo["booking_id"]).execute()
    booking = booking_res.data[0]
    db.table("bookings").update({"status": "completed", "actual_end_at": now, "updated_at": now}) \
        .eq("id", booking["id"]).execute()

    audit_service.record(actor_id, "job_completed", "booking", booking["id"],
                         {"status": booking["status"]}, {"status": "completed"})
    audit_service.record_status(str(booking["id"]), booking["status"], "completed", actor_id, actor_role)
    return {"work_order_id": wo_id, "status": "completed"}
