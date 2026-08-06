"""Tests for the image-relevance guardrail (pydantic, Woodpecker VQA, box verify).

All LLM calls are mocked — no network.
"""
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.diagnosis_guardrails import (
    BOX_ABUT_EPSILON,
    MIN_VQA_SUPPORT_RATIO,
    Box,
    DiagnosisValidation,
    VQAItem,
    iou,
    intersects_or_abuts,
    min_edge_distance,
    run_woodpecker,
    validate_image,
    verify_boxes,
)


# ── pydantic guardrail rejection ─────────────────────────────────────────────
def _box(**over):
    d = dict(label="pipe", x_min=0.1, y_min=0.1, x_max=0.9, y_max=0.9)
    d.update(over)
    return d


def test_box_out_of_range_coords_rejected():
    with pytest.raises(ValidationError):
        Box.model_validate(_box(x_min=-0.1))


def test_box_degenerate_rejected():
    with pytest.raises(ValidationError):
        Box.model_validate(_box(x_max=0.05))  # x_max <= x_min


def test_validation_missing_relevance_rejected():
    raw = {"relevance_confidence": 0.9, "label": "pipe", "bounding_boxes": []}
    with pytest.raises(ValidationError):
        DiagnosisValidation.model_validate(raw)


def test_validation_unknown_key_rejected():
    raw = {"is_relevant_plumbing": True, "relevance_confidence": 0.9, "label": "pipe",
           "bounding_boxes": [], "hallucinated_extra": 1}
    with pytest.raises(ValidationError):
        DiagnosisValidation.model_validate(raw)


def test_validation_accepts_valid():
    raw = {
        "is_relevant_plumbing": True,
        "relevance_confidence": 0.9,
        "label": "corroded copper pipe",
        "fault_label": "corrosion",
        "objects_seen": ["pipe", "joint"],
        "bounding_boxes": [_box(), _box(label="corrosion", x_min=0.4, y_min=0.4, x_max=0.6, y_max=0.6)],
        "vqa_verdict": [{"question": "Q", "answer": "yes", "supported": True, "confidence": 0.9}],
    }
    v = DiagnosisValidation.model_validate(raw)
    assert v.is_relevant_plumbing and len(v.bounding_boxes) == 2


# ── box geometry ─────────────────────────────────────────────────────────────
def test_iou_overlap_and_disjoint():
    a = Box(**_box())
    b = Box(**_box(x_min=0.2, y_min=0.2, x_max=0.8, y_max=0.8))
    assert iou(a, b) > 0
    c = Box(label="far", x_min=0.0, y_min=0.0, x_max=0.05, y_max=0.05)
    assert iou(a, c) == 0


def test_abut_at_epsilon_boundary():
    a = Box(**_box())
    near = Box(label="joint", x_min=0.9, y_min=0.4, x_max=0.98, y_max=0.6)  # 0.0 gap in x
    assert min_edge_distance(a, near) == 0.0
    assert intersects_or_abuts(a, near, BOX_ABUT_EPSILON)
    far = Box(label="joint", x_min=0.0, y_min=0.0, x_max=0.02, y_max=0.02)
    assert not intersects_or_abuts(a, far, BOX_ABUT_EPSILON)


def test_verify_boxes_missing_fault_box_fails():
    v = DiagnosisValidation.model_validate({
        "is_relevant_plumbing": True, "relevance_confidence": 0.9, "label": "pipe",
        "fault_label": "leak",
        "bounding_boxes": [_box(label="pipe")],
    })
    bv = verify_boxes(v)
    assert not bv.passed
    assert "leak" in bv.missing_boxes


def test_verify_boxes_fault_abuts_component_passes():
    v = DiagnosisValidation.model_validate({
        "is_relevant_plumbing": True, "relevance_confidence": 0.9, "label": "joint leak",
        "fault_label": "leak",
        "bounding_boxes": [
            _box(label="pipe"),
            _box(label="leak", x_min=0.88, y_min=0.4, x_max=0.98, y_max=0.6),  # abuts pipe
        ],
    })
    bv = verify_boxes(v)
    assert bv.passed
    assert not bv.missing_boxes


