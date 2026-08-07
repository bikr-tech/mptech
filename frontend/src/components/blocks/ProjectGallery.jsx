import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'
import { DEFAULT_FEATURES, DEFAULT_STATS } from '../../lib/projectDefaults'

gsap.registerPlugin(ScrollTrigger)

/* ────────────────────────── Icons ────────────────────────── */

const ICON_PATHS = {
  camera: <><path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="13" r="3.5" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2.5" /><path d="M8 2v4M16 2v4M3 9h18" /></>,
  mapPin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  wallet: <><rect x="2" y="6" width="20" height="14" rx="2.5" /><path d="M2 10h20" /><circle cx="17.5" cy="15" r="1.4" /></>,
  shield: <><path d="M12 2l7 3v6c0 4.6-3 8.6-7 10-4-1.4-7-5.4-7-10V5l7-3z" /><path d="M9 12l2 2 4-4" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
}

function Icon({ name, className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  )
}

/* ────────────────────────── Tints (literal classes → JIT safe) ────────────────────────── */

const TINTS = {
  cyan:    { chip: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300', bar: 'bg-cyan-400' },
  violet:  { chip: 'bg-violet-500/15 border-violet-400/30 text-violet-300', bar: 'bg-violet-400' },
  emerald: { chip: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300', bar: 'bg-emerald-400' },
  amber:   { chip: 'bg-amber-500/15 border-amber-400/30 text-amber-300', bar: 'bg-amber-400' },
  green:   { chip: 'bg-green-500/15 border-green-400/30 text-green-300', bar: 'bg-green-400' },
  fuchsia: { chip: 'bg-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-300', bar: 'bg-fuchsia-400' },
}

/* ────────────────────────── Default content ────────────────────────── */

const PHOTO_PLACEHOLDERS = [
  { emoji: '🔧', label: 'Bathroom overhaul' },
  { emoji: '⚡', label: 'Emergency repair' },
  { emoji: '💧', label: 'Leak detection' },
]

/* ────────────────────────── Normalization ────────────────────────── */

// Merge admin content over defaults. Unknown keys (features/stats/badge/cta)
// survive admin saves because the drawer does `{ ...existingContent }`.
function normalizeContent(content = {}) {
  // Admin-saved features are authoritative (edits/deletes/adds apply). Defaults only as fallback.
  const features = content.features?.length ? content.features : DEFAULT_FEATURES

  const stats = (content.stats?.length ? content.stats : DEFAULT_STATS).map((s, i) => ({ ...DEFAULT_STATS[i], ...s }))

  // Project photos → first 3 projects (thumbnail + gallery images), fall back to legacy images, then placeholders
  const projects = content.projects || []
  const legacy = content.images || []
  const srcs = []
  projects.slice(0, 3).forEach((p) => {
    const images = [p.thumbnail, ...(p.images || [])].filter(Boolean)
    srcs.push({
      src: images[0] || '',
      category: p.category,
      label: p.title,
      alt: p.title || 'PlumbNepal project',
      title: p.title,
      location: p.location,
      images,
    })
  })
  if (srcs.length < 3) {
    legacy.slice(0, 3 - srcs.length).forEach((im) => srcs.push({ src: im.url, label: im.caption, alt: im.caption || 'PlumbNepal project', images: [im.url] }))
  }
  const photos = PHOTO_PLACEHOLDERS.map((p, i) => srcs[i] ? { ...srcs[i] } : { ...p, images: [] })
  photos[1].size = 'wide'
  photos[2].size = 'wide'

  return {
    badge: content.badge || 'ONE APP · EVERYTHING PLUMBING',
    title: content.title || 'Everything needed to solve plumbing problems',
    subtitle: content.subtitle || 'Snap a photo, get an AI diagnosis, book a verified plumber, track them live, and pay securely — all in one place.',
    ctaText: content.cta_text || 'Start AI Diagnosis',
    ctaLink: content.cta_link || '#ai-diagnosis',
    features,
    stats,
    photos,
  }
}

export { normalizeContent }

/* ────────────────────────── Micro-interactions ────────────────────────── */

function useMagnetic(ref, { strength = 6 } = {}) {
  const reduced = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const qx = gsap.quickTo(el, 'x', { duration: 0.35, ease: EASES.out })
    const qy = gsap.quickTo(el, 'y', { duration: 0.35, ease: EASES.out })
    const clamp = (v) => Math.max(-strength, Math.min(strength, v))
    const move = (e) => {
      const r = el.getBoundingClientRect()
      qx(clamp((e.clientX - (r.left + r.width / 2)) * 0.28))
      qy(clamp((e.clientY - (r.top + r.height / 2)) * 0.38))
    }
    const leave = () => { qx(0); qy(0) }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [reduced, strength])
}

function useTilt(ref) {
  const reduced = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: EASES.out })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: EASES.out })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
      ry((px - 0.5) * 4)   // ±2°
      rx((0.5 - py) * 4)
    }
    const leave = () => { rx(0); ry(0) }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [reduced])
}

