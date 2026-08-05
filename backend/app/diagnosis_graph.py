"""HITL plumbing diagnosis graph.

Pipeline: visual inspection -> image guardrail (relevance + box verify) ->
clarifying questions -> [interrupt for human] -> master diagnosis ->
safety audit (DIY / emergency) -> cost estimate.
"""
import json
import re
from typing import Literal, Optional, TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

from .diagnosis_guardrails import validate_image
from .llm_router import invoke_llm, invoke_vision


class PlumbingHITLState(TypedDict):
    thread_id: str
    image_url: str
    visual_findings: str
    validation: Optional[dict]           # DiagnosisValidation as dict
    box_verification: Optional[dict]     # BoxVerification as dict
    refusal_reason: Optional[str]
    degraded: Optional[bool]
    clarifying_questions: list[str]
    user_answers: Optional[dict]
    diagnosis: Optional[str]
    root_cause: Optional[str]
    severity: Optional[str]
    is_diy_safe: Optional[bool]
    diy_instructions: Optional[list[str]]
    pro_recommendation: Optional[str]
    cost_estimation: Optional[dict]
    error: Optional[str]


def extract_json(text: str) -> dict:
    code = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if code:
        text = code.group(1)
    return json.loads(text.strip())


# ── Node 1: vision inspection ──────────────────────────────────────────────
VISION_PROMPT = """You are a master plumbing inspector. Analyze this photo of a plumbing installation.
Describe ONLY what you can actually see: pipe material (PVC/copper/galvanized/PEX), fittings, visible defects
(corrosion, discoloration, cracks, leaks, water stains, bulges), fixtures, valve types and their state.
Note anything ambiguous or unseen. Keep it factual and concise. Do NOT guess a diagnosis — that comes later."""


def visual_inspection_node(state: PlumbingHITLState) -> dict:
    image_url = state["image_url"]
    prompt = [
        {"role": "user", "content": [
            {"type": "text", "text": VISION_PROMPT},
            {"type": "image_url", "image_url": {"url": image_url}},
        ]}
    ]
    try:
        text = invoke_vision(prompt)
        findings = text.strip()
        return {"visual_findings": findings, "error": None}
    except Exception as e:
        return {"visual_findings": "", "error": f"Vision analysis failed: {e}"}


# ── Node 2: image guardrail (relevance + box cross-verification) ────────────
def image_guardrail_node(state: PlumbingHITLState) -> dict:
    """Validate the photo is an actual plumbing issue before asking questions.

    On refusal, routes to END (terminal) — /start returns REJECTED and the
    frontend never reaches the clarifying-question modal.
    """
    findings = state.get("visual_findings", "")
    validation, refusal, degraded = validate_image(state["image_url"], findings)
    return {
        "validation": validation.model_dump() if validation else None,
        "refusal_reason": refusal,
        "degraded": degraded,
        "error": state.get("error"),
    }


def route_after_guardrail(state: PlumbingHITLState) -> Literal["question_generator", "END"]:
    if state.get("refusal_reason") or not state.get("validation"):
        return END
    return "question_generator"


# ── Node 3: question generator ─────────────────────────────────────────────
def question_generator_node(state: PlumbingHITLState) -> dict:
    findings = state.get("visual_findings", "")
    if state.get("error"):
        return {"clarifying_questions": [], "error": state.get("error")}
    prompt = f"""You are a master plumber prepping a diagnostic interview. Based on the visual inspection below,
write 2-3 short, specific clarifying questions a homeowner can answer (yes/no, pick-a-option, or one line).
Each question must probe a factor the photo cannot reveal: is the leak active, water temperature/pressure,
valve access, when it started, etc. Return ONLY valid JSON: a list of strings.

Visual inspection:
{findings}"""
    try:
        data = extract_json(invoke_llm([{"role": "user", "content": prompt}]))
        questions = data if isinstance(data, list) else data.get("questions", [])
        return {"clarifying_questions": questions[:3]}
    except Exception as e:
        return {"clarifying_questions": [], "error": f"Question generation failed: {e}"}


# ── Node 3: human clarification (interrupt) ────────────────────────────────
def human_clarification_node(state: PlumbingHITLState) -> dict:
    # interrupt() pauses the graph (returning the payload to /start), then on
    # resume returns the Command(resume=...) value delivered by /resume.
    answers = interrupt({"thread_id": state["thread_id"], "questions": state.get("clarifying_questions", [])})
    return {"user_answers": answers if isinstance(answers, dict) else {}}


