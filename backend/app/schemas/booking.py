"""Booking request/response schemas. Identity (customer_id, actor) is resolved
server-side from the auth token — never accepted from the client."""
from datetime import date, time, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from .common import BookingStatus, Urgency


class BookingCreate(BaseModel):
    service_type: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    urgency: Urgency = "medium"
    address: str = ""
    latitude: float | None = None
    longitude: float | None = None
    preferred_date: date | None = None
    preferred_start_time: time | None = None
    preferred_end_time: time | None = None
    ai_diagnosis: dict[str, Any] = {}


class BookingOut(BaseModel):
    id: UUID
    booking_number: str
    customer_id: UUID
    service_type: str
    title: str
    description: str
    urgency: str
    status: str
    address: str
    latitude: float | None
    longitude: float | None
    preferred_date: date | None
    preferred_start_time: time | None
    preferred_end_time: time | None
    assigned_plumber_id: UUID | None
    ai_diagnosis: dict[str, Any]
    estimated_duration_minutes: int | None
    estimated_cost: float
    actual_start_at: datetime | None
    actual_end_at: datetime | None
    customer_confirmed_at: datetime | None
    created_at: datetime | None
    updated_at: datetime | None


class StatusChange(BaseModel):
    to_status: BookingStatus


class ConfirmCompletionIn(BaseModel):
    pass


class BookingCancelIn(BaseModel):
    reason: str = ""
