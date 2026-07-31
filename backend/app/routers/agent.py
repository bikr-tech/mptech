import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
from app.middleware.auth_middleware import require_editor
from app.agent_graph import build_agent_graph
from app.llm_router import invoke_llm

router = APIRouter(prefix="/api/agent", tags=["agent"])

class GenerateRequest(BaseModel):
    section_type: str
    business_info: dict = {}

class ReviewRequest(BaseModel):
    thread_id: str
    section_type: str = ""
    human_edits: dict = {}
    approved: bool

class SceneRequest(BaseModel):
    prompt: str

@router.post("/generate")
def generate_content(body: GenerateRequest, user=Depends(require_editor)):
    graph = build_agent_graph()
    config = {"configurable": {"thread_id": f"{body.section_type}_{hash(str(body.business_info)) % 10000}"}}
    initial = {"section_type": body.section_type, "business_info": body.business_info}
    try:
        for event in graph.stream(initial, config, stream_mode="updates"):
            if "__interrupt__" in event:
                state = graph.get_state(config)
                return {
                    "thread_id": config["configurable"]["thread_id"],
                    "section_type": state.values.get("section_type"),
                    "raw_content": state.values.get("raw_content"),
                    "seo_score": state.values.get("seo_score"),
                    "seo_report": state.values.get("seo_report"),
                }
        state = graph.get_state(config)
        return {"done": True, "result": state.values.get("db_result")}
    except Exception as e:
        raise HTTPException(500, f"Agent error: {e}")

@router.post("/review")
def review_content(body: ReviewRequest, user=Depends(require_editor)):
    graph = build_agent_graph()
    config = {"configurable": {"thread_id": body.thread_id}}
    try:
        graph.update_state(config, {"human_edits": body.human_edits, "approved": body.approved})
        for event in graph.stream(None, config, stream_mode="updates"):
            pass
        state = graph.get_state(config)
        return {"success": body.approved, "section_type": state.values.get("section_type"), "db_result": state.values.get("db_result")}
    except Exception as e:
        raise HTTPException(500, f"Review error: {e}")

@router.post("/scene")
def generate_scene(body: SceneRequest, user=Depends(require_editor)):
    prompt = (
        "You are a 3D scene designer for a plumbing hero section. "
        "Given a user's natural language description, generate a 3D scene configuration. "
        "Return ONLY valid JSON with a key 'scene3d' containing: "
        "sceneType (string: 'home' for house cross-section with water heater/sink/toilet, "
        "'industrial' for exposed brick-wall pipes with valves and gauges, "
        "'luxury' for marble bathroom with chrome fixtures, "
        "'outdoor' for garden faucet with hose and sprinkler), "
        "pipeColor (hex string), waterFlowSpeed (float 0-5), "
        "pipeCount (int 1-6), curvature (float 0-1), "
        "metalness (float 0-1), roughness (float 0-1), "
        "floatIntensity (float 0-2), ambientIntensity (float 0-1), "
        "pipeRadius (float 0.1-0.6), cameraZ (float 4-12), "
        "and a short 'description' of what was changed. "
        f"User request: {body.prompt}"
    )
    try:
        from app.agent_graph import extract_json
        text = invoke_llm([{"role": "user", "content": prompt}])
        result = extract_json(text)
        scene = result.get("scene3d", result)
        return {"scene3d": scene}
    except Exception as e:
        raise HTTPException(500, f"Scene error: {e}")