# ── Node 4: master diagnostician ───────────────────────────────────────────
def master_diagnostician_node(state: PlumbingHITLState) -> dict:
    answers = state.get("user_answers") or {}
    findings = state.get("visual_findings", "")
    questions = state.get("clarifying_questions", [])
    qa = "\n".join(f"Q: {q}\nA: {answers.get(q, '')}" for q in questions if answers.get(q))
    prompt = f"""You are a master plumber. Synthesize the visual inspection and the homeowner's answers to give a
precise diagnosis. Return ONLY valid JSON with keys: diagnosis (string, one/two sentences), root_cause (string,
one sentence), severity (string, one of: LOW, MEDIUM, HIGH, CRITICAL), is_diy_safe (boolean — true only if a
competent homeowner can safely fix it with hand tools and no water shutoff at the street), diy_instructions
(list of steps, or empty array if not DIY-safe), pro_recommendation (string, why/when to call a pro).

Visual inspection:
{findings}

Homeowner answers:
{qa}"""
    data = extract_json(invoke_llm([{"role": "user", "content": prompt}]))
    return {
        "diagnosis": data.get("diagnosis", ""),
        "root_cause": data.get("root_cause", ""),
        "severity": data.get("severity", "MEDIUM"),
        "is_diy_safe": bool(data.get("is_diy_safe")),
        "diy_instructions": data.get("diy_instructions") or [],
        "pro_recommendation": data.get("pro_recommendation", ""),
    }


# ── Node 5: safety auditor (conditional routing) ───────────────────────────
def safety_auditor_node(state: PlumbingHITLState) -> dict:
    if state.get("severity") == "CRITICAL":
        return {"is_diy_safe": False, "diy_instructions": [], "error": None}
    return {"error": None}


def route_after_safety(state: PlumbingHITLState) -> Literal["cost_estimator", "emergency_summary"]:
    return "cost_estimator" if state.get("is_diy_safe") else "emergency_summary"


# ── Node 5b: emergency summary (non-DIY path) ──────────────────────────────
def emergency_summary_node(state: PlumbingHITLState) -> dict:
    prompt = f"""Write a concise emergency summary for the homeowner: why this is not DIY-safe, what immediate
action to take (shut off water, call), and what a licensed plumber will likely need to do. 2-4 sentences.
Context: {state.get('diagnosis', '')} — {state.get('root_cause', '')}"""
    try:
        return {"pro_recommendation": invoke_llm([{"role": "user", "content": prompt}]).strip()}
    except Exception as e:
        return {"pro_recommendation": "Contact a licensed plumber immediately. Do not attempt this repair yourself."}


# ── Node 6: cost estimator ─────────────────────────────────────────────────
def cost_estimator_node(state: PlumbingHITLState) -> dict:
    prompt = f"""Estimate repair costs for this plumbing diagnosis. Return ONLY valid JSON with keys:
parts (list of {{name, est_cost_npr, source}} where source is 'hardware' or 'plumber'), total_hardware_npr (number),
total_plumber_npr (number), labor_hours (number), notes (string). Prices in Nepali Rupees (NPR).
Diagnosis: {state.get('diagnosis', '')}. Root cause: {state.get('root_cause', '')}. DIY-safe: {state.get('is_diy_safe')}."""
    try:
        data = extract_json(invoke_llm([{"role": "user", "content": prompt}]))
        return {"cost_estimation": data}
    except Exception as e:
        return {"cost_estimation": {"parts": [], "total_hardware_npr": 0, "total_plumber_npr": 0, "notes": f"Could not estimate: {e}"}}


# ── Graph assembly ─────────────────────────────────────────────────────────
_diagnosis_checkpointer = MemorySaver()


def build_diagnosis_graph():
    builder = StateGraph(PlumbingHITLState)
    builder.add_node("visual_inspection", visual_inspection_node)
    builder.add_node("image_guardrail", image_guardrail_node)
    builder.add_node("question_generator", question_generator_node)
    builder.add_node("human_clarification", human_clarification_node)
    builder.add_node("master_diagnostician", master_diagnostician_node)
    builder.add_node("safety_auditor", safety_auditor_node)
    builder.add_node("emergency_summary", emergency_summary_node)
    builder.add_node("cost_estimator", cost_estimator_node)

    builder.add_edge(START, "visual_inspection")
    builder.add_edge("visual_inspection", "image_guardrail")
    builder.add_conditional_edges(
        "image_guardrail", route_after_guardrail,
        {"question_generator": "question_generator", END: END},
    )
    builder.add_edge("question_generator", "human_clarification")
    builder.add_edge("human_clarification", "master_diagnostician")
    builder.add_edge("master_diagnostician", "safety_auditor")
    builder.add_conditional_edges(
        "safety_auditor", route_after_safety, {"cost_estimator": "cost_estimator", "emergency_summary": "emergency_summary"}
    )
    builder.add_edge("emergency_summary", "cost_estimator")
    builder.add_edge("cost_estimator", END)

    return builder.compile(checkpointer=_diagnosis_checkpointer)
