# PlumbNepal Landing Page — Complete Design Audit

**Date:** 2026-07-30
**Team:** UX Researcher, UX Architect, UI Designer, Visual Storyteller
**Status:** Audit complete — pending approval for implementation

---

## EXECUTIVE SUMMARY

### Current State
PlumbNepal's existing landing page uses a dark SaaS theme with 3D Three.js hero, GSAP animations, and a CMS-driven block system. It has 4 sections (hero, services, reviews, emergency) that communicate a traditional plumbing service.

### Key Problems Identified
1. **No AI differentiation** — The AI diagnosis engine is invisible. Users see "Premium Plumbing Services" not "AI-Powered Diagnosis"
2. **Low trust density** — No plumber verification, no live stats, no price transparency
3. **No conversion mechanism** — Just "Call Now" CTA, no AI diagnosis entry point, no booking flow
4. **Generic brand** — "MPTech Plumbing" feels like a local contractor, not a tech marketplace
5. **Missing sections** — No trust section, map, app promotion, FAQ, or final CTA
6. **No local context** — English-only, no Nepal payment badges, no emergency phone prominence

### Opportunity
Transform from "local plumbing company" → "AI-powered plumbing marketplace for Nepal" with:
- AI diagnosis as hero hook (price certainty = conversion)
- Trust architecture (verified plumbers, police background checks)
- Marketplace UX (plumber profiles, real-time tracking, reviews with price context)
- Nepal-specific design (Nepali language, eSewa/Khalti, local trust signals)

---

## 1. USER RESEARCH FINDINGS

### 1.1 Three Core Personas

| | Anish (Primary) | Ratna | Sagar |
|---|---|---|---|
| **Age** | 34, IT Manager | 62, Retired | 33, Property Manager |
| **Problem** | Burst pipe at 10PM, needs fix NOW | Leaking pipe, son abroad, trust issues | 12 units, constant maintenance |
| **Anxiety** | Price gouging, no-shows | Being cheated, complex apps | Tenant complaints, tracking |
| **Trust Trigger** | AI price estimate BEFORE booking | Nepali voice, police verification | Same plumber for repeat visits |
| **UX Need** | Camera → Diagnosis → Book in 3 taps | "Send to family" + cash payment | Dashboard + billing history |
| **Conversion** | "Show price, I'll book" | "Call me, I'll confirm" | "Show me one screen" |

### 1.2 Critical Insight: The "Send to Family" Pattern

Diaspora children booking plumbing service for aging parents in Nepal is a **high-leverage, zero-competition feature**. Son in Australia books → PlumbNepal calls senior in Nepal → service happens → son pays digitally.

### 1.3 Conversion Funnel (per 1000 visitors)

```
Awareness: 1000 visits → 550 bounce
Interest: 450 engage → 135 drop off
AI Diagnosis: 315 start → 63 abandon
Match: 252 view → 38 don't book
Book: 214 book → 21 cancel
Service: 193 served → 39 don't review
Review: 154 review → 108 don't return
Re-book: 46 repeat customers
```

**Leverage points:** Reduce bounce (10% improvement = +100 more services), increase diagnosis completion (10% = +30 more)

---

## 2. LANDING PAGE STRUCTURE

### 2.1 New Section Order (with emotional arc)

| # | Section | Emotion | Purpose |
|---|---------|---------|---------|
| 1 | **Premium Navbar** | Trust | Always-on navigation + emergency access |
| 2 | **Hero** | Anxiety → Hope | AI diagnosis promise + dual CTA |
| 3 | **AI Workflow** | Curiosity → Clarity | Explain how AI diagnosis works |
| 4 | **Services** | Confidence | Show breadth of coverage with pricing |
| 5 | **Trust Section** | Trust peak | Stats, badges, plumber previews |
| 6 | **Interactive Map** | Relevance | "We're near you" with live availability |
| 7 | **Testimonials** | Emotional proof | Real stories from real customers |
| 8 | **Mobile App** | Convenience | "Take us anywhere" |
| 9 | **FAQ** | Objection handling | SEO + answer remaining doubts |
| 10 | **Final CTA** | Action | Last conversion opportunity |

### 2.2 Hero Spec (50/50 split)

**Left:** Headline "AI Finds Your Plumbing Problem Before The Plumber Arrives", subheadline, AI demo interface (photo upload/voice/type), dual CTA, trust bar.

**Right:** 3D AI scanning visualization or abstract plumbing scene.

**Mobile:** Stacked, content first, visual second (reduced height).

### 2.3 AI Workflow Design

Horizontal timeline on desktop (4 steps), vertical on mobile:
1. **Snap/Upload** — Photo, video, or voice description
2. **AI Analyzes** — Scanning animation, computer vision processing
3. **Problem Detection** — Annotated photo, severity gauge, cost estimate
4. **Verified Plumber Match** — Top 3 plumbers with AI recommendation

---

## 3. DESIGN SYSTEM (READY)

### 3.1 Color Foundation

| Token | Value | Usage |
|-------|-------|-------|
| `neutral-900` | #0f172a | Page background |
| `neutral-750` | #1e293b | Surface default |
| `primary-500` | #3b82f6 | Primary CTA, links |
| `copper-500` | #f59e0b | Emergency, premium |
| `emergency-500` | #dc2626 | Emergency CTA, alerts |
| `neutral-50` | #f8fafc | Primary text |

