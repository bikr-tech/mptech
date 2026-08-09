import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import { useAuth } from '../../context/AuthContext'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

function TrustedIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l7 3v6c0 4.6-3 8.6-7 10-4-1.4-7-5.4-7-10V5l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'AI Diagnosis', href: '#ai-diagnosis' },
  { label: 'Projects', href: '#projects' },
  { label: 'Reviews', href: '#reviews' },
]

export default function Navbar() {
  const { user, role } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const navRef = useRef(null)
  const pillRef = useRef(null)
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
      onEnter: () => gsap.to(pillRef.current, {
        backgroundColor: 'rgba(255,255,255,0.88)',
        boxShadow: '0 20px 50px -20px rgba(2,20,47,0.55), inset 0 1px 0 rgba(255,255,255,0.9)',
        duration: 0.3,
      }),
      onLeaveBack: () => gsap.to(pillRef.current, {
        backgroundColor: 'rgba(255,255,255,0.72)',
        boxShadow: '0 20px 50px -20px rgba(2,20,47,0.55), inset 0 1px 0 rgba(255,255,255,0.9)',
        duration: 0.3,
      }),
    })
  }, [reduced])

  const authDest = user ? (role === 'admin' ? '/admin' : role === 'plumber' ? '/plumber' : '/account') : '/login'
  const authLabel = user ? 'My account' : 'Sign in'

  // Close overlays on scroll / outside click
  useEffect(() => {
    const onDown = () => { setMenuOpen(false); setLangOpen(false) }
    window.addEventListener('resize', onDown)
    window.addEventListener('scroll', onDown, { passive: true })
    return () => {
      window.removeEventListener('resize', onDown)
      window.removeEventListener('scroll', onDown)
    }
  }, [])

  return (
    <nav ref={navRef} className="fixed top-0 left-0 w-full z-50 px-4 md:px-6">
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <a href="/" className="text-[22px] md:text-2xl font-bold tracking-tight text-white shrink-0" style={{ fontFamily: 'var(--font-family-display)' }}>
          MPTech<span className="text-electric-300">.</span>
        </a>

        {/* Frosted white glass pill menu — center */}
        <div
          ref={pillRef}
          className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-full glass-pill text-slate-800"
        >
          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium text-slate-700 hover:bg-white/70 transition-colors"
            onClick={() => setLangOpen(!langOpen)}
            aria-haspopup="listbox"
            aria-expanded={langOpen}
          >
            <TrustedIcon className="w-4 h-4 text-electric-500" />
            <span>Trusted</span>
            <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div className="relative">
            <button
              className="px-2.5 py-1 rounded-full text-sm font-medium text-slate-700 hover:bg-white/70 transition-colors"
              onClick={() => setLangOpen(!langOpen)}
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              EN
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-2 rounded-xl glass-pill p-1.5 min-w-[120px]">
                {['English', 'Nepali'].map((l) => (
                  <button key={l} className="block w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-white/80 transition-colors">
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a href="#help" className="px-2.5 py-1 rounded-full text-sm font-medium text-slate-700 hover:bg-white/70 transition-colors">
            Help
          </a>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="px-2.5 py-1 rounded-full text-sm font-medium text-slate-700 hover:bg-white/70 transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        {/* Auth entry */}
        {!user && (
          <Link to="/login?mode=signup" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full btn-3d transition-all hover:-translate-y-0.5">
            Sign up
          </Link>
        )}
        <Link to={authDest} className="hidden md:inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full text-white/90 border border-white/20 bg-white/5 backdrop-blur-md transition-all hover:bg-white/15">
          {authLabel}
        </Link>

        {/* Standalone 3D blue CTA — far right */}
        <a
          href="#ai-diagnosis"
          className="btn-3d hidden md:inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95"
        >
          Request Diagnosis Now
        </a>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-white glass-frost"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-1 rounded-2xl glass-frost p-4 space-y-2">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block text-white/90 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
              {l.label}
            </a>
          ))}
          {!user && (
            <Link to="/login?mode=signup" onClick={() => setMenuOpen(false)} className="block text-white/90 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
              Sign up
            </Link>
          )}
          <Link to={authDest} onClick={() => setMenuOpen(false)} className="block text-white/90 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
            {authLabel}
          </Link>
          <a href="#ai-diagnosis" onClick={() => setMenuOpen(false)} className="btn-3d block text-center text-sm font-semibold px-4 py-3 rounded-full">
            Request Diagnosis Now
          </a>
        </div>
      )}
    </nav>
  )
}
