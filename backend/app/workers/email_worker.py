"""Email worker - processes email_job_queue and sends emails."""
import asyncio
import os
import signal
import sys
import time
from typing import Optional

from app.config import settings
from app.database import get_supabase
from app.email import email_service, EmailMessage


class EmailWorker:
    """Email worker that processes the Supabase email job queue."""

    def __init__(
        self,
        worker_id: Optional[str] = None,
        batch_size: Optional[int] = None,
        concurrency: Optional[int] = None,
        poll_interval: float = 5.0,
    ):
        self.worker_id = worker_id or f"worker-{os.getpid()}"
        self.batch_size = batch_size or settings.email_worker_batch_size
        self.concurrency = concurrency or settings.email_worker_concurrency
        self.poll_interval = poll_interval
        self.db = get_supabase()
        self._running = False
        self._semaphore: Optional[asyncio.Semaphore] = None

    async def start(self) -> None:
        """Start the worker loop."""
        self._running = True
        self._semaphore = asyncio.Semaphore(self.concurrency)
        print(f"[{self.worker_id}] Email worker started (batch_size={self.batch_size}, concurrency={self.concurrency})")

        # Setup signal handlers
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            try:
                loop.add_signal_handler(sig, self._shutdown)
            except NotImplementedError:
                # Windows doesn't support add_signal_handler
                pass

        while self._running:
            try:
                await self._process_batch()
            except Exception as e:
                print(f"[{self.worker_id}] Error in worker loop: {e}")
                await asyncio.sleep(self.poll_interval)

    def _shutdown(self) -> None:
        """Signal handler for graceful shutdown."""
        print(f"[{self.worker_id}] Shutdown signal received")
        self._running = False

    async def _process_batch(self) -> None:
        """Claim and process a batch of jobs."""
        # Claim jobs using the database function
        try:
            result = self.db.rpc("claim_email_job", {
                "worker_id": self.worker_id,
                "batch_size": self.batch_size,
            }).execute()

            jobs = result.data or []
            if not jobs:
                await asyncio.sleep(self.poll_interval)
                return

            print(f"[{self.worker_id}] Claimed {len(jobs)} jobs")

            # Process jobs concurrently
            tasks = [self._process_job(job) for job in jobs]
            await asyncio.gather(*tasks, return_exceptions=True)

        except Exception as e:
            print(f"[{self.worker_id}] Error claiming jobs: {e}")
            await asyncio.sleep(self.poll_interval)

    async def _process_job(self, job: dict) -> None:
        """Process a single email job."""
        async with self._semaphore:
            job_id = job["id"]
            payload = job["payload"]

            print(f"[{self.worker_id}] Processing job {job_id} ({payload.get('notification_type')})")

            try:
                # Validate payload
                if not self._validate_payload(payload):
                    await self._fail_job(job_id, "Invalid payload")
                    return

                # Send email
                result = await self._send_email(payload)

                if result.success:
                    await self._complete_job(job_id, result.provider_message_id)
                    await self._update_notification_record(payload, "sent", result.provider_message_id)
                    print(f"[{self.worker_id}] Job {job_id} completed successfully")
                else:
                    await self._fail_job(job_id, result.error or "Unknown error")
                    await self._update_notification_record(payload, "failed", error=result.error)
                    print(f"[{self.worker_id}] Job {job_id} failed: {result.error}")

            except Exception as e:
                print(f"[{self.worker_id}] Job {job_id} exception: {e}")
                await self._fail_job(job_id, str(e))
                await self._update_notification_record(payload, "failed", error=str(e))

    def _validate_payload(self, payload: dict) -> bool:
        """Validate job payload has required fields."""
        required = ["notification_type", "booking_id", "recipient_type", "recipient_id", "subject", "html_content", "text_content", "recipient_email"]
        return all(field in payload for field in required)

    async def _send_email(self, payload: dict) -> "SendResult":
        """Send email using the email service."""
        if not email_service.is_enabled:
            # Email disabled - mark as skipped but successful
            from app.email.base import SendResult
            return SendResult(success=True, error="Email provider disabled")

        message = EmailMessage(
            to=payload["recipient_email"],
            subject=payload["subject"],
            html=payload["html_content"],
            text=payload["text_content"],
        )

        # Run in thread pool since email providers are synchronous
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, email_service.send, message)

    async def _complete_job(self, job_id: str, provider_message_id: Optional[str]) -> None:
        """Mark job as completed."""
        self.db.rpc("complete_email_job", {
            "job_id": job_id,
            "provider_message_id": provider_message_id,
        }).execute()

    async def _fail_job(self, job_id: str, error_msg: str) -> None:
        """Mark job as failed (will retry if attempts < max_attempts)."""
        self.db.rpc("fail_email_job", {
            "job_id": job_id,
            "error_msg": error_msg[:500] if error_msg else "Unknown error",
        }).execute()

    async def _update_notification_record(
        self,
        payload: dict,
        status: str,
        provider_message_id: Optional[str] = None,
        error: Optional[str] = None
    ) -> None:
        """Update the email_notifications record."""
        try:
            update_data = {
                "status": status,
                "updated_at": "now()",
            }
            if provider_message_id:
                update_data["provider_message_id"] = provider_message_id
            if error:
                update_data["error_message"] = error[:500]
            if status == "sent":
                update_data["sent_at"] = "now()"

            self.db.table("email_notifications").update(update_data).eq(
                "booking_id", payload["booking_id"]
            ).eq(
                "notification_type", payload["notification_type"]
            ).eq(
                "recipient_id", payload["recipient_id"]
            ).execute()
        except Exception as e:
            print(f"[{self.worker_id}] Failed to update notification record: {e}")


async def main():
    """Entry point for running the worker."""
    worker = EmailWorker()
    await worker.start()


if __name__ == "__main__":
    asyncio.run(main())