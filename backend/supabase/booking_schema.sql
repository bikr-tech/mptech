-- ============================================================================
-- Smart Plumber Booking — Schema
-- Run in Supabase Dashboard → SQL Editor ONCE (the Python client can't run DDL).
-- Includes: role extension, booking tables, RLS, storage bucket, realtime pub,
-- and the double-booking overlap guard (RPC + hard backstop trigger).
-- ============================================================================

-- ── 1. Roles ─────────────────────────────────────────────────────────────────
-- Extend user_role with customer/plumber. The signup-default is changed to
-- 'customer' in migration.sql (handle_new_user trigger) so anyone who signs up
-- for the booking app does NOT get CMS write access.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'plumber';

-- ── 2. Customers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text,
  phone text,
  email text,
  default_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 3. Plumbers ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plumbers (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  photo_url text,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','busy','off_duty','on_leave','pending')),
  latitude double precision,
  longitude double precision,
  service_radius_km double precision DEFAULT 10,
  skills text[] DEFAULT '{}',
  rating double precision DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_jobs integer DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plumbers_status_idx ON public.plumbers (status);

-- ── 4. Bookings ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  urgency text NOT NULL DEFAULT 'medium'
    CHECK (urgency IN ('low','medium','high','emergency')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','admin_review','scheduled','assigned','accepted',
                      'en_route','arrived','in_progress','awaiting_approval',
                      'completed','customer_confirmed','cancelled','rejected')),
  address text DEFAULT '',
  latitude double precision,
  longitude double precision,
  preferred_date date,
  preferred_start_time time,
  preferred_end_time time,
  assigned_plumber_id uuid REFERENCES public.plumbers(id),
  ai_diagnosis jsonb DEFAULT '{}'::jsonb,
  estimated_duration_minutes integer,
  estimated_cost numeric DEFAULT 0,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  customer_confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON public.bookings (customer_id);
CREATE INDEX IF NOT EXISTS bookings_plumber_idx ON public.bookings (assigned_plumber_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings (status);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON public.bookings (preferred_date);

-- ── 5. Booking status history ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid,
  actor_role text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bsh_booking_idx ON public.booking_status_history (booking_id);

-- ── 6. Booking photos (storage_path only; bytes live in Supabase Storage) ────
CREATE TABLE IF NOT EXISTS public.booking_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES public.profiles(id),
  photo_type text DEFAULT 'before'
    CHECK (photo_type IN ('before','during','after')),
  storage_path text NOT NULL,
  caption text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ── 7. Plumber availability ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plumber_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plumber_id uuid NOT NULL REFERENCES public.plumbers(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','busy','off_duty','on_leave')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pla_plumber_date_idx ON public.plumber_availability (plumber_id, date);

-- ── 8. Work orders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  assigned_plumber_id uuid REFERENCES public.plumbers(id),
  title text NOT NULL,
  description text DEFAULT '',
  priority text DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','emergency')),
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('draft','assigned','accepted','in_progress','paused','completed','cancelled')),
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  completion_notes text DEFAULT '',
  customer_confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wo_plumber_idx ON public.work_orders (assigned_plumber_id);
CREATE INDEX IF NOT EXISTS wo_status_idx ON public.work_orders (status);

-- ── 9. Work order tasks (position persisted server-side) ────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','blocked','completed','cancelled')),
  priority text DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high')),
  estimated_minutes integer,
  actual_minutes integer,
  started_at timestamptz,
  completed_at timestamptz,
  notes text DEFAULT '',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wot_order_idx ON public.work_order_tasks (work_order_id, position);

-- ── 10. Materials (total_price computed server-side) ────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  quantity numeric DEFAULT 1 CHECK (quantity >= 0),
  unit text DEFAULT 'pcs',
  unit_price numeric DEFAULT 0 CHECK (unit_price >= 0),
  total_price numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wom_order_idx ON public.work_order_materials (work_order_id);

-- ── 11. Labor (total computed server-side) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_labor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  plumber_id uuid REFERENCES public.plumbers(id),
  hours numeric DEFAULT 0 CHECK (hours >= 0),
  rate numeric DEFAULT 0 CHECK (rate >= 0),
  total numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wol_order_idx ON public.work_order_labor (work_order_id);

-- ── 12. Notes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.work_order_tasks(id) ON DELETE SET NULL,
  plumber_id uuid REFERENCES public.plumbers(id),
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS won_order_idx ON public.work_order_notes (work_order_id);

-- ── 13. Photos ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.work_order_tasks(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  photo_type text NOT NULL DEFAULT 'during'
    CHECK (photo_type IN ('before','during','after')),
  storage_path text NOT NULL,
  caption text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wop_order_idx ON public.work_order_photos (work_order_id);

-- ── 14. Additional work requests ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.additional_work_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES public.profiles(id),
  description text NOT NULL,
  estimated_cost numeric DEFAULT 0 CHECK (estimated_cost >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_at timestamptz,
  approved_by uuid,
  rejected_at timestamptz,
  rejection_reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS awr_booking_idx ON public.additional_work_requests (booking_id);

-- ── 15. Audit ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_values jsonb DEFAULT '{}'::jsonb,
  new_values jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ba_entity_idx ON public.booking_audit (entity_type, entity_id);

-- ── 16. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plumbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plumber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_work_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_audit ENABLE ROW LEVEL SECURITY;

-- admin sees everything (the backend also runs with the service role, which
-- bypasses RLS entirely — these policies protect direct anon/authenticated
-- access from the client).
DROP POLICY IF EXISTS "admin_select_all_bookings" ON public.bookings;
CREATE POLICY "admin_select_all_bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
DROP POLICY IF EXISTS "customer_select_own_bookings" ON public.bookings;
CREATE POLICY "customer_select_own_bookings" ON public.bookings
  FOR SELECT USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "plumber_select_assigned_bookings" ON public.bookings;
CREATE POLICY "plumber_select_assigned_bookings" ON public.bookings
  FOR SELECT USING (assigned_plumber_id = auth.uid());

-- customers: own row
DROP POLICY IF EXISTS "customer_select_own" ON public.customers;
CREATE POLICY "customer_select_own" ON public.customers
  FOR SELECT USING (id = auth.uid());

-- plumbers: own row (client-side read only; matching runs server-side)
DROP POLICY IF EXISTS "plumber_select_own" ON public.plumbers;
CREATE POLICY "plumber_select_own" ON public.plumbers
  FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "admin_select_all_plumbers" ON public.plumbers;
CREATE POLICY "admin_select_all_plumbers" ON public.plumbers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- work orders: plumber own assigned, admin all
DROP POLICY IF EXISTS "plumber_select_own_work_orders" ON public.work_orders;
CREATE POLICY "plumber_select_own_work_orders" ON public.work_orders
  FOR SELECT USING (assigned_plumber_id = auth.uid());
DROP POLICY IF EXISTS "admin_select_all_work_orders" ON public.work_orders;
CREATE POLICY "admin_select_all_work_orders" ON public.work_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- tasks/materials/labor/notes/photos: plumber own work orders, admin all
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['work_order_tasks','work_order_materials','work_order_labor','work_order_notes','work_order_photos']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "plumber_own_%s" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "plumber_own_%s" ON public.%I FOR SELECT USING (
        EXISTS (SELECT 1 FROM work_orders wo
                WHERE wo.id = %I.work_order_id AND wo.assigned_plumber_id = auth.uid()));',
        t, t, t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_all_%s" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "admin_all_%s" ON public.%I FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''));',
        t, t);
  END LOOP;
END $$;

-- additional work: customer on own booking, plumber on own work order, admin all
DROP POLICY IF EXISTS "customer_own_additional_work" ON public.additional_work_requests;
CREATE POLICY "customer_own_additional_work" ON public.additional_work_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid())
  );
DROP POLICY IF EXISTS "plumber_own_additional_work" ON public.additional_work_requests;
CREATE POLICY "plumber_own_additional_work" ON public.additional_work_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM work_orders wo WHERE wo.id = work_order_id AND wo.assigned_plumber_id = auth.uid())
  );
