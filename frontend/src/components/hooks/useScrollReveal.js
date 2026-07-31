import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

export default function useScrollReveal({ scope, from, start = 'top 85%', toggleActions = 'play none none reverse', targets } = {}) {
  const reduced = useReducedMotion()
  const tl = useRef(null)

  useGSAP(() => {
    if (reduced) return

    const t = targets || scope?.current?.children
    if (!t) return

    tl.current = gsap.from(t, {
      ...(from || { y: 60, opacity: 0 }),
      duration: DURATIONS.reveal,
      ease: EASES.out,
      stagger: { each: 0.08, from: 'start' },
      scrollTrigger: {
        trigger: scope?.current,
        start,
        toggleActions,
      },
    })
  }, { scope, dependencies: [reduced] })

  return tl
}
