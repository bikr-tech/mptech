"""Resend email provider for production."""
import httpx

from app.config import settings
from app.email.base import EmailProvider, EmailMessage, SendResult


class ResendProvider(EmailProvider):
    """Resend HTTP API email provider."""

    RESEND_URL = "https://api.resend.com/emails"

    @property
    def name(self) -> str:
        return "resend"

    def is_configured(self) -> bool:
        return bool(settings.resend_api_key)

    def send(self, message: EmailMessage) -> SendResult:
        if not self.is_configured():
            return SendResult(success=False, error="Resend not configured")

        from_email = message.from_email or settings.resend_from_email
        from_name = message.from_name or settings.email_from_name

        try:
            from_header = f"{from_name} <{from_email}>" if from_name else from_email

            resp = httpx.post(
                self.RESEND_URL,
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_header,
                    "to": [message.to],
                    "subject": message.subject,
                    "html": message.html,
                    "text": message.text,
                },
                timeout=10,
            )

            if resp.status_code in (200, 201):
                data = resp.json()
                return SendResult(
                    success=True,
                    provider_message_id=data.get("id")
                )
            else:
                return SendResult(
                    success=False,
                    error=f"Resend API error: {resp.status_code} - {resp.text}"
                )

        except httpx.TimeoutException:
            return SendResult(success=False, error="Resend API timeout")
        except Exception as e:
            return SendResult(success=False, error=str(e))