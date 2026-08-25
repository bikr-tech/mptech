---
name: email-notification-system
description: Completed email queue worker, notifications, templates, and DB schema
metadata:
  type: project
---

Durable, PostgreSQL-backed email queue starting in 2026-08-16.

**State:** Built but not running. Requires `run_email_worker.py` start command.

**Files:**
- `backend/app/services/booking_notifications.py` — enqueue logic for 12 notification types
- `backend/app/email/*.py` — base + Mailtrap/Resend providers + templates
- `backend/app/workers/email_worker.py` — async batch processor
- `backend/run_email_worker.py` — CLI entry point (just created)
- `backend/supabase/email_notifications.sql` — tables/guards/functions
- `backend/app/templates/emails/*.html` — 12 templates (customer/admin/plumber variants)

**Notifications:**
- `booking_created`, `booking_assigned`, `plumber_job_assigned`
- `booking_scheduled`, `booking_rescheduled`
- `plumber_accepted`, `plumber_en_route`, `plumber_arrived`
- `booking_completed`
- `additional_work_requested/approved/rejected`

**Usage:**
```bash
cd backend
uvicorn app.main:app --reload &
python run_email_worker.py --batch-size 20 --concurrency 5
```

**Must-run SQL** (run once in Supabase Dashboard):
```bash
psql $SUPABASE_URL -f backend/supabase/email_notifications.sql
```

**Depends on environment:**
- `email_provider` = mailtrap|resend
- `mailtrap_*` or `resend_api_key` (email disabled if empty)
- `admin_notification_emails` (when sending to admins)

**Integrates with:**
- `assignment_service` — fire on assign/reassign/schedule
- `booking_service` — fire on create/transition
- `additional_work_service` — fire on request/decision