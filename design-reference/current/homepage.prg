# Homepage — Current Design Reference

> **Project:** MPTech Plumbing Solutions
> **Stack:** React 19 + Vite + TailwindCSS v4 + Three.js + GSAP
> **Status:** Live at `/`

---

## Page Structure

```
PublicPage                    (src/pages/PublicPage.jsx)
├── HeroBlock3D               (full-screen, z-index layers)
│   ├── PipeHeroScene         (Three.js 3D canvas — background)
│   ├── Gradient overlay      (CSS gradient: slate-900/80 → transparent)
│   ├── Headline              (h1, text-5xl→7xl, white)
│   ├── Subheadline           (p, text-xl→2xl, blue-200)
│   ├── CTA Button            (brand-copper, rounded-full, hover:scale-105)
│   └── Value Props           (chips: slate-800/70, rounded-full, backdrop-blur)
├── EmergencyBlock            (interactive, GSAP-triggered banner)
│   ├── Fixed banner          (brand-emergency bg, slides in/out)
│   ├── Valve3D               (3D interactive valve to activate)
│   ├── Gauge3D               (3D pressure gauge responding to valve)
│   └── Status indicators     (CRITICAL / NORMAL text)
├── ServicesBlock             (responsive grid)
│   └── Service cards         (rounded-xl, hover lift + accent border)
└── ReviewsBlock              (carousel with auto-rotate)
    ├── Quote card            (rounded-2xl, italic text, star rating)
    └── Dot navigation        (copper active, slate-600 inactive)
```

---

## Section Details

### 1. HeroBlock3D

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `headline` | string | "Premium Plumbing Services" | h1, responsive size |
| `subheadline` | string | "24/7 Emergency Service With 30-Minute Response" | p tag |
| `cta_text` | string | "Call Now" | Button label |
| `cta_link` | string | "tel:+15551234567" | href target |
| `value_props` | string[] | — | Rendered as chips |
| `scene3d` | object | — | Passed to PipeHeroScene |

**Key styling:**
- Full viewport height (`h-screen`)
- 3D canvas fills absolute inset-0
- Text overlay with `bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40`
- CTA: `bg-brand-copper` rounded-full, shadow-xl, scale-105 on hover
- Value prop chips: `bg-slate-800/70 backdrop-blur-sm border-slate-700 rounded-full`

### 2. EmergencyBlock

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `phone` | string | "+15551234567" | tel: link |
| `emergency_header` | string | "🚨 Emergency Service Available 24/7" | Banner text |
| `response_time` | string | — | Small text below phone |

**Interaction:**
- Valve3D: toggleable 3D valve; on open → GSAP slides down a fixed top banner
- Gauge3D: responds to valve state (pressure 0 or 1)
- Banner: `fixed top-0 z-50 bg-brand-emergency`, slides with `y` transform

### 3. ServicesBlock

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `services` | array | — | Array of service objects |
| `services[].icon` | string | 🔧 | Emoji or icon string |
| `services[].title` | string | — | Card heading |
| `services[].description` | string | — | Card body |

**Key styling:**
- Grid: `grid sm:grid-cols-2 lg:grid-cols-3 gap-6`
- Card: `bg-slate-800 border-slate-700 rounded-xl p-6`
- Hover: `hover:border-brand-accent hover:-translate-y-1 hover:shadow-xl`
- Icon: `text-4xl mb-4`

### 4. ReviewsBlock

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `reviews` | array | — | Array of review objects |
| `reviews[].rating` | number | — | 1-5, renders ★ stars |
| `reviews[].text` | string | — | Quoted in italic |
| `reviews[].author` | string | — | Displayed in brand-copper |

**Behavior:**
- Auto-rotates every 5s via `setInterval`
- Clickable dot navigation
- Empty state: "No reviews yet"

**Key styling:**
- Card: `bg-slate-900 border-slate-700 rounded-2xl p-8 md:p-12`
- Stars: `text-amber-400` (filled), `text-slate-600` (empty)
- Dots: `w-3 h-3 rounded-full`, active = `bg-brand-copper w-6`

---

## Empty / Loading States

| State | What renders | Notes |
|-------|-------------|-------|
| Loading | Spinner with "Loading..." | White text on slate-900 |
| No sections | "No content yet" message | Centered, 2-line |
| No services | "No services configured" | In ServicesBlock area |
| No reviews | "No reviews yet" | In ReviewsBlock area |

---

## Data Flow

```
Supabase DB → Backend API (/api/sections/public)
              → getPublicSections()
                → PublicPage renders blocks by section.type
                  → blockMap maps type to component
```

**Block type → Component mapping:**
- `hero_3d` → `HeroBlock3D`
- `emergency_call` → `EmergencyBlock`
- `services_grid` → `ServicesBlock`
- `reviews` → `ReviewsBlock`

---

## Footer

```html
<footer class="bg-slate-900 border-t border-slate-800 py-8
             text-center text-slate-500 text-sm">
  <p>© {year} MPTech Plumbing Solutions. All rights reserved.</p>
  <p>Licensed • Insured • Bonded</p>
</footer>
```

---

## Dependencies

| Package | Version | Used in |
|---------|---------|---------|
| react-router-dom | ^7.18.1 | Routing |
| @supabase/supabase-js | ^2.110.9 | Auth + data |
| @react-three/fiber | ^9.6.1 | 3D canvas |
| @react-three/drei | ^10.7.7 | 3D helpers |
| three | ^0.185.1 | 3D engine |
| gsap | ^3.15.0 | Animations |
| @gsap/react | ^2.1.2 | GSAP React integration |
| tailwindcss | ^4.3.3 | Styling |
| @dnd-kit/* | ^6.3.1+ | Admin drag-and-drop |
