from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import sections, agent, diagnose, bookings, dispatch, plumbers, work_orders, auth
from app.services.errors import AppError

app = FastAPI(title="Plumbing CMS API", version="1.0.0")

origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content=exc.detail)


app.include_router(sections.router)
app.include_router(agent.router)
app.include_router(diagnose.router)
app.include_router(bookings.router)
app.include_router(dispatch.router)
app.include_router(plumbers.router)
app.include_router(work_orders.router)
app.include_router(auth.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}
