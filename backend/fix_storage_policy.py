"""Fix storage RLS policy to allow authenticated uploads to project-gallery."""
import requests
from app.config import settings

headers = {
    "apikey": settings.supabase_key,
    "Authorization": f"Bearer {settings.supabase_key}",
    "Content-Type": "application/json",
}

sql = """
DROP POLICY IF EXISTS "editors_upload_gallery" ON storage.objects;
CREATE POLICY "editors_upload_gallery" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-gallery');

DROP POLICY IF EXISTS "admins_delete_gallery" ON storage.objects;
CREATE POLICY "admins_delete_gallery" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-gallery');
"""

print("Run this SQL in Supabase Dashboard → SQL Editor:")
print("=" * 60)
print(sql)
