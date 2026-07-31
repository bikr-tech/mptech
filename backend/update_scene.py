"""Update hero_3d section scene3d config with isometric home + fixture defaults."""
from app.database import get_supabase

FIXTURE_DEFAULTS = {
    "toilet": {"visible": True},
    "sink": {"visible": True},
    "bathtub": {"visible": True},
    "shower": {"visible": True},
    "water_heater": {"visible": True},
    "pipes": {"visible": True},
}

db = get_supabase()

res = db.table("landing_sections").select("*").eq("type", "hero_3d").execute()
if not res.data:
    print("No hero_3d section found")
    exit(1)

section = res.data[0]
content = section["content"]

scene3d = content.get("scene3d", {})
scene3d["sceneType"] = "home"
scene3d["fixtures"] = FIXTURE_DEFAULTS
content["scene3d"] = scene3d

db.table("landing_sections").update({"content": content}).eq("id", section["id"]).execute()
print(f"Updated hero_3d section {section['id']}: sceneType=home, fixtures set")
