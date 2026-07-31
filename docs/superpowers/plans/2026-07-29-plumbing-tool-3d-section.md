# Plumbing Tool 3D Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `plumbing_tool_3d` landing page section type with 3D tool belt scene and admin controls.

**Architecture:** New section type with 4 3D tool models built from Three.js primitives. Admin controls (disable, position, color, motion speed, animation style) stored in JSONB content. Standard block pattern: DB → PublicPage blockMap → canvas-embedded 3D scene.

**Tech Stack:** React 19, Three.js/R3F, FastAPI/Supabase, TailwindCSS v4

## Global Constraints

- Must follow existing block pattern (default export, `{ content }` prop, empty-state handling)
- 3D tools built from primitives only (no external model files) — consistent with `PlumbingFittings.jsx`
- Admin editor UI must follow existing `handleChange(key, value)` pattern in `SectionSettingsDrawer.jsx`
- DB CHECK constraint update must be done manually via Supabase Dashboard SQL Editor

---

### Task 1: Add `plumbing_tool_3d` to Backend SectionType

**Files:**
- Modify: `backend/app/models/section.py:6`

**Interfaces:**
- Consumes: None
- Produces: `SectionType` literal includes `"plumbing_tool_3d"` — consumed by all API endpoints

- [ ] **Add type to SectionType literal**

Edit `backend/app/models/section.py:6`. Change:
```
SectionType = Literal["hero_3d", "emergency_call", "services_grid", "reviews", "project_gallery", "site_footer"]
```
To:
```
SectionType = Literal["hero_3d", "emergency_call", "services_grid", "reviews", "project_gallery", "site_footer", "plumbing_tool_3d"]
```

- [ ] **Add typeDefaults entry for SectionSettingsDrawer** (will be done in Task 4, noted here for awareness)

- [ ] **Commit**

```
git add backend/app/models/section.py
git commit -m "feat: add plumbing_tool_3d section type to backend model"
```

---

### Task 2: Create 3D Tool Primitive Components

**Files:**
- Create: `frontend/src/components/3d/tools/Wrench3D.jsx`
- Create: `frontend/src/components/3d/tools/Plunger3D.jsx`
- Create: `frontend/src/components/3d/tools/PipeCutter3D.jsx`
- Create: `frontend/src/components/3d/tools/TapeMeasure3D.jsx`
- Create: `frontend/src/components/3d/tools/BeltArc.jsx`

**Interfaces:**
- All tool components accept: `{ color = "#C0C0C0", metalness = 0.85, roughness = 0.3 }`
- `BeltArc` accepts: `{ beltColor = "#8B4513", metalness = 0.2, roughness = 0.8 }`

- [ ] **Create `Wrench3D.jsx`**

```jsx
import { useMemo } from 'react'

export default function Wrench3D({ color = '#C0C0C0', metalness = 0.85, roughness = 0.3 }) {
  return (
    <group>
      {/* Handle */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      {/* Jaw — C-shape from box + small boxes */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.15, 0.05, 0.08]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      <mesh position={[-0.07, 0.33, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.08]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      <mesh position={[0.07, 0.33, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.08]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      {/* Grip ridges */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0, -0.1 - i * 0.09, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.06, 6]} />
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>
      ))}
    </group>
  )
}
```

- [ ] **Create `Plunger3D.jsx`**

```jsx
export default function Plunger3D({ color = '#C0C0C0', metalness = 0.3, roughness = 0.6 }) {
  return (
    <group>
      {/* Handle */}
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.5, 8]} />
        <meshStandardMaterial color="#4a3728" metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Rubber cup */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d32f2f" metalness={0} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.05, 12]} />
        <meshStandardMaterial color="#d32f2f" metalness={0} roughness={0.9} />
      </mesh>
    </group>
  )
}
```

- [ ] **Create `PipeCutter3D.jsx`**

```jsx
export default function PipeCutter3D({ color = '#C0C0C0', metalness = 0.85, roughness = 0.3 }) {
  return (
    <group>
      {/* C-shaped body — use torus segment */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.1, 0.025, 8, 12, Math.PI * 1.5]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      {/* Handle extending from C */}
      <mesh position={[0.06, -0.06, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.15, 0.025, 0.025]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      {/* Cutting wheel */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.01, 8]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}
```

