"""booking_service tests: create (valid/invalid), IDOR, cancel rules, confirm.
Runs against the in-memory fake DB via the fake_db fixture."""
import pytest

from app.services import booking_service
from app.services.errors import NotFoundError, InvalidOperationError, AlreadyConfirmedError, InvalidTransitionError


@pytest.fixture
def seeded(fake_db):
    fake_db.seed("profiles", [{"id": "u1", "email": "c@x.com", "role": "customer"}])
    fake_db.row("customers", id="u1", name="C", email="c@x.com")
    fake_db.row("plumbers", id="p1", name="Pete", status="available")
    return fake_db


def _payload(**kw):
    p = {
        "service_type": "leak-repair",
        "title": "Kitchen sink leak",
        "description": "Under the sink",
        "urgency": "medium",
        "address": "1 Main St",
        "latitude": 27.7,
        "longitude": 85.3,
        "preferred_date": "2026-08-10",
        "preferred_start_time": "09:00",
        "preferred_end_time": "11:00",
        "ai_diagnosis": {},
    }
    p.update(kw)
    return p


def test_create_booking_pending(seeded):
    row = booking_service.create_booking("u1", "customer", _payload())
    assert row["status"] == "pending"
    assert row["customer_id"] == "u1"
    assert row["booking_number"].startswith("PN-")
    assert seeded.tables["booking_status_history"]  # initial pending recorded


def test_booking_number_increments_from_existing(seeded):
    # Seed a booking with a real PN-1000 so the counter derives 1001.
    seeded.row("bookings", id="old1", booking_number="PN-1000", customer_id="u1",
               status="pending")
    assert booking_service._next_booking_number(seeded) == "PN-1001"


def test_booking_number_ignores_malformed_rows(seeded):
    # A buggy "PN--1000" row (double dash) must not poison the counter.
    seeded.row("bookings", id="bad", booking_number="PN--1000", customer_id="u1",
               status="pending")
    seeded.row("bookings", id="ok", booking_number="PN-1000", customer_id="u1",
               status="pending")
    assert booking_service._next_booking_number(seeded) == "PN-1001"


def test_booking_number_starts_at_1001_when_empty(seeded):
    assert booking_service._next_booking_number(seeded) == "PN-1001"


def test_create_booking_derives_estimate_from_diagnosis(seeded):
    row = booking_service.create_booking("u1", "customer", _payload(
        ai_diagnosis={"cost_estimation": {"total_plumber_npr": 2500}}))
    assert row["estimated_cost"] == 2500


def test_create_booking_creates_customer_row_on_demand(fake_db):
    fake_db.seed("profiles", [{"id": "u9", "email": "n@x.com", "role": "customer"}])
    row = booking_service.create_booking("u9", "customer", _payload())
    assert row["status"] == "pending"
    assert any(c["id"] == "u9" for c in fake_db.tables["customers"])


def test_get_booking_customer_own(seeded):
    b = booking_service.create_booking("u1", "customer", _payload())
    got = booking_service.get_booking(seeded, str(b["id"]), "u1", "customer")
    assert got["id"] == b["id"]


def test_get_booking_idor_other_customer(seeded):
    b = booking_service.create_booking("u1", "customer", _payload())
    with pytest.raises(NotFoundError):
        booking_service.get_booking(seeded, str(b["id"]), "u2", "customer")


def test_admin_reads_any_booking(seeded):
    b = booking_service.create_booking("u1", "customer", _payload())
    got = booking_service.get_booking(seeded, str(b["id"]), "admin", "admin")
    assert got["id"] == b["id"]


def test_list_bookings_scoped(seeded):
    booking_service.create_booking("u1", "customer", _payload())
    booking_service.create_booking("u1", "customer", _payload(title="Second"))
    b2 = booking_service.create_booking("u1", "customer", _payload())
    # admin seed second customer
    seeded.row("customers", id="u3", name="Other")
    seeded.tables["bookings"].append({
        "id": "b3", "booking_number": "PN-9999", "customer_id": "u3", "status": "pending",
        "title": "Other's", "created_at": "2026-08-08T00:00:00+00:00",
    })
    mine = booking_service.list_bookings(seeded, "u1", "customer")
    assert all(x["customer_id"] == "u1" for x in mine)
    all_rows = booking_service.list_bookings(seeded, "admin", "admin")
    assert len(all_rows) == 4


def test_cancel_allowed_from_pending(seeded):
    b = booking_service.create_booking("u1", "customer", _payload())
    res = booking_service.cancel_booking(seeded, b, "u1", "customer", "Changed mind")
    assert res["status"] == "cancelled"


def test_cancel_rejected_once_in_progress(seeded):
    b = booking_service.create_booking("u1", "customer", _payload())
    b["status"] = "in_progress"
    with pytest.raises(InvalidOperationError):
        booking_service.cancel_booking(seeded, b, "u1", "customer", "x")


def test_transition_validates(seeded):
    b = booking_service.create_booking("u1", "customer", _payload())
    with pytest.raises(InvalidTransitionError):
        booking_service.transition_booking(seeded, b, "scheduled", "admin", "admin")


def test_confirm_completion(seeded):
    b = booking_service.create_booking("u1", "customer", _payload())
    b["status"] = "completed"
    res = booking_service.confirm_completion(seeded, b, "u1", "customer")
    assert res["status"] == "customer_confirmed"
    assert res["customer_confirmed_at"]


def test_confirm_duplicate_rejected(seeded):
    b = booking_service.create_booking("u1", "customer", _payload())
    b["status"] = "customer_confirmed"
    with pytest.raises(AlreadyConfirmedError):
        booking_service.confirm_completion(seeded, b, "u1", "customer")


def test_confirm_wrong_state(seeded):
    b = booking_service.create_booking("u1", "customer", _payload())
    with pytest.raises(InvalidTransitionError):
        booking_service.confirm_completion(seeded, b, "u1", "customer")


def test_report_totals_server_side(seeded):
    b = booking_service.create_booking("u1", "customer", _payload(ai_diagnosis={"cost_estimation": {"total_plumber_npr": 1000}}))
    b["status"] = "completed"
    wo = seeded.row("work_orders", booking_id=str(b["id"]), assigned_plumber_id="p1", status="completed")
    seeded.row("work_order_materials", work_order_id=wo["id"], name="Pipe", quantity=2, unit_price=500, total_price=1000)
    seeded.row("work_order_labor", work_order_id=wo["id"], plumber_id="p1", hours=2, rate=300, total=600)
    seeded.row("additional_work_requests", work_order_id=wo["id"], booking_id=str(b["id"]), status="approved", estimated_cost=200)
    seeded.row("additional_work_requests", work_order_id=wo["id"], booking_id=str(b["id"]), status="pending", estimated_cost=999)
    report = booking_service.get_report(seeded, b)
    assert report["totals"]["materials"] == 1000
    assert report["totals"]["labor"] == 600
    assert report["totals"]["additional_work"] == 200  # pending NOT billed
    assert report["totals"]["final_amount"] == 1800
