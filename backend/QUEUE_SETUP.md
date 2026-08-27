"""
Supabase Email Queue Setup Guide

The email queue system uses PostgreSQL tables in Supabase as a durable job queue.
This is NOT the newer Supabase Queue managed service - it's a battle-tested table-based approach.

SETUP STEPS
===========

1. CREATE SCHEMA IN SUPABASE
   - Go to Supabase Dashboard → SQL Editor
   - Copy the entire contents of: backend/supabase/email_notifications.sql
   - Paste and execute in the SQL Editor
   - This creates:
     * email_notifications table (idempotency)
     * email_job_queue table (durable queue)
     * RPC functions (claim_email_job, complete_email_job, fail_email_job, etc.)
     * RLS policies for admin access

2. VERIFY TABLES CREATED
   - Run: SELECT COUNT(*) FROM email_job_queue;
   - Should return 0 (empty queue)
   - Run: SELECT COUNT(*) FROM email_notifications;
   - Should return 0 (empty notifications)

3. CONFIGURE ENVIRONMENT
   - Set EMAIL_PROVIDER to "resend" or "mailtrap"
   - If using Resend: set RESEND_API_KEY
   - If using Mailtrap: set MAILTRAP_USERNAME, MAILTRAP_PASSWORD
   - Example .env:
     EMAIL_PROVIDER=resend
     RESEND_API_KEY=re_xxxxxxxxxxxxx

4. START EMAIL WORKER
   - Run: python run_email_worker.py
   - The worker will:
     * Poll email_job_queue every 5 seconds
     * Claim 10 jobs at a time (configurable)
     * Send emails via configured provider
     * Track job status (pending → processing → completed/failed/dead_letter)
     * Implement exponential backoff for retries

5. TEST QUEUE (OPTIONAL)
   - Run: python -m pytest tests/test_email_queue_service.py -v
   - Should see 4 tests pass

QUEUE ARCHITECTURE
==================

Job Flow:
  Booking created
    ↓
  booking_notifications.enqueue_notification()
    ├─ Render email template
    ├─ Insert to email_notifications (idempotency)
    └─ Insert to email_job_queue (PAYLOAD with JSON)
         ↓
  [Email Worker Poll Every 5s]
    ├─ claim_email_job() — locks 10 jobs, marks processing
    ├─ Send via provider (Resend/Mailtrap)
    ├─ complete_email_job() — marks completed
    └─ On failure: fail_email_job() — retries or dead_letters

Tables:
  email_notifications — Idempotency cache (one per booking × notification type × recipient)
  email_job_queue — Durable queue (one entry per job)

RPC Functions (Atomic Database Operations):
  claim_email_job(worker_id, batch_size) → returns pending jobs
  complete_email_job(job_id, provider_message_id) → mark completed
  fail_email_job(job_id, error_msg) → retry or dead letter
  requeue_dead_letter_jobs(max_jobs) → admin action
  cleanup_email_jobs(retention_days) → admin action
  get_email_queue_stats() → queue health metrics

PAYLOAD STRUCTURE
=================

email_job_queue.payload contains:
{
  "notification_type": "booking_created",
  "booking_id": "550e8400-...",
  "recipient_type": "customer",
  "recipient_id": "660e8400-...",
  "subject": "Booking Confirmed",
  "html_content": "<p>...</p>",
  "text_content": "...",
  "recipient_email": "customer@example.com"
}

API / QUEUE SERVICE
===================

python app/services/email_queue_service.py:

  enqueue_job(payload, max_attempts=3) → job_id
    Publish a job to the queue

  get_queue_stats() → dict
    Get counts by status (pending, processing, completed, failed, dead_letter)

  requeue_dead_letter_jobs(max_jobs=100) → count
    Retry failed jobs (admin action)

  cleanup_old_jobs(retention_days=30) → count
    Delete old completed/failed jobs (admin action)

MONITORING
==========

Check queue status:
  SELECT status, COUNT(*) FROM email_job_queue GROUP BY status;

Check recent errors:
  SELECT id, error_message, last_error_at 
  FROM email_job_queue 
  WHERE status = 'dead_letter' 
  ORDER BY updated_at DESC 
  LIMIT 20;

Check idempotency:
  SELECT notification_type, COUNT(*) FROM email_notifications 
  GROUP BY notification_type;

CONFIGURATION OPTIONS
====================

In backend/app/config.py:
  EMAIL_PROVIDER = "disabled" | "resend" | "mailtrap"
  EMAIL_WORKER_BATCH_SIZE = 10 (jobs to claim per poll)
  EMAIL_WORKER_CONCURRENCY = 3 (concurrent sends)
  RESEND_API_KEY (for production)
  MAILTRAP_USERNAME, MAILTRAP_PASSWORD (for development)
  EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME

CLI Options for Worker:
  python run_email_worker.py --batch-size 20 --concurrency 5 --poll-interval 3

TROUBLESHOOTING
===============

❌ Queue tables not found
   → Run email_notifications.sql in Supabase SQL Editor

❌ Jobs stuck in "processing"
   → Worker crashed; clear with:
     UPDATE email_job_queue SET status='pending' WHERE status='processing';
     UPDATE email_job_queue SET attempts=0, started_at=NULL WHERE status='processing';

❌ Jobs in dead_letter
   → View error: SELECT error_message FROM email_job_queue WHERE status='dead_letter';
   → Fix and retry: SELECT requeue_dead_letter_jobs(100);

❌ Email not sent but job marked completed
   → Check email provider configuration
   → Check recipient email in database
   → Resend/Mailtrap API logs

NO REDIS / NO CELERY
====================

This queue uses PostgreSQL directly as the backing store.
- Simple: no additional infrastructure
- Durable: jobs survive process crashes
- Atomic: RPC functions prevent race conditions
- Observable: full SQL access to job queue
- Cost-effective: uses existing Supabase database

Trade-off: Slightly higher latency than in-memory queue
Performance: ~1-10ms per job (plenty for async emails)
"""