- [ ] **Create `TapeMeasure3D.jsx`**

```jsx
export default function TapeMeasure3D({ color = '#C0C0C0', metalness = 0.3, roughness = 0.5 }) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.04]} />
        <meshStandardMaterial color="#f5c842" metalness={0.1} roughness={0.6} />
      </mesh>
      {/* Spool */}
      <mesh position={[0, 0, 0.025]}>
        <cylinderGeometry args={[0.04, 0.04, 0.025, 12]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Tape extending */}
      <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.06, 0.002, 0.025]} />
        <meshStandardMaterial color="#f5c842" metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  )
}
```

- [ ] **Create `BeltArc.jsx`**

```jsx
import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'

export default function BeltArc({ beltColor = '#8B4513', metalness = 0.2, roughness = 0.8 }) {
  const beltCurve = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const t = (i / 12) * Math.PI
      pts.push(new Vector3(Math.cos(t - Math.PI / 2) * 1.8, Math.sin(t - Math.PI / 2) * 1.5 + 1.5, 0))
    }
    return new CatmullRomCurve3(pts)
  }, [])

  return (
    <mesh>
      <tubeGeometry args={[beltCurve, 24, 0.04, 8, false]} />
      <meshStandardMaterial color={beltColor} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}
```

- [ ] **Commit**

```
git add frontend/src/components/3d/tools/
git commit -m "feat: add 3D tool primitive components (wrench, plunger, pipe cutter, tape measure, belt arc)"
```

---

### Task 3: Create ToolBelt3D Orchestrator

**Files:**
- Create: `frontend/src/components/3d/tools/ToolBelt3D.jsx`

**Interfaces:**
- Consumes: all tool components from Task 2, `BeltArc`
- Produces: `<ToolBelt3D>` component consumed by `PlumbingToolBlock3D` (Task 4)
- Props: `{ beltColor, toolColor, position, motionSpeed, animationStyle, tools }`

- [ ] **Create `ToolBelt3D.jsx`**

```jsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import BeltArc from './BeltArc'
import Wrench3D from './Wrench3D'
import Plunger3D from './Plunger3D'
import PipeCutter3D from './PipeCutter3D'
import TapeMeasure3D from './TapeMeasure3D'

const toolComponents = {
  wrench: Wrench3D,
  plunger: Plunger3D,
  pipe_cutter: PipeCutter3D,
  tape_measure: TapeMeasure3D,
}

const toolPositions = [
  { x: -0.9, y: 0.6, z: 0 },
  { x: -0.3, y: 1.2, z: 0 },
  { x: 0.3, y: 1.2, z: 0 },
  { x: 0.9, y: 0.6, z: 0 },
]

const toolNames = ['wrench', 'plunger', 'pipe_cutter', 'tape_measure']

function AnimatedTool({ name, color, motionSpeed, animationStyle, position, index }) {
  const groupRef = useRef(null)
  const phase = useMemo(() => index * Math.PI * 0.5, [index])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime() * motionSpeed
    const s = motionSpeed

    switch (animationStyle) {
      case 'float':
        groupRef.current.position.y = Math.sin(t * 0.8 + phase) * 0.08
        break
      case 'rotate':
        groupRef.current.rotation.z = Math.sin(t * 0.5 + phase) * 0.3
        break
      case 'bob':
        groupRef.current.position.y = Math.abs(Math.sin(t * 0.6 + phase)) * 0.1
        break
      case 'pulse':
        {
          const scale = 1 + Math.sin(t * 1.2 + phase) * 0.03
          groupRef.current.scale.setScalar(scale)
        }
        break
      default:
        break
    }
  })

  const Component = toolComponents[name]
  if (!Component) return null

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Component color={color} />
    </group>
  )
}

export default function ToolBelt3D({ beltColor, toolColor, position = [0, 0, 0], motionSpeed = 1, animationStyle = 'float', tools }) {
  const visibleTools = useMemo(() => {
    return toolNames.filter((name) => tools?.includes(name))
  }, [tools])

  const activePositions = useMemo(() => {
    return toolPositions.slice(0, visibleTools.length)
  }, [visibleTools])

  return (
    <group position={[position[0], position[1], position[2]]}>
      <BeltArc beltColor={beltColor} />
      {visibleTools.map((name, i) => (
        <AnimatedTool
          key={name}
          name={name}
          color={toolColor}
          motionSpeed={motionSpeed}
          animationStyle={animationStyle}
          position={activePositions[i] || { x: 0, y: 0.6, z: 0 }}
          index={i}
        />
      ))}
    </group>
  )
}
```

