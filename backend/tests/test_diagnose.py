"""Smoke tests for the HITL diagnosis graph (interrupt + resume), no network needed."""
from unittest.mock import patch

import pytest
from langgraph.types import Command

from app.diagnosis_graph import (
    build_diagnosis_graph,
    extract_json,
    question_generator_node,
)


class FakeState:
    """Proxies a checkpointer state so nodes that only read can run standalone."""

    def __init__(self, data):
        self.values = data
        self.config = {"configurable": {"thread_id": "test"}}
        self.next = None

    def get(self, key, default=None):
        return self.values.get(key, default)


def test_extract_json_code_fence():
    assert extract_json('```json\n{"a": 1}\n```') == {"a": 1}


def test_extract_json_plain():
    assert extract_json('{"b": [1, 2]}') == {"b": [1, 2]}


@patch("app.diagnosis_graph.invoke_llm", return_value='["Is the leak active now?", "Hot or cold supply?"]')
def test_question_generator_parses_list(mock):
    state = FakeState({"visual_findings": "corrosion on copper joint", "thread_id": "t1"})
    result = question_generator_node(state)
    assert len(result["clarifying_questions"]) == 2
    assert "active" in result["clarifying_questions"][0]


def test_question_generator_empty_on_error():
    state = FakeState({"visual_findings": "", "thread_id": "t1", "error": "boom"})
    result = question_generator_node(state)
    assert result["clarifying_questions"] == []
    assert "boom" in result["error"]


@patch("app.diagnosis_graph.invoke_llm")
def test_full_graph_interrupt_resume(mock):
    mock.side_effect = [
        "Copper pipe with green corrosion near the joint.",  # visual inspection
        '["Is the leak active now?", "What is the water temperature?"]',  # questions
        '{"diagnosis": "Failed solder joint", "root_cause": "Corroded copper joint", '
        '"severity": "MEDIUM", "is_diy_safe": true, "diy_instructions": ["Shut off water", "Sand the joint"], '
        '"pro_recommendation": "Only if flux is clean"}',  # master diagnostician
        '{"parts": [{"name": "Solder", "est_cost_npr": 150, "source": "hardware"}], '
        '"total_hardware_npr": 150, "total_plumber_npr": 2500, "labor_hours": 2, "notes": "ok"}',  # cost
    ]

    graph = build_diagnosis_graph()
    config = {"configurable": {"thread_id": "t-test-1"}}
    initial = {"thread_id": "t-test-1", "image_url": "https://example.com/img.jpg"}

    # Run until interrupt
    events = list(graph.stream(initial, config, stream_mode="updates"))
    assert any("__interrupt__" in e for e in events)
    state = graph.get_state(config)
    assert state.next[0] == "human_clarification"
    assert len(state.values["clarifying_questions"]) == 2

    # Resume with answers
    events = list(graph.stream(Command(resume={"Is the leak active now?": "yes"}), config, stream_mode="updates"))
    assert events
    state = graph.get_state(config)
    assert state.next is ()
    assert state.values["severity"] == "MEDIUM"
    assert state.values["is_diy_safe"] is True
    assert state.values["diagnosis"] == "Failed solder joint"
    assert state.values["cost_estimation"]["total_hardware_npr"] == 150


def test_route_after_safety():
    from app.diagnosis_graph import route_after_safety

    assert route_after_safety({"is_diy_safe": True}) == "cost_estimator"
    assert route_after_safety({"is_diy_safe": False}) == "emergency_summary"
    assert route_after_safety({"is_diy_safe": False, "severity": "CRITICAL"}) == "emergency_summary"
