"""Check reviews section content."""
from app.database import get_supabase
import json
db = get_supabase()
res = db.table('landing_sections').select('id, type, content').eq('type', 'reviews').execute()
for s in res.data:
    reviews = s['content'].get('reviews', [])
    print(f"ID: {s['id']}")
    print(f"  Title: {s['content'].get('title', 'N/A')}")
    print(f"  Reviews count: {len(reviews)}")
    for r in reviews:
        print(f"    - {r.get('rating')}* {r.get('author')}: {r.get('text', '')[:50]}")
    print()
