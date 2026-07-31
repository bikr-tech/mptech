"""Check all sections in the database."""
from app.database import get_supabase
db = get_supabase()
res = db.table('landing_sections').select('type, is_published, order_index, content').order('order_index').execute()
for s in res.data:
    keys = list(s['content'].keys())
    print(f"{s['order_index']} | {s['type']:20} | published={s['is_published']} | keys: {keys}")
