"""Create admin user in Supabase. Usage: python create_admin.py <email> <password>"""
import sys
from app.config import settings
from app.database import get_supabase

def create_admin(email: str, password: str):
    db = get_supabase()
    # Create user via Supabase Auth Admin API (requires service_role key)
    resp = db.auth.admin.create_user({
        "email": email,
        "password": password,
        "email_confirm": True,
        "app_metadata": {"role": "admin"},
    })
    user_id = resp.user.id
    # Upsert profile with admin role
    db.table("profiles").upsert({
        "id": user_id,
        "email": email,
        "role": "admin",
    }).execute()
    print(f"Admin user created: {email} (id: {user_id})")
    return user_id

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python create_admin.py <email> <password>")
        sys.exit(1)
    create_admin(sys.argv[1], sys.argv[2])