- [ ] **Commit**

```
git add frontend/src/components/3d/tools/ToolBelt3D.jsx
git commit -m "feat: add ToolBelt3D orchestrator with animation system"
```

---

### Task 4: Create PlumbingToolBlock3D Block Component

**Files:**
- Create: `frontend/src/components/blocks/PlumbingToolBlock3D.jsx`

**Interfaces:**
- Consumes: `ToolBelt3D` from Task 3
- Produces: Block component consumed by `PublicPage.jsx` blockMap and `AdminPanel.jsx` live preview
- Standard block pattern: default export, `{ content }` prop, empty-state return null

- [ ] **Create `PlumbingToolBlock3D.jsx`**

```jsx
import { Canvas } from '@react-three/fiber'
import ToolBelt3D from '../3d/tools/ToolBelt3D'

export default function PlumbingToolBlock3D({ content }) {
  const {
    enabled = true,
    title = 'Tools We Use',
    subtitle = 'Professional-grade equipment',
    beltColor = '#8B4513',
    toolColor = '#C0C0C0',
    positionX = 0,
    positionY = 0,
    positionZ = 0,
    motionSpeed = 1.0,
    animationStyle = 'float',
    tools = ['wrench', 'plunger', 'pipe_cutter', 'tape_measure'],
  } = content || {}

  if (!enabled) return null

  return (
    <section className="relative w-full py-20 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">{title}</h2>
        <p className="text-xl text-slate-300">{subtitle}</p>
      </div>
      <div className="h-[500px] w-full">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-3, 2, 3]} intensity={0.4} color="#fbbf24" />
          <ToolBelt3D
            beltColor={beltColor}
            toolColor={toolColor}
            position={[positionX, positionY, positionZ]}
            motionSpeed={motionSpeed}
            animationStyle={animationStyle}
            tools={tools}
          />
        </Canvas>
      </div>
    </section>
  )
}
```

- [ ] **Commit**

```
git add frontend/src/components/blocks/PlumbingToolBlock3D.jsx
git commit -m "feat: add PlumbingToolBlock3D block component with Canvas scene"
```

---

### Task 5: Wire Admin Panel (AdminPanel + SectionSettingsDrawer + SortableBlock)

**Files:**
- Modify: `frontend/src/components/admin/AdminPanel.jsx:14` — add to SECTION_TYPES
- Modify: `frontend/src/components/admin/AdminPanel.jsx:4` — add import
- Modify: `frontend/src/components/admin/AdminPanel.jsx:8` — add to SECTION_TYPES array
- Modify: `frontend/src/components/admin/AdminPanel.jsx` — add import + preview case + live preview
- Modify: `frontend/src/components/admin/SectionSettingsDrawer.jsx:55-61` — add typeDefaults entry
- Modify: `frontend/src/components/admin/SectionSettingsDrawer.jsx` — add editor UI section
- Modify: `frontend/src/components/admin/SectionSettingsDrawer.jsx:63-98` — update contentToForm/formToContent
- Modify: `frontend/src/components/admin/SortableBlock.jsx` — add typeColors + typeLabels entries

**Interfaces:**
- Consumes: PlumbingToolBlock3D from Task 4, form state from drawer
- Produces: Admin can create/edit/disable/preview plumbing_tool_3d sections

- [ ] **Add import and SECTION_TYPES entry in `AdminPanel.jsx`**

At line 4, add import:
```
import PlumbingToolBlock3D from '../blocks/PlumbingToolBlock3D'
```

