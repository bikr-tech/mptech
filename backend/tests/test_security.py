"""Role-boundary tests via TestClient. 401/403 checks run before any DB access;
identity + profiles lookup are overridden/mocked."""
from types import SimpleNamespace

from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.middleware.auth_middleware import get_current_user
from app.database import require_booking_schema

# Booking-schema guard does a live DB probe — neutralize in tests (the
# per-route 401/403 checks run before any booking-table read anyway).
app.dependency_overrides[require_booking_schema] = lambda: None

client = TestClient(app)


def _ident(user_id="c1"):
    return SimpleNamespace(user=SimpleNamespace(id=user_id))


def _override_get_current_user(user_id="c1"):
    ident = _ident(user_id)
    async def _fake():
        return ident
    app.dependency_overrides[get_current_user] = _fake
    return ident


def _reset_overrides():
    app.dependency_overrides.clear()
    app.dependency_overrides[require_booking_schema] = lambda: None


def test_unauthenticated_bookings_forbidden():
    _reset_overrides()
    res = client.get("/api/bookings")
    assert res.status_code == 403


def test_unauthenticated_dispatch_forbidden():
    _reset_overrides()
    res = client.get("/api/admin/bookings")
    assert res.status_code == 403


def test_unauthenticated_plumber_forbidden():
    _reset_overrides()
    res = client.get("/api/plumber/jobs")
    assert res.status_code == 403


def test_openapi_still_serves():
    _reset_overrides()
    res = client.get("/openapi.json")
    assert res.status_code == 200


def test_plumber_endpoint_denies_customer():
    _override_get_current_user("c1")
    with patch("app.middleware.auth_middleware.get_supabase") as mdb:
        mdb.return_value.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = \
            SimpleNamespace(data={"role": "customer"})
        res = client.get("/api/plumber/jobs")
    assert res.status_code == 403


def test_dispatch_endpoint_denies_customer():
    _override_get_current_user("c1")
    with patch("app.middleware.auth_middleware.get_supabase") as mdb:
        mdb.return_value.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = \
            SimpleNamespace(data={"role": "customer"})
        res = client.get("/api/admin/bookings")
    assert res.status_code == 403


def test_pending_plumber_denied_until_verified():
    """require_plumber now gates on plumbers.status == 'available'. A pending
    plumber (role+row present) must get 403."""
    _override_get_current_user("p1")
    with patch("app.middleware.auth_middleware.get_supabase") as mdb:
        # .single().execute() is hit twice: role lookup (profiles) then status
        # lookup (plumbers). Return values in order via side_effect.
        single_exec = mdb.return_value.table.return_value.select.return_value.eq.return_value.single.return_value.execute
        single_exec.side_effect = [
            SimpleNamespace(data={"role": "plumber"}),   # _role_of
            SimpleNamespace(data={"status": "pending"}), # status gate
        ]
        # _has_plumber_row: .eq().execute() → list
        mdb.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = \
            SimpleNamespace(data=[{"id": "p1"}])
        res = client.get("/api/plumber/jobs")
    assert res.status_code == 403
