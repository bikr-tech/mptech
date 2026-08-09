"""Task lifecycle: start/complete/pause, time tracking, notes, reorder."""
from datetime import datetime, timezone

from app.database import get_supabase
from . import audit_service
from .errors import NotFoundError, InvalidOperationError, DuplicateActionError

ACTIVE_TASK_STATUSES = ("pending", "in_progress", "blocked")


def _num(v) -> float:
    try:
        return float(v) if v is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def get_task(db, task_id: str, user_id: str | None = None, role: str | None = None) -> dict:
    res = db.table("work_order_tasks").select("*").eq("id", task_id).execute()
    if not res.data:
        raise NotFoundError("Task not found")
    task = res.data[0]
    if role not in ("admin", "editor"):
        wo_res = db.table("work_orders").select("assigned_plumber_id").eq("id", task["work_order_id"]).single().execute()
        assigned = wo_res.data.get("assigned_plumber_id") if wo_res.data else None
        if str(assigned or "") != str(user_id or ""):
            raise NotFoundError("Task not found")
    return task


def start_task(db, task_id: str, actor_id: str, actor_role: str) -> dict:
    task = get_task(db, task_id, actor_id, actor_role)
    if task["status"] in ("completed", "cancelled"):
        raise InvalidOperationError("Task cannot be started in its current state.")
    now = datetime.now(timezone.utc).isoformat()
    res = db.table("work_order_tasks").update({"status": "in_progress", "started_at": now, "updated_at": now}) \
        .eq("id", task_id).execute()
    audit_service.record(actor_id, "task_started", "work_order_task", task_id)
    return res.data[0]


def complete_task(db, task_id: str, actor_id: str, actor_role: str, notes: str = "") -> dict:
    task = get_task(db, task_id, actor_id, actor_role)
    if task["status"] == "completed":
        raise DuplicateActionError("Task already completed.")
    now = datetime.now(timezone.utc)
    started = task.get("started_at")
    if isinstance(started, str):
        started = datetime.fromisoformat(started)
    actual_minutes = int((now - started).total_seconds() // 60) if started else (task.get("estimated_minutes") or 0)
    res = db.table("work_order_tasks").update({
        "status": "completed", "completed_at": now.isoformat(),
        "actual_minutes": actual_minutes, "updated_at": now.isoformat(),
        "notes": notes or task.get("notes", ""),
    }).eq("id", task_id).execute()
    audit_service.record(actor_id, "task_completed", "work_order_task", task_id,
                         {"status": "in_progress"}, {"status": "completed", "actual_minutes": actual_minutes})
    return res.data[0]


def update_task(db, task_id: str, data: dict, actor_id: str, actor_role: str) -> dict:
    get_task(db, task_id, actor_id, actor_role)
    fields = {}
    if "status" in data and data["status"]:
        fields["status"] = data["status"]
    if "position" in data and data["position"] is not None:
        fields["position"] = data["position"]
    if "notes" in data and data["notes"] is not None:
        fields["notes"] = data["notes"]
    if "title" in data and data["title"]:
        fields["title"] = data["title"]
    if "description" in data and data["description"] is not None:
        fields["description"] = data["description"]
    if not fields:
        raise InvalidOperationError("Nothing to update.")
    fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = db.table("work_order_tasks").update(fields).eq("id", task_id).execute()
    if not res.data:
        raise NotFoundError("Task not found")
    return res.data[0]
