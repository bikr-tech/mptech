"""Fix DB CHECK constraint to include project_gallery. Uses psycopg2 direct connection."""
import os, sys
from app.config import settings

# Extract project ref from supabase URL
project_ref = settings.supabase_url.replace("https://", "").split(".")[0]
password = settings.supabase_key

conn_str = f"postgresql://postgres:{password}@db.{project_ref}.supabase.co:5432/postgres"

try:
    import psycopg2
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("""
        ALTER TABLE public.landing_sections
        DROP CONSTRAINT IF EXISTS landing_sections_type_check,
        ADD CONSTRAINT landing_sections_type_check
          CHECK (type IN ('hero_3d','emergency_call','services_grid','reviews','project_gallery'));
    """)
    cur.close()
    conn.close()
    print("CHECK constraint updated successfully")
except Exception as e:
    print(f"psycopg2 failed: {e}")
    print("Trying via Supabase REST API...")
    import requests
    sql = """
        ALTER TABLE public.landing_sections
        DROP CONSTRAINT IF EXISTS landing_sections_type_check,
        ADD CONSTRAINT landing_sections_type_check
          CHECK (type IN ('hero_3d','emergency_call','services_grid','reviews','project_gallery'));
    """
    headers = {
        "apikey": password,
        "Authorization": f"Bearer {password}",
        "Content-Type": "application/json",
        "Prefer": "params=single-object",
    }
    # Try pg_query endpoint
    res = requests.post(
        f"{settings.supabase_url}/rest/v1/rpc/pg_query",
        json={"query": sql},
        headers=headers,
    )
    if res.status_code == 200:
        print("CHECK constraint updated via REST")
    else:
        # Fallback: seed data insert bypasses Python-side check
        print(f"REST failed ({res.status_code}). Please run this SQL in Supabase Dashboard SQL Editor:")
        print()
        print(sql)
