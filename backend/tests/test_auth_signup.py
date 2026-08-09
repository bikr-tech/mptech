"""Signup router tests: role enforcement, plumber row creation with pending
status, customer default. Patches app.routers.auth.get_supabase."""
import contextlib
from types import SimpleNamespace
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient

from app.main import app
from app.database import require_booking_schema

app.dependency_overrides[require_booking_schema] = lambda: None
client = TestClient(app)


def _db_mock(uid="u1"):
    """Returns a fake db whose table() echoes into a FakeDB-like store and whose
    auth.sign_up returns a user with the given id."""
    from tests.conftest import FakeDB
    db = FakeDB()
    db.auth = SimpleNamespace(sign_up=lambda *a, **kw: SimpleNamespace(user=SimpleNamespace(id=uid)))
    # auth router calls db.table().update/upsert — FakeDB handles it.
    return db


def test_signup_customer_does_not_touch_plumbers():
    with patch("app.routers.auth.get_supabase") as m:
        db = _db_mock("u1")
        m.return_value = db
        res = client.post("/api/auth/signup", json={
            "email": "c@x.com", "password": "secret1", "role": "customer"})
        assert res.status_code == 200
        assert res.json()["role"] == "customer"
        # No plumbers row created for a customer.
        assert db.tables.get("plumbers", []) == []


def test_signup_plumber_creates_pending_row():
    with patch("app.routers.auth.get_supabase") as m:
        db = _db_mock("p1")
        db.row("profiles", id="p1", role="customer")  # trigger-created profile
        m.return_value = db
        res = client.post("/api/auth/signup", json={
            "email": "p@x.com", "password": "secret1", "role": "plumber",
            "name": "Pete"})
        assert res.status_code == 200
        assert res.json()["role"] == "plumber"
        rows = db.tables["plumbers"]
        assert rows and rows[0]["id"] == "p1"
        assert rows[0]["status"] == "pending"
        # profiles role flipped to plumber.
        assert db.tables["profiles"][0]["role"] == "plumber"


def test_signup_rejects_admin_role():
    with patch("app.routers.auth.get_supabase") as m:
        m.return_value = _db_mock()
        res = client.post("/api/auth/signup", json={
            "email": "a@x.com", "password": "secret1", "role": "admin"})
        assert res.status_code == 422  # Literal rejects unknown role


def _override_admin(uid="admin1"):
    from app.middleware.auth_middleware import get_current_user
    async def _fake():
        return SimpleNamespace(user=SimpleNamespace(id=uid))
    app.dependency_overrides[get_current_user] = _fake


def _patch_verify(db, admin_id="admin1"):
    """Patch auth_middleware (require_admin reads profiles → dict, not .data)
    + dispatch + audit_service. require_admin needs a profile whose .single()
    returns a SimpleNamespace(data={...}) — separate mock chain."""
    admin_mock = MagicMock()
    admin_mock.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = \
        SimpleNamespace(data={"role": "admin"})
    return (
        patch("app.routers.dispatch.get_supabase", return_value=db),
        patch("app.middleware.auth_middleware.get_supabase", return_value=admin_mock),
        patch("app.services.audit_service.get_supabase", return_value=db),
    )


def test_verify_pending_plumber():
    _override_admin()
    from tests.conftest import FakeDB
    db = FakeDB()
    db.row("plumbers", id="p1", name="Pete", status="pending")
    with contextlib.ExitStack() as stack:
        for p in _patch_verify(db):
            stack.enter_context(p)
        res = client.post("/api/admin/plumbers/p1/verify")
    assert res.status_code == 200
    assert db.tables["plumbers"][0]["status"] == "available"


def test_verify_non_pending_rejected():
    _override_admin()
    from tests.conftest import FakeDB
    db = FakeDB()
    db.row("plumbers", id="p1", name="Pete", status="available")
    with contextlib.ExitStack() as stack:
        for p in _patch_verify(db):
            stack.enter_context(p)
        res = client.post("/api/admin/plumbers/p1/verify")
    assert res.status_code == 422  # ValidationAppError
