"""Shared Pydantic helpers (error envelope, literals)."""
from typing import Literal, TypeVar, Generic, Any
from pydantic import BaseModel

BookingStatus = Literal[
    "pending", "admin_review", "scheduled", "assigned", "accepted", "en_route",
    "arrived", "in_progress", "awaiting_approval", "completed",
    "customer_confirmed", "cancelled", "rejected",
]

WorkOrderStatus = Literal["draft", "assigned", "accepted", "in_progress", "paused", "completed", "cancelled"]
TaskStatus = Literal["pending", "in_progress", "blocked", "completed", "cancelled"]
AdditionalWorkStatus = Literal["pending", "approved", "rejected", "cancelled"]
PlumberStatus = Literal["available", "busy", "off_duty", "on_leave", "pending"]
Urgency = Literal["low", "medium", "high", "emergency"]


class AppErrorDetail(BaseModel):
    code: str
    message: str


class ErrorEnvelope(BaseModel):
    error: AppErrorDetail


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    data: T | None = None
