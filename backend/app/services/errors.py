"""Consistent API error envelope.

Raise AppError(...) in services; the FastAPI exception handler in main.py
converts it to {"error": {"code": ..., "message": ...}}.
"""
from fastapi import HTTPException


class AppError(HTTPException):
    def __init__(self, code: str, message: str, status: int = 400):
        super().__init__(status_code=status, detail={"error": {"code": code, "message": message}})
        self.code = code


class NotFoundError(AppError):
    def __init__(self, message: str = "Not found"):
        super().__init__("NOT_FOUND", message, status=404)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden"):
        super().__init__("FORBIDDEN", message, status=403)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__("UNAUTHORIZED", message, status=401)


class ValidationAppError(AppError):
    def __init__(self, message: str = "Invalid request"):
        super().__init__("VALIDATION_ERROR", message, status=422)


class InvalidTransitionError(AppError):
    def __init__(self, from_status: str, to_status: str):
        super().__init__(
            "INVALID_STATUS_TRANSITION",
            f"Cannot transition booking from '{from_status}' to '{to_status}'.",
            status=409,
        )


class PlumberUnavailableError(AppError):
    def __init__(self, message: str = "The selected plumber is unavailable during the requested time."):
        super().__init__("PLUMBER_UNAVAILABLE", message, status=409)


class ScheduleConflictError(AppError):
    def __init__(self, message: str = "Plumber is already scheduled for another job during this time."):
        super().__init__("SCHEDULE_CONFLICT", message, status=409)


class AlreadyConfirmedError(AppError):
    def __init__(self, message: str = "Booking already confirmed."):
        super().__init__("BOOKING_ALREADY_CONFIRMED", message, status=409)


class UnapprovedWorkError(AppError):
    def __init__(self, message: str = "This additional work has not been approved by the customer."):
        super().__init__("UNAPPROVED_ADDITIONAL_WORK", message, status=409)


class InvalidOperationError(AppError):
    def __init__(self, message: str = "Operation not allowed in the current state."):
        super().__init__("INVALID_OPERATION", message, status=409)


class DuplicateActionError(AppError):
    def __init__(self, message: str = "This action has already been performed."):
        super().__init__("DUPLICATE_ACTION", message, status=409)


class SchemaNotAppliedError(AppError):
    def __init__(self, message: str = "Booking database schema is not applied. Run backend/supabase/booking_schema.sql in the Supabase Dashboard SQL Editor."):
        super().__init__("SCHEMA_NOT_APPLIED", message, status=503)
