import { useState, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

function PlumberCard({ plumber, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(plumber.id)}
      className={`w-full text-left bg-slate-800 border rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${
        selected ? 'border-brand-accent ring-2 ring-brand-accent/30' : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-copper to-amber-600 flex items-center justify-center text-white text-xl font-bold">
            {plumber.name.charAt(0)}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900 ${plumber.online ? 'bg-green-400' : 'bg-slate-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold truncate">{plumber.name}</h3>
            {plumber.ai_recommended && (
              <span className="shrink-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                AI RECOMMENDED
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>{'★'.repeat(Math.round(plumber.rating || 5))} {plumber.rating}</span>
            <span>{plumber.jobs}+ jobs</span>
            <span>{plumber.distance}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-green-400 text-xs font-medium">{plumber.eta}</span>
            <span className="text-brand-copper text-xs font-bold">{plumber.price_range}</span>
          </div>
        </div>
      </div>
      {plumber.badges?.length > 0 && (
        <div className="flex gap-2 mt-3">
          {plumber.badges.map((b, i) => (
            <span key={i} className="text-[10px] text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">{b}</span>
          ))}
        </div>
      )}
    </button>
  )
}

export default function PlumbersMatchBlock({ content }) {
  const { headline, subheadline, plumbers } = content || {}
  const [selectedId, setSelectedId] = useState(null)
  const [showBooking, setShowBooking] = useState(false)
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const cardsRef = useRef(null)
  const reduced = useReducedMotion()

  const defaultPlumbers = plumbers?.length ? plumbers : [
    { id: 'p1', name: 'Ram Bahadur Thapa', rating: 4.9, jobs: 847, distance: '1.2 km', eta: '12 min', price_range: 'Rs 1,500 - 2,000', online: true, ai_recommended: true, badges: ['Verified', 'Background Checked', '10+ yrs exp'] },
    { id: 'p2', name: 'Sita Devi Sharma', rating: 4.8, jobs: 623, distance: '2.5 km', eta: '18 min', price_range: 'Rs 1,200 - 1,800', online: true, ai_recommended: false, badges: ['Verified', 'Insured'] },
    { id: 'p3', name: 'Krishna Prasad Acharya', rating: 4.7, jobs: 512, distance: '3.8 km', eta: '22 min', price_range: 'Rs 1,000 - 1,500', online: false, ai_recommended: false, badges: ['Verified'] },
  ]

  useGSAP(() => {
    if (reduced) return
    gsap.from(headerRef.current?.children, { immediateRender: false, y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out, scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } })
    gsap.from(cardsRef.current?.children, { immediateRender: false, y: 40, opacity: 0, stagger: 0.08, duration: DURATIONS.normal, ease: EASES.out, scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } })
  }, { scope: sectionRef, dependencies: [reduced] })

  function handleBooking() {
    setShowBooking(true)
  }

  const bookStep = showBooking ? (
    <div className="max-w-md mx-auto space-y-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-bold text-lg mb-4 text-center">Book {defaultPlumbers.find(p => p.id === selectedId)?.name}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">When do you need service?</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-brand-accent text-white text-sm py-2 rounded-lg font-medium">ASAP</button>
              <button className="bg-slate-700 text-slate-300 text-sm py-2 rounded-lg">Schedule</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Your phone number</label>
            <input type="tel" placeholder="98XXXXXXXX" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Location</label>
            <input type="text" placeholder="Enter your address" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <span className="inline-block"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm5 15h-2v-2h-2v-2h-2v2H9v2H7v-2h2v-2h2v-2h2v2h2v2h2v2z'/%3E%3C/svg%3E" alt="eSewa" className="h-6" /></span>
            <span className="inline-block"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm5 15h-2v-2h-2v-2h-2v2H9v2H7v-2h2v-2h2v-2h2v2h2v2h2v2z'/%3E%3C/svg%3E" alt="Khalti" className="h-6" /></span>
          </div>
          <button className="w-full bg-brand-copper hover:bg-amber-600 text-white font-bold py-3 rounded-lg text-sm transition">
            Confirm Booking — Pay Deposit
          </button>
          <p className="text-slate-500 text-xs text-center">Free cancellation up to 1hr before</p>
        </div>
      </div>
    </div>
  ) : null

  return (
    <section id="plumbers" ref={sectionRef} className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div ref={headerRef} className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {headline || 'Available Plumbers Near You'}
          </h2>
          <p className="text-lg text-slate-300">
            {subheadline || 'AI-matched plumbers ready to fix your issue'}
          </p>
        </div>

        {!showBooking ? (
          <>
            <div ref={cardsRef} className="space-y-3 max-w-lg mx-auto">
              {defaultPlumbers.map((plumber) => (
                <PlumberCard key={plumber.id} plumber={plumber} selected={selectedId === plumber.id} onSelect={setSelectedId} />
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                disabled={!selectedId}
                onClick={handleBooking}
                className="bg-brand-accent hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-lg"
              >
                {selectedId ? 'Book This Plumber' : 'Select a Plumber'}
              </button>
              <p className="text-slate-500 text-xs mt-3">
                Price estimate shown upfront. No hidden charges.
              </p>
            </div>

            <div className="flex justify-center gap-6 mt-10 text-xs text-slate-500">
              <span>🔒 Secure payment via eSewa, Khalti, Prabhu Pay</span>
              <span>🔄 Free cancellation up to 1hr before</span>
              <span>✅ Rebooking guarantee if no-show</span>
            </div>
          </>
        ) : bookStep}
      </div>
    </section>
  )
}
