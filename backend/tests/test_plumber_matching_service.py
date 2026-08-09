"""Pure tests for matching scoring + haversine. No DB (recommend is mocked
to the ranking core via a fake booking; verify_assignment needs a DB stub)."""
from types import SimpleNamespace

import pytest
from unittest.mock import patch

from app.services.availability_service import haversine_km
from app.services.plumber_matching_service import recommend, verify_assignment

# 1° of latitude ≈ 111.19 km — two points on the same meridian.
_KM_PER_DEG = 111.19


def test_haversine_same_point():
    assert haversine_km(27.7, 85.3, 27.7, 85.3) == 0.0


def test_haversine_known_distance():
    # ~1° latitude apart, same longitude → ~111 km.
    d = haversine_km(27.7, 85.3, 28.7, 85.3)
    assert 110 < d < 113


def test_haversine_none_is_inf():
    assert haversine_km(None, 85.3, 28.0, 85.0) == float("inf")


def _booking(**kw):
    b = {
        "urgency": "medium", "latitude": 27.7, "longitude": 85.3,
        "ai_diagnosis": {"required_skills": ["leak-repair"]},
    }
    b.update(kw)
    return b


def _plumber(id, skills, rating=5.0, jobs=0, lat=27.7, lon=85.3, status="available", radius=10):
    return {"id": id, "name": f"P{id}", "status": status, "latitude": lat, "longitude": lon,
            "service_radius_km": radius, "skills": skills, "rating": rating,
            "total_jobs": jobs, "hourly_rate": 500}


class _FakeDB:
    def __init__(self, plumbers):
        self._plumbers = plumbers

    def table(self, name):
        return _FakeTable(self._plumbers)


class _FakeTable:
    def __init__(self, rows):
        self._rows = rows
        self._single = False

    def select(self, *a, **k):
        return self

    def execute(self):
        data = self._rows[0] if (self._single and self._rows) else self._rows
        return SimpleNamespace(data=data)

    def eq(self, *a, **k):
        return self

    def single(self, *a, **k):
        self._single = True
        return self

    def order(self, *a, **k):
        return self


@patch("app.services.plumber_matching_service.get_supabase")
def test_recommend_ranks_skilled_nearby_higher(mock_db):
    mock_db.return_value = _FakeDB([
        _plumber(1, ["leak-repair"], lat=27.7001, lon=85.3001),  # ~15m away, skilled
        _plumber(2, ["other"], lat=27.8, lon=85.3, jobs=12),      # 11km away, no skill, loaded
    ])
    ranked = recommend(mock_db.return_value, _booking())
    assert ranked[0]["plumber_id"] == 1
    assert ranked[0]["score"] > ranked[1]["score"]
    assert "Skill match" in ranked[0]["reasons"]


@patch("app.services.plumber_matching_service.get_supabase")
def test_recommend_excludes_non_available(mock_db):
    mock_db.return_value = _FakeDB([
        _plumber(1, ["leak-repair"]),
        _plumber(2, ["leak-repair"], status="off_duty"),
    ])
    ranked = recommend(mock_db.return_value, _booking())
    assert [r["plumber_id"] for r in ranked] == [1]


@patch("app.services.plumber_matching_service.get_supabase")
def test_recommend_score_caps_at_100(mock_db):
    mock_db.return_value = _FakeDB([
        _plumber(1, ["leak-repair"], rating=5.0, jobs=0, lat=27.7, lon=85.3),
    ])
    ranked = recommend(mock_db.return_value, _booking())
    assert ranked[0]["score"] == 100
    assert ranked[0]["distance_km"] == 0.0


@patch("app.services.plumber_matching_service.get_supabase")
def test_recommend_no_diagnosis_any_plumber(mock_db):
    mock_db.return_value = _FakeDB([
        _plumber(1, []),
        _plumber(2, []),
    ])
    ranked = recommend(mock_db.return_value, _booking(ai_diagnosis={}))
    assert len(ranked) == 2  # no skills required → skill_match = 1.0 for all


@patch("app.services.plumber_matching_service.get_supabase")
def test_verify_assignment_blocks_bad_skills(mock_db):
    mock_db.return_value = _FakeDB([_plumber(1, ["heating"])])
    ok, msg = verify_assignment(mock_db.return_value, _booking(), "1")
    assert ok is False
    assert "skills" in msg


@patch("app.services.plumber_matching_service.get_supabase")
def test_verify_assignment_blocks_radius(mock_db):
    mock_db.return_value = _FakeDB([_plumber(1, ["leak-repair"], lat=30.0, lon=85.3, radius=5)])
    ok, msg = verify_assignment(mock_db.return_value, _booking(), "1")
    assert ok is False
    assert "km" in msg
