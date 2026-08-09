"""Additional work request schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AdditionalWorkIn(BaseModel):
    description: str = Field(min_length=1, max_length=2000)
    estimated_cost: float = Field(default=0, ge=0)


class AdditionalWorkOut(BaseModel):
    id: UUID
    work_order_id: UUID
    booking_id: UUID
    requested_by: UUID | None = None
    description: str
    estimated_cost: float
    status: str
    approved_at: datetime | None = None
    approved_by: UUID | None = None
    rejected_at: datetime | None = None
    rejection_reason: str = ""
    created_at: datetime | None = None


class AdditionalWorkDecisionIn(BaseModel):
    reason: str = ""
