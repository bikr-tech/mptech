"""Completion flow: plumber completes work order → booking completed → customer
confirms → customer_confirmed. Duplicate confirmation rejected."""
import pytest

from app.services import work_order_service, booking_service
from app.services.errors import AlreadyConfirmedError


@pytest.fixture
def ctx(fake_db):
    fake_db.seed("profiles", [{"id": "u1", "email": "c@x.com", "role": "customer"},
                              {"id": "p1", "email": "p@x.com", "role": "plumber"}])
    fake_db.row("customers", id="u1", name="C", email="c@x.com")
    fake_db.row("plumbers", id="p1", name="Pete", status="available")
    fake_db.row("bookings", id="b1", booking_number="PN-1", customer_id="u1",
                assigned_plumber_id="p1", status="in_progress", title="Sink leak",
                description="", urgency="medium", ai_diagnosis={}, estimated_cost=0)
    wo = fake_db.row("work_orders", id="wo1", booking_id="b1", assigned_plumber_id="p1",
                     title="Sink leak", description="", status="in_progress")
    return {"db": fake_db, "wo": wo, "booking": fake_db.table("bookings").select("*").eq("id", "b1").single().execute().data}


def test_plumber_completes_then_customer_confirms(ctx):
    out = work_order_service.complete_work_order(ctx["db"], ctx["wo"]["id"], "p1", "plumber", "Done, leak fixed")
    assert out["status"] == "completed"
    b = ctx["db"].table("bookings").select("*").eq("id", "b1").single().execute().data
    assert b["status"] == "completed"

    confirmed = booking_service.confirm_completion(ctx["db"], b, "u1", "customer")
    assert confirmed["status"] == "customer_confirmed"
    assert confirmed["customer_confirmed_at"]


def test_customer_confirms_duplicate_rejected(ctx):
    ctx["booking"]["status"] = "completed"
    booking_service.confirm_completion(ctx["db"], ctx["booking"], "u1", "customer")
    with pytest.raises(AlreadyConfirmedError):
        booking_service.confirm_completion(ctx["db"], ctx["booking"], "u1", "customer")