Full 10-color palettes for primary, copper, neutral (dark + light), and semantic colors already defined.

### 3.2 Typography

- **Display:** Plus Jakarta Sans (72px hero, 48px headings)
- **UI/Body:** Inter (16px body, 14px small)
- **Code:** JetBrains Mono (AI diagnostic data)

### 3.3 Component Library Specs

Defined: Buttons (7 variants × 4 sizes), Cards (4 types), Navbar (desktop + mobile), Badges (6 types), Forms (input, search, upload, voice), Glassmorphism utilities.

### 3.4 Animation Principles

- **Guide, don't distract** — every animation has functional purpose
- **Reduce perceived wait** — AI scanning animation makes 2s feel like 1s
- **Motion hierarchy** — hero reveal (1.2s), section entrance (600ms), hover (200ms)
- **Reduced motion** — `prefers-reduced-motion` disables all non-essential animation

---

## 4. VISUAL STORYTELLING

### 4.1 5-Chapter Narrative Arc

1. **The Problem** — Plumbing emergencies are stressful, expensive, unpredictable
2. **The AI Solution** — AI diagnosis removes uncertainty (know problem + price)
3. **Trust & Quality** — Every plumber verified, background-checked, AI-recommended
4. **The Experience** — Real-time tracking, digital payment, warranty
5. **Take Action** — Join thousands of happy homeowners

### 4.2 Visual Style (No Stock Photos)

- **Abstract 3D:** Floating pipe networks, glowing water particles, AI analysis nodes
- **Real photography:** Plumber portraits (uniformed), before/after repairs, customer in home
- **UI mockups:** Glassmorphic phone frames with live app content
- **Glassmorphism:** 12-24px backdrop blur, 1px rgba borders

### 4.3 AI Diagnosis Animation

The signature visual moment — 2.5s scanning sequence:
1. Scan line moves top-to-bottom across uploaded photo
2. Spectrum sweep radiates from image center (blue → purple → teal)
3. Processing nodes light up sequentially
4. Neural network overlay appears briefly
5. Result: annotated photo with problem area, severity gauge, cost estimate

---

## 5. CONVERSION OPTIMIZATION

### 5.1 Key Conversion Levers

| Lever | Impact | Implementation |
|-------|--------|----------------|
| Price transparency | Highest | Show price range BEFORE plumber assignment |
| AI diagnosis entry | High | Hero upload zone, no signup required |
| Trust signals | High | Police verification badge, real photos, live stats |
| 3-option rule | Medium | Show max 3 plumbers, 3 time slots |
| WhatsApp integration | Medium | "We'll send updates on WhatsApp" |
| Emergency access | High | Fixed phone number, visible on all screens |

### 5.2 CTA Strategy

- **Primary:** "Start AI Diagnosis" (blue gradient, high contrast)
- **Secondary:** "Book a Plumber Directly" (ghost/secondary)
- **Emergency floater:** "🔴 24/7 Emergency? Call Now" (fixed bottom mobile, sidebar desktop)
- **Exit popup:** "Get Rs 200 off your first booking"

---

## 6. LOCAL MARKET ADAPTATION (NEPAL)

| Element | Adaptation |
|---------|-----------|
| Language | Nepali default, English toggle |
| Payment | eSewa, Khalti, Connect IPS, cash-on-service |
| Trust | Police verification (govt-backed), PAN verified |
| Communication | WhatsApp primary channel, voice call fallback |
| Emergency | Prominent phone number, 24/7 guarantee |
| Cultural | Nepali names, real neighborhoods, "Send to Family" |

---

## 7. IMPLEMENTATION PLAN

### Phase 1 — Foundation (Day 1)
- Update `index.css` with new design tokens (already drafted by UI Designer)
- Install Google Fonts (Inter, Plus Jakarta Sans, JetBrains Mono)
- Create base layout components (Container, Section, Grid)

### Phase 2 — Core Components (Day 2-3)
- Button system (all variants)
- Card system (service, plumber, review, stat)
- Navigation (desktop + mobile, scroll-aware)

### Phase 3 — Hero + AI Workflow (Day 4-5)
- Hero section with 50/50 split
- AI diagnosis interface mockup
- Workflow timeline (horizontal/vertical)
- GSAP entrance animations

### Phase 4 — Trust + Map + Testimonials (Day 6-7)
- Animated counters
- Plumber card previews
- Map integration (split layout)
- Testimonial carousel
- FAQ accordion

### Phase 5 — App + Final CTA + Polish (Day 8-9)
- App section with phone mockup
- Final CTA band
- Light mode implementation
- Accessibility audit
- Performance optimization

---

## 8. REQUIRED APPROVALS

Before implementation begins, please confirm:

1. **Design direction:** Dark SaaS marketplace with AI diagnosis as hero hook
2. **Color system:** Blue primary + copper accent + dark default
3. **Section structure:** 10 sections as specified
4. **Content strategy:** AI diagnosis as primary CTA, no stock plumbing photos
5. **Local adaptation:** Nepali-first, local payment, police verification

---

## APPENDIX: FILES CREATED

- `ux-research/plumbnepal-ux-research.md` — Full UX research (personas, journeys, funnel, psychology)
- `ux-research/plumbnepal-design-audit-compiled.md` — This compiled audit
- `design-system/plumbnepal-design-system.md` — Complete design system (tokens, components, specs)
- `frontend/src/index.css` — Updated with 100+ design tokens (already applied by UI Designer)
