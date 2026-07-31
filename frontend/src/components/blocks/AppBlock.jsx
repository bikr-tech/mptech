import { useRef, useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES, sectionEntrance, staggerPreset } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

function CheckIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const APP_SCREENS = [
  { icon: 'camera', label: 'AI Diagnosis', gradient: 'from-cyan-500 to-blue-600' },
  { icon: 'calendar', label: 'Smart Booking', gradient: 'from-violet-500 to-purple-600' },
  { icon: 'map-pin', label: 'Live Tracking', gradient: 'from-emerald-500 to-teal-600' },
  { icon: 'wallet', label: 'Easy Payments', gradient: 'from-amber-500 to-orange-600' },
]

function ScreenIcon({ name, className = 'w-6 h-6' }) {
  switch (name) {
    case 'camera':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l1-2h8l1 2h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
    case 'calendar':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'map-pin':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    case 'wallet':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="16" rx="2"/><path d="M1 10h22"/><circle cx="18" cy="14" r="2"/></svg>
    default:
      return null
  }
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div className="relative rounded-[2.5rem] bg-slate-800 border-4 border-slate-600 shadow-2xl shadow-brand-accent/10 overflow-hidden aspect-[9/19]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-1/3 h-6 bg-slate-900 rounded-b-xl flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-600" />
          <div className="w-12 h-1 rounded-full bg-slate-700" />
        </div>
        <div className="absolute inset-0 top-6 bottom-6 bg-slate-900">
          <div className="h-full flex flex-col items-center justify-center gap-3 px-4">
            {APP_SCREENS.map((s, i) => (
              <div
                key={s.label}
                className={`w-full rounded-xl bg-gradient-to-br ${s.gradient} p-3 shadow-lg flex items-center gap-3 text-white`}
                style={{ zIndex: APP_SCREENS.length - i }}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <ScreenIcon name={s.icon} />
                </div>
                <span className="text-sm font-semibold">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full bg-slate-600" />
      </div>
    </div>
  )
}

export default function AppBlock({ content }) {
  const { headline, subheadline, features } = content || {}
  const featureList = useMemo(() => features?.length ? features : [
    { title: 'AI-Powered Diagnosis', description: 'Snap a photo and our AI identifies the issue instantly, saving time and guesswork.' },
    { title: 'Smart Scheduling', description: 'Book appointments at your convenience with real-time calendar availability.' },
    { title: 'Live Plumber Tracking', description: 'Track your assigned plumber in real-time — know exactly when they arrive.' },
    { title: 'Secure Payments', description: 'Pay seamlessly through the app with multiple payment options.' },
  ], [features])

  const sectionRef = useRef(null)
  const phoneRef = useRef(null)
  const contentRef = useRef(null)
  const featureRefs = useRef([])
  const reduced = useReducedMotion()

  useGSAP(() => {
    if (reduced) return
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    })
    tl.from(phoneRef.current, { immediateRender: false, ...sectionEntrance('left'), duration: DURATIONS.reveal, ease: EASES.out }, 0)
      .from(contentRef.current?.children, { y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out }, '-=0.3')
      .from(featureRefs.current, { immediateRender: false, y: 20, opacity: 0, ...staggerPreset(featureList.length, 0) }, '-=0.1')
  }, { scope: sectionRef, dependencies: [reduced, featureList.length] })

  return (
    <section ref={sectionRef} className="bg-slate-900 py-20 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div ref={phoneRef} className="phone-wrapper flex justify-center md:justify-end">
            <PhoneMockup />
          </div>
          <div ref={contentRef}>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {headline || 'Your Plumbing Partner in Your Pocket'}
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              {subheadline || 'Download the PlumbNepal app to diagnose issues, book plumbers, track service in real-time, and pay securely — all from your phone.'}
            </p>
            <ul className="space-y-5 mb-10">
              {featureList.map((f, i) => (
                <li
                  key={i}
                  ref={(el) => { featureRefs.current[i] = el }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center">
                    <CheckIcon className="w-3.5 h-3.5 text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{f.title}</h3>
                    <p className="text-slate-400 text-sm">{f.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:border-brand-accent hover:shadow-glow-blue">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                App Store
              </a>
              <a href="#" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:border-brand-copper hover:shadow-glow-copper">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                Google Play
              </a>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .phone-wrapper {
          animation: float 4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .phone-wrapper { animation: none; }
        }
      `}</style>
    </section>
  )
}
