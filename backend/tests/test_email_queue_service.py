"""Test email queue service."""
import pytest
from app.services import email_queue_service

def test_enqueue_job(fake_db):
    """Test enqueueing a job to the queue."""
    payload = {
        "notification_type": "booking_created",
        "booking_id": "550e8400-e29b-41d4-a716-446655440000",
        "recipient_type": "customer",
        "recipient_id": "660e8400-e29b-41d4-a716-446655440000",
        "subject": "Test Subject",
        "html_content": "<p>Test</p>",
        "text_content": "Test",
        "recipient_email": "test@example.com",
    }

    job_id = email_queue_service.enqueue_job(payload)
    assert isinstance(job_id, str)
    assert len(job_id) == 36  # UUID length


def test_queue_stats(fake_db):
    """Test getting queue statistics."""
    stats = email_queue_service.get_queue_stats()
    assert isinstance(stats, dict)


def test_requeue_dead_letter(fake_db):
    """Test requeuing dead letter jobs."""
    count = email_queue_service.requeue_dead_letter_jobs(max_jobs=10)
    assert isinstance(count, int)
    assert count >= 0


def test_cleanup_jobs(fake_db):
    """Test cleaning up old jobs."""
    count = email_queue_service.cleanup_old_jobs(retention_days=30)
    assert isinstance(count, int)
    assert count >= 0
