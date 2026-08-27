-- ============================================================================
-- Email Notifications & Queue Schema
-- Run in Supabase Dashboard → SQL Editor ONCE
-- ============================================================================

-- ── 1. Email Notifications Table (Idempotency) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('customer', 'plumber', 'admin')),
  recipient_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN (
    'booking_created',
    'booking_assigned',
    'plumber_job_assigned',
    'booking_scheduled',
    'booking_rescheduled',
    'plumber_accepted',
    'plumber_en_route',
    'plumber_arrived',
    'booking_completed',
    'additional_work_requested',
    'additional_work_approved',
    'additional_work_rejected'
  )),
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('mailtrap', 'resend', 'disabled')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  attempts integer DEFAULT 0,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (booking_id, notification_type, recipient_id)
);

CREATE INDEX IF NOT EXISTS email_notifications_booking_idx ON public.email_notifications (booking_id);
CREATE INDEX IF NOT EXISTS email_notifications_status_idx ON public.email_notifications (status);
CREATE INDEX IF NOT EXISTS email_notifications_recipient_idx ON public.email_notifications (recipient_type, recipient_id);

-- ── 2. Email Job Queue Table (PostgreSQL-backed durable queue) ────────────────
CREATE TABLE IF NOT EXISTS public.email_job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  error_message text,
  last_error_at timestamptz,
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_job_queue_status_idx ON public.email_job_queue (status, scheduled_at);
CREATE INDEX IF NOT EXISTS email_job_queue_payload_idx ON public.email_job_queue USING gin (payload);

-- ── 3. Queue Processing Functions ─────────────────────────────────────────────
-- Claim next available job (atomic, prevents duplicate processing)
CREATE OR REPLACE FUNCTION public.claim_email_job(
  worker_id text,
  batch_size integer DEFAULT 10,
  visibility_timeout interval DEFAULT '5 minutes'
) RETURNS SETOF public.email_job_queue LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  job public.email_job_queue;
BEGIN
  FOR job IN
    UPDATE public.email_job_queue
    SET status = 'processing',
        attempts = attempts + 1,
        started_at = now(),
        updated_at = now()
    WHERE id IN (
      SELECT id FROM public.email_job_queue
      WHERE status = 'pending'
        AND scheduled_at <= now()
        AND attempts < max_attempts
      ORDER BY scheduled_at
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  LOOP
    RETURN NEXT job;
  END LOOP;
END $$;

-- Mark job as completed
CREATE OR REPLACE FUNCTION public.complete_email_job(
  job_id uuid,
  provider_message_id text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.email_job_queue
  SET status = 'completed',
      completed_at = now(),
      updated_at = now()
  WHERE id = job_id;
END $$;

-- Mark job as failed (will retry if attempts < max_attempts)
CREATE OR REPLACE FUNCTION public.fail_email_job(
  job_id uuid,
  error_msg text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  job public.email_job_queue;
BEGIN
  SELECT * INTO job FROM public.email_job_queue WHERE id = job_id;
  IF job IS NULL THEN
    RETURN;
  END IF;

  IF job.attempts >= job.max_attempts THEN
    UPDATE public.email_job_queue
    SET status = 'dead_letter',
        error_message = error_msg,
        last_error_at = now(),
        updated_at = now()
    WHERE id = job_id;
  ELSE
    UPDATE public.email_job_queue
    SET status = 'pending',
        error_message = error_msg,
        last_error_at = now(),
        scheduled_at = now() + (make_interval(mins => 1) * power(2, job.attempts)), -- exponential backoff
        updated_at = now()
    WHERE id = job_id;
  END IF;
END $$;

-- Requeue dead letter jobs (admin action)
CREATE OR REPLACE FUNCTION public.requeue_dead_letter_jobs(
  max_jobs integer DEFAULT 100
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  count integer;
BEGIN
  UPDATE public.email_job_queue
  SET status = 'pending',
      attempts = 0,
      error_message = NULL,
      scheduled_at = now(),
      updated_at = now()
  WHERE id IN (
    SELECT id FROM public.email_job_queue
    WHERE status = 'dead_letter'
    ORDER BY created_at
    LIMIT max_jobs
  );
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN count;
END $$;

-- Cleanup old completed/failed jobs
CREATE OR REPLACE FUNCTION public.cleanup_email_jobs(
  retention_days integer DEFAULT 30
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  count integer;
BEGIN
  DELETE FROM public.email_job_queue
  WHERE status IN ('completed', 'dead_letter')
    AND updated_at < now() - make_interval(days => retention_days);
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN count;
END $$;

-- Queue statistics
CREATE OR REPLACE FUNCTION public.get_email_queue_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN jsonb_build_object(
    'pending', (SELECT COUNT(*) FROM public.email_job_queue WHERE status = 'pending'),
    'processing', (SELECT COUNT(*) FROM public.email_job_queue WHERE status = 'processing'),
    'completed', (SELECT COUNT(*) FROM public.email_job_queue WHERE status = 'completed'),
    'failed', (SELECT COUNT(*) FROM public.email_job_queue WHERE status = 'failed'),
    'dead_letter', (SELECT COUNT(*) FROM public.email_job_queue WHERE status = 'dead_letter')
  );
END $$;

-- ── 4. RLS Policies ───────────────────────────────────────────────────────────
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_job_queue ENABLE ROW LEVEL SECURITY;

-- Admin can see all
DROP POLICY IF EXISTS "admin_all_email_notifications" ON public.email_notifications;
CREATE POLICY "admin_all_email_notifications" ON public.email_notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admin_all_email_job_queue" ON public.email_job_queue;
CREATE POLICY "admin_all_email_job_queue" ON public.email_job_queue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Backend service role bypasses RLS (using service_role key)

-- ── 5. Realtime for admin monitoring ──────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.email_notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.email_job_queue;
  END IF;
END $$;