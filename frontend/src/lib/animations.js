import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export const DURATIONS = {
  fast: 0.3,
  normal: 0.6,
  slow: 1,
  reveal: 0.8,
  stagger: 0.08,
}

export const EASES = {
  out: 'power2.out',
  inOut: 'power2.inOut',
  elastic: 'back.out(1.7)',
  bounce: 'bounce.out',
}

export function breakpoint(width = 768) {
  if (typeof window === 'undefined') return false
  return window.innerWidth < width
}

export function staggerPreset(itemCount, baseDelay = 0) {
  return {
    stagger: { each: DURATIONS.stagger, from: 'start' },
    delay: baseDelay,
    duration: DURATIONS.normal,
    ease: EASES.out,
  }
}

export function sectionEntrance(direction = 'up') {
  const y = direction === 'up' ? 60 : direction === 'down' ? -60 : 0
  const x = direction === 'left' ? -60 : direction === 'right' ? 60 : 0
  return { y, x, opacity: 0, duration: DURATIONS.reveal, ease: EASES.out }
}
