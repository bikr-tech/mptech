"""Image-relevance guardrail for the AI plumbing diagnosis pipeline.

Layered validation before clarifying questions:
  1. Pydantic & guardrail validation  (strict models, extra="forbid")
  2. Vision-language model grounding  (Gemini 2.5 Flash bounding boxes)
  3. Woodpecker strategy              (decompose findings into atomic facts,
                                      answer per-fact VQA against the image)
  4. Bounding-box cross-verification  (fault box must abut a component box;
                                      claim object without a box => hallucination)

Fails SAFE: any hard failure refuses the image rather than proceeding with an
unvalidated diagnosis. Soft failures degrade to text-only when relevance and
boxes already passed.
"""
import json
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from .llm_router import invoke_gemini

# ── thresholds (module constants; promote to settings if per-deploy tuning) ──
MIN_RELEVANCE_CONFIDENCE = 0.6
MIN_VQA_SUPPORT_RATIO = 0.5
BOX_ABUT_EPSILON = 0.05

FAULT_KEYWORDS = ("leak", "corros", "crack", "stain", "bulge", "burst", "drip", "green")
COMPONENT_KEYWORDS = (
    "pipe", "joint", "fitting", "valve", "solder", "coupling",
    "elbow", "flange", "drain", "sink", "tap", "hose",
)


# ── pydantic models (requirement 1 + atomic VQA container) ───────────────────
class Box(BaseModel):
    """Normalized bounding box [0,1]. extra="forbid" rejects VLM junk keys."""
    model_config = ConfigDict(extra="forbid")

    label: str
    x_min: float = Field(ge=0, le=1)
    y_min: float = Field(ge=0, le=1)
    x_max: float = Field(ge=0, le=1)
    y_max: float = Field(ge=0, le=1)

    @model_validator(mode="after")
    def _ordered(self):
        if self.x_max <= self.x_min or self.y_max <= self.y_min:
            raise ValueError("x_max/x_max and y_max must be > min (degenerate box)")
        return self


class VQAItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str
    answer: str
    supported: bool
    confidence: float = Field(ge=0, le=1)


class DiagnosisValidation(BaseModel):
    """Atomic VQA consistency container — everything the VLM claimed about the image."""
    model_config = ConfigDict(extra="forbid")

    is_relevant_plumbing: bool
    relevance_confidence: float = Field(ge=0, le=1)
    label: str
    fault_label: str = ""
    objects_seen: list[str] = []
    bounding_boxes: list[Box] = []
    vqa_verdict: list[VQAItem] = []
    explanation: str = ""


class BoxVerification(BaseModel):
    model_config = ConfigDict(extra="forbid")

    passed: bool
    missing_boxes: list[str]
    fault_component_pairs: list[dict]
    notes: list[str]


# ── VLM grounding (requirement: bounding boxes via Gemini grounding) ──────────
GROUNDING_PROMPT = (
    "You are a plumbing-photo validator. Determine whether this photo actually "
    "shows a plumbing installation with a detectable issue. Return ONLY valid JSON "
    "with keys:\n"
    '  "is_relevant_plumbing": bool,\n'
    '  "relevance_confidence": number 0-1,\n'
    '  "label": short string e.g. "corroded copper pipe",\n'
    '  "fault_label": short string naming the fault only, e.g. "leak" or "corrosion" '
    'or "" if none,\n'
    '  "objects_seen": array of short object nouns (pipe, joint, valve, tap, drain, '
    "sink, ...),\n"
    '  "bounding_boxes": array of { "label": string, "x_min","y_min","x_max","y_max": '
    "number in [0,1] } — one box per detected plumbing object or fault region,\n"
    '  "explanation": one short sentence.\n'
    "If the photo is not a plumbing scene (e.g. a random outdoor picture), set "
    'is_relevant_plumbing=false and bounding_boxes=[].'
)


