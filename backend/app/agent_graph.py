import json
import re
from typing import TypedDict, Any
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt
from .llm_router import invoke_llm
from .database import get_supabase

def extract_json(text: str) -> dict:
    code = re.search(r'```(?:json)?\s*\n?(.*?)```', text, re.DOTALL)
    if code:
        text = code.group(1)
    return json.loads(text.strip())

class AgentState(TypedDict):
    section_type: str
    business_info: dict
    raw_content: dict | None
    seo_score: int | None
    seo_report: dict | None
    human_edits: dict | None
    approved: bool | None
    db_result: dict | None

def copywriter_node(state: AgentState) -> dict:
    prompts = {
        "hero_3d": "Write hero section content for a high-end plumbing service. Include headline, subheadline, CTA text, description (short admin note), and value_props array. Return valid JSON with keys: description, headline, subheadline, cta_text, value_props.",
        "emergency_call": "Write emergency call section content. Include emergency_header, phone, response_time, description (short admin note), and service_hours. Return valid JSON.",
        "services_grid": "Write services grid content. Include description (short admin note), and services array with objects: title, icon (emoji), description. Include 6 services. Return valid JSON.",
        "reviews": "Write 3 customer reviews. Include description (short admin note), and reviews array with objects: rating (1-5), text, author. Return valid JSON.",
        "ai_diagnosis": "Write AI diagnosis section content for a plumbing service marketplace. Include headline, subheadline, upload_cta, urgency_text. The AI diagnosis lets users upload a photo and get instant price estimates. Return valid JSON with keys: headline, subheadline, upload_cta, urgency_text.",
        "trust_banner": "Write trust banner content for a plumbing service. Include headline, stats array (each with value, suffix, label), badges array (each with label and type: verified/insurance/background/guarantee/pan), reviews array (each with rating, text, author — use Nepali names). Return valid JSON.",
        "plumbers_match": "Write plumber matching section content. Include headline, subheadline, plumbers array (each with id, name, rating, jobs, distance, eta, price_range, online bool, ai_recommended bool, badges array). Use Nepali names. Return valid JSON.",
        "project_gallery": "Write project gallery content for a plumbing service. Include title, subtitle, and projects array (each with id, title, location, thumbnail (use unsplash URL), images array (3-5 unsplash plumbing photo URLs), description). Return valid JSON.",
        "map_section": "Write service area section content for a plumbing company. Include headline, subheadline, cities array (list of city names in Nepal). Return valid JSON with keys: headline, subheadline, cities.",
        "app_section": "Write app download section content for a plumbing service app. Include headline, subheadline, features array (each with title and description). Return valid JSON with keys: headline, subheadline, features.",
        "faq_section": "Write FAQ section content for a plumbing service. Include headline, subheadline, faqs array (each with category and questions array, each question has q and a). Return valid JSON with keys: headline, subheadline, faqs.",
        "final_cta": "Write final call-to-action section content for a plumbing service. Include headline, subheadline, cta_text, trust_phone (string), trust_stats (string). Return valid JSON with keys: headline, subheadline, cta_text, trust_phone, trust_stats.",
        "scene_3d": (
            "You are a 3D scene designer for a plumbing hero section. "
            "Given a user's natural language description, generate a 3D scene configuration. "
            "Return valid JSON with a key 'scene3d' containing: "
            "sceneType (string: 'home' for house cross-section, "
            "'industrial' for exposed brick-wall pipes with valves, "
            "'luxury' for marble bathroom with chrome fixtures, "
            "'outdoor' for garden faucet with hose), "
            "pipeColor (hex string), waterFlowSpeed (float 0-5), "
            "pipeCount (int 1-6), curvature (float 0-1), "
            "metalness (float 0-1), roughness (float 0-1), "
            "floatIntensity (float 0-2), ambientIntensity (float 0-1), "
            "pipeRadius (float 0.1-0.6), cameraZ (float 4-12), "
            "and a short 'description' of what was changed. "
            "Use sensible defaults for unspecified values."
        ),
    }
    business = state.get("business_info", {})
    custom = business.get("custom_prompt", "")
    base_prompt = prompts.get(state["section_type"], "Write content for a plumbing service section. Return valid JSON.")
    full_prompt = custom if custom else f"{base_prompt}\n\nBusiness context: {json.dumps(business)}"
    text = invoke_llm([{"role": "user", "content": full_prompt}])
    try:
        content = extract_json(text)
    except (json.JSONDecodeError, Exception):
        content = {"raw_text": text}
    return {"raw_content": content}

def seo_audit_node(state: AgentState) -> dict:
    content_str = json.dumps(state.get("raw_content", {}))
    prompt = f"SEO audit this content. Return JSON {{score(int),keyword_density(float),readability_score(int),suggestions(list)}}. Content: {content_str}"
    text = invoke_llm([{"role": "user", "content": prompt}])
    try:
        report = extract_json(text)
    except (json.JSONDecodeError, Exception):
        report = {"score": 50, "suggestions": ["Could not parse audit"]}
    return {"seo_score": report.get("score"), "seo_report": report}

def human_review_node(state: AgentState) -> dict:
    value = interrupt({"raw_content": state.get("raw_content"), "seo_score": state.get("seo_score"), "seo_report": state.get("seo_report")})
    edits = value.get("human_edits", {})
    approved = value.get("approved", False)
    final_content = {**state.get("raw_content", {}), **edits}
    return {"human_edits": edits, "approved": approved, "raw_content": final_content}

def write_db_node(state: AgentState) -> dict:
    if not state.get("approved"):
        return {"db_result": {"status": "rejected"}}
    content = state.get("raw_content", {})
    section_type = state.get("section_type")
    db = get_supabase()
    res = db.table("landing_sections").insert({
        "type": section_type,
        "order_index": 999,
        "content": content,
        "is_published": False,
    }).execute()
    return {"db_result": {"status": "created", "id": str(res.data[0]["id"])} if res.data else {"status": "error"}}

_checkpointer = MemorySaver()

def build_agent_graph():
    builder = StateGraph(AgentState)
    builder.add_node("copywriter", copywriter_node)
    builder.add_node("seo_audit", seo_audit_node)
    builder.add_node("human_review", human_review_node)
    builder.add_node("write_db", write_db_node)

    builder.add_edge(START, "copywriter")
    builder.add_edge("copywriter", "seo_audit")
    builder.add_edge("seo_audit", "human_review")
    builder.add_conditional_edges("human_review", lambda s: "write_db" if s.get("approved") else END)
    builder.add_edge("write_db", END)

    return builder.compile(checkpointer=_checkpointer)