DROP POLICY IF EXISTS "admin_all_additional_work" ON public.additional_work_requests;
CREATE POLICY "admin_all_additional_work" ON public.additional_work_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- audit + status history: admin read-only
DROP POLICY IF EXISTS "admin_all_booking_audit" ON public.booking_audit;
CREATE POLICY "admin_all_booking_audit" ON public.booking_audit
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
DROP POLICY IF EXISTS "admin_all_status_history" ON public.booking_status_history;
CREATE POLICY "admin_all_status_history" ON public.booking_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 17. Double-booking guard ─────────────────────────────────────────────────
-- RPC the backend calls before assigning. SECURITY DEFINER so it sees all rows
-- even when invoked by a non-superuser role. Returns true when the plumber is
-- free for the window (plus travel buffer) and not busy.
CREATE OR REPLACE FUNCTION public.prevent_booking_overlap(
  check_plumber_id uuid,
  check_start timestamptz,
  check_end timestamptz,
  exclude_booking_id uuid DEFAULT NULL,
  travel_buffer_min integer DEFAULT 30
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p_status text;
  overlap boolean;
BEGIN
  SELECT status INTO p_status FROM public.plumbers WHERE id = check_plumber_id;
  IF p_status IS NULL THEN
    RETURN false; -- plumber does not exist
  END IF;
  IF p_status <> 'available' THEN
    RETURN false; -- off duty / on leave / busy
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.assigned_plumber_id = check_plumber_id
      AND b.status NOT IN ('cancelled','rejected','completed','customer_confirmed')
      AND (exclude_booking_id IS NULL OR b.id <> exclude_booking_id)
      AND b.preferred_start_time IS NOT NULL
      AND tstzrange(
            (b.preferred_date + b.preferred_start_time)::timestamptz - make_interval(mins => travel_buffer_min),
            (b.preferred_date + b.preferred_end_time)::timestamptz + make_interval(mins => travel_buffer_min)
          ) && tstzrange(check_start, check_end)
  ) INTO overlap;
  RETURN NOT overlap;
