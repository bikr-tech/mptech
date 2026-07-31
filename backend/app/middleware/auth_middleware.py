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
