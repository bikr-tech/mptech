import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import Valve3D from '../canvas/Valve3D'
import Gauge3D from '../canvas/Gauge3D'

export default function EmergencyBlock({ content }) {
  const [valveOpen, setValveOpen] = useState(false)
  const bannerRef = useRef(null)
  const { phone, emergency_header, response_time } = content || {}

  useEffect(() => {
    if (!bannerRef.current) return
    if (valveOpen) {
      gsap.to(bannerRef.current, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
    } else {
      gsap.to(bannerRef.current, { y: -100, opacity: 0, duration: 0.4, ease: 'power2.in' })
    }
  }, [valveOpen])

  return (
    <section className="emergency-section relative min-h-screen bg-luminous py-16 px-4">
      <div
        ref={bannerRef}
        className="fixed top-0 left-0 w-full z-50 bg-brand-emergency text-white text-center py-4 shadow-2xl transform -translate-y-full opacity-0"
      >
        <p className="text-2xl font-bold">{emergency_header || '🚨 Emergency Service Available 24/7'}</p>
        <a href={`tel:${phone || '+15551234567'}`} className="text-xl underline underline-offset-4 hover:text-yellow-200">
          {phone || '(555) 123-4567'}
        </a>
        {response_time && <p className="text-sm mt-1">Response time: {response_time}</p>}
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-8">
          Emergency Services
        </h2>
        <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
          Turn the valve to activate emergency mode and reveal our 24/7 contact banner
        </p>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="h-[400px] rounded-xl overflow-hidden bg-deep-800 border border-white/10">
            <Valve3D
              valveOpen={valveOpen}
              onValveToggle={(open) => setValveOpen(open)}
            />
          </div>
          <div className="h-[300px] rounded-xl overflow-hidden bg-deep-800 border border-white/10">
            <Gauge3D pressure={valveOpen ? 1 : 0} />
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-white/50 text-sm">
            Pressure: {valveOpen ? 'CRITICAL' : 'NORMAL'} | Valve: {valveOpen ? 'OPEN' : 'CLOSED'}
          </p>
        </div>
      </div>
    </section>
  )
}
