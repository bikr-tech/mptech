# Design System — MPTech Plumbing Solutions

**Stack:** TailwindCSS v4 (with `@theme` custom tokens) + React 19  
**File:** `src/index.css` defines all brand tokens

---

## Brand Colors

Defined in `src/index.css` `@theme` block:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand-bg` | `#0f172a` (slate-900) | Page backgrounds |
| `--color-brand-surface` | `#1e293b` (slate-800) | Cards, panels, form backgrounds |
| `--color-brand-accent` | `#2563eb` (blue-600) | Primary buttons, links, focus rings, active states |
| `--color-brand-copper` | `#d97706` (amber-600) | CTA buttons, highlights, review author names |
| `--color-brand-emergency` | `#dc2626` (red-600) | Emergency banner, destructive actions |
| `--color-brand-text` | `#f8fafc` (slate-50) | Primary text on dark backgrounds |

**CSS variable usage:** `bg-brand-accent`, `text-brand-copper`, `border-brand-emergency`, etc.

---

## Neutral Palette (Tailwind slate)

| Token | Value | Usage |
|-------|-------|-------|
| slate-50 | `#f8fafc` | White text on dark |
| slate-300 | `#cbd5e1` | Body text, label text |
| slate-400 | `#94a3b8` | Secondary text, muted labels |
| slate-500 | `#64748b` | Captions, placeholders, footer text |
| slate-600 | `#475569` | Subtle borders, inactive dots |
| slate-700 | `#334155` | Input backgrounds, secondary borders |
| slate-800 | `#1e293b` | Card/surface backgrounds (brand-surface) |
| slate-900 | `#0f172a` | Page background (brand-bg) |
| slate-950 | `#020617` | Darkest possible bg |

---

## Typography

Font stack: System UI (`tailwindcss` default sans-serif)

| Level | Class | Size | Weight | Color |
|-------|-------|------|--------|-------|
| Display | `text-5xl md:text-7xl` | 3rem→4.5rem | Bold | `text-white` |
| Heading 1 | `text-3xl md:text-5xl` | 1.875rem→3rem | Bold | `text-white` |
| Heading 2 | `text-3xl` | 1.875rem | Bold | `text-white` |
| Heading 3 | `text-xl` | 1.25rem | Semibold | `text-white` |
| Body large | `text-xl md:text-2xl` | 1.25rem→1.5rem | Normal | `text-blue-200` |
| Body | `text-base` | 1rem | Normal | `text-slate-400` |
| Small | `text-sm` | 0.875rem | Normal | `text-slate-500` |

---

## Spacing

Tailwind spacing scale: `{0,1,2,3,4,5,6,8,10,12,16,20,24,32,40,48,56,64}`  
1 unit = 0.25rem (4px)

Common patterns:
- Section padding: `py-16` to `py-20`
- Card padding: `p-6` or `p-8 md:p-12`
- Page horizontal: `px-4` or `px-6`
- Grid gap: `gap-6`

---

## Component Library

### Buttons

| Variant | Classes | When to use |
|---------|---------|-------------|
| Primary | `bg-brand-accent hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg` | Main actions |
| Copper | `bg-brand-copper hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg` | CTAs, calls to action |
| Emergency | `bg-brand-emergency hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg` | Destructive/urgent |
| Secondary | `bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-5 py-2.5 rounded-lg` | Alternative actions |
| Outline | `border border-slate-600 hover:border-slate-500 text-slate-300 font-semibold px-5 py-2.5 rounded-lg` | Ghost buttons with border |
| Ghost | `text-slate-400 hover:text-white font-semibold px-5 py-2.5 rounded-lg` | Minimal actions |
| CTA hero | `bg-brand-copper hover:bg-amber-600 text-white text-lg px-8 py-4 rounded-full font-bold hover:scale-105 shadow-xl` | Hero section |

**Sizes:** `text-xs px-3 py-1.5` (small), default, `px-6 py-3` (large)  
**States:** `disabled:opacity-50 cursor-not-allowed`, loading spinner variant

---

### Form Elements

| Element | Classes | Notes |
|---------|---------|-------|
| Input | `w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent` | Dark theme input |
| Textarea | Same as input + `rows={3}` | Multi-line |
| Select | Same as input | Dropdown |
| Label | `block text-slate-300 text-sm mb-1` | Above field |
| Error input | `border-red-500 focus:border-red-400` | + red error text below |
| Form card | `bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md` | Card wrapping form |

---

### Cards

| Variant | Classes | Use case |
|---------|---------|----------|
| Standard | `bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-brand-accent` | Services, features |
| Dashed | `bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 border-dashed` | Drop zones, empty states |
| Accent | `bg-gradient-to-br from-brand-accent/10 to-transparent rounded-xl p-6 border border-brand-accent/30` | Highlighted content |
| Emergency | `bg-gradient-to-br from-brand-emergency/10 to-transparent rounded-xl p-6 border border-brand-emergency/30` | Urgent/alert content |
| Quote | `bg-slate-900 border-slate-700 rounded-2xl p-8 md:p-12` | Testimonials |

---

### Interactive Patterns

- **Hover lift:** `hover:-translate-y-1 hover:shadow-xl` (services cards)
- **Button scale:** `hover:scale-105` (hero CTA)
- **Transition standard:** `transition-all` or `transition`
- **GSAP animations:** Used in EmergencyBlock (banner slide), ReviewsBlock (not yet)
- **3D canvas:** `@react-three/fiber` + `@react-three/drei` for PipeHeroScene, Valve3D, Gauge3D
- **Drag and drop:** `@dnd-kit` in admin panel for section reordering

---

## Layout Patterns

| Pattern | Implementation |
|---------|---------------|
| Full-screen hero | `h-screen relative overflow-hidden` with absolute canvas + gradient overlay |
| Section | `min-h-screen bg-slate-900 py-20 px-4` |
| Content container | `max-w-6xl mx-auto` |
| Responsive grid | `grid sm:grid-cols-2 lg:grid-cols-3 gap-6` |
| Centered content | `flex items-center justify-center` + `text-center` |
| Sticky header | `sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b` |

---

## Gradients

| Gradient | Used on |
|----------|---------|
| `bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40` | Hero text overlay |
| `bg-gradient-to-br from-slate-900 to-blue-900` | Canvas fallback |
| `bg-gradient-to-br from-brand-accent/10 to-transparent` | Accent cards |
| `bg-gradient-to-br from-brand-emergency/10 to-transparent` | Emergency cards |

---

## Admin-Only Styling

When a section is being edited in the admin panel, it receives `ring-2 ring-brand-accent` via `settingsOverrides` prop.

---

## Future Considerations

- Font customization (add Google Fonts via `@import` in index.css)
- Animation system standardization (GSAP timeline presets vs CSS transitions)
- Dark/light mode via Tailwind `dark:` variant
- Component-specific design tokens for each block type
