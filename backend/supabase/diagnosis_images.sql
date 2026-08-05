-- Storage bucket for AI diagnosis photos (uploaded via /api/diagnose/start)
-- Run in Supabase Dashboard → SQL Editor once.
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagnosis-images', 'diagnosis-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read: the vision model and the frontend thumbnail fetch via the public URL.
DROP POLICY IF EXISTS "public_read_diagnosis" ON storage.objects;
CREATE POLICY "public_read_diagnosis" ON storage.objects
  FOR SELECT USING (bucket_id = 'diagnosis-images');

-- Allow uploads (backend uses the service key which bypasses RLS, but keep the
-- policy so anon/authenticated uploads also work if the client ever uploads directly).
DROP POLICY IF EXISTS "public_upload_diagnosis" ON storage.objects;
CREATE POLICY "public_upload_diagnosis" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'diagnosis-images');
