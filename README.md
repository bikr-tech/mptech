# Plumbing Tech Solution — Landing Page CMS

Full-stack marketing site with an AI-powered content copilot. React frontend, FastAPI backend, Supabase (auth, DB, storage), and a LangGraph agent that generates + SEO-audits section content.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, TailwindCSS v4, React Router v7 |
| **3D** | Three.js, @react-three/fiber, @react-three/drei |
| **Animation** | GSAP + ScrollTrigger |
| **Drag & drop** | @dnd-kit/core, @dnd-kit/sortable |
| **Backend** | FastAPI, Python 3.12 |
| **Data** | Supabase (Postgres, auth, storage) |
| **AI** | LangGraph agent + Gemini (primary) / NVIDIA Llama (fallback) |
| **CI/CD** | GitHub Actions → Render deploy |

## Project Structure

```
.
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── blocks/    # Section block components (hero, services, reviews, …)
│       │   └── admin/     # Admin panel, section editor, AI copilot drawer
│       └── ...
├── backend/           # FastAPI app
│   └── app/
│       ├── routers/   # /api/sections, /api/agent
│       ├── models/    # Pydantic + SectionType Literal
│       ├── llm_router.py
│       ├── agent_graph.py   # LangGraph state machine
│       └── ...
└── .github/workflows/ # CI/CD
```

## Prerequisites

- Node.js 20+
- Python 3.12+
- Supabase project (URL + anon/service keys)
- Gemini API key and/or NVIDIA API key

## Setup

### 1. Clone & install

```sh
git clone <repo-url>
cd mptechsolution
```

### 2. Backend

```sh
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt

# Copy env template and fill in values
cp .env.example .env
```

`.env` needs: `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `SITE_URL`.

### 3. Frontend

```sh
cd frontend
npm install

# Copy env template and fill in values
cp .env.example .env
```

`.env` needs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

### 4. Create an admin user

```sh
cd backend
python create_admin.py your@email.com
```

## Run locally

```sh
# Backend — http://localhost:8000
cd backend && uvicorn app.main:app --reload

# Frontend — http://localhost:5173 (proxies /api → localhost:8000)
cd frontend && npm run dev
```

- Health check: `GET /api/health`
- OpenAPI docs: `http://localhost:8000/docs`
- Admin panel: `http://localhost:5173/admin`

## Tests

```sh
cd backend && pytest
```

## CI/CD

`.github/workflows/ci-cd.yml` runs on push/PR to `main`:

1. **backend-test** — pip install + pytest
2. **frontend-build** — npm ci + `vite build`
3. **deploy** — on `main` push, curls the Render deploy hook

**To enable deploy:** Render dashboard → service → Deploy → create a **Deploy Hook**, copy the URL, add it as a GitHub Actions secret named `RENDER_DEPLOY_HOOK_URL`.

## AI content copilot

`POST /api/agent/generate` runs a LangGraph pipeline:

1. **copywriter** — Gemini generates JSON content for a section type (falls back to NVIDIA Llama)
2. **seo_audit** — scores content 0–100, keyword density, readability, suggestions
3. **human_review** — interrupts for admin approval (content + SEO report)
4. **write_db** — inserts into `landing_sections` when approved

The admin UI drives this from `AICopilotDrawer.jsx` + `HumanReviewModal.jsx`.

## Adding a new section type

`landing_sections.type` has a Postgres CHECK constraint. Adding a type requires all of:

1. Add to `backend/app/models/section.py` — `SectionType` Literal
2. Run `ALTER TABLE` in Supabase Dashboard SQL Editor (Python client can't run DDL)
3. Add to `frontend/src/components/admin/AdminPanel.jsx` — `SECTION_TYPES`
4. Add a block component in `frontend/src/components/blocks/` and register it in `PublicPage.jsx` `blockMap`
5. Add editor UI in `SectionSettingsDrawer.jsx` + `contentToForm` / `formToContent`
6. Add a preview case in `AdminPanel.jsx`

## Environment variables

| File | Variables |
|------|-----------|
| `frontend/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `backend/.env` | `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `SITE_URL` |

## License

Proprietary — internal project.
