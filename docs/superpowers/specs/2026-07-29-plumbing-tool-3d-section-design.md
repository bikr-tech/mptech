# Plumbing Tool 3D Section — Design Spec

## Overview

New landing page section type `plumbing_tool_3d` showing a 3D tool belt with 4 plumbing tools (wrench, plunger, pipe cutter, tape measure) built from Three.js primitives. Admin can disable, reposition, recolor, and control animation of the entire scene.

## Section Type

- DB type: `plumbing_tool_3d`
- Block component: `PlumbingToolBlock3D`
- Content shape (JSONB):

```json
{
  "enabled": true,
  "title": "Tools We Use",
  "subtitle": "Professional-grade equipment",
  "beltColor": "#8B4513",
  "toolColor": "#C0C0C0",
  "positionX": 0,
  "positionY": 0,
  "positionZ": 0,
  "motionSpeed": 1.0,
  "animationStyle": "float",
  "tools": ["wrench", "plunger", "pipe_cutter", "tape_measure"]
}
```

`animationStyle` enum: `float | rotate | bob | pulse | none`

## 3D Scene — ToolBelt3D

Built from Three.js primitives. Files under `frontend/src/components/3d/tools/`.

### BeltArc.jsx
- `CatmullRomCurve3` half-circle arc
- `TubeGeometry` with leather-brown material
- Receives `beltColor` prop

### Wrench3D.jsx
- Box handle + torus/open jaw profile
- Grip ridges as small cylinders

### Plunger3D.jsx
- Cylinder handle + hemisphere rubber cup
- Rubber cup slightly flared

### PipeCutter3D.jsx
- Torus body + small cylinder wheel + short box handle
- C-shaped profile

### TapeMeasure3D.jsx
- Box body + small cylinder spool + thin box tape
- Yellow body with tape extending

### ToolBelt3D.jsx
- Orchestrator: renders BeltArc + tools at evenly-spaced angles around arc
- Hangs tools by short loop segments
- Applies `useFrame` animation based on `animationStyle` prop:
  - `float` — sine wave Y oscillation at frequency × motionSpeed
  - `rotate` — slow Z rotation at rate × motionSpeed
  - `bob` — smoother up/down ease at rate × motionSpeed
  - `pulse` — subtle scale oscillation (0.95–1.05) at rate × motionSpeed
  - `none` — static
- MeshStandardMaterial with metalness/roughness driven by `toolColor`

## Block Component

`frontend/src/components/blocks/PlumbingToolBlock3D.jsx`

Standard block pattern: receives `{ content }`, destructures with defaults, returns null if `!enabled`.

Layout: section with gradient background (slate-900 to slate-800), title/subtitle above, 500px tall Canvas with `<ToolBelt3D />`.

## Admin Editor (SectionSettingsDrawer)

New case `plumbing_tool_3d`:

| Field | Control | Key |
|-------|---------|-----|
| Title | Text input | title |
| Subtitle | Text input | subtitle |
| Enabled | Toggle | enabled |
| Belt Color | Color picker | beltColor |
| Tool Color | Color picker | toolColor |
| Position X | Range -5..5 | positionX |
| Position Y | Range -5..5 | positionY |
| Position Z | Range -5..5 | positionZ |
| Motion Speed | Range 0..3 step 0.1 | motionSpeed |
| Animation Style | Dropdown | animationStyle |
| Tools | Checkbox group | tools |

## Wiring

### Files to modify:
1. `backend/app/models/section.py` — Add `"plumbing_tool_3d"` to `SectionType`
2. `frontend/src/components/admin/AdminPanel.jsx` — `SECTION_TYPES` + preview case
3. `frontend/src/components/admin/SectionSettingsDrawer.jsx` — editor UI + `contentToForm`/`formToContent`
4. `frontend/src/components/admin/SortableBlock.jsx` — type label/color
5. `frontend/src/pages/PublicPage.jsx` — import + blockMap

### Files to create:
6. `frontend/src/components/blocks/PlumbingToolBlock3D.jsx`
7. `frontend/src/components/3d/tools/ToolBelt3D.jsx`
8. `frontend/src/components/3d/tools/BeltArc.jsx`
9. `frontend/src/components/3d/tools/Wrench3D.jsx`
10. `frontend/src/components/3d/tools/Plunger3D.jsx`
11. `frontend/src/components/3d/tools/PipeCutter3D.jsx`
12. `frontend/src/components/3d/tools/TapeMeasure3D.jsx`

### Database:
13. Supabase SQL Editor — `ALTER TABLE landing_sections DROP CONSTRAINT... ADD CONSTRAINT... CHECK (type IN (...'plumbing_tool_3d'...))`
