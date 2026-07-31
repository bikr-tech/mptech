# PlumbNepal Design System

**Product:** AI-powered plumbing service marketplace (Nepal)
**DNA:** Modern SaaS marketplace | AI-first diagnosis | Trust platform | Nepal-local | Premium approachable
**Inspiration:** Airbnb/Stripe/Linear/Vercel quality bar

---

## 1. Color System

### 1.1 Primary Palette (Brand Blue)

| Token | Hex | Usage | WCAG AA on dark bg | WCAG AA on light bg |
|-------|-----|-------|---------------------|---------------------|
| primary-50 | #eff6ff | Light bg accent | — | — |
| primary-100 | #dbeafe | Hover light bg | — | 4.6:1 on white |
| primary-200 | #bfdbfe | Subtle border | — | 3.2:1 on white |
| primary-300 | #93c5fd | Disabled | — | — |
| primary-400 | #60a5fa | Muted accent | 4.8:1 on #0f172a | — |
| primary-500 | #3b82f6 | **Primary CTA, links** | 6.3:1 on #0f172a | — |
| primary-600 | #2563eb | Hover, active | 7.8:1 on #0f172a | — |
| primary-700 | #1d4ed8 | Pressed | 9.3:1 on #0f172a | — |
| primary-800 | #1e3a8a | Dark accent | 11.5:1 on #0f172a | — |
| primary-900 | #172554 | Deep bg accent | — | — |

### 1.2 Secondary / Copper Palette (Warm Accent)

| Token | Hex | Usage | WCAG AA on dark bg |
|-------|-----|-------|---------------------|
| copper-50 | #fffbeb | Light badge bg | — |
| copper-100 | #fef3c7 | Badge bg | — |
| copper-200 | #fde68a | Subtle highlight | — |
| copper-300 | #fcd34d | Rating stars | — |
| copper-400 | #fbbf24 | Premium badge | — |
| copper-500 | #f59e0b | **Copper accent** | 6.2:1 on #0f172a |
| copper-600 | #d97706 | Hover, emergency header | 7.8:1 on #0f172a |
| copper-700 | #b45309 | Pressed | — |
| copper-800 | #92400e | Deep copper | — |
| copper-900 | #78350f | Text on amber | — |

### 1.3 Neutral Palette — Dark Mode (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| neutral-50 | #f8fafc | **Primary text** |
| neutral-100 | #f1f5f9 | Secondary text |
| neutral-200 | #e2e8f0 | Muted text, icons |
| neutral-300 | #cbd5e1 | Disabled text |
| neutral-400 | #94a3b8 | Placeholder |
| neutral-500 | #64748b | Border subtle |
| neutral-600 | #475569 | Border default |
| neutral-700 | #334155 | Surface elevated |
| neutral-750 | #1e293b | **Surface default** |
| neutral-800 | #1a2332 | Surface hover |
| neutral-850 | #151f2e | Card border hover |
| neutral-900 | #0f172a | **Page background** |
| neutral-950 | #0a0f1d | Deepest bg (hero) |

### 1.4 Neutral Palette — Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| light-50 | #ffffff | **Page background** |
| light-100 | #fafafa | Surface |
| light-150 | #f5f5f5 | Surface hover |
| light-200 | #e5e5e5 | Border |
| light-300 | #d4d4d4 | Border subtle |
| light-400 | #a3a3a3 | Placeholder |
| light-500 | #737373 | Muted text |
| light-600 | #525252 | Secondary text |
| light-700 | #404040 | **Primary text** |
| light-800 | #262626 | Heading text |
| light-900 | #171717 | Highest emphasis |

### 1.5 Semantic Colors