END $$;

-- Hard backstop: no two overlapping ACTIVE assignments on the same plumber.
-- Raised inside a trigger so the DB rejects a double-booking even if the RPC
-- check was bypassed.
CREATE OR REPLACE FUNCTION public.reject_booking_overlap_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.assigned_plumber_id IS NOT NULL AND NEW.status NOT IN ('cancelled','rejected','completed','customer_confirmed')
     AND NEW.preferred_start_time IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.assigned_plumber_id = NEW.assigned_plumber_id
        AND b.id <> NEW.id
        AND b.status NOT IN ('cancelled','rejected','completed','customer_confirmed')
        AND b.preferred_start_time IS NOT NULL
        AND tstzrange(
              (b.preferred_date + b.preferred_start_time)::timestamptz,
              (b.preferred_date + b.preferred_end_time)::timestamptz
            ) && tstzrange(
              (NEW.preferred_date + NEW.preferred_start_time)::timestamptz,
              (NEW.preferred_date + NEW.preferred_end_time)::timestamptz
            )
    ) THEN
      RAISE EXCEPTION 'plumber_schedule_conflict';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_booking_overlap ON public.bookings;
CREATE TRIGGER trg_booking_overlap
  BEFORE INSERT OR UPDATE OF assigned_plumber_id, preferred_date, preferred_start_time, preferred_end_time, status
  ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.reject_booking_overlap_trigger();

-- ── 18. Storage bucket for work photos ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-photos', 'work-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_work_photos" ON storage.objects;
CREATE POLICY "public_read_work_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'work-photos');

-- ── 19. Realtime publication ─────────────────────────────────────────────────
-- Enable so the frontend can push booking/assignment/approval updates live.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.additional_work_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_status_history;
  END IF;
END $$;
