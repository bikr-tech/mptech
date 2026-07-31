DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin','editor','viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role user_role DEFAULT 'viewer'::user_role,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'editor');
  RETURN new;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.sync_role_to_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE auth.users SET raw_app_meta_data =
    raw_app_meta_data || jsonb_build_object('role', new.role::text)
  WHERE id = new.id;
  RETURN new;
END $$;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_auth();

CREATE TABLE IF NOT EXISTS public.landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('hero_3d','emergency_call','services_grid','reviews','project_gallery')),
  order_index integer NOT NULL,
  is_published boolean DEFAULT false,
  content jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published" ON public.landing_sections;
CREATE POLICY "public_read_published" ON public.landing_sections
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "editors_write_sections" ON public.landing_sections;
CREATE POLICY "editors_write_sections" ON public.landing_sections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
  );

DROP POLICY IF EXISTS "editors_update_sections" ON public.landing_sections;
CREATE POLICY "editors_update_sections" ON public.landing_sections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
  );

DROP POLICY IF EXISTS "admins_delete_sections" ON public.landing_sections;
CREATE POLICY "admins_delete_sections" ON public.landing_sections
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admins_select_all" ON public.landing_sections;
CREATE POLICY "admins_select_all" ON public.landing_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

INSERT INTO public.landing_sections (type, order_index, is_published, content)
SELECT * FROM (VALUES
  ('hero_3d'::text, 0, true, '{"description": "Main hero banner", "headline": "Premium Plumbing Services", "subheadline": "24/7 Emergency Service With 30-Minute Response", "cta_text": "Call Now", "value_props": ["Licensed & Insured", "Same-Day Service", "Senior Discounts"]}'::jsonb),
  ('services_grid', 1, true, '{"description": "Grid of 6 plumbing services offered", "services": [{"title": "Pipe Repair", "icon": "🔧", "description": "Fix leaks, bursts, and damaged pipes"}, {"title": "Drain Cleaning", "icon": "🪠", "description": "Clear clogs and restore flow"}, {"title": "Water Heater", "icon": "🔥", "description": "Installation and repair services"}, {"title": "Sewer Line", "icon": "🏗️", "description": "Inspection and replacement"}, {"title": "Fixtures", "icon": "🚿", "description": "Sinks, toilets, and faucets"}, {"title": "Emergency", "icon": "🚨", "description": "24/7 rapid response team"}]}'),
  ('reviews', 2, true, '{"description": "Customer testimonials carousel", "reviews": [{"rating": 5, "text": "Best plumber in town! Fast and professional.", "author": "John D."}, {"rating": 5, "text": "Fixed my burst pipe at 2am. Amazing service!", "author": "Sarah M."}, {"rating": 4, "text": "Fair prices and quality work.", "author": "Mike R."}]}'),
  ('project_gallery', 3, true, '{"description": "Project gallery showcasing recent work", "title": "Our Projects", "subtitle": "Recent work by our team", "images": []}')
) AS seed_data(type, order_index, is_published, content)
WHERE NOT EXISTS (SELECT 1 FROM public.landing_sections LIMIT 1);
