"""Plumber availability checks: status, per-day schedule, and window overlap.

Matching is deterministic and server-side. If PostGIS were enabled the distance
math could move into SQL (ST_DWithin), but the repo has no PostGIS — haversine
in Python is the safe fallback (spec §11)."""
import math
from datetime import datetime, time

from app.database import get_supabase

TRAVEL_BUFFER_MIN = 30


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    if None in (lat1, lon1, lat2, lon2):
        return float("inf")
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _active(booking_status: str) -> bool:
    return booking_status not in ("cancelled", "rejected", "completed", "customer_confirmed")


def plumber_available(db, plumber_id: str) -> bool:
    res = db.table("plumbers").select("status").eq("id", plumber_id).single().execute()
    return bool(res.data and res.data["status"] == "available")


def schedule_conflict(db, plumber_id: str, start: datetime, end: datetime,
                      exclude_booking_id: str | None = None) -> bool:
    """True if the plumber has an overlapping ACTIVE booking in the window.
    Called before assignment (and on reassign with exclude). The DB trigger
    reject_booking_overlap_trigger is the hard backstop."""
    try:
        res = db.rpc("prevent_booking_overlap", {
            "check_plumber_id": plumber_id,
            "check_start": start.isoformat(),
            "check_end": end.isoformat(),
            "exclude_booking_id": exclude_booking_id or None,
            "travel_buffer_min": TRAVEL_BUFFER_MIN,
        }).execute()
        return not bool(res.data)
    except Exception:
        # RPC unavailable (schema not applied yet) — fall back to a client-side
        # overlap scan so the app still refuses double-booking.
        bookings = db.table("bookings").select("id,preferred_date,preferred_start_time,preferred_end_time,status") \
            .eq("assigned_plumber_id", plumber_id).execute()
        for b in bookings.data or []:
            if not _active(b["status"]):
                continue
            if exclude_booking_id and b["id"] == exclude_booking_id:
                continue
            bs, be = _window(b)
            if bs and be and _overlaps(bs, be, start, end, TRAVEL_BUFFER_MIN):
                return True
        return False


def _window(booking: dict):
    date = booking.get("preferred_date")
    s = booking.get("preferred_start_time")
    e = booking.get("preferred_end_time")
    if not (date and s and e):
        return None, None
    return _dt(date, s), _dt(date, e)


def _dt(d, t) -> datetime:
    if isinstance(t, time):
        t = f"{t.hour:02d}:{t.minute:02d}"
    return datetime.fromisoformat(f"{d}T{t}")


def _overlaps(bs, be, cs, ce, buffer_min: int) -> bool:
    import datetime as _d

    buf = _d.timedelta(minutes=buffer_min)
    return bs - buf < ce and cs < be + buf
