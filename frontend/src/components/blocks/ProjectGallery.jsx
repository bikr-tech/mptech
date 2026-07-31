import { useState, useRef, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_PROJECTS = [
  {
    id: 'p1', title: 'Bathroom Renovation', location: 'Kathmandu',
    thumbnail: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=80',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80',
    ],
    description: 'Complete bathroom plumbing overhaul with premium fixtures and tiling.',
  },
  {
    id: 'p2', title: 'Water Heater Installation', location: 'Lalitpur',
    thumbnail: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=80',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&q=80',
    ],
    description: 'Tankless water heater replacement with upgraded gas line and venting.',
  },
  {
    id: 'p3', title: 'Kitchen Plumbing', location: 'Bhaktapur',
    thumbnail: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1200&q=80',
      'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=80',
    ],
    description: 'Full kitchen sink, dishwasher, and garbage disposal installation.',
  },
  {
    id: 'p4', title: 'Emergency Drain Repair', location: 'Pokhara',
    thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80',
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=80',
    ],
    description: 'Emergency drain cleaning with camera inspection and pipe restoration.',
  },
  {
    id: 'p5', title: 'Pipe Repiping', location: 'Kathmandu',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80',
    ],
    description: 'Full home repiping from galvanized iron to modern PEX system.',
  },
  {
    id: 'p6', title: 'Bathroom Fixtures', location: 'Lalitpur',
    thumbnail: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80',
    ],
    description: 'Premium faucet, shower system, and toilet installation for modern bathroom.',
  },
]

function ImageWithFallback({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Reset when src changes
    setLoaded(false)
    setFailed(false)
  }, [src])

  // If already cached (complete), mark loaded immediately — prevents opacity-0 stall
  useEffect(() => {
    const img = new Image()
    img.src = src
    if (img.complete) { setLoaded(true); return }
    img.onload = () => setLoaded(true)
    img.onerror = () => setFailed(true)
    return () => { img.onload = null; img.onerror = null }
  }, [src])

  // Branded dummy placeholder shown while loading — replaces blank spinner
  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 text-slate-400 ${className}`}>
        <span className="text-2xl mb-1">🖼️</span>
        <span className="text-[10px] uppercase tracking-wider">Unavailable</span>
      </div>
    )
  }

  return (
    <>
      {!loaded && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-brand-accent/20 via-slate-800 to-slate-900 ${className}`}>
          {/* Pipe/wrench watermark */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-accent/40 to-brand-copper/30 border border-brand-accent/30 flex items-center justify-center text-2xl shadow-glow-blue">
            🔧
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-copper animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      <img
        src={src} alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
}

function ProjectCard({ project, onClick }) {
  const initials = project.title.split(' ').map(w => w[0]).slice(0, 2).join('')

  return (
    <button
      onClick={() => onClick(project)}
      className="group relative aspect-video rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-brand-accent transition-all duration-300 text-left"
    >
      <div className="absolute inset-0">
        <ImageWithFallback
          src={project.thumbnail}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
      {/* Project info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-semibold text-sm">{project.title}</p>
        <p className="text-slate-400 text-xs flex items-center gap-1 mt-1">
          <span>📍</span> {project.location}
          <span className="ml-auto text-brand-copper text-xs">{project.images?.length || 1} photos</span>
        </p>
      </div>
      {/* Image count badge */}
      {(project.images?.length || 1) > 1 && (
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <span>📷</span> {project.images.length}
        </div>
      )}
      {/* Hover indicator */}
      <div className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/10 transition-colors duration-300" />
    </button>
  )
}

function Lightbox({ project, onClose }) {
  const [current, setCurrent] = useState(0)
  const images = project.images || [project.thumbnail]
  const total = images.length

  function prev(e) { e.stopPropagation(); setCurrent((current - 1 + total) % total) }
  function next(e) { e.stopPropagation(); setCurrent((current + 1) % total) }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl hover:text-slate-300 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">&times;</button>

      {/* Project title bar */}
      <div className="absolute top-4 left-4 text-white z-10">
        <p className="font-semibold">{project.title}</p>
        <p className="text-slate-400 text-sm">{project.location}</p>
        {project.description && <p className="text-slate-500 text-xs mt-1 max-w-md">{project.description}</p>}
      </div>

      {/* Prev */}
      {total > 1 && (
        <button onClick={prev} className="absolute left-4 text-white text-4xl hover:text-brand-copper z-10 opacity-60 hover:opacity-100 transition-all w-12 h-12 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-sm">&lsaquo;</button>
      )}

      {/* Image */}
      <div className="max-w-5xl max-h-[80vh] w-full" onClick={e => e.stopPropagation()}>
        <ImageWithFallback
          src={images[current]}
          alt={`${project.title} - ${current + 1}`}
          className="w-full h-full max-h-[80vh] object-contain rounded-lg"
        />
      </div>

      {/* Next */}
      {total > 1 && (
        <button onClick={next} className="absolute right-4 text-white text-4xl hover:text-brand-copper z-10 opacity-60 hover:opacity-100 transition-all w-12 h-12 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-sm">&rsaquo;</button>
      )}

      {/* Thumbnails strip at bottom */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 max-w-[90vw] overflow-x-auto px-4 py-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setCurrent(i) }}
              className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                i === current ? 'border-brand-copper opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="absolute bottom-20 right-4 bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full z-10">
        {current + 1} / {total}
      </div>
    </div>
  )
}

// Normalize both data formats:
//  - New: projects[{ id, title, location, thumbnail, images[], description }]
//  - Legacy: images[{ url, caption }]  → wrapped as a single project
function normalizeProjects(content) {
  if (content?.projects?.length) return content.projects
  if (content?.images?.length) {
    // Legacy format → one project with all images
    return [{
      id: 'legacy',
      title: content.title || 'Our Projects',
      location: content.subtitle || '',
      thumbnail: content.images[0]?.url,
      images: content.images.map(i => i.url),
      description: '',
    }]
  }
  return DEFAULT_PROJECTS
}

export default function ProjectGallery({ content }) {
  const projects = normalizeProjects(content)
  const legacy = content?.images?.length && !content?.projects?.length
  const sectionTitle = legacy ? undefined : content?.title
  const sectionSubtitle = legacy ? undefined : content?.subtitle
  const { title = sectionTitle, subtitle = sectionSubtitle } = content || {}
  const [lightboxProject, setLightboxProject] = useState(null)
  const sectionRef = useRef(null)
  const gridRef = useRef(null)
  const headerRef = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(() => {
    if (reduced) return
    ScrollTrigger.refresh()
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
    })
    tl.from(headerRef.current?.children, { y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out, immediateRender: false })
      .from(gridRef.current?.children, {
        y: 40, opacity: 0, scale: 0.95, immediateRender: false, stagger: { each: 0.06, from: 'start' }, duration: DURATIONS.normal, ease: EASES.out,
      }, '-=0.2')
  }, { scope: sectionRef, dependencies: [reduced] })

  return (
    <section id="projects" ref={sectionRef} className="min-h-screen bg-slate-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef}>
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-4">
            {title || 'Our Projects'}
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            {subtitle || 'Recent work by our expert plumbing team'}
          </p>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={setLightboxProject} />
          ))}
        </div>
      </div>

      {lightboxProject && (
        <Lightbox project={lightboxProject} onClose={() => setLightboxProject(null)} />
      )}
    </section>
  )
}
