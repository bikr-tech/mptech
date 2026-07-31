import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

function AnimatedCounter({ target, suffix = '' }) {
  const ref = useRef(null)
  useGSAP(() => {
    const el = ref.current
    if (!el) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => { el.textContent = Math.round(obj.val) + suffix },
    })
  }, { scope: ref, dependencies: [target, suffix] })
  return <span ref={ref}>0</span>
}

function Badge({ label, type }) {
  const colors = {
    verified: 'bg-green-900/40 text-green-300 border-green-700',
    insurance: 'bg-blue-900/40 text-blue-300 border-blue-700',
    background: 'bg-purple-900/40 text-purple-300 border-purple-700',
    guarantee: 'bg-amber-900/40 text-amber-300 border-amber-700',
    pan: 'bg-slate-800 text-slate-300 border-slate-600',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium ${colors[type] || colors.verified}`}>
      {label}
    </span>
  )
}

export default function TrustBannerBlock({ content }) {
  const { headline, stats, badges, reviews } = content || {}
  const sectionRef = useRef(null)
  const statRef = useRef(null)
  const badgRef = useRef(null)
  const revRef = useRef(null)
  const reduced = useReducedMotion()

  const defaultStats = [
    { value: 4.8, suffix: '★', label: 'Average Rating' },
    { value: 3200, suffix: '+', label: 'Jobs Completed' },
    { value: 30, suffix: ' min', label: 'Average Response' },
  ]

  const defaultBadges = [
    { label: '✓ Verified Plumbers', type: 'verified' },
    { label: '✓ Insured & Bonded', type: 'insurance' },
    { label: '✓ Background Checked', type: 'background' },
    { label: '✓ Satisfaction Guaranteed', type: 'guarantee' },
    { label: '✓ PAN Verified', type: 'pan' },
  ]

  const defaultReviews = [
    { rating: 5, text: 'Uploaded a photo of my leaking pipe. Got estimate and plumber in 10 minutes. Fixed same day.', author: 'Rajesh Sharma, Kathmandu' },
    { rating: 5, text: 'Emergency toilet blockage at 2am. AI diagnosed it instantly. Plumber arrived in 20 min. Lifesaver.', author: 'Anita Poudel, Lalitpur' },
    { rating: 4, text: 'Fair price, no hidden charges. AI estimate matched exactly what I paid.', author: 'Sagar Thapa, Bhaktapur' },
  ]

  const s = stats || defaultStats
  const b = badges || defaultBadges
  const r = reviews || defaultReviews

  useGSAP(() => {
    if (reduced) return
    gsap.from(statRef.current?.children, { immediateRender: false, y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.normal, ease: EASES.out, scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } })
    gsap.from(badgRef.current?.children, { immediateRender: false, scale: 0.8, opacity: 0, stagger: 0.05, duration: DURATIONS.fast, ease: EASES.out, scrollTrigger: { trigger: badgRef.current, start: 'top 85%' } })
    gsap.from(revRef.current?.children, { immediateRender: false, x: -20, opacity: 0, stagger: 0.08, duration: DURATIONS.normal, ease: EASES.out, scrollTrigger: { trigger: revRef.current, start: 'top 80%' } })
  }, { scope: sectionRef, dependencies: [reduced] })

  return (
    <section id="trust" ref={sectionRef} className="bg-slate-900 py-16 px-4 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div ref={statRef} className="grid grid-cols-3 gap-8 mb-12 text-center">
          {s.map((stat, i) => (
            <div key={i}>
              <div className="text-3xl md:text-5xl font-bold text-brand-accent">
                {stat.value === 4.8 ? '4.8★' : <AnimatedCounter target={stat.value} suffix={stat.suffix || ''} />}
              </div>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div ref={badgRef} className="flex flex-wrap justify-center gap-3 mb-12">
          {b.map((badge, i) => (
            <Badge key={i} label={badge.label} type={badge.type} />
          ))}
        </div>

        <div ref={revRef} className="grid md:grid-cols-3 gap-6">
          {r.map((rev, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex gap-1 text-amber-400 text-sm mb-3">
                {Array.from({ length: rev.rating || 5 }).map((_, s) => <span key={s}>★</span>)}
              </div>
              <p className="text-slate-300 text-sm italic mb-3">&ldquo;{rev.text}&rdquo;</p>
              <p className="text-brand-copper text-xs font-semibold">— {rev.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
