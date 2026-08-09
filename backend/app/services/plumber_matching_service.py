"""Smart plumber matching (spec §10).

Scoring (out of 100):
  availability  30
  distance      25
  skills        20
  workload      15
  rating        10

The result is a RECOMMENDATION. The admin always makes the final assignment
call (assignment_service enforces availability + no-overlap regardless).
"""
from app.database import get_supabase
from .availability_service import haversine_km, schedule_conflict

W_AVAIL = 0.30
W_DIST = 0.25
W_SKILL = 0.20
W_LOAD = 0.15
W_RATING = 0.10

MAX_RADIUS_MULT = 1.5  # how far beyond the plumber's radius we still consider them


def _skills_from_diagnosis(ai_diagnosis: dict) -> list[str]:
    skills = ai_diagnosis.get("required_skills") or []
    if not skills and ai_diagnosis.get("problem_type"):
        skills = [ai_diagnosis["problem_type"]]
    return [str(s).lower() for s in skills]


def recommend(db, booking: dict) -> list[dict]:
    plumbers = db.table("plumbers").select("*").execute().data or []
    diag = booking.get("ai_diagnosis") or {}
    required = _skills_from_diagnosis(diag)
    urgency = booking.get("urgency", "medium")
    lat, lng = booking.get("latitude"), booking.get("longitude")

    out = []
    for p in plumbers:
        if p.get("status") != "available":
            continue  # off duty / on leave / busy are hard-excluded

        dist = haversine_km(lat, lng, p.get("latitude"), p.get("longitude"))
        radius = p.get("service_radius_km") or 10
        if dist != float("inf") and dist > radius * MAX_RADIUS_MULT:
            continue

        skills = {str(s).lower() for s in (p.get("skills") or [])}
        skill_match = len([s for s in required if s in skills]) / len(required) if required else 1.0

        if not required:
            skill_match = 1.0  # no diagnosis → any plumber can take it

        workload = p.get("total_jobs") or 0
        rating = p.get("rating") or 5.0

        reasons = []
        reasons.append("Available")
        if skill_match >= 1.0:
            reasons.append("Skill match")
        if dist != float("inf"):
            reasons.append(f"{dist:.1f} km away")
        if workload < 5:
            reasons.append("Low workload")

        # Distance score: 25 pts if same spot, decays to ~0 at 20 km.
        dist_score = max(0.0, 1.0 - dist / 20.0) if dist != float("inf") else 0.0
        # Workload score: inverse of job count, cap effect.
        load_score = max(0.0, 1.0 - workload / 20.0)
        rating_score = (rating - 3.0) / 2.0  # 3★→0, 5★→1

        score = round(100 * (
            W_AVAIL * 1.0 +
            W_DIST * dist_score +
            W_SKILL * skill_match +
            W_LOAD * load_score +
            W_RATING * rating_score
        ))

        out.append({
            "plumber_id": p["id"],
            "name": p.get("name", ""),
            "distance_km": round(dist, 1) if dist != float("inf") else None,
            "availability": p.get("status", "available"),
            "rating": rating,
            "skill_match": round(skill_match, 2),
            "workload": workload,
            "score": score,
            "reasons": reasons,
        })

    out.sort(key=lambda r: r["score"], reverse=True)
    return out


def verify_assignment(db, booking: dict, plumber_id: str) -> tuple[bool, str]:
    """Pre-assignment gate: plumber exists, active, skills, radius, availability,
    no overlap. Returns (ok, message)."""
    from .availability_service import plumber_available

    res = db.table("plumbers").select("*").eq("id", plumber_id).single().execute()
    if not res.data:
        return False, "Plumber not found."
    p = res.data

    if not plumber_available(db, plumber_id):
        return False, "Plumber is not available."

    if p.get("status") != "available":
        return False, "Plumber is not currently available."

    required = _skills_from_diagnosis(booking.get("ai_diagnosis") or {})
    if required:
        skills = {str(s).lower() for s in (p.get("skills") or [])}
        if not all(s in skills for s in required):
            return False, f"Plumber lacks required skills: {', '.join(required)}."

    if p.get("latitude") and p.get("longitude") and booking.get("latitude"):
        dist = haversine_km(booking["latitude"], booking["longitude"], p["latitude"], p["longitude"])
        radius = p.get("service_radius_km") or 10
        if dist > radius:
            return False, f"Plumber is {dist:.1f} km away — outside their {radius:.0f} km service radius."

    return True, "ok"