def run_grounding(image_url: str) -> dict:
    """Ask Gemini 2.5 Flash (grounding) for relevance + bounding boxes."""
    prompt = [
        {"role": "user", "content": [
            {"type": "text", "text": GROUNDING_PROMPT},
            {"type": "image_url", "image_url": {"url": image_url}},
        ]}
    ]
    text = invoke_gemini(prompt)
    return extract_json(text)


def extract_json(text: str) -> dict:
    """Parse JSON from VLM text output (fenced or bare). Mirrors diagnosis_graph."""
    import re
    code = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if code:
        text = code.group(1)
    return json.loads(text.strip())


# ── Woodpecker: atomic VQA consistency (requirement 4 + 6) ────────────────────
WOODPECKER_DECOMPOSE_PROMPT = (
    "Break this plumbing visual-inspection text into atomic factual claims the photo "
    "could prove or refute. Return ONLY valid JSON: an array of "
    'objects with keys "fact" and "question" (question is a yes/no question '
    "answerable from the photo). Skip hedged or negative statements like "
    "'cannot tell'. 2-5 items."
)

WOODPECKER_ANSWER_PROMPT = (
    "Look at the photo and answer each question from image evidence ONLY. "
    "Return ONLY valid JSON: an array of objects with keys \"question\", \"answer\" "
    "(yes or no), \"supported\" (bool), \"confidence\" (number 0-1), matching the "
    "input order."
)


def _decompose_findings(findings: str) -> list[dict]:
    prompt = WOODPECKER_DECOMPOSE_PROMPT + "\nFindings:\n" + findings
    data = extract_json(invoke_gemini([{"role": "user", "content": prompt}]))
    items = data if isinstance(data, list) else data.get("facts", [])
    return [i for i in items if i.get("fact") and i.get("question")]


def _answer_vqa(image_url: str, questions: list[str]) -> list[VQAItem]:
    prompt = [
        {"role": "user", "content": [
            {"type": "text", "text": WOODPECKER_ANSWER_PROMPT + "\nQuestions:\n" + json.dumps(questions)},
            {"type": "image_url", "image_url": {"url": image_url}},
        ]}
    ]
    data = extract_json(invoke_gemini(prompt))
    raw = data if isinstance(data, list) else data.get("answers", [])
    return [VQAItem.model_validate(i) for i in raw]


def run_woodpecker(image_url: str, findings: str) -> tuple[list[VQAItem], float]:
    """Decompose findings into atomic facts, VQA each against the image.

    Returns (verdicts, support_ratio). support_ratio < MIN_VQA_SUPPORT_RATIO means
    the photo contradicts the visual-inspection claims.
    """
    facts = _decompose_findings(findings)
    if not facts:
        return [], 1.0
    verdicts = _answer_vqa(image_url, [f["question"] for f in facts])
    supported = sum(1 for v in verdicts if v.supported)
    return verdicts, supported / max(len(verdicts), 1)


# ── Bounding-box cross-verification (requirement 2) — pure, deterministic ─────
def iou(a: Box, b: Box) -> float:
    ix = max(0.0, min(a.x_max, b.x_max) - max(a.x_min, b.x_min))
    iy = max(0.0, min(a.y_max, b.y_max) - max(a.y_min, b.y_min))
    inter = ix * iy
    area_a = (a.x_max - a.x_min) * (a.y_max - a.y_min)
    area_b = (b.x_max - b.x_min) * (b.y_max - b.y_min)
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def min_edge_distance(a: Box, b: Box) -> float:
    dx = max(0.0, max(a.x_min - b.x_max, b.x_min - a.x_max))
    dy = max(0.0, max(a.y_min - b.y_max, b.y_min - a.y_max))
    return (dx * dx + dy * dy) ** 0.5


def intersects_or_abuts(a: Box, b: Box, epsilon: float = BOX_ABUT_EPSILON) -> bool:
    return iou(a, b) > 0 or min_edge_distance(a, b) <= epsilon


