# MPTech Plumbing Solutions — AGENTS.md

## Stack

- **Frontend:** React 19 + Vite 8 + TailwindCSS v4 + React Router v7
- **Backend:** FastAPI + Supabase (auth, DB, storage)
- **3D:** Three.js + @react-three/fiber + @react-three/drei
- **Animation:** GSAP + @gsap/react + ScrollTrigger
- **Drag:** @dnd-kit/core + sortable
- **AI:** LangGraph + Gemini (via langchain-google-genai) + NVIDIA Llama

## Dev servers

```sh
# Frontend (port 5173, proxies /api → localhost:8000)
cd frontend && npm run dev

# Backend (port 8000)
cd backend && uvicorn app.main:app --reload
```

Frontend Vite config proxies `/api/*` to `http://localhost:8000`. No CORS issues in dev.

## Build

```sh
cd frontend && npm run build
```

No lint, typecheck, or test runner configured in package.json. Only build step exists.

## Tests

```sh
cd backend && pytest
```

A single test file (`backend/tests/test_api.py`): health check, public sections, auth-required endpoints. Tests requiring Supabase skip if `SUPABASE_URL` is not set.

## Architecture

### Data flow
```
Supabase DB → FastAPI `/api/sections/public` → React PublicPage
                → blockMap[section.type] → Block component
```
Sections are stored in `landing_sections` table with `type`, `order_index`, `is_published`, `content` (JSONB). Public endpoint filters `is_published = true`.

### Section types and block components
| DB type | Component | Content shape |
|---------|-----------|---------------|
| `hero_3d` | `HeroBlock3D` | `headline, subheadline, cta_text, cta_link, value_props` |
| `services_grid` | `ServicesBlock` | `title, subtitle, services[{icon, title, description}]` |
| `reviews` | `ReviewsBlock` | `title, subtitle, reviews[{rating, text, author}]` |
| `project_gallery` | `ProjectGallery` | `title, subtitle, images[{url, caption}]` |
| `site_footer` | `FooterBlock` | `copyright, tagline, socials[{platform, url}]` |

### Block component pattern
All blocks live in `frontend/src/components/blocks/`. Each receives `{ content }` prop (the section's JSONB content). Empty-state check required.

### Admin panel
`AdminPanel.jsx` orchestrates: `LandingEditor` (sortable list) → `SectionSettingsDrawer` (edit form per section type). AI generation is embedded in the drawer via `generateContent()`.

## Database constraints

The `landing_sections.type` column has a PostgreSQL CHECK constraint. **Adding a new section type requires:**

1. Add to `backend/app/models/section.py` `SectionType` Literal
2. Run ALTER TABLE in Supabase Dashboard SQL Editor:
   ```sql
   ALTER TABLE public.landing_sections
   DROP CONSTRAINT IF EXISTS landing_sections_type_check,
   ADD CONSTRAINT landing_sections_type_check
      CHECK (type IN ('hero_3d','emergency_call','services_grid','reviews','project_gallery','site_footer'));
   ```
3. Add to `frontend/src/components/admin/AdminPanel.jsx` `SECTION_TYPES`
4. Add block component to `PublicPage.jsx` blockMap
5. Add editor UI in `SectionSettingsDrawer.jsx` + update `contentToForm`/`formToContent`
6. Add preview case in `AdminPanel.jsx` live preview

The Supabase Python client cannot execute DDL via REST API. All CHECK constraint changes must be done manually in the Supabase Dashboard SQL Editor.

## Storage

Project gallery images are stored in Supabase `project-gallery` bucket (public). Upload requires storage RLS policies:
```sql
CREATE POLICY "editors_upload_gallery" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-gallery');
CREATE POLICY "admins_delete_gallery" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'project-gallery');
```

Frontend uploads via `supabase.storage.from('project-gallery').upload(path, file)` in `SectionSettingsDrawer.jsx`.

## Environment

| File | Variables |
|------|-----------|
| `frontend/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `backend/.env` | `SUPABASE_URL`, `SUPABASE_KEY` (service_role), `JWT_SECRET`, `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `SITE_URL` |

Frontend uses VITE_ prefix (Vite convention). Backend uses plain names from pydantic-settings.

## Key dependencies

- **@dnd-kit** — Drag-and-drop for services list in admin drawer and section reordering
- **@tailwindcss/vite** — TailwindCSS v4 Vite plugin (no PostCSS config needed)
- **@react-three/fiber + drei** — 3D canvas scenes (used in original HeroBlock3D, since replaced with parallax)
- **GSAP + ScrollTrigger** — Scroll-based parallax on hero, entrance animations on scene fixtures
- **supabase-py** — Backend CRUD via `db.table().select/insert/update/delete().execute()`

## Admin drawer patterns

Editor UI is conditional on `section.type`. Each type gets its own section in the drawer with specific fields:
- `services_grid` — SortableServiceItem (drag-reorderable) + IconPicker
- `reviews` — Star rating selector + author/text fields
- `project_gallery` — Image upload to Supabase + caption field
- `site_footer` — Copyright, tagline, social link list (platform select + URL)

All editors use `handleChange(key, value)` which updates form state and fires preview.

## Gotchas

- DB CHECK constraint blocks new section types until manually updated via Supabase Dashboard
- Supabase storage bucket must be created via `supabase-py` (`create_bucket` then `update_bucket` to set public), but RLS policies require Dashboard SQL
- The `api()` helper in `frontend/src/lib/api.js` handles 204 No Content for delete (returns null, avoids JSON parse error)
- `generateContent()` in backend calls LangGraph agent; requires either GEMINI_API_KEY or NVIDIA_API_KEY
- `SortableBlock.jsx` uses `useSortable` from @dnd-kit/sortable, must wrap in `DndContext` + `SortableContext`
- TailwindCSS v4 uses `@theme` in CSS, not `tailwind.config.js`
