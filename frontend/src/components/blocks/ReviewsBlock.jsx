import { useRef, useState, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'

function Stars({ rating }) {
  return (
    <div className="flex gap-1 shrink-0">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'text-amber-400' : 'text-slate-600'}>
          ★
        </span>
      ))}
    </div>
  )
}

function ReviewCard({ review, width }) {
  return (
    <div
      className="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 shrink-0 mx-3"
      style={{ width }}
    >
      <Stars rating={review.rating} />
      <p className="text-base md:text-lg text-white my-4 italic leading-relaxed">
        &ldquo;{review.text}&rdquo;
      </p>
      <p className="text-brand-copper font-semibold text-sm">— {review.author}</p>
    </div>
  )
}

function useContainerWidth() {
  const [width, setWidth] = useState(400)
  const ref = useRef(null)

  const measure = useCallback(() => {
    if (!ref.current) return
    const parentW = ref.current.offsetWidth
    setWidth(Math.min(parentW - 32, 400))
  }, [])

  useGSAP(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  return { ref, width }
}

export default function ReviewsBlock({ content }) {
  const { reviews, title, subtitle } = content || {}
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const headerRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)
  const tlRef = useRef(null)
  const reduced = useReducedMotion()
  const { ref: containerRef, width: cardWidth } = useContainerWidth()

  useGSAP(() => {
    if (reduced || !reviews?.length) return

    const cards = trackRef.current?.children
    if (!cards || cards.length === 0) return

    const totalWidth = cards[0].offsetWidth + 24

    gsap.from(headerRef.current?.children, {
      y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out,
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
    })

    const tl = gsap.timeline({ repeat: -1, paused: isPaused })
    tl.to(trackRef.current, {
      x: () => -(totalWidth * reviews.length),
      duration: reviews.length * 4,
      ease: 'none',
    })
    tl.set(trackRef.current, { x: 0 })

    tlRef.current = tl

    return () => { tl.kill() }
  }, { scope: sectionRef, dependencies: [reduced, reviews?.length, cardWidth] })

  useGSAP(() => {
    if (!tlRef.current) return
    if (isPaused) tlRef.current.pause()
    else tlRef.current.resume()
  }, [isPaused])

  if (!reviews || reviews.length === 0) {
    return (
      <section id="reviews" className="min-h-screen bg-slate-800 py-16 px-4 flex items-center justify-center">
        <p className="text-slate-500">No reviews yet</p>
      </section>
    )
  }

  return (
    <section id="reviews" ref={sectionRef} className="min-h-screen bg-slate-800 py-20 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef}>
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-4">
            {title || 'What Our Customers Say'}
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            {subtitle || 'Real reviews from real customers'}
          </p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div ref={trackRef} className="flex">
          {[...reviews, ...reviews].map((review, i) => (
            <ReviewCard key={i} review={review} width={cardWidth} />
          ))}
        </div>
      </div>
    </section>
  )
}
