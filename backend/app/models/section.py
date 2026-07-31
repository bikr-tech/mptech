from pydantic import BaseModel, Field
from typing import Literal, Any
from uuid import UUID
from datetime import datetime

SectionType = Literal["hero_3d", "emergency_call", "services_grid", "reviews", "project_gallery", "site_footer", "plumbing_tool_3d", "ai_diagnosis", "trust_banner", "plumbers_match", "map_section", "app_section", "faq_section", "final_cta"]

class LandingSectionCreate(BaseModel):
    type: SectionType
    order_index: int
    content: dict = {}
    is_published: bool = False

class LandingSectionUpdate(BaseModel):
    type: SectionType | None = None
    order_index: int | None = None
    content: dict | None = None
    is_published: bool | None = None

class LandingSectionOut(BaseModel):
    id: UUID
    type: str
    order_index: int
    is_published: bool
    content: dict
    created_at: datetime
    updated_at: datetime

class ReorderItem(BaseModel):
    id: UUID
    order_index: int

class ReorderBatch(BaseModel):
    items: list[ReorderItem]