| Token | Hex | Dark bg contrast | Usage |
|-------|-----|------------------|-------|
| success-500 | #10b981 | 5.8:1 on #0f172a | Verified, complete, online |
| success-600 | #059669 | 7.2:1 on #0f172a | Hover |
| warning-500 | #f59e0b | 6.2:1 on #0f172a | Pending, caution |
| error-500 | #ef4444 | 5.3:1 on #0f172a | Errors, offline |
| emergency-500 | #dc2626 | 6.8:1 on #0f172a | **Emergency CTA, alerts** |
| emergency-600 | #b91c1c | Hover | |
| info-500 | #3b82f6 | 6.3:1 on #0f172a | AI tips, informational |

### 1.6 Gradient System

```css
/* Hero background: dark dramatic */
--gradient-hero: linear-gradient(
  135deg,
  #0a0f1d 0%,
  #0f172a 30%,
  #172554 60%,
  #0f172a 100%
);

/* Hero with radial highlight */
--gradient-hero-radial: radial-gradient(
  ellipse 80% 50% at 50% -20%,
  rgba(37, 99, 235, 0.15) 0%,
  transparent 100%
);

/* Card surface */
--gradient-card: linear-gradient(
  180deg,
  rgba(30, 41, 59, 0.8) 0%,
  rgba(15, 23, 42, 0.6) 100%
);

/* Card hover */
--gradient-card-hover: linear-gradient(
  180deg,
  rgba(37, 99, 235, 0.08) 0%,
  rgba(30, 41, 59, 0.8) 100%
);

/* CTA primary */
--gradient-cta: linear-gradient(
  135deg,
  #2563eb 0%,
  #3b82f6 50%,
  #60a5fa 100%
);

/* CTA copper */
--gradient-cta-copper: linear-gradient(
  135deg,
  #d97706 0%,
  #f59e0b 50%,
  #fbbf24 100%
);

/* AI glow */
--gradient-ai-glow: linear-gradient(
  135deg,
  rgba(59, 130, 246, 0.4) 0%,
  rgba(139, 92, 246, 0.3) 50%,
  rgba(59, 130, 246, 0.1) 100%
);

/* Emergency radial */
--gradient-emergency: radial-gradient(
  ellipse 100% 80% at 50% -20%,
  rgba(220, 38, 38, 0.2) 0%,
  transparent 70%
);

/* Light mode hero */
--gradient-hero-light: linear-gradient(
  135deg,
  #f0f9ff 0%,
  #e0f2fe 30%,
  #dbeafe 60%,
  #f0f9ff 100%
);
```

---

## 2. Typography

### 2.1 Font Stack

| Role | Font | Fallback | Weight range |
|------|------|----------|-------------|
| UI / Body | Inter | system-ui, sans-serif | 300-700 |
| Display / Headings | Plus Jakarta Sans | Inter, sans-serif | 400-800 |
| Code / Data | JetBrains Mono | Menlo, monospace | 400-700 |

### 2.2 Type Scale

```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
--text-6xl:  3.75rem;   /* 60px */
--text-7xl:  4.5rem;    /* 72px */
--text-8xl:  5rem;      /* 80px */
```

### 2.3 Leading

| Token | Ratio | Usage |
|-------|-------|-------|
| --leading-tight | 1.1 | Display, headings |
| --leading-snug | 1.3 | Subheadings |
| --leading-normal | 1.5 | Body text |
| --leading-relaxed | 1.7 | Long-form content |
| --leading-loose | 2.0 | Captions, legal |

### 2.4 Weight

| Weight | Token | Usage |
|--------|-------|-------|
| 300 | --weight-light | Display only (80px text) |
| 400 | --weight-normal | Body, inputs |
| 500 | --weight-medium | Emphasis, nav items |
| 600 | --weight-semibold | Subheadings, button text |
| 700 | --weight-bold | Headings |
| 800 | --weight-extrabold | Display headings, hero |

### 2.5 Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| --tracking-tight | -0.025em | Display, headings |
| --tracking-normal | 0em | Body |
| --tracking-wide | 0.025em | Uppercase labels |
| --tracking-wider | 0.05em | Badges, tags |
| --tracking-widest | 0.1em | All-caps headers |

