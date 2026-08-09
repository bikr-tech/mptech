"""Work-order + task admin endpoints. Admins read all; plumbers read own
(ownership enforced in work_order_service/task_service — other plumbers' 404)."""
from fastapi import APIRouter, Depends

from app.database import get_supabase, require_booking_schema
from app.middleware.auth_middleware import require_admin, require_plumber
from app.schemas.work_order import TaskCreate, TaskUpdate, TaskReorderIn, TaskOut, WorkOrderDetailOut
from app.services import work_order_service, task_service

router = APIRouter(tags=["work-orders"], dependencies=[Depends(require_booking_schema)])


def _role_of(db, user_id: str) -> str:
    prof = db.table("profiles").select("role").eq("id", user_id).single().execute()
    return prof.data.get("role") if prof.data else "viewer"


@router.get("/api/work-orders/{wo_id}", response_model=WorkOrderDetailOut)
def get_work_order(wo_id: str, user=Depends(require_plumber)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    return work_order_service.get_work_order_detail(db, wo_id, user.user.id, role)


@router.post("/api/work-orders/{wo_id}/tasks", response_model=TaskOut)
def add_task(wo_id: str, body: TaskCreate, user=Depends(require_admin)):
    db = get_supabase()
    return work_order_service.add_task(db, wo_id, body.model_dump(), user.user.id, "admin")


@router.put("/api/work-orders/{wo_id}/tasks/reorder")
def reorder_tasks(wo_id: str, body: TaskReorderIn, user=Depends(require_admin)):
    db = get_supabase()
    return work_order_service.reorder_tasks(db, wo_id, [str(t) for t in body.task_ids], user.user.id, "admin")


@router.patch("/api/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: str, body: TaskUpdate, user=Depends(require_plumber)):
    db = get_supabase()
    role = _role_of(db, user.user.id)
    return task_service.update_task(db, task_id, body.model_dump(exclude_none=True), user.user.id, role)
