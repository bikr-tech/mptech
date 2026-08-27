"""Plumber mobile-app endpoints. Every job query is scoped to the authenticated
plumber's own id — a plumber can never read another plumber's jobs (404)."""
from fastapi import APIRouter, Depends, Query

from app.database import get_supabase, require_booking_schema
from app.middleware.auth_middleware import require_plumber
from app.schemas.work_order import (MaterialIn, LaborIn, NoteIn, PhotoIn,
                                    MaterialOut, LaborOut, NoteOut, PhotoOut, WorkOrderDetailOut)
from app.schemas.additional_work import AdditionalWorkIn, AdditionalWorkOut
from app.services import work_order_service, additional_work_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/api/plumber", tags=["plumber"], dependencies=[Depends(require_booking_schema)])


def _own_booking(db, booking_id: str, plumber_id: str) -> dict:
    res = db.table("bookings").select("*").eq("id", booking_id) \
        .eq("assigned_plumber_id", plumber_id).execute()
    if not res.data:
        raise NotFoundError("Job not found")
    return res.data[0]


def _own_work_order(db, wo_id: str, plumber_id: str) -> dict:
    res = db.table("work_orders").select("*").eq("id", wo_id) \
        .eq("assigned_plumber_id", plumber_id).execute()
    if not res.data:
        raise NotFoundError("Work order not found")
    return res.data[0]


@router.get("/jobs")
def plumber_jobs(user=Depends(require_plumber)):
    db = get_supabase()
    return work_order_service.list_plumber_jobs(db, user.user.id)


@router.get("/jobs/{booking_id}")
def plumber_job(booking_id: str, user=Depends(require_plumber)):
    db = get_supabase()
    booking = _own_booking(db, booking_id, user.user.id)
    wo = db.table("work_orders").select("*").eq("booking_id", booking_id).execute().data
    detail = work_order_service.get_work_order_detail(db, str(wo[0]["id"]), user.user.id, "plumber") if wo else None
    customer = db.table("customers").select("name,phone,email,default_address").eq("id", booking["customer_id"]).execute().data
    return {
        "booking": booking,
        "work_order": detail,
        "customer": customer[0] if customer else None,
    }


@router.post("/jobs/{booking_id}/action")
def job_action(booking_id: str, action: str = Query(...), user=Depends(require_plumber)):
    db = get_supabase()
    booking = _own_booking(db, booking_id, user.user.id)
    wo_res = db.table("work_orders").select("*").eq("booking_id", booking_id).execute()
    if not wo_res.data:
        raise NotFoundError("Work order not found")
    return work_order_service.apply_job_action(db, booking, wo_res.data[0], action, user.user.id, "plumber")


@router.post("/jobs/{booking_id}/tasks/{task_id}/start")
def start_task(booking_id: str, task_id: str, user=Depends(require_plumber)):
    from app.services import task_service
    db = get_supabase()
    _own_booking(db, booking_id, user.user.id)
    return task_service.start_task(db, task_id, user.user.id, "plumber")


@router.post("/jobs/{booking_id}/tasks/{task_id}/complete")
def complete_task(booking_id: str, task_id: str, user=Depends(require_plumber)):
    from app.services import task_service
    db = get_supabase()
    _own_booking(db, booking_id, user.user.id)
    return task_service.complete_task(db, task_id, user.user.id, "plumber")


@router.post("/work-orders/{wo_id}/materials", response_model=MaterialOut)
def add_material(wo_id: str, body: MaterialIn, user=Depends(require_plumber)):
    db = get_supabase()
    return work_order_service.add_material(db, wo_id, body.model_dump(), user.user.id, "plumber")


@router.post("/work-orders/{wo_id}/labor", response_model=LaborOut)
def add_labor(wo_id: str, body: LaborIn, user=Depends(require_plumber)):
    db = get_supabase()
    return work_order_service.add_labor(db, wo_id, user.user.id, body.model_dump(), user.user.id, "plumber")


@router.post("/work-orders/{wo_id}/notes", response_model=NoteOut)
def add_note(wo_id: str, body: NoteIn, user=Depends(require_plumber)):
    db = get_supabase()
    return work_order_service.add_note(db, wo_id, user.user.id, body.model_dump(), user.user.id, "plumber")


@router.post("/work-orders/{wo_id}/photos", response_model=PhotoOut)
def add_photo(wo_id: str, body: PhotoIn, user=Depends(require_plumber)):
    db = get_supabase()
    return work_order_service.add_photo(db, wo_id, user.user.id, body.model_dump(), user.user.id, "plumber")


@router.post("/work-orders/{wo_id}/additional-work", response_model=AdditionalWorkOut)
def request_additional(wo_id: str, body: AdditionalWorkIn, user=Depends(require_plumber)):
    db = get_supabase()
    _own_work_order(db, wo_id, user.user.id)
    return additional_work_service.request_additional_work(db, wo_id, user.user.id, "plumber", body.model_dump())


@router.post("/jobs/{booking_id}/complete", response_model=WorkOrderDetailOut)
def submit_completion(booking_id: str, completion_notes: str = "", user=Depends(require_plumber)):
    """Alias for jobs/{id}/action?action=complete (full detail returned)."""
    db = get_supabase()
    booking = _own_booking(db, booking_id, user.user.id)
    wo = db.table("work_orders").select("*").eq("booking_id", booking_id).execute().data
    if not wo:
        raise NotFoundError("Work order not found")
    work_order_service.complete_work_order(db, str(wo[0]["id"]), user.user.id, "plumber", completion_notes)
    return work_order_service.get_work_order_detail(db, str(wo[0]["id"]), user.user.id, "plumber")
