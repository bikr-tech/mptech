"""Try calling various RPC functions to alter the CHECK constraint."""
from app.database import get_supabase

db = get_supabase()
sql = "ALTER TABLE public.landing_sections DROP CONSTRAINT IF EXISTS landing_sections_type_check, ADD CONSTRAINT landing_sections_type_check CHECK (type IN ('hero_3d','emergency_call','services_grid','reviews','project_gallery'));"

for fn in ['exec_sql', 'query', 'pg_query', 'execute_sql', 'run_sql']:
    try:
        r = db.rpc(fn, {'query': sql}).execute()
        print(f'{fn}: OK - {r.data}')
        break
    except Exception as e:
        print(f'{fn}: {e}')
