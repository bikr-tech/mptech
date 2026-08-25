"""Mailtrap email provider for development/testing."""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

from app.config import settings
from app.email.base import EmailProvider, EmailMessage, SendResult


class MailtrapProvider(EmailProvider):
    """Mailtrap SMTP email provider."""

    @property
    def name(self) -> str:
        return "mailtrap"

    def is_configured(self) -> bool:
        return bool(
            settings.mailtrap_username
            and settings.mailtrap_password
            and settings.mailtrap_host
        )

    def send(self, message: EmailMessage) -> SendResult:
        if not self.is_configured():
            return SendResult(success=False, error="Mailtrap not configured")

        from_email = message.from_email or settings.email_from_address
        from_name = message.from_name or settings.email_from_name

        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = message.subject
            msg["From"] = formataddr((from_name, from_email))
            msg["To"] = message.to

            # Attach parts
            text_part = MIMEText(message.text, "plain", "utf-8")
            html_part = MIMEText(message.html, "html", "utf-8")
            msg.attach(text_part)
            msg.attach(html_part)

            # Send via SMTP
            context = ssl.create_default_context()
            with smtplib.SMTP(settings.mailtrap_host, settings.mailtrap_port) as server:
                server.starttls(context=context)
                server.login(settings.mailtrap_username, settings.mailtrap_password)
                server.send_message(msg)

            return SendResult(success=True)

        except Exception as e:
            return SendResult(success=False, error=str(e))