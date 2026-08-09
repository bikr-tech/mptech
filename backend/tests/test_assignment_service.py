"""assignment_service tests: happy assign, unavailable plumber, skill mismatch,
schedule conflict, reassign re-check. Runs against the fake DB."""
from datetime import datetime, timezone
from unittest.mock import patch

import pytest

from app.services import assignment_service
from app.services.errors import PlumberUnavailableError, ScheduleConflictError, InvalidOperationError


def _dt(s):
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


@pytest.fixture
def seeded(fake_db):
    fake_db.seed("profiles", [{"id": "u1", "email": "c@x.com", "role": "customer"}])
    fake_db.row("customers", id="u1", name="C", email="c@x.com")
    fake_db.row("plumbers", id="p1", name="Pete", status="available", latitude=27.7, longitude=85.3,
                service_radius_km=10, skills=["leak-repair"], rating=4.8, total_jobs=2)
    fake_db.row("plumbers", id="p2", name="NoSkill", status="available", latitude=27.7, longitude=85.3,
                service_radius_km=10, skills=["heating"], rating=4.0, total_jobs=2)
    fake_db.row("plumbers", id="p3", name="Busy", status="busy", latitude=27.7, longitude=85.3,
                service_radius_km=10, skills=["leak-repair"], rating=4.0, total_jobs=2)
    return fake_db


def _booking(fake_db, **kw):
    from app.services.booking_service import create_booking
    p = {
        "service_type": "leak-repair", "title": "Sink leak", "description": "",
        "urgency": "medium", "address": "1 Main", "latitude": 27.7, "longitude": 85.3,
        "preferred_date": "2026-08-10", "preferred_start_time": "09:00", "preferred_end_time": "11:00",
        "ai_diagnosis": {"required_skills": ["leak-repair"]},
    }
    p.update(kw)
    return create_booking("u1", "customer", p)


def test_assign_happy(seeded):
    b = _booking(seeded)
    out = assignment_service.assign(seeded, str(b["id"]), "p1", "admin", "admin")
    assert out["status"] == "assigned"
    assert out["work_order_id"]
    row = seeded.table("bookings").select("*").eq("id", str(b["id"])).single().execute().data
    assert row["assigned_plumber_id"] == "p1"
    assert row["status"] == "assigned"
    assert seeded.table("work_orders").select("*").eq("booking_id", str(b["id"])).execute().data


def test_assign_rejects_unavailable_plumber(seeded):
    b = _booking(seeded)
    with pytest.raises(PlumberUnavailableError):
        assignment_service.assign(seeded, str(b["id"]), "p3", "admin", "admin")


def test_assign_rejects_skill_mismatch(seeded):
    b = _booking(seeded)
    with pytest.raises(PlumberUnavailableError):
        assignment_service.assign(seeded, str(b["id"]), "p2", "admin", "admin")


def test_assign_rejects_closed_booking(seeded):
    b = _booking(seeded)
    b["status"] = "completed"
    with pytest.raises(InvalidOperationError):
        assignment_service.assign(seeded, str(b["id"]), "p1", "admin", "admin")


def test_assign_schedule_conflict(seeded):
    b = _booking(seeded)
    seeded.overlap_rpc = False  # RPC returns "not available" → conflict
    with pytest.raises(ScheduleConflictError):
        assignment_service.assign(seeded, str(b["id"]), "p1", "admin", "admin")


def test_reassign_rechecks_conflict(seeded):
    b = _booking(seeded)
    assignment_service.assign(seeded, str(b["id"]), "p1", "admin", "admin")
    seeded.overlap_rpc = False
    with pytest.raises(ScheduleConflictError):
        assignment_service.reassign(seeded, str(b["id"]), "p1", "admin", "admin")


def test_schedule_sets_window_and_status(seeded):
    b = _booking(seeded)
    out = assignment_service.schedule(seeded, str(b["id"]), _dt("2026-08-11T10:00:00+00:00"),
                                      _dt("2026-08-11T12:00:00+00:00"), "admin", "admin")
    assert out["status"] == "scheduled"
    row = seeded.table("bookings").select("*").eq("id", str(b["id"])).single().execute().data
    assert row["status"] == "scheduled"


def test_assign_emails_plumber_and_customer_on_window_change(seeded):
    from app.config import settings
    from app.services import email_service
    seeded.row("profiles", id="p1", email="p@x.com", role="plumber")  # plumber profile
    b = _booking(seeded)  # preferred 08-10 09:00-11:00
    calls = []
    with patch.object(settings, "resend_api_key", "test-key"), \
         patch.object(email_service, "notify_job_assigned", side_effect=lambda *a, **k: calls.append(("job", a))) \
         as j, \
         patch.object(email_service, "notify_visit_scheduled", side_effect=lambda *a, **k: calls.append(("visit", a))) \
         as v:
        # Assign with a DIFFERENT window → both emails fire.
        assignment_service.assign(seeded, str(b["id"]), "p1", "admin", "admin",
                                  _dt("2026-08-12T14:00:00+00:00"), _dt("2026-08-12T16:00:00+00:00"))
    assert len(calls) == 2
    j.assert_called_once()
    v.assert_called_once()


def test_assign_matching_window_skips_customer_email(seeded):
    from app.config import settings
    from app.services import email_service
    seeded.row("profiles", id="p1", email="p@x.com", role="plumber")
    b = _booking(seeded)  # preferred 08-10 09:00-11:00
    with patch.object(settings, "resend_api_key", "test-key"), \
         patch.object(email_service, "notify_job_assigned") as j, \
         patch.object(email_service, "notify_visit_scheduled") as v:
        # Assign at the PREFERRED window → plumber emailed, customer skipped.
        assignment_service.assign(seeded, str(b["id"]), "p1", "admin", "admin",
                                  _dt("2026-08-10T09:00:00+00:00"), _dt("2026-08-10T11:00:00+00:00"))
    j.assert_called_once()
    v.assert_not_called()
