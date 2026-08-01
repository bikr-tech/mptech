import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef(null)
  const linksRef = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(() => {
    if (reduced) return
    gsap.from(navRef.current, { y: -80, opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.2 })
  }, [reduced])

  useGSAP(() => {
    if (reduced) return
    ScrollTrigger.create({
      trigger: '.hero-section',
      start: 'bottom top',
      onEnter: () => gsap.to(navRef.current, {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(30, 41, 59, 1)',
        duration: 0.3,
      }),
      onLeaveBack: () => gsap.to(navRef.current, {
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(30, 41, 59, 0.5)',
        duration: 0.3,
      }),
    })
  }, [reduced])

  useEffect(() => {
    const handler = () => { if (menuOpen) setMenuOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [menuOpen])

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 w-full z-50 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800/50 transition-colors"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-white tracking-tight">
          MPTech<span className="text-brand-accent">.</span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm" ref={linksRef}>
          <a href="#services" className="text-slate-300 hover:text-white transition-colors">Services</a>
          <a href="#ai-diagnosis" className="text-slate-300 hover:text-white transition-colors">AI Diagnosis</a>
          <a href="#reviews" className="text-slate-300 hover:text-white transition-colors">Reviews</a>
          <a href="#projects" className="text-slate-300 hover:text-white transition-colors">Projects</a>
          <a href="tel:+15551234567" className="bg-brand-copper hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-xs">
            Call Now
          </a>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-slate-300 hover:text-white p-2"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-4 space-y-3">
          <a href="#services" onClick={() => setMenuOpen(false)} className="block text-slate-300 hover:text-white transition-colors">Services</a>
          <a href="#ai-diagnosis" onClick={() => setMenuOpen(false)} className="block text-slate-300 hover:text-white transition-colors">AI Diagnosis</a>
          <a href="#reviews" onClick={() => setMenuOpen(false)} className="block text-slate-300 hover:text-white transition-colors">Reviews</a>
          <a href="#projects" onClick={() => setMenuOpen(false)} className="block text-slate-300 hover:text-white transition-colors">Projects</a>
          <a href="tel:+15551234567" className="block bg-brand-copper text-white px-4 py-2 rounded-lg text-center font-semibold">
            Call Now
          </a>
        </div>
      )}
    </nav>
  )
}