# ── woodpecker aggregation ───────────────────────────────────────────────────
@patch("app.diagnosis_guardrails.invoke_gemini")
def test_run_woodpecker_support_ratio(mock):
    mock.side_effect = [
        # decompose -> 2 facts
        '[{"fact": "there is green corrosion", "question": "Is there green corrosion visible?"},'
        '{"fact": "the pipe is copper", "question": "Is the pipe copper?"}]',
        # answers -> 1 supported of 2
        '[{"question": "Is there green corrosion visible?", "answer": "yes", "supported": true, "confidence": 0.9},'
        '{"question": "Is the pipe copper?", "answer": "no", "supported": false, "confidence": 0.7}]',
    ]
    verdicts, ratio = run_woodpecker("data:image/jpeg;base64,AAAA", "green corrosion on copper pipe")
    assert len(verdicts) == 2
    assert ratio == 0.5
    assert all(isinstance(v, VQAItem) for v in verdicts)


# ── validate_image orchestrator ──────────────────────────────────────────────
@patch("app.diagnosis_guardrails.run_woodpecker")
@patch("app.diagnosis_guardrails.run_grounding")
def test_validate_image_refuses_irrelevant(mock_grounding, mock_woodpecker):
    mock_grounding.return_value = {
        "is_relevant_plumbing": False,
        "relevance_confidence": 0.2,
        "label": "outdoor park",
        "bounding_boxes": [],
    }
    validation, refusal, degraded = validate_image("data:img", "some findings")
    assert refusal is not None
    assert "plumbing" in refusal
    assert not degraded


@patch("app.diagnosis_guardrails.run_woodpecker")
@patch("app.diagnosis_guardrails.run_grounding")
def test_validate_image_passes_relevant(mock_grounding, mock_woodpecker):
    mock_grounding.return_value = {
        "is_relevant_plumbing": True,
        "relevance_confidence": 0.9,
        "label": "corroded copper joint",
        "fault_label": "corrosion",
        "objects_seen": ["pipe", "joint"],
        "bounding_boxes": [
            {"label": "pipe", "x_min": 0.1, "y_min": 0.1, "x_max": 0.9, "y_max": 0.9},
            {"label": "corrosion", "x_min": 0.4, "y_min": 0.4, "x_max": 0.6, "y_max": 0.6},
        ],
    }
    mock_woodpecker.return_value = ([], 1.0)
    validation, refusal, degraded = validate_image("data:img", "green corrosion at the joint")
    assert refusal is None
    assert validation is not None
    assert validation.is_relevant_plumbing


@patch("app.diagnosis_guardrails.run_woodpecker")
@patch("app.diagnosis_guardrails.run_grounding")
def test_validate_image_degrades_on_low_vqa_support(mock_grounding, mock_woodpecker):
    mock_grounding.return_value = {
        "is_relevant_plumbing": True,
        "relevance_confidence": 0.9,
        "label": "pipe",
        "bounding_boxes": [{"label": "pipe", "x_min": 0.1, "y_min": 0.1, "x_max": 0.9, "y_max": 0.9}],
    }
    mock_woodpecker.return_value = ([VQAItem(question="Q", answer="no", supported=False, confidence=0.9)], 0.0)
    _, refusal, degraded = validate_image("data:img", "claim A")
    assert refusal is not None  # contradictory VQA => hard refuse
    assert not degraded


@patch("app.diagnosis_guardrails.run_woodpecker")
@patch("app.diagnosis_guardrails.run_grounding")
def test_validate_image_refuses_when_claim_box_missing(mock_grounding, mock_woodpecker):
    mock_grounding.return_value = {
        "is_relevant_plumbing": True,
        "relevance_confidence": 0.9,
        "label": "joint leak",
        "fault_label": "leak",  # central claim, but NO box labelled leak
        "bounding_boxes": [{"label": "pipe", "x_min": 0.1, "y_min": 0.1, "x_max": 0.9, "y_max": 0.9}],
    }
    mock_woodpecker.return_value = ([], 1.0)
    _, refusal, _ = validate_image("data:img", "leak at the joint")
    assert refusal is not None
    assert "location" in refusal


@patch("app.diagnosis_guardrails.run_grounding")
def test_validate_image_refuses_when_grounding_fails_and_no_findings(mock_grounding):
    mock_grounding.side_effect = RuntimeError("Gemini down")
    _, refusal, degraded = validate_image("data:img", "")
    assert refusal is not None
    assert not degraded


@patch("app.diagnosis_guardrails.run_grounding")
def test_validate_image_degrades_when_grounding_fails_but_findings_ok(mock_grounding):
    mock_grounding.side_effect = RuntimeError("Gemini down")
    validation, refusal, degraded = validate_image("data:img", "pipe with corrosion")
    assert refusal is None
    assert degraded is True
    assert validation is None  # no structured validation, text-only pass
