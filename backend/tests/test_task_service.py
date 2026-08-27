"""task_service tests: ownership, start/complete timing, duplicate completion."""
import pytest

from app.services import task_service
from app.services.errors import NotFoundError, InvalidOperationError, DuplicateActionError


@pytest.fixture
def ctx(fake_db):
    fake_db.seed("profiles", [{"id": "p1", "email": "p@x.com", "role": "plumber"}])
    fake_db.row("plumbers", id="p1", name="Pete", status="available")
    wo = fake_db.row("work_orders", id="wo1", booking_id="b1", assigned_plumber_id="p1",
                     title="WO", description="", status="in_progress")
    task = fake_db.row("work_order_tasks", id="t1", work_order_id="wo1", title="Inspect",
                       description="", status="pending", priority="normal", position=0,
                       estimated_minutes=30, started_at=None, completed_at=None)
    return {"db": fake_db, "wo": wo, "task": task}


def test_start_task(ctx):
    out = task_service.start_task(ctx["db"], "t1", "p1", "plumber")
    assert out["status"] == "in_progress"
    assert out["started_at"]


def test_complete_task_sets_actual_minutes(ctx):
    ctx["task"]["status"] = "in_progress"
    ctx["task"]["started_at"] = "2026-08-08T09:00:00+00:00"
    out = task_service.complete_task(ctx["db"], "t1", "p1", "plumber")
    assert out["status"] == "completed"
    assert out["actual_minutes"] >= 0


def test_complete_task_duplicate(ctx):
    ctx["task"]["status"] = "completed"
    with pytest.raises(DuplicateActionError):
        task_service.complete_task(ctx["db"], "t1", "p1", "plumber")


def test_start_completed_task_invalid(ctx):
    ctx["task"]["status"] = "completed"
    with pytest.raises(InvalidOperationError):
        task_service.start_task(ctx["db"], "t1", "p1", "plumber")


def test_other_plumber_cannot_read(ctx):
    with pytest.raises(NotFoundError):
        task_service.get_task(ctx["db"], "t1", "p2", "plumber")


def test_update_task_fields(ctx):
    out = task_service.update_task(ctx["db"], "t1", {"title": "Renamed", "position": 3}, "p1", "plumber")
    assert out["title"] == "Renamed"
    assert out["position"] == 3
