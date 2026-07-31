# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
# Frontend dev (port 5173, proxies /api → localhost:8000)
cd frontend && npm run dev

# Backend dev (port 8000)
cd backend && uvicorn app.main:app --reload

# Build frontend
cd frontend && npm run build

# Run backend tests
cd backend && pytest

# Create admin user
cd backend && python create_admin.py <email>
```

## Tech Stack

- **Frontend:** React 19 + Vite 8 + TailwindCSS v4 + React Router v7
- **Backend:** FastAPI + Supabase (auth, DB, storage)
- **3D:** Three.js + @react-three/fiber + @react-three/drei
- **Animation:** GSAP + ScrollTrigger
- **Drag:** @dnd-kit/core + @dnd-kit/sortable
- **AI:** LangGraph agent + Gemini (primary) / NVIDIA Llama (fallback)
- **No linter, typechecker, or test framework on the frontend.**

## Architecture

### Data flow

```
Supabase DB → FastAPI /api/sections/public → React PublicPage
                → blockMap[section.type] → Block component
```

Sections live in `landing_sections` table: `type`, `order_index`, `is_published`, `content` (JSONB). Public endpoint returns only `is_published = true` sorted by `order_index`.

### Section types → Block components

| DB type | Component | Content keys |
|---------|-----------|--------------|
| `hero_3d` | `HeroBlock3D` | headline, subheadline, cta_text, cta_link, value_props |
| `services_grid` | `ServicesBlock` | title, subtitle, services[{icon, title, description}] |
| `reviews` | `ReviewsBlock` | title, subtitle, reviews[{rating, text, author}] |
| `project_gallery` | `ProjectGallery` | title, subtitle, images[{url, caption}] |
| `plumbing_tool_3d` | `PlumbingToolBlock3D` | scene3d[{sceneType, pipeColor, ...}] |
| `site_footer` | `FooterBlock` | copyright, tagline, socials[{platform, url}] |
| `emergency_call` | `EmergencyBlock` | emergency_header, phone, response_time, service_hours |

Block components live in `frontend/src/components/blocks/`, receive `{ content }` prop, and must handle empty content state.

### Block component pattern

Every block renders nothing / a placeholder when content is empty or missing keys. Blocks use TailwindCSS v4 `@theme` tokens (brand-bg, brand-surface, brand-accent, brand-copper, brand-emergency, brand-text) defined in `src/index.css`.

### Admin panel

`AdminPanel.jsx` orchestrates:
1. `LandingEditor` — sortable list of sections (wraps `DndContext` + `SortableContext`)
2. `SectionSettingsDrawer` — editor form per section type + AI generation via `generateContent()`
3. Live preview in the admin panel (separate from the drawer)

Auth is Supabase-based. `AuthContext.jsx` provides user, role, loading, login, logout. Admin page renders `LoginForm` when unauthenticated.

### AI agent pipeline

The `POST /api/agent/generate` endpoint runs a LangGraph state machine with 4 nodes:
1. **copywriter** — calls Gemini (or falls back to NVIDIA Llama) to generate JSON content for the section type
2. **seo_audit** — scores content (0-100), keyword density, readability, suggestions
3. **human_review** — interrupts with LangGraph `interrupt()`, returns content + SEO report for admin review
4. **write_db** — inserts into `landing_sections` if approved

The frontend `AICopilotDrawer.jsx` and `HumanReviewModal.jsx` handle the review workflow.

### LLM routing

`llm_router.py` attempts Gemini first (fast, 10s timeout). On any failure (rate limit, timeout, exception), falls back to NVIDIA-hosted Llama (120s timeout). Total timeout: 180s.

## Database constraints

`landing_sections.type` has a PostgreSQL CHECK constraint. **Adding a new section type requires:**
1. Add to `backend/app/models/section.py` `SectionType` Literal
2. Run ALTER TABLE in Supabase Dashboard SQL Editor (Python client can't execute DDL)
3. Add to `frontend/src/components/admin/AdminPanel.jsx` `SECTION_TYPES`
4. Add block component to `PublicPage.jsx` blockMap
5. Add editor UI in `SectionSettingsDrawer.jsx` + `contentToForm`/`formToContent`
6. Add preview case in `AdminPanel.jsx` live preview

## Environment

| File | Variables |
|------|-----------|
| `frontend/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `backend/.env` | `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `SITE_URL` |

Frontend uses `VITE_` prefix (Vite convention). Backend uses pydantic-settings from `.env`.

## Key dependencies

- **@dnd-kit** — drag-and-drop for services list and section reordering
- **@tailwindcss/vite** — TailwindCSS v4 Vite plugin (no PostCSS config)
- **@react-three/fiber + drei** — 3D canvas scenes
- **GSAP + ScrollTrigger** — scroll-based hero parallax, entrance animations
- **supabase-py** — backend CRUD via `db.table().select/insert/update/delete().execute()`

## Gotchas

- DB CHECK constraint blocks new section types until manually updated via Supabase Dashboard
- `api()` helper handles 204 No Content for DELETE (returns null, avoids JSON parse error)
- `generateContent()` requires either `GEMINI_API_KEY` or `NVIDIA_API_KEY`
- TailwindCSS v4 uses `@theme` in CSS, not `tailwind.config.js`
- Admin dynamic import for `HumanReviewModal` and `AICopilotDrawer` — ensure they're lazy-loaded correctly
