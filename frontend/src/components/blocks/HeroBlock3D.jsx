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
      return <div className="w-full h-full bg-gradient-to-br from-slate-900 to-blue-900" />
    }
    return this.props.children
  }
}

export default function HeroBlock3D({ content, settingsOverrides }) {
  const over = settingsOverrides?.content
  const c = { ...content, ...over }
  const { headline, subheadline, cta_text, cta_link, secondary_cta_text, secondary_cta_link, value_props, trust_stats, emergency_phone } = c
  const sectionRef = useRef(null)
  const textRef = useRef(null)
  const ctaRef = useRef(null)
  const propsRef = useRef(null)
  const trustRef = useRef(null)
  const badgeRef = useRef(null)
  const reduced = useReducedMotion()

  const defaultTrust = trust_stats?.length ? trust_stats : [
    { label: 'Average Rating', value: '4.8★' },
    { label: 'Jobs Completed', value: '3,200+' },
    { label: 'Avg Response', value: '30 min' },
  ]

  useGSAP(() => {
    if (reduced) return

    const tl = gsap.timeline({ defaults: { duration: DURATIONS.slow, ease: EASES.out } })

    tl.from(badgeRef.current, { y: -10, opacity: 0, duration: DURATIONS.fast })
      .from(textRef.current?.children, { y: 40, opacity: 0, stagger: 0.15, duration: DURATIONS.reveal }, '-=0.1')
      .from(ctaRef.current?.children, { scale: 0.8, opacity: 0, stagger: 0.1, duration: DURATIONS.normal, ease: EASES.elastic }, '-=0.3')
      .from(propsRef.current?.children, { y: 20, opacity: 0, stagger: 0.05, duration: DURATIONS.fast }, '-=0.2')
      .from(trustRef.current?.children, { y: 20, opacity: 0, stagger: 0.08, duration: DURATIONS.fast }, '-=0.1')

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        const progress = self.progress
        gsap.set(sectionRef.current.querySelector('.hero-content'), {
          y: progress * 80,
          opacity: 1 - progress * 0.5,
        })
      },
    })
  }, { scope: sectionRef, dependencies: [reduced] })

  return (
    <section ref={sectionRef} className={`hero-section relative h-screen w-full overflow-hidden ${settingsOverrides ? 'ring-2 ring-brand-accent' : ''}`}>
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-slate-900 to-blue-900" />}>
          <CanvasErrorBoundary>
            <HeroScene />
          </CanvasErrorBoundary>
        </Suspense>
      </div>

      <div className="hero-content relative z-10 flex flex-col items-center justify-center h-full text-center px-4 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40">
        {/* AI-powered badge pill */}
        <div ref={badgeRef} className="mb-4">
          <span className="inline-block bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg tracking-wide">
            AI-Powered
          </span>
        </div>

        {/* Pain activation headline */}
        <div ref={textRef}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg max-w-4xl">
            {headline || 'AI Finds Your Plumbing Problem Before The Plumber Arrives'}
          </h1>
          <p className="text-lg md:text-xl text-blue-200 mb-6 max-w-2xl mx-auto">
            {subheadline || 'Upload a photo. Get an instant estimate. Match with a verified plumber nearby.'}
          </p>
        </div>

        {/* Dual CTA — primary + secondary */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 items-center">
          <a
            href={cta_link || '#ai-diagnosis'}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-lg px-8 py-4 rounded-xl font-bold shadow-glow-blue transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
          >
            {cta_text || 'Start AI Diagnosis'} <span>→</span>
          </a>
          <a
            href={secondary_cta_link || '#services'}
            className="border-2 border-white/30 hover:border-white/60 text-white text-lg px-8 py-4 rounded-xl font-medium transition-all hover:bg-white/10 inline-flex items-center gap-2"
          >
            {secondary_cta_text || 'Book a Plumber'}
          </a>
        </div>

        {/* Trust bar below CTAs */}
        <div ref={trustRef} className="mt-4 text-slate-400 text-sm">
          4.8★ | 3,200+ jobs | 30-min avg response
        </div>

        {/* Value props */}
        {value_props && value_props.length > 0 && (
          <div ref={propsRef} className="flex flex-wrap gap-3 mt-6 justify-center">
            {value_props.map((prop, i) => (
              <span key={i} className="bg-slate-800/60 text-slate-200 px-3 py-1.5 rounded-full text-xs backdrop-blur-sm border border-slate-700">
                {prop}
              </span>
            ))}
          </div>
        )}

        {/* Trust anchor — always visible */}
        <div className="hidden">
          {defaultTrust.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-brand-copper">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency floater — desktop sidebar */}
      <div className="hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-40 group">
        <div className="bg-brand-emergency text-white px-3 py-6 rounded-l-xl shadow-2xl transition-all duration-300 hover:px-4 flex items-center gap-2 cursor-pointer"
          style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}>
          <span>🔴</span> 24/7 Emergency
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-red-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Call <a href={`tel:${emergency_phone || '+977-9800000000'}`} className="underline hover:text-blue-200">{emergency_phone || '1660-XX-XXXX'}</a>
        </div>
      </div>
    </section>
  )
}