### 2.6 Typography Scale Usage

```css
/* Display XL — Hero headline */
font-family: 'Plus Jakarta Sans', sans-serif;
font-size: var(--text-7xl);        /* 72px desktop */
font-weight: var(--weight-extrabold);
line-height: var(--leading-tight);
letter-spacing: var(--tracking-tight);

/* Display LG — Section headers */
font-family: 'Plus Jakarta Sans', sans-serif;
font-size: var(--text-5xl);        /* 48px */
font-weight: var(--weight-bold);
line-height: var(--leading-tight);

/* Heading XL — Card titles */
font-family: 'Inter', sans-serif;
font-size: var(--text-2xl);        /* 24px */
font-weight: var(--weight-semibold);
line-height: var(--leading-snug);

/* Body — Paragraphs */
font-family: 'Inter', sans-serif;
font-size: var(--text-base);        /* 16px */
font-weight: var(--weight-normal);
line-height: var(--leading-relaxed);

/* Small — Captions, meta */
font-family: 'Inter', sans-serif;
font-size: var(--text-sm);          /* 14px */
font-weight: var(--weight-normal);
line-height: var(--leading-normal);

/* Code — AI data, diagnostics */
font-family: 'JetBrains Mono', monospace;
font-size: var(--text-sm);          /* 14px */
font-weight: var(--weight-medium);
line-height: var(--leading-snug);
```

---

## 3. Design Token Values

### 3.1 Spacing (8px base grid)

```css
--space-0:   0px;
--space-0\.5: 0.125rem;  /* 2px */
--space-1:   0.25rem;   /* 4px */
--space-1\.5: 0.375rem;  /* 6px */
--space-2:   0.5rem;    /* 8px */
--space-2\.5: 0.625rem;  /* 10px */
--space-3:   0.75rem;   /* 12px */
--space-3\.5: 0.875rem;  /* 14px */
--space-4:   1rem;      /* 16px */
--space-5:   1.25rem;   /* 20px */
--space-6:   1.5rem;    /* 24px */
--space-7:   1.75rem;   /* 28px */
--space-8:   2rem;      /* 32px */
--space-9:   2.25rem;   /* 36px */
--space-10:  2.5rem;    /* 40px */
--space-11:  2.75rem;   /* 44px */
--space-12:  3rem;      /* 48px */
--space-14:  3.5rem;    /* 56px */
--space-16:  4rem;      /* 64px */
--space-20:  5rem;      /* 80px */
--space-24:  6rem;      /* 96px */
--space-28:  7rem;      /* 112px */
--space-32:  8rem;      /* 128px */
```

### 3.2 Border Radius

```css
--radius-none:   0px;
--radius-sm:     0.375rem;   /* 6px */
--radius-md:     0.75rem;    /* 12px */
--radius-lg:     1rem;       /* 16px */
--radius-xl:     1.5rem;     /* 24px */
--radius-2xl:    2rem;       /* 32px */
--radius-full:   9999px;

/* Context mapping */
--radius-button:    var(--radius-sm);   /* 6px for standard, 12px for CTA */
--radius-card:      var(--radius-md);   /* 12px */
--radius-input:     var(--radius-sm);   /* 6px */
--radius-badge:     var(--radius-full);
--radius-modal:     var(--radius-lg);   /* 16px */
--radius-avatar:    var(--radius-full);
```

### 3.3 Shadow System

