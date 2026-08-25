"""Email service with provider abstraction."""
from app.config import settings
from app.email.base import EmailProvider, EmailMessage, SendResult
from app.email.mailtrap import MailtrapProvider
from app.email.resend import ResendProvider


class EmailService:
    """Email service that routes to the configured provider."""

    def __init__(self):
        self._provider: EmailProvider | None = None
        self._init_provider()

    def _init_provider(self) -> None:
        provider_name = settings.email_provider.lower()
        if provider_name == "mailtrap":
            self._provider = MailtrapProvider()
        elif provider_name == "resend":
            self._provider = ResendProvider()
        else:
            self._provider = None

    @property
    def provider(self) -> EmailProvider | None:
        return self._provider

    @property
    def is_enabled(self) -> bool:
        return self._provider is not None and self._provider.is_configured()

    def send(self, message: EmailMessage) -> SendResult:
        """Send an email via the configured provider."""
        if not self.is_enabled:
            return SendResult(
                success=False,
                error=f"Email provider '{settings.email_provider}' not configured or disabled"
            )
        return self._provider.send(message)


# Global instance
email_service = EmailService()