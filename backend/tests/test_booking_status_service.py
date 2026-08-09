"""Pure tests for the deterministic booking status machine."""
import pytest

from app.services.booking_status_service import VALID_TRANSITIONS, can_transition, assert_transition
from app.services.errors import InvalidTransitionError

ALL_STATUSES = set(VALID_TRANSITIONS)


def test_every_status_present():
    assert ALL_STATUSES == {
        "pending", "admin_review", "scheduled", "assigned", "accepted",
        "en_route", "arrived", "in_progress", "awaiting_approval", "completed",
        "customer_confirmed", "cancelled", "rejected",
    }


def test_terminal_states():
    assert VALID_TRANSITIONS["customer_confirmed"] == set()
    assert VALID_TRANSITIONS["cancelled"] == set()
    assert VALID_TRANSITIONS["rejected"] == set()


def test_happy_path_forward():
    chain = ["pending", "admin_review", "scheduled", "assigned", "accepted",
             "en_route", "arrived", "in_progress", "awaiting_approval", "completed",
             "customer_confirmed"]
    for a, b in zip(chain, chain[1:]):
        assert can_transition(a, b), f"{a} -> {b} should be valid"


def test_completion_direct_from_in_progress():
    assert can_transition("in_progress", "completed")
    assert can_transition("completed", "awaiting_approval")


@pytest.mark.parametrize("from_s,to", [
    ("pending", "scheduled"),     # skips admin_review
    ("pending", "in_progress"),   # skips whole chain
    ("assigned", "arrived"),      # skips accepted/en_route
    ("completed", "in_progress"), # completed is near-terminal
    ("cancelled", "pending"),     # terminal
    ("customer_confirmed", "completed"),
    ("en_route", "rejected"),     # rejected only from early states
])
def test_invalid_transitions_rejected(from_s, to):
    assert not can_transition(from_s, to)


def test_assert_transition_raises():
    with pytest.raises(InvalidTransitionError):
        assert_transition("pending", "completed")


def test_assert_transition_ok():
    assert_transition("pending", "admin_review")  # no raise
