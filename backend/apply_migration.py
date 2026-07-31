"""Attempt to create exec_sql function and run migration via Supabase REST API."""
import requests
from app.config import settings

headers = {
    "apikey": settings.supabase_key,
    "Authorization": f"Bearer {settings.supabase_key}",
    "Content-Type": "application/json",
}

# Step 1: Try to create the exec_sql function via a raw endpoint
# The Supabase management API is at https://api.supabase.com
project_ref = settings.supabase_url.replace("https://", "").split(".")[0]
mgmt_url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
mgmt_headers = {
    "Authorization": f"Bearer {settings.supabase_key}",
    "Content-Type": "application/json",
}

sql_to_run = """
ALTER TABLE public.landing_sections
DROP CONSTRAINT IF EXISTS landing_sections_type_check,
ADD CONSTRAINT landing_sections_type_check
  CHECK (type IN ('hero_3d','emergency_call','services_grid','reviews','project_gallery'));
"""

# Try management API
try:
    r = requests.post(mgmt_url, json={"query": sql_to_run}, headers=mgmt_headers)
    if r.status_code in (200, 201):
        print("Migration applied via management API")
        exit(0)
    else:
        print(f"Management API: {r.status_code} {r.text[:200]}")
except Exception as e:
    print(f"Management API error: {e}")

# Step 2: Try Supabase REST API directly
try:
    r = requests.post(
        f"{settings.supabase_url}/rest/v1/",
        json={"query": sql_to_run},
        headers=headers,
    )
    print(f"REST: {r.status_code} {r.text[:200]}")
except Exception as e:
    print(f"REST error: {e}")

print()
print("=" * 60)
print("Could not apply migration automatically.")
print("Please go to your Supabase Dashboard → SQL Editor and run:")
print("=" * 60)
print(sql_to_run)
