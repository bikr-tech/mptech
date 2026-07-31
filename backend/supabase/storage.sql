-- Create storage bucket for project gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-gallery', 'project-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to gallery files
DROP POLICY IF EXISTS "public_read_gallery" ON storage.objects;
CREATE POLICY "public_read_gallery" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-gallery');

-- Allow authenticated editors/admins to upload
DROP POLICY IF EXISTS "editors_upload_gallery" ON storage.objects;
CREATE POLICY "editors_upload_gallery" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-gallery'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
  );

-- Allow admins to delete gallery images
DROP POLICY IF EXISTS "admins_delete_gallery" ON storage.objects;
CREATE POLICY "admins_delete_gallery" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-gallery'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
