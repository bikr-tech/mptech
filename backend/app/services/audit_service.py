"""Audit trail + status history recording. All writes go through the
service-role client so they bypass RLS by design (same as the rest of the app)."""
from typing import Any
from app.database import get_supabase

from datetime import datetime, timezone


def record(actor_id: str | None, action: str, entity_type: str, entity_id: str | None = None,
           old_values: dict | None = None, new_values: dict | None = None) -> None:
    db = get_supabase()
    try:
        db.table("booking_audit").insert({
            "actor_id": actor_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": str(entity_id) if entity_id else None,
            "old_values": old_values or {},
            "new_values": new_values or {},
        }).execute()
    except Exception:
        # Audit must never take down a booking action.
        pass


def record_status(booking_id: str, from_status: str | None, to_status: str,
                  actor_id: str | None = None, actor_role: str | None = None) -> None:
    db = get_supabase()
    try:
        db.table("booking_status_history").insert({
            "booking_id": booking_id,
            "from_status": from_status,
            "to_status": to_status,
            "actor_id": actor_id,
            "actor_role": actor_role,
        }).execute()
    except Exception:
        pass


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
