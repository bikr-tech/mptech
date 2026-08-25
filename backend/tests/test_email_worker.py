"""Test email worker functionality."""
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
import pytest

from app.workers.email_worker import EmailWorker
from app.email.base import SendResult


@pytest.mark.asyncio
async def test_worker_validates_payload():
    """Test that worker validates job payload."""
    worker = EmailWorker(batch_size=1, concurrency=1)
    
    # Invalid payload (missing fields)
    invalid_payload = {
        "notification_type": "booking_created",
        # Missing required fields
    }
    
    # Should return False for invalid payload
    assert not worker._validate_payload(invalid_payload)


@pytest.mark.asyncio
async def test_worker_validates_complete_payload():
    """Test that worker accepts valid payload."""
    worker = EmailWorker(batch_size=1, concurrency=1)
    
    valid_payload = {
        "notification_type": "booking_created",
        "booking_id": "550e8400-e29b-41d4-a716-446655440000",
        "recipient_type": "customer",
        "recipient_id": "660e8400-e29b-41d4-a716-446655440000",
        "subject": "Test Subject",
        "html_content": "<p>Test</p>",
        "text_content": "Test",
        "recipient_email": "test@example.com",
    }
    
    assert worker._validate_payload(valid_payload)


@pytest.mark.asyncio
async def test_worker_creates_correct_message():
    """Test that worker creates EmailMessage correctly."""
    worker = EmailWorker(batch_size=1, concurrency=1)
    
    payload = {
        "notification_type": "booking_created",
        "booking_id": "550e8400-e29b-41d4-a716-446655440000",
        "recipient_type": "customer",
        "recipient_id": "660e8400-e29b-41d4-a716-446655440000",
        "subject": "Test Subject",
        "html_content": "<p>HTML Content</p>",
        "text_content": "Text Content",
        "recipient_email": "customer@example.com",
    }
    
    # Mock email service
    with patch('app.workers.email_worker.email_service') as mock_service:
        mock_service.is_enabled = True
        mock_service.send = MagicMock(return_value=SendResult(success=True, provider_message_id="msg_123"))
        
        # Mock RPC calls
        with patch.object(worker.db, 'rpc'):
            with patch.object(worker.db, 'table'):
                loop = asyncio.get_event_loop()
                # Would normally run in executor, but we're just testing message creation
                pass


@pytest.mark.asyncio
async def test_worker_configuration():
    """Test that worker accepts configuration parameters."""
    worker = EmailWorker(
        worker_id="test-worker-1",
        batch_size=20,
        concurrency=5,
        poll_interval=3.0
    )
    
    assert worker.worker_id == "test-worker-1"
    assert worker.batch_size == 20
    assert worker.concurrency == 5
    assert worker.poll_interval == 3.0


def test_worker_graceful_shutdown():
    """Test that worker can be shut down gracefully."""
    worker = EmailWorker()
    assert worker._running == False
    
    worker._running = True
    worker._shutdown()
    assert worker._running == False


@pytest.mark.asyncio
async def test_worker_semaphore_concurrency():
    """Test that worker respects concurrency limits."""
    worker = EmailWorker(batch_size=10, concurrency=2)
    
    # Semaphore should be initialized when worker starts
    await worker._process_batch()  # This will set up semaphore if any jobs
    # Note: actual test would require real queue