/* ────────────────────────── Building blocks ────────────────────────── */

function AnimatedCounter({ target, suffix = '' }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  useGSAP(() => {
    const el = ref.current
    if (!el) return
    if (reduced) { el.textContent = target + suffix; return }
    const obj = { val: 0 }
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => { el.textContent = Math.round(obj.val) + suffix },
    })
  }, { scope: ref, dependencies: [target, suffix, reduced] })
  return <span ref={ref}>0</span>
}

function ImageWithFallback({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setLoaded(false); setFailed(false) }, [src])

  useEffect(() => {
    const img = new Image()
    img.src = src
    if (img.complete) { setLoaded(true); return }
    img.onload = () => setLoaded(true)
    img.onerror = () => setFailed(true)
    return () => { img.onload = null; img.onerror = null }
  }, [src])

  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-deep-800 via-deep-800 to-deep-950 text-white/40 ${className}`}>
        <span className="text-2xl mb-1">🖼️</span>
        <span className="text-[10px] uppercase tracking-wider">Unavailable</span>
      </div>
    )
  }

  return (
    <>
      {!loaded && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-electric-500/20 via-deep-800 to-deep-950 ${className}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500/40 to-brand-copper/30 border border-electric-500/30 flex items-center justify-center text-xl shadow-glow-blue">🔧</div>
        </div>
      )}
      <img
        src={src} alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
}

function FeatureCard({ f, itemRef }) {
  const cardRef = useRef(null)
  const t = TINTS[f.tint] || TINTS.cyan
  useTilt(cardRef)

  return (
    <li ref={itemRef} className={f.size === 'wide' ? 'sm:col-span-2' : ''}>
      <div
        ref={cardRef}
        style={{ transformStyle: 'preserve-3d' }}
        className="tile-spotlight group glass-frost rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-electric-400 outline-none"
      >
        <div className="flex items-start justify-between mb-5">
          <span className={`w-11 h-11 rounded-xl flex items-center justify-center border ${t.chip} transition-transform duration-300 group-hover:scale-110`}>
            <Icon name={f.icon} />
          </span>
          {f.stat && (
            <span className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-white/90 tracking-tight">{f.stat.value}</span>
              <span className="text-white/40 text-[10px] font-mono uppercase tracking-wider">{f.stat.label}</span>
            </span>
          )}
        </div>
        <h3 className="text-white font-semibold text-lg tracking-tight mb-2">{f.title}</h3>
        <p className="text-white/55 text-sm leading-relaxed">{f.description}</p>
        {f.stat && (
          <div className="mt-auto pt-5">
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full w-full rounded-full ${t.bar} opacity-70 transition-transform duration-700 origin-left scale-x-0 group-hover:scale-x-100`} />
            </div>
          </div>
        )}
      </div>
    </li>
  )
}