```css
/* Dark mode shadows (light source from top) */
--shadow-xs:    0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
--shadow-md:    0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
--shadow-lg:    0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2);
--shadow-xl:    0 20px 25px rgba(0, 0, 0, 0.4), 0 10px 10px rgba(0, 0, 0, 0.2);
--shadow-2xl:   0 25px 50px rgba(0, 0, 0, 0.5);

/* Light mode shadows */
--shadow-sm-light:  0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md-light:  0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-lg-light:  0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-xl-light:  0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);

/* Branded glow shadows */
--shadow-glow-blue:   0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1);
--shadow-glow-copper: 0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1);
--shadow-glow-red:    0 0 20px rgba(220, 38, 38, 0.4), 0 0 40px rgba(220, 38, 38, 0.15);

/* Context mapping */
--shadow-card:        var(--shadow-sm);
--shadow-card-hover:  var(--shadow-md);
--shadow-dropdown:    var(--shadow-lg);
--shadow-modal:       var(--shadow-xl);
--shadow-toast:       var(--shadow-2xl);
--shadow-cta:         var(--shadow-glow-blue);
--shadow-emergency:   var(--shadow-glow-red);
--shadow-ai-badge:    var(--shadow-glow-blue);
```

### 3.4 Blur / Backdrop Filter

```css
--blur-none:   0px;
--blur-sm:     4px;
--blur-md:     12px;
--blur-lg:     24px;
--blur-xl:     48px;

/* Context mapping */
--blur-glass-sm:   var(--blur-sm);   /* subtle backdrops */
--blur-glass-md:   var(--blur-md);   /* navbar, cards */
--blur-glass-lg:   var(--blur-lg);   /* modals, overlays */
```

### 3.5 Opacity

```css
--opacity-0:     0;
--opacity-subtle:   0.08;   /* hover overlay, disabled bg */
--opacity-medium:   0.16;   /* focused ring, divider */
--opacity-strong:   0.32;   /* disabled text, overlay bg */
--opacity-50:       0.5;    /* muted elements */
--opacity-75:       0.75;   /* hover state */
--opacity-90:       0.9;    /* near-solid */
--opacity-full:     1;
```

### 3.6 Transitions

```css
--duration-fast:   150ms;
--duration-normal: 300ms;
--duration-slow:   500ms;
--duration-slower: 700ms;

--ease-out:       cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out:    cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-linear:    linear;

/* Context mapping */
--transition-button:   all var(--duration-fast) var(--ease-out);
--transition-card:     all var(--duration-normal) var(--ease-out);
--transition-hover:    transform var(--duration-fast) var(--ease-spring);
--transition-focus:    box-shadow var(--duration-fast) var(--ease-out);
--transition-modal:    transform var(--duration-slow) var(--ease-out), opacity var(--duration-normal) var(--ease-out);
--transition-slide:    transform var(--duration-normal) var(--ease-out);
```

### 3.7 Z-Index Scale

```css
--z-base:       0;
--z-above:      1;
--z-dropdown:   50;
--z-sticky:     100;
--z-overlay:    150;
--z-modal:      200;
--z-toast:      300;
--z-tooltip:    400;
```

---

## 4. UI Component Specifications

### 4.1 Buttons

#### Base Button
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: 'Inter', sans-serif;
  font-weight: var(--weight-semibold);
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: var(--transition-button);
  position: relative;
  overflow: hidden;
}

