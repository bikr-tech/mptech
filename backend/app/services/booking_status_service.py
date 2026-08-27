"""Deterministic booking status state machine.

Pure module — no DB. Every booking.status mutation in the codebase goes through
transition_booking in booking_service, which consults can_transition here.
The frontend can never set a status directly; it calls status endpoints that
route through this validation.
"""

VALID_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"admin_review", "cancelled", "rejected"},
    "admin_review": {"scheduled", "cancelled", "rejected"},
    "scheduled": {"assigned", "cancelled", "rejected"},
    "assigned": {"accepted", "rejected", "cancelled"},
    "accepted": {"en_route", "cancelled", "rejected"},
    "en_route": {"arrived", "cancelled"},
    "arrived": {"in_progress", "cancelled"},
    "in_progress": {"awaiting_approval", "completed"},
    "awaiting_approval": {"in_progress", "completed"},
    "completed": {"customer_confirmed", "awaiting_approval"},
    "customer_confirmed": set(),
    "cancelled": set(),
    "rejected": set(),
}


def can_transition(from_status: str, to_status: str) -> bool:
    return to_status in VALID_TRANSITIONS.get(from_status, set())


def assert_transition(from_status: str, to_status: str) -> None:
    from .errors import InvalidTransitionError

    if not can_transition(from_status, to_status):
        raise InvalidTransitionError(from_status, to_status)
