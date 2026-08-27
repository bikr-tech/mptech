"""Public signup: customer or plumber. Role is set server-side (service key);
the anon client can't write profiles/plumbers (RLS). Admin signup is NOT
allowed here — admins are created explicitly via create_admin.py."""
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.database import get_supabase
from app.services.errors import ValidationAppError

router = APIRouter(prefix="/api/auth", tags=["auth"])

SignupRole = Literal["customer", "plumber"]


class SignupIn(BaseModel):
    email: str
    password: str = Field(min_length=6)
    role: SignupRole = "customer"
    name: str | None = None


@router.post("/signup")
def signup(body: SignupIn):
    db = get_supabase()
    resp = db.auth.sign_up({"email": body.email, "password": body.password})
    uid = (resp.user or {}).id if resp.user else None
    if not uid:
        raise ValidationAppError("Could not create account. Try again.")
    # Trigger sets profiles.role='customer'. Plumbers need role + plumbers row.
    if body.role == "plumber":
        db.table("profiles").update({"role": "plumber"}).eq("id", uid).execute()
        db.table("plumbers").upsert({
            "id": uid,
            "name": body.name or body.email.split("@")[0],
            "status": "pending",  # admin must verify before this plumber works
            "skills": [],
            "service_radius_km": 10,
            "hourly_rate": 0,
            "rating": 0,
        }).execute()
    return {"ok": True, "role": body.role}