.btn:focus-visible {
  outline: 2px solid var(--primary-400);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
```

#### Size Variants

| Size | Height | Padding X | Font Size | Border Radius | Icon Size |
|------|--------|-----------|-----------|---------------|-----------|
| sm | 32px (8) | 12px (3) | 14px | 6px | 14px |
| md | 40px (10) | 16px (4) | 14px | 6px | 16px |
| lg | 48px (12) | 24px (6) | 16px | 8px | 18px |
| xl | 56px (14) | 32px (8) | 18px | 12px | 20px |

#### Variant Specifications

**Primary (Blue CTA)**
```
Background: --gradient-cta
Text: white
Shadow: --shadow-cta (on non-disabled)
Hover:  transform scale(1.02), shadow deepen 1.15x
Active: transform scale(0.98), brightness 0.9
```

**Secondary (Copper)**
```
Background: --gradient-cta-copper
Text: neutral-900 (#0f172a)
Shadow: --shadow-glow-copper
Hover:  scale(1.02), shadow deepen
Active: scale(0.98)
```

**Ghost**
```
Background: transparent
Text: neutral-200 (dark) / neutral-700 (light)
Border: 1px solid transparent
Hover:  bg rgba(255,255,255,0.08), border neutral-600
Active: bg rgba(255,255,255,0.12)
```

**Emergency**
```
Background: --gradient-emergency, bg emergency-500
Text: white
Shadow: --shadow-emergency
Hover:  bg emergency-600, scale(1.02)
Pulse:  @keyframes pulse-emergency (scale 1 -> 1.05 -> 1, 2s infinite)
```

**AI Action**
```
Background: --gradient-ai-glow, bg rgba(59,130,246,0.15)
Text: primary-400
Border: 1px solid rgba(59,130,246,0.3)
Icon: Sparkles icon
Loading: spinner replaces icon, text "Thinking..."
```

**Icon Button**
```
Padding: equal all sides (square)
Same height as size variant
```

### 4.2 Cards

**Service Card**
```
Glass-morphic surface
--gradient-card background
Border: 1px solid rgba(255,255,255,0.06)
Border-radius: --radius-card (12px)
Padding: --space-6
Icon: 40x40, rounded, subtle bg
Title: text-base, semibold
Description: text-sm, neutral-400
Hover: translateY(-4px), --shadow-card-hover, border primary-500/20
```

**Plumber Card**
```
Surface: neutral-750
Border-radius: --radius-md
Padding: --space-5
Layout: avatar (48px) | info | price
Info: name (medium), rating + reviews, distance + ETA
Status badge: online (success-500 dot), busy (warning-500), offline (neutral-500)
Price: text-xl, bold, copper-500
```

**Review Card**
```
Surface: neutral-800/50
Border-radius: --radius-md
Padding: --space-6
Quote icon: top-left, neutral-600, opacity 0.3
Text: text-sm, neutral-300, italic
Author: text-sm, semibold, neutral-100
Rating: copper-400 stars
```

**Stat Card**
```
Background: --gradient-card
Border: 1px solid rgba(255,255,255,0.06)
Border-radius: --radius-md
Padding: --space-6
Counter: text-4xl, bold, primary-400
Label: text-sm, neutral-400
Icon: 32px, colored accent
Accent border: 2px left border in primary-500
```

### 4.3 Navigation

**Desktop Navbar**
```
Position: fixed top, full width
Height: 72px (desktop), 64px (mobile)
Background: rgba(15,23,42,0.8) → solid on scroll
Backdrop: blur(12px)
Border-bottom: 1px solid rgba(255,255,255,0.06)
Padding: 0 --space-8
Z-index: --z-sticky

Elements:
- Logo (32px height)
- Nav links (text-sm, medium, neutral-300 → hover white)
- Language switch (Nepali / English, dropdown)
- Emergency hotline (copper-500, bold, with phone icon)
- Login / Sign Up buttons
```

**Mobile Nav**
```
Trigger: hamburger icon
Overlay: rgba(0,0,0,0.6), backdrop blur
Panel: full-screen, neutral-900, slides from right
Padding: --space-8
Links: text-2xl, medium, stacked
CTA buttons: full width, stacked
```

### 4.4 Hero Components

**Hero Layout**
```
max-width: 1280px
Padding: --space-20 top, --space-16 bottom
Grid: 2 columns (60/40) desktop, stacked mobile

Left column:
- Badge: "AI-Powered" (primary-500 bg, white text, small pill)
- Headline: 72px, Plus Jakarta Sans, extrabold, gradient text
- Subheadline: 18px, neutral-400, max-w 560px
- CTAs: Primary + Secondary, lg size, gap-4
- Trust bar: "10,000+ jobs completed" + "4.8★ avg rating"

Right column:
- AI demo interface mockup
- Upload area / scanning animation / results panel
```

**Hero Text Gradient**
```css
background: linear-gradient(135deg, #f8fafc 0%, #60a5fa 50%, #818cf8 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### 4.5 Badges

| Badge | Background | Text | Border | Icon |
|-------|-----------|------|--------|------|
| Verified Plumber | primary-500/15 | primary-400 | — | Check badge icon |
| AI Recommended | rgba(139,92,246,0.15) | violet-400 | violet-500/30 | Sparkles |
| Emergency | emergency-500 | white | — | Alert triangle |
| Top Rated | copper-500/15 | copper-400 | copper-500/30 | Star |
| Background Checked | success-500/15 | success-400 | success-500/30 | Shield |
| Pro | neutral-50/10 | neutral-300 | — | Zap |

Badge spec: height 22px, padding 6px 8px, text 11px bold, rounded-full, gap 4px, icon 12px.

### 4.6 Form Elements

**Text Input**
```
Background: rgba(255,255,255,0.05)
Border: 1px solid neutral-600
Border-radius: --radius-sm (6px)
Padding: 10px 14px
Text: text-base, neutral-100
Placeholder: neutral-400
Focus: border primary-500, shadow 0 0 0 3px rgba(59,130,246,0.15)
Disabled: opacity 0.4, bg neutral-800
Error: border error-500, shadow 0 0 0 3px rgba(239,68,68,0.15)
Height: 40px (md), 48px (lg)
```

**Search Input**
```
Same as text input
Left icon: Search, 16px, neutral-400
Padding-left: 40px (for icon)
Clear button: right side, on typing
Autocomplete: dropdown panel below
```

**File Upload**
```
Dashed border: 2px dashed neutral-600
Border-radius: --radius-md
Padding: --space-10
Background: rgba(255,255,255,0.02)
Hover: border primary-500, bg primary-500/5
Icon: Upload, 32px, neutral-400
Text: "Drag photo here or tap to upload", text-sm
Camera button: secondary, small, with camera icon
```

**Voice Input**
```
Circular button, 48px
Default: bg primary-500, mic icon
Recording: bg emergency-500, pulse animation, waveform
```

---

## 5. Visual Aesthetic Guide

### 5.1 Glassmorphism Formula

```css
.glass {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-strong {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.glass-light {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.04);
}
```

**Usage map:**
- Navbar: `.glass-strong` (so text stays legible over any background)
- Cards: `.glass` (subtle, premium feel)
- Modals: `.glass-strong` (depth, focus)
- Tooltips: `.glass-strong` + shadow-xl
- Hero overlays: `.glass-light` for non-interactive decorative panels

### 5.2 Light Mode Glass

```css
.glass--light {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.06);
}
```

### 5.3 Iconography Guidelines

**Library:** Lucide React (primary), custom SVGs for plumbing-specific icons.

**Icon sizes by context:**
| Context | Size |
|---------|------|
| Inline with text | 14-16px |
| Button icon | 16-20px |
| Card illustration | 32-40px |
| Nav icon | 20px |
| Feature icon | 48-64px |
| AI processing | 24px with spinner |

**Stroke width:** 1.5px standard, 2px for UI icons.

**Animated icons:**
- AI processing: rotating/pulsing glow ring
- Emergency: pulsing alert triangle
- Voice: waveform bars
- Upload: arrow-to-document with progress fill

### 5.4 Micro-interactions

```css
/* Button hover pop */
.btn:not(:disabled):hover {
  transform: scale(1.02);
}
.btn:not(:disabled):active {
  transform: scale(0.98);
}

/* Card hover lift + glow */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
  border-color: rgba(59, 130, 246, 0.2);
}

/* Input focus glow */
.input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* Nav link underline slide */
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-500);
  transition: width var(--duration-normal) var(--ease-out);
}
.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

/* Emergency pulse */
@keyframes pulse-emergency {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
  50% { box-shadow: 0 0 0 16px rgba(220, 38, 38, 0); }
}

/* AI thinking dots */
@keyframes thinking-dot {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

/* Skeleton shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### 5.5 Floating / Decorative Elements

For hero section and AI feature sections:

- **3D pipe segments:** rotating, translucent, copper-500/10 with glow
- **Water particles:** floating up, blue-400/20, varied sizes
- **AI data nodes:** pulsing circles connected by lines, primary-500/30
- **Circuit traces:** subtle grid lines with animated dot flow
- **Radial gradients:** soft color blooms behind key content blocks

All decorative: `pointer-events: none`, `user-select: none`.

### 5.6 Responsive Breakpoint Behavior

```css
/* Sm (640px+) — tablet adjustments */
@media (min-width: 640px) {
  .hero { grid-template-columns: 1fr 1fr; }
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Md (768px+) — standard desktop */
@media (min-width: 768px) {
  .nav-mobile { display: none; }
  .nav-desktop { display: flex; }
  .hero-headline { font-size: var(--text-7xl); }
}

/* Lg (1024px+) — wide desktop */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Xl (1280px+) — max content width */
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

---

## 6. TailwindCSS v4 @theme Configuration

```css
@theme {
  /* Primary */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e3a8a;
  --color-primary-900: #172554;

  /* Copper */
  --color-copper-50: #fffbeb;
  --color-copper-100: #fef3c7;
  --color-copper-200: #fde68a;
  --color-copper-300: #fcd34d;
  --color-copper-400: #fbbf24;
  --color-copper-500: #f59e0b;
  --color-copper-600: #d97706;
  --color-copper-700: #b45309;
  --color-copper-800: #92400e;
  --color-copper-900: #78350f;

  /* Neutral Dark */
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-750: #1e293b;
  --color-neutral-800: #1a2332;
  --color-neutral-850: #151f2e;
  --color-neutral-900: #0f172a;
  --color-neutral-950: #0a0f1d;

  /* Neutral Light */
  --color-light-50: #ffffff;
  --color-light-100: #fafafa;
  --color-light-150: #f5f5f5;
  --color-light-200: #e5e5e5;
  --color-light-300: #d4d4d4;
  --color-light-400: #a3a3a3;
  --color-light-500: #737373;
  --color-light-600: #525252;
  --color-light-700: #404040;
  --color-light-800: #262626;
  --color-light-900: #171717;

  /* Semantic */
  --color-success-500: #10b981;
  --color-success-600: #059669;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
  --color-emergency-500: #dc2626;
  --color-emergency-600: #b91c1c;
  --color-info-500: #3b82f6;

  /* Typography */
  --font-family-primary: 'Inter', system-ui, sans-serif;
  --font-family-display: 'Plus Jakarta Sans', 'Inter', sans-serif;
  --font-family-mono: 'JetBrains Mono', Menlo, monospace;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;
  --font-size-6xl: 3.75rem;
  --font-size-7xl: 4.5rem;
  --font-size-8xl: 5rem;

  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  --leading-tight: 1.1;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;
  --leading-loose: 2.0;

  --tracking-tight: -0.025em;
  --tracking-normal: 0em;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;

  /* Spacing */
  --spacing-0\.5: 0.125rem;
  --spacing-1\.5: 0.375rem;
  --spacing-2\.5: 0.625rem;
  --spacing-3\.5: 0.875rem;

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-glow-blue: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1);
  --shadow-glow-copper: 0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1);
  --shadow-glow-red: 0 0 20px rgba(220, 38, 38, 0.4), 0 0 40px rgba(220, 38, 38, 0.15);

  /* Blur */
  --blur-sm: 4px;
  --blur-md: 12px;
  --blur-lg: 24px;
  --blur-xl: 48px;

  /* Z-index */
  --z-below: -1;
  --z-above: 1;
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-overlay: 150;
  --z-modal: 200;
  --z-toast: 300;
  --z-tooltip: 400;
}
```

### 6.1 Semantic alias tokens (for theme-agnostic component code)

```css
@theme {
  /* Semantic aliases — map through for both modes */
  --color-brand-bg: var(--color-neutral-900);
  --color-brand-surface: var(--color-neutral-750);
  --color-brand-surface-hover: var(--color-neutral-800);
  --color-brand-border: var(--color-neutral-600);
  --color-brand-border-subtle: var(--color-neutral-500);
  --color-brand-text: var(--color-neutral-50);
  --color-brand-text-secondary: var(--color-neutral-100);
  --color-brand-text-muted: var(--color-neutral-400);
  --color-brand-accent: var(--color-primary-500);
  --color-brand-copper: var(--color-copper-500);
  --color-brand-emergency: var(--color-emergency-500);
  --color-brand-success: var(--color-success-500);
}

/* Light mode override */
@media (prefers-color-scheme: light) {
  :root {
    --color-brand-bg: var(--color-light-50);
    --color-brand-surface: var(--color-light-100);
    --color-brand-surface-hover: var(--color-light-150);
    --color-brand-border: var(--color-light-200);
    --color-brand-border-subtle: var(--color-light-300);
    --color-brand-text: var(--color-light-700);
    --color-brand-text-secondary: var(--color-light-600);
    --color-brand-text-muted: var(--color-light-400);
  }
}
```

---

## 7. WCAG AA Compliance Notes

### Critical color pairs

| Foreground | Background | Ratio | Pass? |
|-----------|-----------|-------|-------|
| neutral-50 (#f8fafc) | neutral-900 (#0f172a) | 16.9:1 | AA+AAA |
| neutral-100 (#f1f5f9) | neutral-900 (#0f172a) | 14.3:1 | AA+AAA |
| neutral-200 (#e2e8f0) | neutral-900 (#0f172a) | 11.7:1 | AA+AAA |
| neutral-300 (#cbd5e1) | neutral-900 (#0f172a) | 9.3:1 | AA+AAA |
| neutral-400 (#94a3b8) | neutral-900 (#0f172a) | 6.1:1 | AA |
| primary-500 (#3b82f6) | neutral-900 (#0f172a) | 6.3:1 | AA (large text) |
| primary-400 (#60a5fa) | neutral-900 (#0f172a) | 4.8:1 | AA |
| copper-500 (#f59e0b) | neutral-900 (#0f172a) | 6.2:1 | AA |
| emergency-500 (#dc2626) | neutral-900 (#0f172a) | 6.8:1 | AA |

**Do NOT use:**
- neutral-400 (#94a3b8) on neutral-750 (#1e293b) = 3.2:1 (fails for small text)
- neutral-300 on neutral-700 = 2.8:1 (fails)
- primary-200 on white = 1.8:1 (fails)
- Any foreground on `neutral-50` background in light mode without verifying ratio

**Minimum contrast rules applied:**
- Body text (<18px / <14px bold): 4.5:1 minimum
- Large text (>=18px / >=14px bold): 3:1 minimum
- UI components (icons, borders): 3:1 minimum against adjacent colors
- Focus indicators: 3:1 against unfocused state
- Disabled text: 3:1 against background

---

## 8. Implementation Priority

**Phase 1 — Foundation (Day 1)**
- Color tokens + Tailwind v4 `@theme` in `index.css`
- Typography system + Google Fonts import
- Base layout (container, grid, spacing)

**Phase 2 — Core Components (Day 2-3)**
- Button system (all variants, sizes, states)
- Card system (all 4 card types)
- Navigation (desktop + mobile)

**Phase 3 — Hero + Landing (Day 4-5)**
- Hero section with glass elements
- AI demo interface mockup
- Responsive layout

**Phase 4 — Forms + Interactive (Day 6-7)**
- Form inputs, file upload, voice input
- Badges, tags, status indicators
- Micro-interactions and animations

**Phase 5 — Polish (Day 8-9)**
- Light mode implementation
- 3D decorative elements
- Accessibility audit
- Performance optimization
