import { useState, useEffect, useCallback } from 'react'
import LandingEditor from './LandingEditor'
import SectionSettingsDrawer from './SectionSettingsDrawer'
import EmailDashboard from './EmailDashboard'
import HeroBlock3D from '../blocks/HeroBlock3D'
import ServicesBlock from '../blocks/ServicesBlock'
import ReviewsBlock from '../blocks/ReviewsBlock'
import ProjectGallery from '../blocks/ProjectGallery'
import FooterBlock from '../blocks/FooterBlock'
import PlumbingToolBlock3D from '../blocks/PlumbingToolBlock3D'
import AIDiagnosisBlock from '../blocks/AIDiagnosisBlock'
import TrustBannerBlock from '../blocks/TrustBannerBlock'
import PlumbersMatchBlock from '../blocks/PlumbersMatchBlock'
import MapBlock from '../blocks/MapBlock'
import AppBlock from '../blocks/AppBlock'
import FAQBlock from '../blocks/FAQBlock'
import FinalCTA from '../blocks/FinalCTA'
import { useAuth } from '../../context/AuthContext'
import {
  getAdminSections, createSection, updateSection, deleteSection, reorderSections,
} from '../../lib/api'

const SECTION_TYPES = ['hero_3d', 'services_grid', 'reviews', 'project_gallery', 'site_footer', 'plumbing_tool_3d', 'ai_diagnosis', 'trust_banner', 'plumbers_match', 'map_section', 'app_section', 'faq_section', 'final_cta']

const TABS = [
  { id: 'cms', label: 'CMS', icon: '📄' },
  { id: 'email', label: 'Email', icon: '📧' },
]

export default function AdminPanel() {
  const { user, role, logout } = useAuth()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [settingsSection, setSettingsSection] = useState(null)
  const [previewOverrides, setPreviewOverrides] = useState({})
  const [activeTab, setActiveTab] = useState('cms')

  const fetchSections = useCallback(async () => {
    try {
      const data = await getAdminSections()
      setSections(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSections() }, [fetchSections])

  function handleReorder(reordered) {
    setSections(reordered)
    reorderSections(reordered.map((s) => ({ id: s.id, order_index: s.order_index })))
      .catch((e) => setError('Reorder failed: ' + e.message))
  }

  async function handleTogglePublish(id, is_published) {
    try {
      await updateSection(id, { is_published })
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, is_published } : s)))
    } catch (e) {
      setError('Publish toggle failed: ' + e.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteSection(id)
      setSections((prev) => prev.filter((s) => s.id !== id))
    } catch (e) {
      setError('Delete failed: ' + e.message)
    }
  }

  async function handleAddSection(type) {
    try {
      const order = sections.length
      await createSection({ type, order_index: order, content: {}, is_published: false })
      await fetchSections()
    } catch (e) {
      setError('Add section failed: ' + e.message)
    }
  }

  async function handleUpdateContent(id, content) {
    try {
      await updateSection(id, { content })
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)))
    } catch (e) {
      setError('Update failed: ' + e.message)
    }
  }

  function handlePreviewUpdate(id, content) {
    setPreviewOverrides((prev) => ({ ...prev, [id]: { content } }))
  }

  function handleSaveSettings(id, content) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)))
    setPreviewOverrides((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  if (loading) return <div className="p-8 text-slate-400">Loading sections...</div>

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm">{user?.email} — {role}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={logout} className="text-sm text-slate-400 hover:text-white transition">
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-slate-700">
          <nav className="flex gap-1" role="tablist">
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSettingsSection(null)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-brand-surface border-b-2 border-brand-accent text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2">&times;</button>
          </div>
        )}

        {activeTab === 'cms' && (
          <div className="max-w-4xl mx-auto">
            <LandingEditor
              sections={sections}
              onReorder={handleReorder}
              onTogglePublish={handleTogglePublish}
              onDelete={handleDelete}
              onEditSettings={(s) => setSettingsSection(s)}
              onUpdateContent={handleUpdateContent}
            />

            <div className="mt-6">
              <p className="text-slate-400 text-sm mb-2">Quick add section:</p>
              <div className="flex flex-wrap gap-2">
                {SECTION_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleAddSection(type)}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-lg transition capitalize"
                  >
                    + {type.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {settingsSection && (
              <div className="mt-8 border border-brand-accent rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                  <span className="text-xs text-slate-400">Live Preview — {settingsSection.type}</span>
                </div>
                <div className="h-64 overflow-hidden relative bg-slate-950">
                  {settingsSection.type === 'hero_3d' && (
                    <HeroBlock3D
                      key={settingsSection.id}
                      content={settingsSection.content}
                      settingsOverrides={previewOverrides[settingsSection.id]}
                    />
                  )}
                  {settingsSection.type === 'services_grid' && (
                    <ServicesBlock content={{ ...settingsSection.content, ...previewOverrides[settingsSection.id]?.content }} />
                  )}
                  {settingsSection.type === 'reviews' && (
                    <ReviewsBlock content={{ ...settingsSection.content, ...previewOverrides[settingsSection.id]?.content }} />
                  )}
                  {settingsSection.type === 'project_gallery' && (
                    <ProjectGallery content={{ ...settingsSection.content, ...previewOverrides[settingsSection.id]?.content }} />
                  )}
                  {settingsSection.type === 'site_footer' && (
                    <FooterBlock content={{ ...settingsSection.content, ...previewOverrides[settingsSection.id]?.content }} />
                  )}
                  {settingsSection.type === 'plumbing_tool_3d' && (
                    <PlumbingToolBlock3D content={{ ...settingsSection.content, ...previewOverrides[settingsSection.id]?.content }} />
                  )}
                  {settingsSection.type === 'ai_diagnosis' && (
                    <AIDiagnosisBlock content={{ ...settingsSection.content, ...previewOverrides[settingsSection.id]?.content }} />
                  )}
                  {settingsSection.type === 'trust_banner' && (
                    <TrustBannerBlock content={{ ...settingsSection.content, ...previewOverrides[settingsSection.id]?.content }} />
                  )}
                  {settingsSection.type === 'plumbers_match' && (
                    <PlumbersMatchBlock content={{ ...settingsSection.content, ...previewOverrides[settingsSection.id]?.content }} />
                  )}
                  {['map_section', 'app_section', 'faq_section', 'final_cta'].includes(settingsSection.type) && (
                    <div className="p-4 text-slate-400 text-sm">Preview not available for this block type</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <EmailDashboard />
        )}

        {settingsSection && activeTab === 'cms' && (
          <SectionSettingsDrawer
            section={settingsSection}
            isOpen={!!settingsSection}
            onClose={() => setSettingsSection(null)}
            onPreviewUpdate={handlePreviewUpdate}
            onSave={handleSaveSettings}
          />
        )}

      </div>
    </div>
  )
}
