"""Transactional email via Resend REST API. Fire-and-forget: a send failure
must never break the booking/dispatch flow, so every path swallows errors and
the service is a silent no-op when RESEND_API_KEY is empty."""
import threading

import httpx

from app.config import settings

RESEND_URL = "https://api.resend.com/emails"


def send_email(to: str, subject: str, html: str) -> bool:
    """Send one email. Returns False when disabled or on failure (never raises)."""
    if not settings.resend_api_key or not to:
        return False
    try:
        resp = httpx.post(
            RESEND_URL,
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={"from": settings.resend_from_email, "to": [to], "subject": subject, "html": html},
            timeout=10,
        )
        return resp.status_code in (200, 201)
    except Exception:
        return False


def _notify_async(fn):
    """Run the send off the request thread so a slow SMTP never blocks the API."""
    threading.Thread(target=fn, daemon=True).start()


def notify_visit_scheduled(to: str, name: str, booking_number: str, booking_id: str,
                           service_type: str, start_iso: str, end_iso: str, site_url: str) -> None:
    """Email a customer that the visit window was set/changed."""
    def _run():
        start = start_iso.replace("T", " ")[:16]
        end = end_iso.replace("T", " ")[:16]
        link = f"{site_url}/account/bookings/{booking_id}"
        html = (
            f"<p>Hi {name},</p>"
            f"<p>Your booking <b>{booking_number}</b> ({service_type}) has been "
            f"scheduled.</p>"
            f"<p><b>Visit window:</b> {start} &ndash; {end}</p>"
            f"<p>Track it here: "
            f"<a href='{link}'>{link}</a></p>"
        )
        send_email(to, f"Visit scheduled — {booking_number}", html)
    _notify_async(_run)


def notify_job_assigned(to: str, name: str, booking_number: str, service_type: str,
                        site_url: str, start_iso: str | None = None, end_iso: str | None = None) -> None:
    """Email a plumber that a job was assigned to them."""
    def _run():
        window = ""
        if start_iso:
            start = start_iso.replace("T", " ")[:16]
            end = (end_iso or "").replace("T", " ")[:16]
            window = f"<p><b>Visit window:</b> {start} &ndash; {end}</p>"
        html = (
            f"<p>Hi {name},</p>"
            f"<p>You've been assigned booking <b>{booking_number}</b> "
            f"({service_type}).</p>"
            f"{window}"
            f"<p>Open it in your dashboard: "
            f"<a href='{site_url}/plumber'>{site_url}/plumber</a></p>"
        )
        send_email(to, f"New job assigned — {booking_number}", html)
    _notify_async(_run)
