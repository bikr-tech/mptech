"""Assignment / scheduling schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AssignIn(BaseModel):
    plumber_id: UUID
    scheduled_start_at: datetime | None = None
    scheduled_end_at: datetime | None = None


class ReassignIn(BaseModel):
    plumber_id: UUID
    scheduled_start_at: datetime | None = None
    scheduled_end_at: datetime | None = None


class ScheduleIn(BaseModel):
    scheduled_start_at: datetime
    scheduled_end_at: datetime


class AssignOut(BaseModel):
    booking_id: UUID
    booking_number: str
    plumber_id: UUID
    plumber_name: str | None = None
    status: str
    work_order_id: UUID | None = None
