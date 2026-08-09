"""Work order + task + material + labor + notes + photos schemas."""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from .common import WorkOrderStatus


class WorkOrderOut(BaseModel):
    id: UUID
    booking_id: UUID
    assigned_plumber_id: UUID | None = None
    title: str
    description: str = ""
    priority: str = "normal"
    status: str
    scheduled_start_at: datetime | None = None
    scheduled_end_at: datetime | None = None
    actual_start_at: datetime | None = None
    actual_end_at: datetime | None = None
    completion_notes: str = ""
    customer_confirmed_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WorkOrderDetailOut(WorkOrderOut):
    tasks: list[Any] = []
    materials: list[Any] = []
    labor: list[Any] = []
    notes: list[Any] = []
    photos: list[Any] = []
    additional_work: list[Any] = []
    timeline: list[Any] = []
    totals: dict[str, Any] = {}


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    priority: str = "normal"
    estimated_minutes: int | None = None


class TaskUpdate(BaseModel):
    status: str | None = None
    position: int | None = None
    notes: str | None = None
    title: str | None = None
    description: str | None = None


class TaskReorderIn(BaseModel):
    task_ids: list[UUID]


class TaskOut(BaseModel):
    id: UUID
    work_order_id: UUID
    title: str
    description: str = ""
    status: str
    priority: str = "normal"
    estimated_minutes: int | None = None
    actual_minutes: int | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    notes: str = ""
    position: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MaterialIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    quantity: float = 1
    unit: str = "pcs"
    unit_price: float = 0
    notes: str = ""
    # total_price is deliberately NOT accepted — computed server-side.


class MaterialOut(BaseModel):
    id: UUID
    work_order_id: UUID
    name: str
    description: str = ""
    quantity: float
    unit: str
    unit_price: float
    total_price: float
    notes: str = ""
    created_at: datetime | None = None


class LaborIn(BaseModel):
    hours: float = Field(ge=0)
    rate: float = Field(ge=0)
    notes: str = ""
    # total computed server-side from hours * rate.


class LaborOut(BaseModel):
    id: UUID
    work_order_id: UUID
    plumber_id: UUID | None = None
    hours: float
    rate: float
    total: float
    notes: str = ""
    created_at: datetime | None = None


class NoteIn(BaseModel):
    note: str = Field(min_length=1, max_length=2000)
    task_id: UUID | None = None


class NoteOut(BaseModel):
    id: UUID
    work_order_id: UUID
    task_id: UUID | None = None
    plumber_id: UUID | None = None
    note: str
    created_at: datetime | None = None


class PhotoIn(BaseModel):
    photo_type: str = "during"
    storage_path: str = Field(min_length=1)
    caption: str = ""
    task_id: UUID | None = None


class PhotoOut(BaseModel):
    id: UUID
    work_order_id: UUID
    task_id: UUID | None = None
    uploaded_by: UUID | None = None
    photo_type: str
    storage_path: str
    caption: str = ""
    created_at: datetime | None = None
