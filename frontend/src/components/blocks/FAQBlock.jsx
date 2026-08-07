import { useRef, useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES, staggerPreset } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

function ChevronDown({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const DEFAULT_FAQS = [
  {
    category: 'Booking',
    questions: [
      { q: 'How do I book a plumber?', a: 'You can book through our website or mobile app. Select your issue, choose a convenient time slot, and confirm — your plumber will arrive as scheduled.' },
      { q: 'Can I schedule a service in advance?', a: 'Yes. You can schedule service up to 7 days in advance. Choose your preferred date and time during booking, and we will confirm availability.' },
      { q: 'What if I need emergency service?', a: 'Our emergency service is available 24/7. Call our emergency hotline or use the emergency button on our app for immediate dispatch.' },
    ],
  },
  {
    category: 'Pricing',
    questions: [
      { q: 'How much does plumbing service cost?', a: 'Pricing depends on the type of service. Standard visits start at NPR 500 for diagnosis. Complex repairs are quoted after inspection. We send a price estimate before work begins.' },
      { q: 'Is your pricing transparent?', a: 'Absolutely. You receive a detailed estimate before any work starts. No hidden charges, no surprise fees. What we quote is what you pay.' },
      { q: 'Are there any hidden fees?', a: 'No hidden fees. All costs — including parts, labor, and emergency surcharges — are clearly listed in your estimate. You approve all charges upfront.' },
    ],
  },
  {
    category: 'AI Diagnosis',
    questions: [
      { q: 'How accurate is the AI diagnosis?', a: 'Our AI model achieves over 90% accuracy for common plumbing issues when provided with clear photos. For complex cases, it narrows down possibilities for the plumber to confirm on site.' },
      { q: 'What AI model powers the diagnosis?', a: 'We use a custom computer vision model trained on thousands of plumbing scenarios, combining object detection and pattern recognition to identify leaks, clogs, cracks, and corrosion.' },
      { q: 'Do I need to take a photo?', a: 'A photo helps the AI provide the most accurate diagnosis, but you can also describe the issue in text. The AI works with either input.' },
      { q: 'Is the AI diagnosis free?', a: 'Yes, AI diagnosis is completely free. You can check your plumbing issue anytime without any charges.' },
    ],
  },
  {
    category: 'Emergency',
    questions: [
      { q: 'Are you available 24/7?', a: 'Yes. Our emergency plumbing service operates 24 hours a day, 7 days a week, including public holidays.' },
      { q: 'What is the response time for emergencies?', a: 'Our average emergency response time is 30-45 minutes within Kathmandu Valley. Areas outside the valley may take 60-90 minutes depending on distance.' },
      { q: 'Do you charge extra for holiday service?', a: 'A modest holiday surcharge applies for service on public holidays, clearly shown in your estimate before you approve the booking.' },
    ],
  },
  {
    category: 'Plumbers',
    questions: [
      { q: 'Who are your plumbers?', a: 'All our plumbers are licensed, experienced professionals with a minimum of 5 years in the field. Each undergoes thorough training in modern plumbing techniques.' },
      { q: 'Are plumbers background-checked?', a: 'Yes. Every plumber passes a comprehensive background check, including identity verification, certification validation, and reference checks before joining our network.' },
      { q: 'Can I choose my plumber?', a: 'Yes. After booking, you can view available plumbers, their ratings, and experience. You can select the one you prefer or let us assign the best match.' },
    ],
  },
]

function FAQCategory({ category, questions }) {
  return (
    <div className="mb-2">
      <h3 className="text-brand-copper font-semibold text-sm uppercase tracking-wider mb-3 px-1">
        {category}
      </h3>
      <ul className="space-y-2">
        {questions.map((item, i) => (
          <li key={i}>
            <details className="group glass-frost rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10">
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer text-white font-medium text-sm list-none transition-colors duration-200 hover:text-electric-300 [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="w-4 h-4 flex-shrink-0 text-white/40 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 text-white/60 text-sm leading-relaxed border-t border-white/10 pt-3">
                {item.a}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function FAQBlock({ content }) {
  const { headline, subheadline, faqs } = content || {}
  const categories = useMemo(() => faqs?.length ? faqs : DEFAULT_FAQS, [faqs])

  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const catRefs = useRef([])
  const reduced = useReducedMotion()

  useGSAP(() => {
    if (reduced) return
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    })
    tl.from(headerRef.current?.children, { immediateRender: false, y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out })
      .from(catRefs.current, { immediateRender: false, y: 30, opacity: 0, ...staggerPreset(categories.length, 0) }, '-=0.3')
  }, { scope: sectionRef, dependencies: [reduced, categories.length] })

  return (
    <section ref={sectionRef} className="bg-luminous py-20 px-4" aria-label="Frequently Asked Questions">
      <div className="max-w-5xl mx-auto">
        <div ref={headerRef} className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {headline || 'Frequently Asked Questions'}
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {subheadline || 'Find answers to common questions about our plumbing services, pricing, AI diagnosis, and more.'}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6" role="list" aria-label="FAQ categories">
          {categories.map((cat, i) => (
            <div key={cat.category} ref={(el) => { catRefs.current[i] = el }} role="listitem">
              <FAQCategory category={cat.category} questions={cat.questions} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
