"""Create a plumber user in Supabase.
Usage: python create_plumber.py <email> <name> [password]
Sets role='plumber' in profiles and inserts a plumbers row (status=available)."""
import sys

from app.config import settings
from app.database import get_supabase

DEFAULT_PASSWORD = "Plumber123!"

def create_plumber(email: str, name: str, password: str = DEFAULT_PASSWORD):
    db = get_supabase()
    resp = db.auth.admin.create_user({
        "email": email,
        "password": password,
        "email_confirm": True,
        "app_metadata": {"role": "plumber"},
    })
    user_id = resp.user.id
    db.table("profiles").upsert({
        "id": user_id,
        "email": email,
        "role": "plumber",
    }).execute()
    db.table("plumbers").upsert({
        "id": user_id,
        "name": name,
        "status": "available",
        "skills": ["leak repair", "pipe replacement", "drain cleaning"],
        "service_radius_km": 15,
        "hourly_rate": 500,
        "rating": 4.8,
        "total_jobs": 0,
    }).execute()
    print(f"Plumber created: {email} (id: {user_id}, password: {password})")
    return user_id

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_plumber.py <email> <name> [password]")
        sys.exit(1)
    pw = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_PASSWORD
    create_plumber(sys.argv[1], sys.argv[2], pw)
