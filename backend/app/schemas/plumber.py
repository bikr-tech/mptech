"""Plumber + availability schemas."""
from datetime import date, time
from uuid import UUID

from pydantic import BaseModel

from .common import PlumberStatus


class PlumberOut(BaseModel):
    id: UUID
    name: str
    phone: str | None = None
    photo_url: str | None = None
    status: str
    latitude: float | None = None
    longitude: float | None = None
    service_radius_km: float | None = None
    skills: list[str] = []
    rating: float | None = None
    total_jobs: int = 0
    hourly_rate: float = 0


class PlumberRecommendation(BaseModel):
    plumber_id: UUID
    name: str
    distance_km: float | None = None
    availability: str
    rating: float | None = None
    skill_match: float = 0.0
    workload: int = 0
    score: int = 0
    reasons: list[str] = []


class PlumberAvailabilityCreate(BaseModel):
    date: date
    start_time: time | None = None
    end_time: time | None = None
    status: PlumberStatus = "available"
