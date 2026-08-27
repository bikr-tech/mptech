from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_supabase

bearer_scheme = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    try:
        db = get_supabase()
        user = db.auth.get_user(credentials.credentials)
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

async def require_editor(user = Depends(get_current_user)):
    db = get_supabase()
    profile = db.table("profiles").select("role").eq("id", user.user.id).single().execute()
    if not profile.data or profile.data["role"] not in ("admin", "editor"):
        raise HTTPException(status_code=403, detail="Editor or admin role required")
    return user

async def require_admin(user = Depends(get_current_user)):
    db = get_supabase()
    profile = db.table("profiles").select("role").eq("id", user.user.id).single().execute()
    if not profile.data or profile.data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user

def _role_of(db, user_id: str) -> str | None:
    profile = db.table("profiles").select("role").eq("id", user_id).single().execute()
    return profile.data.get("role") if profile.data else None

def _has_plumber_row(db, user_id: str) -> bool:
    res = db.table("plumbers").select("id").eq("id", user_id).execute()
    return bool(res.data)

async def require_plumber(user = Depends(get_current_user)):
    """Role 'plumber' AND a row in the plumbers table (server-verified identity)
    AND status 'available' — a pending plumber can't work until admin verifies."""
    db = get_supabase()
    role = _role_of(db, user.user.id)
    if role != "plumber" or not _has_plumber_row(db, user.user.id):
        raise HTTPException(status_code=403, detail="Plumber role required")
    pl = db.table("plumbers").select("status").eq("id", user.user.id).single().execute()
    if not pl.data or pl.data.get("status") != "available":
        raise HTTPException(status_code=403, detail="Plumber account not yet verified. Contact admin.")
    return user

async def require_customer(user = Depends(get_current_user)):
    """Any authenticated user with role 'customer' or 'admin' may act as a
    customer. Admin acting on behalf of customers is allowed by design."""
    db = get_supabase()
    role = _role_of(db, user.user.id)
    if role not in ("customer", "admin"):
        raise HTTPException(status_code=403, detail="Customer role required")
    return user

async def require_customer_or_admin(user = Depends(get_current_user)):
    return await require_customer(user)
