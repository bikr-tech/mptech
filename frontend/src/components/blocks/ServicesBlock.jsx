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

const DEFAULT_SERVICES = [
  { icon: '🛠️', title: 'Leak Repair', description: 'Fix leaking pipes, faucets, and fixtures. Same-day service with 90-day warranty on all repairs.' },
  { icon: '💧', title: 'Drain Cleaning', description: 'Clear clogged drains, toilets, and sewer lines. Camera inspection included for stubborn blockages.' },
  { icon: '🚿', title: 'Bathroom Plumbing', description: 'Complete bathroom plumbing — toilets, showers, sinks, and tubs. Installation and repair.' },
  { icon: '🍳', title: 'Kitchen Plumbing', description: 'Kitchen sink, garbage disposal, dishwashers, and ice maker hookups. Leak-free guaranteed.' },
  { icon: '🔥', title: 'Water Heater', description: 'Tankless and traditional water heater repair, installation, and maintenance. 24/7 emergency service.' },
  { icon: '⚡', title: 'Emergency Repair', description: 'Burst pipes, gas leaks, flooding. Available 24/7 with 30-minute response time in Kathmandu valley.' },
  { icon: '🔧', title: 'Pipe Installation', description: 'New pipe installation, repiping, and fixture upgrades. Copper, PEX, and PVC — all materials.' },
  { icon: '🔍', title: 'Inspection & Camera', description: 'Video pipe inspection, leak detection, and preventative maintenance. Know exactly what\'s wrong.' },
]

const DEFAULT_STATS = [
  { target: 15, suffix: '+', label: 'Years Experience', color: 'text-brand-accent' },
  { target: 5000, suffix: '+', label: 'Jobs Completed', color: 'text-brand-copper' },
  { target: 98, suffix: '%', label: 'Satisfaction', color: 'text-green-400' },
]

export default function ServicesBlock({ content }) {
  const rawServices = content?.services
  const rawStats = content?.stats
  const services = rawServices?.length ? rawServices : DEFAULT_SERVICES
  const stats = rawStats?.length ? rawStats : DEFAULT_STATS
  const { title, subtitle } = content || {}
  const sectionRef = useRef(null)
  const cardsRef = useRef(null)
  const headerRef = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(() => {
    if (reduced) return
    ScrollTrigger.refresh()
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    })
    tl.from(headerRef.current?.children, { y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out, immediateRender: false })
      .from(cardsRef.current?.children, { y: 50, opacity: 0, immediateRender: false, stagger: { each: 0.06, from: 'start' }, duration: DURATIONS.normal, ease: EASES.out }, '-=0.2')
  }, { scope: sectionRef, dependencies: [reduced] })

  if (!services || services.length === 0) {
    return (
      <section id="services" className="min-h-screen bg-slate-900 py-16 px-4 flex items-center justify-center">
        <p className="text-slate-500">No services configured</p>
      </section>
    )
  }

  return (
    <section id="services" ref={sectionRef} className="min-h-screen bg-slate-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef}>
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-4">
            {title || 'Our Services'}
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            {subtitle || 'Comprehensive plumbing solutions for residential and commercial properties'}
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((svc, i) => (
            <div
              key={i}
              className="group bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-brand-accent transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-brand-accent/10"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{svc.icon || '🔧'}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{svc.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{svc.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto text-center">
          {stats.map((stat, i) => (
            <div key={i}>
              <div className={`text-3xl md:text-4xl font-bold ${stat.color || 'text-brand-accent'}`}>
                <AnimatedCounter target={stat.target} suffix={stat.suffix || ''} />
              </div>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
