"""Audit / status history schemas."""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class StatusHistoryOut(BaseModel):
    id: UUID
    booking_id: UUID
    from_status: str | None = None
    to_status: str
    actor_id: UUID | None = None
    actor_role: str | None = None
    created_at: datetime | None = None


class AuditOut(BaseModel):
    id: UUID
    actor_id: UUID | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    old_values: dict[str, Any] = {}
    new_values: dict[str, Any] = {}
    created_at: datetime | None = None
