from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import sections, agent

app = FastAPI(title="Plumbing CMS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.site_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sections.router)
app.include_router(agent.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}
