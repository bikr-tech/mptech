from pydantic import BaseModel
from typing import Literal
from uuid import UUID
from datetime import datetime

UserRole = Literal["admin", "editor", "viewer"]

class ProfileOut(BaseModel):
    id: UUID
    email: str | None = None
    role: str
    created_at: datetime | None = None
