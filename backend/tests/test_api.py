import os
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

def test_public_sections_no_auth():
    if not settings.supabase_url:
        return  # skip if no Supabase configured
    res = client.get("/api/sections/public")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_admin_sections_requires_auth():
    res = client.get("/api/sections/admin")
    assert res.status_code == 403

def test_agent_generate_requires_auth():
    res = client.post("/api/agent/generate", json={"section_type": "hero_3d"})
    assert res.status_code == 403

def test_openapi_docs():
    res = client.get("/openapi.json")
    assert res.status_code == 200