At line 14, change:
```
const SECTION_TYPES = ['hero_3d', 'services_grid', 'reviews', 'project_gallery', 'site_footer']
```
To:
```
const SECTION_TYPES = ['hero_3d', 'services_grid', 'reviews', 'project_gallery', 'site_footer', 'plumbing_tool_3d']
```

Add live preview case after the `site_footer` preview (after line 166):
```
{settingsSection.type === 'plumbing_tool_3d' && (
  <PlumbingToolBlock3D content={{ ...settingsSection.content, ...previewOverrides[settingsSection.id]?.content }} />
)}
```

- [ ] **Add typeDefaults, contentToForm, formToContent updates in `SectionSettingsDrawer.jsx`**

In `typeDefaults` (line 55-61), add:
```
plumbing_tool_3d: { title: '', subtitle: '', enabled: true, beltColor: '#8B4513', toolColor: '#C0C0C0', positionX: 0, positionY: 0, positionZ: 0, motionSpeed: 1.0, animationStyle: 'float', tools: ['wrench', 'plunger', 'pipe_cutter', 'tape_measure'] },
```

In `contentToForm` (line 63-77), add cases for plumbing_tool_3d fields after the existing mappings:
```
    enabled: content.enabled !== undefined ? content.enabled : true,
    beltColor: content.beltColor || '#8B4513',
    toolColor: content.toolColor || '#C0C0C0',
    positionX: content.positionX ?? 0,
    positionY: content.positionY ?? 0,
    positionZ: content.positionZ ?? 0,
    motionSpeed: content.motionSpeed ?? 1.0,
    animationStyle: content.animationStyle || 'float',
    tools: content.tools || ['wrench', 'plunger', 'pipe_cutter', 'tape_measure'],
```

In `formToContent` (line 79-98), add case for plumbing_tool_3d after the site_footer block:
```
  if (sectionType === 'plumbing_tool_3d') {
    base.enabled = form.enabled
    base.beltColor = form.beltColor
    base.toolColor = form.toolColor
    base.positionX = form.positionX
    base.positionY = form.positionY
    base.positionZ = form.positionZ
    base.motionSpeed = form.motionSpeed
    base.animationStyle = form.animationStyle
    base.tools = form.tools
  }
```

- [ ] **Add editor UI in `SectionSettingsDrawer.jsx`**

Add after the existing type-specific editor blocks (before the AI Generate section, around line 347):

