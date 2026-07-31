import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_PLUMBERS = [
  { id: 'p1', name: 'Rajesh Sharma', rating: 4.8, jobs: 342, distance: '0.8 km', eta: '5 min', price_range: '$$', online: true, specialty: 'Gas & Water' },
  { id: 'p2', name: 'Arun Thapa', rating: 4.6, jobs: 218, distance: '1.2 km', eta: '7 min', price_range: '$$$', online: true, specialty: 'Drainage' },
  { id: 'p3', name: 'Binod Gurung', rating: 4.9, jobs: 527, distance: '2.1 km', eta: '10 min', price_range: '$', online: false, specialty: 'Emergency' },
]

const DEFAULT_CITIES = ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur']

const MARKER_POSITIONS = [
  { top: '25%', left: '30%' },
  { top: '55%', left: '65%' },
  { top: '70%', left: '25%' },
]

const MARKER_COLORS = [
  { ring: 'border-emerald-400/60', dot: 'bg-emerald-400', glow: 'rgba(52,211,153,0.3)' },
  { ring: 'border-amber-400/60', dot: 'bg-amber-400', glow: 'rgba(251,191,36,0.3)' },
  { ring: 'border-rose-400/60', dot: 'bg-rose-400', glow: 'rgba(244,63,94,0.3)' },
]

function PlumberCard({ plumber }) {
  const statusColor = plumber.online ? 'bg-green-400' : 'bg-slate-400'
  const statusLabel = plumber.online ? 'Online' : 'Away'
  const initials = plumber.name.split(' ').map(n => n[0]).join('')

  return (
    <div className="relative bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-xl p-4 hover:border-brand-accent/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-accent/5">
      <div className="flex items-start gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-accent to-brand-copper flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-semibold text-sm truncate">{plumber.name}</h4>
          <p className="text-slate-400 text-xs truncate">{plumber.specialty}</p>
        </div>
        <span className={`inline-block w-2 h-2 rounded-full ${statusColor} mt-2 shrink-0 shadow-[0_0_6px] ${plumber.online ? 'shadow-green-400/50' : 'shadow-slate-400/30'}`} title={statusLabel} />
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 flex-wrap">
        <span className="text-amber-400">{'★'.repeat(Math.floor(plumber.rating))}{plumber.rating % 1 >= 0.5 ? '½' : ''} {plumber.rating}</span>
        <span className="text-slate-600">|</span>
        <span>{plumber.distance}</span>
        <span className="text-emerald-400 font-medium">{plumber.eta}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-brand-copper font-bold text-sm">{plumber.price_range}</span>
        <button className="text-xs bg-brand-accent hover:bg-brand-accent/90 active:scale-95 text-white px-4 py-1.5 rounded-lg font-medium transition-all duration-200">
          Book Now
        </button>
      </div>
    </div>
  )
}

function MapArea({ activeCity, cities, onCityChange }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 h-[250px] md:h-auto md:aspect-[16/10] group hover:scale-[1.02] transition-transform duration-500">
      <div className="absolute top-3 left-3 z-10">
        <select
          value={activeCity}
          onChange={e => onCityChange(e.target.value)}
          className="text-xs bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-white rounded-lg px-3 py-1.5 outline-none focus:border-brand-accent cursor-pointer appearance-none pr-7"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center',
          }}
        >
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.04) 0%, transparent 70%)',
            'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(51,65,85,0.25) 39px, rgba(51,65,85,0.25) 40px)',
            'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(51,65,85,0.25) 39px, rgba(51,65,85,0.25) 40px)',
          ].join(', '),
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.07) 0%, rgba(6,182,212,0.02) 40%, transparent 70%)',
        }}
      />

      <svg className="absolute inset-0 w-full h-full z-[1] pointer-events-none">
        {MARKER_POSITIONS.map((m, i) => (
          <line
            key={i}
            x1="50%" y1="50%"
            x2={m.left} y2={m.top}
            stroke="rgba(34,211,238,0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        ))}
      </svg>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2]">
        <div className="w-4 h-4">
          <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-50 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />
        </div>
      </div>

      {MARKER_POSITIONS.map((m, i) => {
        const c = MARKER_COLORS[i]
        return (
          <div key={i} className="absolute z-[2]" style={{ top: m.top, left: m.left, transform: 'translate(-50%,-50%)' }}>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border ${c.ring} opacity-40`} />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border ${c.ring} opacity-20`} />
            <div className={`w-3 h-3 rounded-full ${c.dot} relative`} style={{ boxShadow: `0 0 8px ${c.glow}` }} />
          </div>
        )
      })}

      <div className="absolute bottom-2 right-3 text-[10px] text-slate-600 z-[2] tracking-wider">
        PlumbNepal &middot; LIVE
      </div>
    </div>
  )
}

export default function MapBlock({ content }) {
  const headline = content?.headline
  const subheadline = content?.subheadline
  const cities = content?.cities?.length ? content.cities : DEFAULT_CITIES
  const plumbers = content?.plumbers?.length ? content.plumbers : DEFAULT_PLUMBERS

  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const cardsRef = useRef(null)
  const mapContainerRef = useRef(null)
  const reduced = useReducedMotion()
  const [activeCity, setActiveCity] = useState(cities[0])
  const [mapVisible, setMapVisible] = useState(false)

  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setMapVisible(true); obs.disconnect() }
      },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useGSAP(() => {
    if (reduced) return
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
    })
    tl.from(headerRef.current?.children, { immediateRender: false, y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out })
      .from(cardsRef.current?.children, { immediateRender: false, y: 40, opacity: 0, stagger: { each: 0.08, from: 'start' }, duration: DURATIONS.normal, ease: EASES.out }, '-=0.2')
      .from(mapContainerRef.current, { immediateRender: false, scale: 0.95, opacity: 0, duration: DURATIONS.reveal, ease: EASES.out }, '-=0.35')
  }, { scope: sectionRef, dependencies: [reduced] })

  return (
    <section ref={sectionRef} className="bg-slate-900 py-16 md:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div ref={headerRef} className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
            {headline || 'Find a Plumber Near You'}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
            {subheadline || 'Real-time map of available plumbers in your area'}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="order-first md:order-last md:col-span-2 space-y-3" ref={cardsRef}>
            {plumbers.slice(0, 3).map((plumber) => (
              <PlumberCard key={plumber.id} plumber={plumber} />
            ))}
            <button className="text-brand-accent hover:text-brand-copper text-sm font-medium transition-colors mt-1 block">
              View all {plumbers.length} available plumbers &rarr;
            </button>
          </div>

          <div ref={mapContainerRef} className="order-last md:order-first md:col-span-3">
            {mapVisible ? (
              <MapArea activeCity={activeCity} cities={cities} onCityChange={setActiveCity} />
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 h-[250px] md:aspect-[16/10] flex items-center justify-center">
                <span className="text-slate-600 text-sm">Loading map&hellip;</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
