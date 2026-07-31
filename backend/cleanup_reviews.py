"""Delete empty reviews sections, keep the one with actual reviews."""
from app.database import get_supabase
db = get_supabase()
res = db.table('landing_sections').select('id, content').eq('type', 'reviews').execute()
for s in res.data:
    reviews = s['content'].get('reviews', [])
    if len(reviews) == 0:
        db.table('landing_sections').delete().eq('id', s['id']).execute()
        print(f"Deleted empty reviews section: {s['id']}")
    else:
        print(f"Kept reviews section: {s['id']} ({len(reviews)} reviews)")