```jsx
{section?.type === 'plumbing_tool_3d' && (
  <div className="border-t border-slate-700 pt-4 mt-4 space-y-3">
    <label className="block text-xs text-slate-400 mb-2 font-semibold">Tool Belt 3D Settings</label>
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-400">Enabled</label>
      <input type="checkbox" checked={form.enabled !== false}
        onChange={(e) => handleChange('enabled', e.target.checked)}
        className="w-4 h-4 accent-brand-accent" />
    </div>
    <div>
      <label className="block text-xs text-slate-500 mb-1">Belt Color</label>
      <input type="color" value={form.beltColor || '#8B4513'}
        onChange={(e) => handleChange('beltColor', e.target.value)}
        className="w-full h-8 rounded cursor-pointer bg-transparent" />
    </div>
    <div>
      <label className="block text-xs text-slate-500 mb-1">Tool Color</label>
      <input type="color" value={form.toolColor || '#C0C0C0'}
        onChange={(e) => handleChange('toolColor', e.target.value)}
        className="w-full h-8 rounded cursor-pointer bg-transparent" />
    </div>
    <div>
      <label className="block text-xs text-slate-500 mb-1">Position X ({form.positionX ?? 0})</label>
      <input type="range" min="-5" max="5" step="0.1" value={form.positionX ?? 0}
        onChange={(e) => handleChange('positionX', parseFloat(e.target.value))}
        className="w-full accent-brand-accent" />
    </div>
    <div>
      <label className="block text-xs text-slate-500 mb-1">Position Y ({form.positionY ?? 0})</label>
      <input type="range" min="-5" max="5" step="0.1" value={form.positionY ?? 0}
        onChange={(e) => handleChange('positionY', parseFloat(e.target.value))}
        className="w-full accent-brand-accent" />
    </div>
    <div>
      <label className="block text-xs text-slate-500 mb-1">Position Z ({form.positionZ ?? 0})</label>
      <input type="range" min="-5" max="5" step="0.1" value={form.positionZ ?? 0}
        onChange={(e) => handleChange('positionZ', parseFloat(e.target.value))}
        className="w-full accent-brand-accent" />
    </div>
    <div>
      <label className="block text-xs text-slate-500 mb-1">Motion Speed ({form.motionSpeed ?? 1.0}x)</label>
      <input type="range" min="0" max="3" step="0.1" value={form.motionSpeed ?? 1.0}
        onChange={(e) => handleChange('motionSpeed', parseFloat(e.target.value))}
        className="w-full accent-brand-accent" />
    </div>
    <div>
      <label className="block text-xs text-slate-500 mb-1">Animation Style</label>
      <select value={form.animationStyle || 'float'}
        onChange={(e) => handleChange('animationStyle', e.target.value)}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
        <option value="float">Float</option>
        <option value="rotate">Rotate</option>
        <option value="bob">Bob</option>
        <option value="pulse">Pulse</option>
        <option value="none">None</option>
      </select>
    </div>
    <div>
      <label className="block text-xs text-slate-500 mb-1">Tools</label>
      <div className="space-y-1">
        {[
          { value: 'wrench', label: 'Wrench' },
          { value: 'plunger', label: 'Plunger' },
          { value: 'pipe_cutter', label: 'Pipe Cutter' },
          { value: 'tape_measure', label: 'Tape Measure' },
        ].map((t) => (
          <label key={t.value} className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={(form.tools || []).includes(t.value)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...(form.tools || []), t.value]
                  : (form.tools || []).filter((x) => x !== t.value)
                handleChange('tools', next)
              }}
              className="w-4 h-4 accent-brand-accent" />
            {t.label}
          </label>
        ))}
      </div>
    </div>
  </div>
)}
```

- [ ] **Add typeColors and typeLabels in `SortableBlock.jsx`**

In `typeColors` (line 5-10), add:
```
plumbing_tool_3d: 'border-amber-700 bg-amber-700/10',
```

In `typeLabels` (line 12-17), add:
```
plumbing_tool_3d: 'Tool Belt 3D',
```

- [ ] **Commit**

```
git add frontend/src/components/admin/
git commit -m "feat: wire plumbing_tool_3d into admin panel (editor, sortable, preview)"
```

---

### Task 6: Wire PublicPage Block Map

**Files:**
- Modify: `frontend/src/pages/PublicPage.jsx:7` — add import
- Modify: `frontend/src/pages/PublicPage.jsx:9-14` — add blockMap entry

- [ ] **Add import and blockMap entry**

At line 7, add:
```
import PlumbingToolBlock3D from '../components/blocks/PlumbingToolBlock3D'
```

In `blockMap` (line 9-14), add:
```
plumbing_tool_3d: PlumbingToolBlock3D,
```

- [ ] **Commit**

```
git add frontend/src/pages/PublicPage.jsx
git commit -m "feat: wire plumbing_tool_3d into PublicPage block map"
```

---

### Task 7: Database CHECK Constraint

**Instructions (manual — Supabase Dashboard):**

Run this SQL in Supabase Dashboard SQL Editor:

```sql
ALTER TABLE public.landing_sections
DROP CONSTRAINT IF EXISTS landing_sections_type_check,
ADD CONSTRAINT landing_sections_type_check
  CHECK (type IN ('hero_3d','emergency_call','services_grid','reviews','project_gallery','site_footer','plumbing_tool_3d'));
```

- [ ] **Execute ALTER TABLE in Supabase Dashboard SQL Editor**

---

### Task 8: Verify Build

- [ ] **Run frontend build**

```
cd frontend && npm run build
```

Expected: clean build with no errors.

- [ ] **Fix any issues found during build**

- [ ] **Final commit**

```
git add -A
git commit -m "chore: finalize plumbing_tool_3d section implementation"
```
