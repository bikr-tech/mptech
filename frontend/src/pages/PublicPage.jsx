import { useState, useEffect, useCallback } from 'react'
import { getPublicSections } from '../lib/api'
import Navbar from '../components/ui/Navbar'
import HeroBlock3D from '../components/blocks/HeroBlock3D'
import ServicesBlock from '../components/blocks/ServicesBlock'
import ReviewsBlock from '../components/blocks/ReviewsBlock'
import ProjectGallery from '../components/blocks/ProjectGallery'
import FooterBlock from '../components/blocks/FooterBlock'
import PlumbingToolBlock3D from '../components/blocks/PlumbingToolBlock3D'
import AIDiagnosisBlock from '../components/blocks/AIDiagnosisBlock'
import TrustBannerBlock from '../components/blocks/TrustBannerBlock'
import PlumbersMatchBlock from '../components/blocks/PlumbersMatchBlock'
import StickyConversionBar from '../components/ui/StickyConversionBar'
import MapBlock from '../components/blocks/MapBlock'
import AppBlock from '../components/blocks/AppBlock'
import FAQBlock from '../components/blocks/FAQBlock'
import FinalCTA from '../components/blocks/FinalCTA'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
const blockMap = {
  hero_3d: HeroBlock3D,
  services_grid: ServicesBlock,
  reviews: ReviewsBlock,
  project_gallery: ProjectGallery,
  plumbing_tool_3d: PlumbingToolBlock3D,
  ai_diagnosis: AIDiagnosisBlock,
  trust_banner: TrustBannerBlock,
  plumbers_match: PlumbersMatchBlock,
  map_section: MapBlock,
  app_section: AppBlock,
  faq_section: FAQBlock,
  final_cta: FinalCTA,
}

export default function PublicPage() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  const [ready, setReady] = useState(false)

  useEffect(() => {
    getPublicSections()
      .then(setSections)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Refresh ScrollTrigger after sections render and images load
  useEffect(() => {
    if (loading || sections.length === 0) return
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
      setReady(true)
    }, 500)
    // Also refresh once images finish loading
    const onLoad = () => { ScrollTrigger.refresh(); setReady(true) }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad)
    return () => { clearTimeout(timer); window.removeEventListener('load', onLoad) }
  }, [loading, sections.length])

  const footerSection = sections.find(s => s.type === 'site_footer')
  const emergencySection = sections.find(s => s.type === 'emergency_call')
  const emergencyPhone = emergencySection?.content?.phone || footerSection?.content?.emergency_phone || ''
  const whatsapp = emergencySection?.content?.whatsapp || ''
  const contentSections = sections.filter(s => s.type !== 'site_footer')

  if (loading) {
    return (
      <div className="min-h-screen bg-luminous flex items-center justify-center">
        <div className="text-white/60 text-lg">Loading...</div>
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-luminous flex items-center justify-center">
        <div className="text-white/50 text-center">
          <p className="text-2xl mb-2">No content yet</p>
          <p className="text-sm">Check back soon or contact the admin.</p>
        </div>
      </div>
    )
  }

  return (
    <main>
      <Navbar />
      {contentSections.map((section) => {
        const Block = blockMap[section.type]
        if (!Block) return null
        // Inject emergency phone from emergency_call section into hero + final CTA
        const merged = (section.type === 'hero_3d' || section.type === 'final_cta') && emergencyPhone
          ? { ...section.content, emergency_phone: emergencyPhone, trust_phone: emergencyPhone }
          : section.content
        return <Block key={section.id} content={merged} />
      })}
      <FooterBlock content={footerSection?.content || {}} />
      <StickyConversionBar emergencyPhone={emergencyPhone} whatsapp={whatsapp} />
    </main>
  )
}
