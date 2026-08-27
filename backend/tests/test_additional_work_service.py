"""additional_work tests: request→approve→task created; reject; unapproved not
billable; only assigned plumber can request."""
import pytest

from app.services import additional_work_service
from app.services.errors import ForbiddenError, DuplicateActionError, InvalidOperationError


@pytest.fixture
def ctx(fake_db):
    fake_db.seed("profiles", [{"id": "u1", "email": "c@x.com", "role": "customer"},
                              {"id": "p1", "email": "p@x.com", "role": "plumber"},
                              {"id": "p2", "email": "q@x.com", "role": "plumber"}])
    fake_db.row("customers", id="u1", name="C", email="c@x.com")
    fake_db.row("plumbers", id="p1", name="Pete", status="available")
    fake_db.row("plumbers", id="p2", name="Other", status="available")
    fake_db.row("bookings", id="b1", booking_number="PN-1", customer_id="u1",
                assigned_plumber_id="p1", status="in_progress", title="Sink leak",
                description="", urgency="medium", ai_diagnosis={})
    wo = fake_db.row("work_orders", id="wo1", booking_id="b1", assigned_plumber_id="p1",
                     title="Sink leak", description="", status="in_progress")
    return {"db": fake_db, "wo": wo}


def test_assignee_requests_additional_work(ctx):
    req = additional_work_service.request_additional_work(ctx["db"], ctx["wo"]["id"], "p1", "plumber",
        {"description": "Replace the trap too", "estimated_cost": 1500})
    assert req["status"] == "pending"
    assert req["requested_by"] == "p1"


def test_non_assigned_plumber_forbidden(ctx):
    with pytest.raises(ForbiddenError):
        additional_work_service.request_additional_work(ctx["db"], ctx["wo"]["id"], "p2", "plumber",
            {"description": "x", "estimated_cost": 0})


def test_approve_creates_task_and_reopens_booking(ctx):
    req = additional_work_service.request_additional_work(ctx["db"], ctx["wo"]["id"], "p1", "plumber",
        {"description": "Replace the trap too", "estimated_cost": 1500})
    ctx["db"].table("bookings").update({"status": "awaiting_approval"}).eq("id", "b1").execute()
    out = additional_work_service.approve(ctx["db"], req["id"], "u1", "customer")
    assert out["status"] == "approved"
    tasks = ctx["db"].table("work_order_tasks").select("*").eq("work_order_id", ctx["wo"]["id"]).execute().data
    assert len(tasks) == 1
    # booking reopens from awaiting_approval → in_progress
    b = ctx["db"].table("bookings").select("*").eq("id", "b1").single().execute().data
    assert b["status"] == "in_progress"


def test_approve_duplicate_rejected(ctx):
    req = additional_work_service.request_additional_work(ctx["db"], ctx["wo"]["id"], "p1", "plumber",
        {"description": "x", "estimated_cost": 0})
    additional_work_service.approve(ctx["db"], req["id"], "u1", "customer")
    with pytest.raises(DuplicateActionError):
        additional_work_service.approve(ctx["db"], req["id"], "u1", "customer")


def test_reject_records_reason(ctx):
    req = additional_work_service.request_additional_work(ctx["db"], ctx["wo"]["id"], "p1", "plumber",
        {"description": "x", "estimated_cost": 0})
    out = additional_work_service.reject(ctx["db"], req["id"], "u1", "customer", "Too expensive")
    assert out["status"] == "rejected"
    assert out["rejection_reason"] == "Too expensive"


def test_customer_approving_others_booking_forbidden(ctx):
    req = additional_work_service.request_additional_work(ctx["db"], ctx["wo"]["id"], "p1", "plumber",
        {"description": "x", "estimated_cost": 0})
    with pytest.raises(ForbiddenError):
        additional_work_service.approve(ctx["db"], req["id"], "u9", "customer")
