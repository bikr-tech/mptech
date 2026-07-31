import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

export default function FinalCTA({ content }) {
  const c = content || {}
  const { headline, subheadline, cta_text, cta_link, trust_phone, trust_stats } = c

  const sectionRef = useRef(null)
  const textRef = useRef(null)
  const ctaRef = useRef(null)
  const trustRef = useRef(null)
  const overlayRef = useRef(null)
  const reduced = useReducedMotion()

  const h = headline || 'Ready to fix your plumbing problem?'
  const sub = subheadline || 'AI-powered diagnosis. Verified plumbers. Transparent pricing.'
  const ctaT = cta_text || 'Start AI Diagnosis Now'
  const ctaL = cta_link || '#ai-diagnosis'
  const phone = trust_phone || '1660-XX-XXXX'
  const stats = trust_stats || '★★★★★ 4.8 average | 25,000+ repairs | We\'ve helped thousands of customers'

  useGSAP(() => {
    if (reduced) return

    const tl = gsap.timeline({ defaults: { duration: DURATIONS.slow, ease: EASES.out } })
    tl.from(textRef.current?.children, { immediateRender: false, y: 30, opacity: 0, stagger: 0.15, duration: DURATIONS.reveal })
      .from(ctaRef.current, { immediateRender: false, scale: 0.8, opacity: 0, duration: DURATIONS.normal, ease: EASES.elastic }, '-=0.2')
      .from(trustRef.current, { immediateRender: false, y: 20, opacity: 0, duration: DURATIONS.fast }, '-=0.1')

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        gsap.set(overlayRef.current, { opacity: 0.3 + self.progress * 0.7 })
      },
    })
  }, { scope: sectionRef, dependencies: [reduced] })

  return (
    <section ref={sectionRef} className="relative w-full py-20 px-4 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900">
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
          opacity: 0.3,
        }}
      />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div ref={textRef}>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {h}
          </h2>
          <p className="text-lg md:text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            {sub}
          </p>
        </div>

        <div ref={ctaRef} className="flex flex-col items-center justify-center gap-4">
          <a
            href={ctaL}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-glow-blue cta-pulse transition-all hover:scale-105 active:scale-95"
          >
            {ctaT} →
          </a>
        </div>

        <p className="text-slate-400 text-sm mt-4">
          📞 or call <a href={`tel:${phone}`} className="text-blue-300 hover:text-blue-200 underline">{phone}</a> for emergency service
        </p>

        <div ref={trustRef} className="mt-8 text-sm text-slate-400">
          {stats}
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.2); }
        }
        .cta-pulse { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>
    </section>
  )
}
