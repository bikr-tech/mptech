"""Email provider abstraction base class."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class EmailMessage:
    """Email message to send."""
    to: str
    subject: str
    html: str
    text: str
    from_email: Optional[str] = None
    from_name: Optional[str] = None


@dataclass
class SendResult:
    """Result of sending an email."""
    success: bool
    provider_message_id: Optional[str] = None
    error: Optional[str] = None


class EmailProvider(ABC):
    """Abstract base class for email providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name (e.g., 'mailtrap', 'resend')."""
        pass

    @abstractmethod
    def send(self, message: EmailMessage) -> SendResult:
        """Send an email message. Never raises - returns SendResult."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider is properly configured."""
        pass