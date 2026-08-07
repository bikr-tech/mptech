import { Component, Suspense, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroScene from '../3d/HeroScene'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

class CanvasErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(e) { console.warn('Canvas error:', e.message) }
  render() {
    if (this.state.hasError) {
      return <div className="w-full h-full bg-gradient-to-br from-electric-800 to-deep-950" />
    }
    return this.props.children
  }
}

function CameraIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 8a2 2 0 012-2h2l2-3h6l2 3h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

export default function HeroBlock3D({ content, settingsOverrides }) {
  const over = settingsOverrides?.content
  const c = { ...content, ...over }
  const { headline, subheadline, cta_text, cta_link, secondary_cta_text, secondary_cta_link, value_props, trust_stats, emergency_phone } = c
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const reduced = useReducedMotion()

  const metrics = (trust_stats && trust_stats.length
    ? trust_stats
    : [
        { label: 'Jobs Completed', value: '3,200+' },
        { label: 'Avg Response', value: '30 min' },
        { label: 'Verified Pros', value: '100%' },
      ]
  ).slice(0, 3)

  useGSAP(() => {
    if (reduced) return
    const tl = gsap.timeline({ defaults: { duration: DURATIONS.reveal, ease: EASES.out } })
    tl.from(contentRef.current?.children, { y: 40, opacity: 0, stagger: 0.15 })
      .from('[data-hero-metrics]', { x: 40, opacity: 0, stagger: 0.1, duration: DURATIONS.normal }, '-=0.5')

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        const p = self.progress
        gsap.set(contentRef.current, { y: p * 70, opacity: 1 - p * 0.45 })
      },
    })
  }, { scope: sectionRef, dependencies: [reduced] })

  return (
    <section ref={sectionRef} className={`hero-section relative h-screen min-h-[680px] w-full overflow-hidden bg-luminous ${settingsOverrides ? 'ring-2 ring-brand-accent' : ''}`}>
      {/* 3D floaters — orbs, glass shards, bubbles w/ depth blur */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb absolute left-[8%] top-[18%] w-16 h-16 opacity-70" style={{ animation: 'float-orb 7s ease-in-out infinite', filter: 'blur(1px)' }} />
        <div className="orb absolute left-[42%] top-[8%] w-9 h-9 opacity-50" style={{ animation: 'float-orb 5s ease-in-out 0.8s infinite', filter: 'blur(2px)' }} />
        <div className="orb absolute right-[6%] top-[32%] w-24 h-24 opacity-40" style={{ animation: 'float-orb 9s ease-in-out 1.4s infinite', filter: 'blur(4px)' }} />
        <div className="orb absolute right-[18%] bottom-[14%] w-12 h-12 opacity-50" style={{ animation: 'float-orb 6s ease-in-out 2.1s infinite', filter: 'blur(1px)' }} />

        <div className="shard absolute left-[20%] top-[62%] w-14 h-14 rounded-2xl opacity-50" style={{ animation: 'drift 11s ease-in-out infinite' }} />
        <div className="shard absolute right-[12%] top-[12%] w-20 h-14 rounded-3xl opacity-30" style={{ animation: 'drift 14s ease-in-out 1s infinite', filter: 'blur(3px)' }} />
        <div className="shard absolute left-[48%] bottom-[8%] w-10 h-10 rounded-xl opacity-40" style={{ animation: 'drift 9s ease-in-out 2.4s infinite' }} />

        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="orb absolute bottom-[-6%] w-3 h-3 opacity-40"
            style={{
              left: `${8 + i * 19}%`,
              animation: `bubble-rise ${10 + i * 2.5}s linear ${i * 2.8}s infinite`,
              filter: 'blur(2px)',
            }}
          />
        ))}
      </div>

      {/* 3D cutaway asset — center column */}
      <div className="absolute inset-0 z-0 pointer-events-none md:pointer-events-auto">
        <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-electric-800 to-deep-950" />}>
          <CanvasErrorBoundary>
            <HeroScene />
          </CanvasErrorBoundary>
        </Suspense>
      </div>

      {/* Asymmetric 3-column content */}
      <div ref={contentRef} className="relative z-10 mx-auto max-w-7xl px-6 h-full flex flex-col justify-center lg:grid lg:grid-cols-3 lg:items-center lg:gap-6">
        {/* Col 1 — text + CTAs */}
        <div className="max-w-xl pt-24 lg:pt-0">
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/90 px-3.5 py-1.5 rounded-full glass-frost tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-electric-300 shadow-[0_0_8px_#4fc3ff]" />
              AI-POWERED
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-bold text-white leading-[1.04] tracking-[-0.03em] drop-shadow-[0_2px_16px_rgba(0,20,79,0.6)]">
            {headline || 'AI Finds Your Plumbing Problem Before The Plumber Arrives'}
          </h1>
          <p className="text-lg text-white/75 mt-5 max-w-md">
            {subheadline || 'Upload a photo. Get an instant estimate. Match with a verified plumber nearby.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a
              href={cta_link || '#ai-diagnosis'}
              className="btn-3d text-base font-bold px-8 py-4 rounded-full inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95"
            >
              {cta_text || 'Start AI Diagnosis'} <span aria-hidden>→</span>
            </a>
            <a
              href={secondary_cta_link || '#services'}
              className="text-white text-base font-medium px-8 py-4 rounded-full border border-white/25 bg-white/5 backdrop-blur-md inline-flex items-center justify-center gap-2 transition-all hover:bg-white/15 hover:scale-[1.03] active:scale-95"
            >
              {secondary_cta_text || 'Book a Plumber'}
            </a>
          </div>

          {value_props && value_props.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {value_props.map((prop, i) => (
                <span key={i} className="text-white/70 text-xs px-3 py-1.5 rounded-full glass-frost">
                  {prop}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Col 2 — reserved for the 3D cutaway scene (absolute layer above) */}
        <div className="hidden lg:block h-[420px]" aria-hidden />

        {/* Col 3 — vertical metric pills */}
        <div className="hidden lg:flex flex-col items-end gap-5" data-hero-metrics>
          {metrics.map((m, i) => (
            <div key={i} className={`metric-pill rounded-2xl px-6 py-4 text-right ${i === 0 ? 'w-52' : 'w-44'}`}>
              <div className="font-mono text-xl font-bold text-white tracking-tight">
                {m.value}
              </div>
              <div className="text-white/60 text-xs mt-1">{m.label}</div>
            </div>
          ))}
          <div className="metric-pill rounded-2xl px-6 py-4 text-right w-44">
            <div className="flex items-center justify-end gap-1.5 font-mono text-xl font-bold text-electric-300 tracking-tight">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 2l7 3v6c0 4.6-3 8.6-7 10-4-1.4-7-5.4-7-10V5l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Verified
            </div>
            <div className="text-white/60 text-xs mt-1">All pros screened</div>
          </div>
        </div>
      </div>

      {/* CTA icon micro-badge (camera) — anchor point for nav */}
      <span aria-hidden className="hidden">
        <CameraIcon />
      </span>
    </section>
  )
}