function PhotoCard({ p, itemRef, onOpen }) {
  return (
    <li ref={itemRef} className={`group ${p.size === 'wide' ? 'sm:col-span-2' : ''}`}>
      <button
        type="button"
        onClick={onOpen}
        className="bento-photo relative h-full w-full min-h-[190px] overflow-hidden rounded-2xl border border-white/10 bg-deep-800 text-left transition-all duration-300 hover:ring-1 hover:ring-electric-400/40 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-electric-400 outline-none cursor-pointer"
        aria-label={p.title || p.alt}
      >
        {p.src ? (
          <ImageWithFallback src={p.src} alt={p.alt} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center text-5xl bg-gradient-to-br from-electric-500/25 via-deep-800 to-deep-950 ${''}`}>
            <span className="drop-shadow-[0_0_18px_rgba(79,195,255,0.5)]">{p.emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-950/85 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wider text-white/85 px-2.5 py-1 rounded-full bg-deep-950/70 backdrop-blur-sm border border-white/10">
          {p.label}
        </span>
        {p.category && (
          <span className="absolute bottom-3 left-3 text-[10px] font-mono uppercase tracking-wider text-white/85 px-2.5 py-1 rounded-full bg-deep-950/70 backdrop-blur-sm border border-white/10">
            {p.category}
          </span>
        )}
        {p.images?.length > 1 && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-mono text-white/85 px-2 py-1 rounded-full bg-deep-950/70 backdrop-blur-sm border border-white/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
            {p.images.length}
          </span>
        )}
      </button>
    </li>
  )
}

function PhotoLightbox({ project, onClose }) {
  const [idx, setIdx] = useState(0)
  const imgs = project.images || []
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % imgs.length)
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + imgs.length) % imgs.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [imgs.length, onClose])
  if (!imgs.length) return null
  const img = imgs[idx]
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={project.title}>
      <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <img src={img} alt={project.alt || project.title} className="w-full max-h-[80vh] object-contain rounded-2xl border border-white/15 bg-deep-900 shadow-2xl" />
        <div className="flex items-center justify-between mt-4">
          <div className="text-white text-sm">
            <span className="font-semibold">{project.title}</span>
            {project.location && <span className="text-white/50"> · {project.location}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs font-mono">{idx + 1} / {imgs.length}</span>
            {imgs.length > 1 && (
              <>
                <button onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition" aria-label="Previous photo">&larr;</button>
                <button onClick={() => setIdx((i) => (i + 1) % imgs.length)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition" aria-label="Next photo">&rarr;</button>
              </>
            )}
          </div>
        </div>
      </div>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition" aria-label="Close">&times;</button>
    </div>
  )
}

/* ────────────────────────── Main ────────────────────────── */

export default function ProjectGallery({ content }) {
  const n = normalizeContent(content)
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const tilesRef = useRef([])
  const statsRef = useRef(null)
  const ctaRef = useRef(null)
  const ctaBtnRef = useRef(null)
  const emeraldBtnRef = useRef(null)
  const reduced = useReducedMotion()
  const tileEls = useRef([])
  const [openProject, setOpenProject] = useState(null)

  // Interleave features + photos so each row lands at 4 (lg) / 2 (sm) columns
  const { features, photos } = n
  const [f1, f2, f3, f4, f5, f6] = features
  const [p1, p2, p3] = photos
  // lg 4-col: f1(2)+f2+f3 | f4+f5+f6+p1 | p2(2)+p3(2) — rows fill exactly
  const tiles = [f1, f2, f3, f4, f5, f6, p1, p2, p3]

  useGSAP(() => {
    if (reduced) return

    const tl = gsap.timeline({
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
    })
    tl.from(headerRef.current?.children, { y: 30, opacity: 0, stagger: 0.08, duration: DURATIONS.reveal, ease: EASES.out, immediateRender: false })
      .from(tileEls.current, { y: 40, opacity: 0, scale: 0.96, stagger: 0.06, duration: DURATIONS.normal, ease: EASES.out, immediateRender: false }, '-=0.35')
      .from(statsRef.current?.children, { y: 24, opacity: 0, stagger: 0.08, duration: DURATIONS.normal, ease: EASES.out, immediateRender: false }, '-=0.2')
      .from(ctaRef.current?.children, { y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out, immediateRender: false }, '-=0.2')

    // Parallax scrub on photo tiles
    sectionRef.current.querySelectorAll('.bento-photo').forEach((p) => {
      gsap.fromTo(p.querySelector('img') || p.firstElementChild,
        { yPercent: -8 }, { yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
  }, { scope: sectionRef, dependencies: [reduced] })

  useMagnetic(ctaBtnRef)
  useMagnetic(emeraldBtnRef)

  return (
    <section id="projects" ref={sectionRef} className="relative bg-luminous py-20 md:py-28 px-4 overflow-hidden" aria-labelledby="projects-title">
      {/* ambient floaters — subtle, behind content */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb absolute right-[10%] top-[12%] w-10 h-10 opacity-30" style={{ animation: 'float-orb 8s ease-in-out infinite', filter: 'blur(3px)' }} />
        <div className="shard absolute left-[6%] top-[55%] w-10 h-8 rounded-2xl opacity-25" style={{ animation: 'drift 12s ease-in-out infinite' }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* 1 · Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-electric-300 px-4 py-1.5 rounded-full glass-frost">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-300 shadow-[0_0_8px_#4fc3ff]" />
            {n.badge}
          </span>
          <h2 id="projects-title" className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-6 leading-[1.05] tracking-[-0.03em] drop-shadow-[0_2px_16px_rgba(0,20,79,0.6)]">
            {n.title}
          </h2>
          <p className="text-white/60 text-lg md:text-xl mt-6 leading-relaxed">{n.subtitle}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <a
              ref={ctaBtnRef}
              href={n.ctaLink}
              className="btn-3d inline-flex items-center gap-2 text-base font-bold px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95"
            >
              {n.ctaText} <span aria-hidden>→</span>
            </a>
            <a
              href="#plumbers"
              className="inline-flex items-center gap-2 text-white/85 text-base font-medium px-8 py-3.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md transition-all hover:bg-white/15 hover:scale-[1.03] active:scale-95"
            >
              See verified plumbers
            </a>
          </div>
        </div>

        {/* 2 · Bento grid */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 list-none">
          {tiles.map((t, i) => (
            t.src || t.emoji
              ? <PhotoCard key={`ph-${i}`} p={t} itemRef={(el) => { tileEls.current[i] = el }} onOpen={() => setOpenProject(t)} />
              : <FeatureCard key={t.title} f={t} itemRef={(el) => { tileEls.current[i] = el }} />
          ))}
        </ul>
        {openProject && <PhotoLightbox project={openProject} onClose={() => setOpenProject(null)} />}

        {/* 3 · Stats band */}
        <dl ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mt-16 md:mt-20">
          {n.stats.map((s, i) => (
            <div key={i} className="metric-pill rounded-2xl px-6 py-5 text-center">
              <dd className="font-mono text-2xl md:text-3xl font-bold text-white tracking-tight">
                {s.count ? <AnimatedCounter target={Number(s.value)} suffix={s.suffix || ''} /> : `${s.value}${s.suffix || ''}`}
              </dd>
              <dt className="text-white/55 text-xs mt-1.5">{s.label}</dt>
            </div>
          ))}
        </dl>

        {/* 4 · CTA band */}
        <div ref={ctaRef} className="relative mt-16 md:mt-24 glass-frost rounded-3xl px-6 py-12 md:py-16 text-center overflow-hidden">
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, transparent 65%)' }} />
          <div className="relative">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-[-0.02em]">
              Ready to fix your plumbing problem?
            </h3>
            <p className="text-white/60 text-base md:text-lg mt-4 max-w-xl mx-auto">
              Get an instant AI diagnosis, then book a verified plumber who arrives on time — guaranteed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <a
                ref={emeraldBtnRef}
                href="#plumbers"
                className="btn-emerald inline-flex items-center gap-2 text-base font-bold px-9 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95"
              >
                Book a Plumber
              </a>
              <span className="text-white/45 text-sm">
                24/7 emergency support · <span className="font-mono">+977-9851110441</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
