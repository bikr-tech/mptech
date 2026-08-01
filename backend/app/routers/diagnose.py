import base64
import re
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile
from langgraph.types import Command
from pydantic import BaseModel

from app.config import settings
from app.database import get_supabase
from app.diagnosis_graph import build_diagnosis_graph

router = APIRouter(prefix="/api/diagnose", tags=["diagnose"])

ALLOWED_CONTENT = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
MAX_BYTES = settings.max_upload_mb * 1024 * 1024

ALLOWED_ANSWER_TYPES = (str, int, float, bool, type(None))


def _sanitize_answers(answers):
    if not isinstance(answers, dict):
        return {}
    return {str(k): v for k, v in answers.items() if isinstance(v, ALLOWED_ANSWER_TYPES)}


class ResumeRequest(BaseModel):
    thread_id: str
    user_answers: dict


@router.post("/start")
async def start_diagnosis(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT:
        raise HTTPException(415, "Unsupported image type. Use JPEG, PNG, WEBP, or HEIC.")
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file.")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, f"Image exceeds {settings.max_upload_mb}MB limit.")

    ext = (file.filename or "image").rsplit(".", 1)[-1] or "jpg"
    thread_id = uuid.uuid4().hex
    path = f"{thread_id}.{ext}"

    # Persist image so the frontend can show a thumbnail after resume.
    try:
        get_supabase().storage.from_(settings.storage_bucket).upload(path, data, {"content-type": file.content_type})
    except Exception as e:
        raise HTTPException(500, f"Image upload failed: {e}")
    image_url = get_supabase().storage.from_(settings.storage_bucket).get_public_url(path)

    # Vision reads the image inline (base64 data URL) — avoids fetching over the
    # public URL (storage RLS/network) and works with Gemini's inline_data.
    mime = file.content_type or "image/jpeg"
    data_url = f"data:{mime};base64,{base64.b64encode(data).decode()}"

    graph = build_diagnosis_graph()
    config = {"configurable": {"thread_id": thread_id}}
    try:
        for _event in graph.stream(
            {"thread_id": thread_id, "image_url": data_url}, config, stream_mode="updates"
        ):
            pass
    except Exception as e:
        raise HTTPException(500, f"Diagnosis pipeline error: {e}")

    state = graph.get_state(config)
    questions = state.values.get("clarifying_questions") or []
    if not questions and not state.values.get("error"):
        raise HTTPException(500, "No clarifying questions were generated.")

    return {
        "thread_id": thread_id,
        "status": "NEEDS_CLARIFICATION",
        "questions": questions,
        "image_url": image_url,
        "visual_findings": state.values.get("visual_findings"),
        "error": state.values.get("error"),
    }


@router.post("/resume")
async def resume_diagnosis(body: ResumeRequest):
    thread_id = re.sub(r"[^a-zA-Z0-9_-]", "", body.thread_id)
    if not thread_id or len(thread_id) > 64:
        raise HTTPException(400, "Invalid thread_id.")
    if not body.user_answers:
        raise HTTPException(400, "user_answers is required.")

    graph = build_diagnosis_graph()
    config = {"configurable": {"thread_id": thread_id}}
    try:
        for _event in graph.stream(
            Command(resume=_sanitize_answers(body.user_answers)), config, stream_mode="updates"
        ):
            pass
    except Exception as e:
        raise HTTPException(500, f"Diagnosis resume error: {e}")

    state = graph.get_state(config)
    values = state.values
    return {
        "thread_id": thread_id,
        "status": "COMPLETED",
        "visual_findings": values.get("visual_findings"),
        "clarifying_questions": values.get("clarifying_questions"),
        "user_answers": values.get("user_answers"),
        "diagnosis": values.get("diagnosis"),
        "root_cause": values.get("root_cause"),
        "severity": values.get("severity"),
        "is_diy_safe": values.get("is_diy_safe"),
        "diy_instructions": values.get("diy_instructions") or [],
        "pro_recommendation": values.get("pro_recommendation"),
        "cost_estimation": values.get("cost_estimation"),
        "error": values.get("error"),
    }
