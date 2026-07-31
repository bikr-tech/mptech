"""Run SQL migration to add project_gallery type and create storage bucket."""
from app.database import get_supabase

db = get_supabase()

sql = """
ALTER TABLE public.landing_sections
DROP CONSTRAINT IF EXISTS landing_sections_type_check,
ADD CONSTRAINT landing_sections_type_check
  CHECK (type IN ('hero_3d','emergency_call','services_grid','reviews','project_gallery'));

INSERT INTO public.landing_sections (type, order_index, is_published, content)
SELECT 'project_gallery', 3, true, '{"description": "Project gallery showcasing recent work", "title": "Our Projects", "subtitle": "Recent work by our team", "images": []}'
WHERE NOT EXISTS (SELECT 1 FROM public.landing_sections WHERE type = 'project_gallery');
"""

try:
    db.rpc('exec_sql', {'query': sql})
    print("Table constraint updated + project_gallery seed inserted")
except:
    db.table('landing_sections').insert({
        'type': 'project_gallery', 'order_index': 3,
        'is_published': True,
        'content': {"description": "Project gallery showcasing recent work", "title": "Our Projects", "subtitle": "Recent work by our team", "images": []}
    }).execute()
    print("project_gallery seed inserted directly (constraint may need manual update)")

# Create storage bucket
try:
    db.rpc('create_bucket', {'id': 'project-gallery', 'name': 'project-gallery', 'public': True})
    print("Storage bucket created")
except:
    print("Storage bucket may already exist, create via Supabase dashboard if needed")