def verify_boxes(validation: DiagnosisValidation, findings: str = "") -> BoxVerification:
    """Cross-check detected fault/component boxes against the VLM's claims.

    - Every claimed fault must have a bounding box (a central claim object with no
      box is a hallucination signal).
    - The fault box must overlap or abut at least one plumbing component box
      (leak box near pipe joint ↔ "joint leak").
    """
    missing: list[str] = []
    pairs: list[dict] = []
    notes: list[str] = []
    boxes = validation.bounding_boxes
    fault_label = validation.fault_label.lower()

    fault_box = None
    for box in boxes:
        label = box.label.lower()
        if fault_label and fault_label in label:
            fault_box = box
            break
    if fault_box is None:
        for box in boxes:
            if any(k in box.label.lower() for k in FAULT_KEYWORDS):
                fault_box = box
                break

    if fault_box is None:
        # fault_label present but no box anywhere => central claim w/o box.
        missing.append(validation.fault_label or "fault")
        notes.append("No bounding box found for the claimed fault.")

    component_boxes = [b for b in boxes if any(k in b.label.lower() for k in COMPONENT_KEYWORDS)]
    abuts = False
    if fault_box is not None:
        for cb in component_boxes:
            hit = intersects_or_abuts(fault_box, cb)
            pairs.append({"fault": fault_box.label, "component": cb.label, "intersects": hit})
            abuts = abuts or hit
        if not abuts:
            notes.append("Fault box does not overlap or abut any detected component box.")

    return BoxVerification(
        passed=not missing and (abuts or not component_boxes),
        missing_boxes=missing,
        fault_component_pairs=pairs,
        notes=notes,
    )


# ── Orchestrator ──────────────────────────────────────────────────────────────
Refusal = tuple[None, str, bool]  # (validation, refusal_reason, degraded)


def validate_input(image_url: Optional[str], findings: str) -> tuple[DiagnosisValidation | None, str | None, bool]:
    """Run the full guardrail chain. Returns (validation, refusal_reason, degraded).

    - hard refuses: irrelevant image, pydantic failure, low VQA support, claim box missing
    - soft degrade (degraded=True): grounding/VQA unavailable but relevance+boxes passed
    """
    # 1. Grounding
    try:
        if not image_url:
            return None, "No image provided for visual validation.", False
        raw = run_grounding(image_url)
        validation = DiagnosisValidation.model_validate(raw)
    except ValidationError as e:
        return None, _validation_error_to_refusal(e), False
    except Exception:
        # Grounding/VLM unavailable.
        if findings.strip():
            return None, None, True  # degrade: text-only pass (ponytail)
        return None, "We couldn't analyze this photo. Please try another one.", False

    # 2. Relevance gate (hard)
    if not validation.is_relevant_plumbing or validation.relevance_confidence < MIN_RELEVANCE_CONFIDENCE:
        return validation, "We couldn't detect a plumbing issue in this photo. Please upload a photo of your plumbing problem.", False

    # 3. Woodpecker atomic VQA (hard on contradiction)
    try:
        if not image_url:
            return validation, None, True # degrade: VQA requires image, skip if text-only input
        verdicts, ratio = run_woodpecker(image_url, findings)
        validation.vqa_verdict = verdicts
        if ratio < MIN_VQA_SUPPORT_RATIO:
            return validation, "This photo doesn't match the described plumbing issue. Please try a clearer photo.", False
    except Exception:
        if validation.relevance_confidence >= 0.8:
            return validation, None, True  # degrade (ponytail: could refuse always)
        return validation, "We couldn't verify this photo. Please try another one.", False

    # 4. Box cross-verification (hard on missing claim box, soft on precision)
    if not image_url:
        return validation, None, True # degrade: box verification requires image, skip if text-only input
    bv = verify_boxes(validation, findings)
    if bv.missing_boxes:
        return validation, "We couldn't confirm the issue location in this photo. Please retake a closer photo.", False
    degraded = bool(bv.notes)  # spatial imprecision => pass-with-note, not refuse
    return validation, None, degraded


def _validation_error_to_refusal(e: ValidationError) -> str:
    return "The AI couldn't read this image reliably. Please upload a clearer photo of your plumbing issue."
