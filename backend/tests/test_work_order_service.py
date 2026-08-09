"""work_order_service tests: task CRUD, reorder, server-side totals, notes,
photo validation, and the plumber job-action state machine."""
import pytest

from app.services import work_order_service
from app.services.errors import NotFoundError, InvalidOperationError, InvalidTransitionError, DuplicateActionError


@pytest.fixture
def seeded(fake_db):
    fake_db.seed("profiles", [{"id": "u1", "email": "c@x.com", "role": "customer"},
                              {"id": "p1", "email": "p@x.com", "role": "plumber"}])
    fake_db.row("customers", id="u1", name="C", email="c@x.com")
    fake_db.row("plumbers", id="p1", name="Pete", status="available", skills=["leak-repair"])
    b = fake_db.row("bookings", id="b1", booking_number="PN-1", customer_id="u1",
                    assigned_plumber_id="p1", status="assigned", title="Sink leak",
                    description="", urgency="medium", preferred_date="2026-08-10",
                    preferred_start_time="09:00", preferred_end_time="11:00", ai_diagnosis={})
    wo = fake_db.row("work_orders", id="wo1", booking_id="b1", assigned_plumber_id="p1",
                     title="Sink leak", description="", status="assigned", priority="normal")
    return {"b": b, "wo": wo, "db": fake_db}


def _add_task(ctx, **kw):
    t = {"title": kw.pop("title", "Inspect"), "description": "", "priority": "normal", "estimated_minutes": 30}
    t.update(kw)
    return work_order_service.add_task(ctx["db"], ctx["wo"]["id"], t, "p1", "plumber")


def test_add_task_appends_position(seeded):
    t1 = _add_task(seeded)
    t2 = _add_task(seeded)
    assert t1["position"] == 0
    assert t2["position"] == 1


def test_reorder_tasks_persists(seeded):
    t1 = _add_task(seeded)
    t2 = _add_task(seeded)
    t3 = _add_task(seeded)
    work_order_service.reorder_tasks(seeded["db"], seeded["wo"]["id"], [str(t3["id"]), str(t1["id"]), str(t2["id"])], "p1", "plumber")
    tasks = seeded["db"].table("work_order_tasks").select("*").eq("work_order_id", seeded["wo"]["id"]).order("position").execute().data
    assert [str(t["id"]) for t in tasks] == [str(t3["id"]), str(t1["id"]), str(t2["id"])]
    assert [t["position"] for t in tasks] == [0, 1, 2]


def test_material_total_computed_server_side(seeded):
    m = work_order_service.add_material(seeded["db"], seeded["wo"]["id"],
        {"name": "Copper pipe", "quantity": 3, "unit_price": 400, "total_price": 1},  # client total ignored
        "p1", "plumber")
    assert m["total_price"] == 1200


def test_labor_total_computed_server_side(seeded):
    l = work_order_service.add_labor(seeded["db"], seeded["wo"]["id"], "p1",
        {"hours": 2.5, "rate": 400, "total": 1}, "p1", "plumber")
    assert l["total"] == 1000.0


def test_add_note(seeded):
    n = work_order_service.add_note(seeded["db"], seeded["wo"]["id"], "p1",
        {"note": "Found corroded joint", "task_id": None}, "p1", "plumber")
    assert n["note"] == "Found corroded joint"


def test_photo_type_validated(seeded):
    with pytest.raises(InvalidOperationError):
        work_order_service.add_photo(seeded["db"], seeded["wo"]["id"], "p1",
            {"photo_type": "mid", "storage_path": "wp/x.jpg"}, "p1", "plumber")
    p = work_order_service.add_photo(seeded["db"], seeded["wo"]["id"], "p1",
        {"photo_type": "before", "storage_path": "wp/x.jpg", "caption": "before"}, "p1", "plumber")
    assert p["photo_type"] == "before"


def test_other_plumber_cannot_read(seeded):
    with pytest.raises(NotFoundError):
        work_order_service.get_work_order(seeded["db"], seeded["wo"]["id"], "p2", "plumber")


def test_apply_job_action_accept(seeded):
    out = work_order_service.apply_job_action(seeded["db"], seeded["b"], seeded["wo"], "accept", "p1", "plumber")
    assert out["booking_status"] == "accepted"
    assert seeded["db"].table("work_orders").select("*").eq("id", seeded["wo"]["id"]).single().execute().data["status"] == "accepted"


def test_apply_job_action_wrong_state(seeded):
    with pytest.raises(InvalidTransitionError):
        work_order_service.apply_job_action(seeded["db"], seeded["b"], seeded["wo"], "start", "p1", "plumber")


def test_apply_job_action_reject(seeded):
    out = work_order_service.apply_job_action(seeded["db"], seeded["b"], seeded["wo"], "reject", "p1", "plumber")
    assert out["booking_status"] == "rejected"


def test_apply_job_action_complete_from_awaiting_approval(seeded):
    seeded["b"]["status"] = "awaiting_approval"
    out = work_order_service.apply_job_action(seeded["db"], seeded["b"], seeded["wo"], "complete", "p1", "plumber")
    assert out["booking_status"] == "completed"


def test_complete_work_order_blocks_pending_tasks(seeded):
    _add_task(seeded)
    seeded["wo"]["status"] = "in_progress"
    with pytest.raises(InvalidOperationError):
        work_order_service.complete_work_order(seeded["db"], seeded["wo"]["id"], "p1", "plumber")


def test_complete_work_order_duplicate(seeded):
    seeded["wo"]["status"] = "completed"
    with pytest.raises(DuplicateActionError):
        work_order_service.complete_work_order(seeded["db"], seeded["wo"]["id"], "p1", "plumber")


def test_get_work_order_detail_totals(seeded):
    work_order_service.add_material(seeded["db"], seeded["wo"]["id"], {"name": "Pipe", "quantity": 2, "unit_price": 500}, "p1", "plumber")
    work_order_service.add_labor(seeded["db"], seeded["wo"]["id"], "p1", {"hours": 1, "rate": 300}, "p1", "plumber")
    detail = work_order_service.get_work_order_detail(seeded["db"], seeded["wo"]["id"], "p1", "plumber")
    assert detail["totals"]["materials"] == 1000
    assert detail["totals"]["labor"] == 300
    assert detail["totals"]["final_amount"] == 1300
