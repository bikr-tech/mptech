from supabase import create_client, Client
from app.config import settings

_client: Client | None = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client

_SCHEMA_TABLES = ("bookings", "customers", "plumbers", "work_orders")
_QUEUE_TABLES = ("email_notifications", "email_job_queue")


def require_booking_schema() -> None:
    """Guard for the booking feature: fails fast (503) if the booking tables
    aren't in Supabase yet. Without this every endpoint 500s on PGRST205."""
    from app.services.errors import SchemaNotAppliedError
    db = get_supabase()
    for t in _SCHEMA_TABLES:
        try:
            db.table(t).select("id").limit(1).execute()
        except Exception:
            raise SchemaNotAppliedError(f"Booking table '{t}' is missing.")
        break


def require_queue_schema() -> None:
    """Guard for the email queue feature: fails fast if queue tables aren't set up."""
    from app.services.errors import SchemaNotAppliedError
    db = get_supabase()
    for t in _QUEUE_TABLES:
        try:
            db.table(t).select("id").limit(1).execute()
        except Exception:
            raise SchemaNotAppliedError(f"Queue table '{t}' is missing. Run email_notifications.sql in Supabase.")
        break
