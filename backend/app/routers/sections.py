from fastapi import APIRouter, Depends, HTTPException
from app.database import get_supabase
from app.models.section import LandingSectionCreate, LandingSectionUpdate, LandingSectionOut, ReorderBatch
from app.middleware.auth_middleware import get_current_user, require_editor, require_admin
from uuid import UUID
from datetime import datetime, timezone

router = APIRouter(prefix="/api/sections", tags=["sections"])

@router.get("/public", response_model=list[LandingSectionOut])
def get_public_sections():
    db = get_supabase()
    res = db.table("landing_sections").select("*").eq("is_published", True).order("order_index").execute()
    return res.data

@router.get("/admin", response_model=list[LandingSectionOut])
def get_admin_sections(user=Depends(require_editor)):
    db = get_supabase()
    res = db.table("landing_sections").select("*").order("order_index").execute()
    return res.data

@router.post("/", response_model=LandingSectionOut, status_code=201)
def create_section(body: LandingSectionCreate, user=Depends(require_editor)):
    db = get_supabase()
    res = db.table("landing_sections").insert(body.model_dump()).execute()
    if not res.data:
        raise HTTPException(400, "Failed to create section")
    return res.data[0]

@router.put("/{id}", response_model=LandingSectionOut)
def update_section(id: UUID, body: LandingSectionUpdate, user=Depends(require_editor)):
    db = get_supabase()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = db.table("landing_sections").update(data).eq("id", str(id)).execute()
    if not res.data:
        raise HTTPException(404, "Section not found")
    return res.data[0]

@router.delete("/{id}", status_code=204)
def delete_section(id: UUID, user=Depends(require_admin)):
    db = get_supabase()
    db.table("landing_sections").delete().eq("id", str(id)).execute()

@router.put("/reorder/batch", status_code=200)
def reorder_sections(body: ReorderBatch, user=Depends(require_editor)):
    db = get_supabase()
    for item in body.items:
        db.table("landing_sections").update({"order_index": item.order_index}).eq("id", str(item.id)).execute()
    return {"ok": True}
