import { useState, useEffect, useCallback } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateSection, generateContent } from '../../lib/api'
import { supabase } from '../../lib/supabase'

const ICONS = ['🔧', '🪠', '🚿', '🛁', '🚰', '🔥', '💧', '❄️', '🧊', '🌡️', '⚡', '🔩', '🛠️', '🧹', '🧽', '💦', '🚽', '🧻']

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-10 h-10 bg-slate-600 border border-slate-500 rounded-lg text-xl flex items-center justify-center hover:bg-slate-500 transition">
        {value || '🔧'}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-slate-700 border border-slate-600 rounded-lg p-2 shadow-xl" style={{ width: '180px' }}>
          <div className="grid grid-cols-6 gap-1">
            {ICONS.map((icon) => (
              <button key={icon} onClick={() => { onChange(icon); setOpen(false) }}
                className={`w-7 h-7 text-sm flex items-center justify-center rounded hover:bg-slate-500 transition ${value === icon ? 'bg-brand-accent ring-2 ring-brand-accent' : ''}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SortableServiceItem({ id, svc, index, onUpdate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="bg-slate-700 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-slate-500 hover:text-white text-sm px-1">⠿</button>
        <IconPicker value={svc.icon || '🔧'} onChange={(icon) => onUpdate(index, { icon })} />
        <input type="text" value={svc.title || ''} onChange={(e) => onUpdate(index, { title: e.target.value })}
          placeholder="Service name" className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs" />
        <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-300 text-sm px-1">&times;</button>
      </div>
      <textarea value={svc.description || ''} onChange={(e) => onUpdate(index, { description: e.target.value })}
        placeholder="Description" rows={2}
        className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs" />
    </div>
  )
}

const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin']

const typeDefaults = {
  emergency_call: { title: '', subtitle: '', phone: '', responseTime: '', serviceHours: '' },
  hero_3d: { title: '', subtitle: '', ctaText: '', ctaLink: '' },
  services_grid: { title: '', subtitle: '' },
  reviews: { title: '', subtitle: '' },
  project_gallery: { title: '', subtitle: '' },
  site_footer: { title: '', subtitle: '' },
  plumbing_tool_3d: { title: '', subtitle: '', enabled: true, beltColor: '#8B4513', toolColor: '#C0C0C0', positionX: 0, positionY: 0, positionZ: 0, motionSpeed: 1.0, animationStyle: 'float', tools: ['wrench', 'plunger', 'pipe_cutter', 'tape_measure'] },
  ai_diagnosis: { title: '', subtitle: '', uploadCta: '' },
  trust_banner: { title: '' },
  plumbers_match: { title: '', subtitle: '' },
  map_section: { title: '', subtitle: '' },
  app_section: { title: '', subtitle: '' },
  faq_section: { title: '', subtitle: '' },
  final_cta: { title: '', subtitle: '' },
}

function contentToForm(content, sectionType) {
  const def = typeDefaults[sectionType] || {}
  const base = {
    title: content.headline || content.emergency_header || content.title || def.title,
    subtitle: content.subheadline || content.subtitle || def.subtitle,
    ctaText: content.cta_text || content.ctaText || def.ctaText,
    ctaLink: content.cta_link || content.ctaLink || def.ctaLink,
    secondaryCtaText: content.secondary_cta_text || '',
    secondaryCtaLink: content.secondary_cta_link || '',
    emergencyPhone: content.emergency_phone || content.phone || '',
    uploadCta: content.upload_cta || '',
    responseTime: content.response_time || '',
    serviceHours: content.service_hours || '',
    urgencyText: content.urgency_text || '',
    trustStats: content.trust_stats || [],
    services: content.services || [],
    reviews: content.reviews || [],
    images: content.images || [],
    copyright: content.copyright || '',
    tagline: content.tagline || '',
    socials: content.socials || [],
    enabled: content.enabled !== undefined ? content.enabled : true,
    beltColor: content.beltColor || '#8B4513',
    toolColor: content.toolColor || '#C0C0C0',
    positionX: content.positionX ?? 0,
    positionY: content.positionY ?? 0,
    positionZ: content.positionZ ?? 0,
    motionSpeed: content.motionSpeed ?? 1.0,
    animationStyle: content.animationStyle || 'float',
    tools: content.tools || ['wrench', 'plunger', 'pipe_cutter', 'tape_measure'],
  }
  if (sectionType === 'map_section') { base.cities = content.cities || []; return base }
  if (sectionType === 'app_section') { base.features = content.features || []; return base }
  if (sectionType === 'faq_section') { base.faqs = content.faqs || []; return base }
  if (sectionType === 'final_cta') { base.cta_text = content.cta_text || ''; base.trust_phone = content.trust_phone || ''; base.trust_stats = content.trust_stats || ''; return base }
  if (sectionType === 'project_gallery') {
    base.projects = content.projects?.length ? content.projects : []
    // Also keep legacy images mapping for display fallback
    base.images = content.images || []
  }
  return base
}

function formToContent(form, sectionType, existingContent) {
  const base = { ...existingContent }
  base.title = form.title
  base.subtitle = form.subtitle
  base.cta_text = form.ctaText || base.cta_text
  if (sectionType === 'hero_3d') {
    base.headline = form.title
    base.subheadline = form.subtitle
    base.cta_link = form.ctaLink
    base.secondary_cta_text = form.secondaryCtaText || ''
    base.secondary_cta_link = form.secondaryCtaLink || ''
    base.emergency_phone = form.emergencyPhone || ''
    base.trust_stats = form.trustStats || []
  }
  if (sectionType === 'emergency_call') {
    base.emergency_header = form.title || base.emergency_header
    base.subtitle = form.subtitle
    base.phone = form.emergencyPhone || form.phone || ''
    base.response_time = form.responseTime || ''
    base.service_hours = form.serviceHours || ''
  }
  if (sectionType === 'ai_diagnosis') {
    base.headline = form.title
    base.subheadline = form.subtitle
    base.upload_cta = form.uploadCta || ''
    base.urgency_text = form.urgencyText || ''
  }
  if (sectionType === 'trust_banner') {
    base.headline = form.title
    base.stats = form.trustStats || []
  }
  if (sectionType === 'plumbers_match') {
    base.headline = form.title
    base.subheadline = form.subtitle
  }
  if (sectionType === 'services_grid' && form.services) base.services = form.services
  if (sectionType === 'reviews' && form.reviews) base.reviews = form.reviews
  if (sectionType === 'project_gallery') {
    if (form.projects?.length) base.projects = form.projects
    if (form.images?.length) base.images = form.images
  }
  if (sectionType === 'site_footer') {
    base.copyright = form.copyright
    base.tagline = form.tagline
    base.socials = form.socials
  }
  if (sectionType === 'plumbing_tool_3d') {
    base.enabled = form.enabled
    base.beltColor = form.beltColor
    base.toolColor = form.toolColor
    base.positionX = form.positionX
    base.positionY = form.positionY
    base.positionZ = form.positionZ
    base.motionSpeed = form.motionSpeed
    base.animationStyle = form.animationStyle
    base.tools = form.tools
  }
  if (sectionType === 'map_section') {
    base.headline = form.title
    base.subheadline = form.subtitle
    base.cities = form.cities || []
  }
  if (sectionType === 'app_section') {
    base.headline = form.title
    base.subheadline = form.subtitle
    base.features = form.features || []
  }
  if (sectionType === 'faq_section') {
    base.headline = form.title
    base.subheadline = form.subtitle
    base.faqs = form.faqs || []
  }
  if (sectionType === 'final_cta') {
    base.headline = form.title
    base.subheadline = form.subtitle
    base.cta_text = form.cta_text || ''
    base.trust_phone = form.trust_phone || ''
    base.trust_stats = form.trust_stats || ''
  }
  return base
}

export default function SectionSettingsDrawer({ section, isOpen, onClose, onPreviewUpdate, onSave }) {
  const [form, setForm] = useState(() => contentToForm(section?.content || {}, section?.type || 'hero_3d'))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (section) setForm(contentToForm(section.content || {}, section.type))
  }, [section])

  const firePreview = useCallback((updatedForm) => {
    if (!section || !onPreviewUpdate) return
    const newContent = formToContent(updatedForm, section.type, section.content)
    onPreviewUpdate(section.id, newContent)
  }, [section, onPreviewUpdate])

  function handleChange(key, value) {
    const next = { ...form, [key]: value }
    setForm(next)
    firePreview(next)
  }

  function moveService(oldIndex, newIndex) {
    handleChange('services', arrayMove(form.services, oldIndex, newIndex))
  }

  function updateService(i, patch) {
    const next = [...form.services]; next[i] = { ...next[i], ...patch }
    handleChange('services', next)
  }

  function removeService(i) {
    handleChange('services', form.services.filter((_, j) => j !== i))
  }

  const [uploading, setUploading] = useState(false)

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `gallery/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { data, error: uploadError } = await supabase.storage.from('project-gallery').upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('project-gallery').getPublicUrl(data.path)
      const next = [...(form.images || []), { url: publicUrl, caption: '' }]
      handleChange('images', next)
    } catch (e) {
      setError('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleProjectImageUpload(e, projectIndex, isThumbnail = false) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `gallery/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { data, error: uploadError } = await supabase.storage.from('project-gallery').upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('project-gallery').getPublicUrl(data.path)
      const projects = [...(form.projects || [])]
      if (isThumbnail) {
        projects[projectIndex] = { ...projects[projectIndex], thumbnail: publicUrl }
      } else {
        const images = projects[projectIndex]?.images || []
        projects[projectIndex] = { ...projects[projectIndex], images: [...images, publicUrl] }
      }
      handleChange('projects', projects)
    } catch (e) {
      setError('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function updateProject(i, patch) {
    const next = [...(form.projects || [])]
    next[i] = { ...next[i], ...patch }
    handleChange('projects', next)
  }

  function removeProject(i) {
    handleChange('projects', (form.projects || []).filter((_, j) => j !== i))
  }

  function removeProjectImage(projectIndex, imgIndex) {
    const projects = [...(form.projects || [])]
    const images = projects[projectIndex]?.images || []
    projects[projectIndex] = { ...projects[projectIndex], images: images.filter((_, j) => j !== imgIndex) }
    handleChange('projects', projects)
  }

  function updateImage(i, patch) {
    const next = [...form.images]; next[i] = { ...next[i], ...patch }
    handleChange('images', next)
  }

  function removeImage(i) {
    handleChange('images', form.images.filter((_, j) => j !== i))
  }

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setError('')
    try {
      const result = await generateContent(section?.type || 'hero_3d', { custom_prompt: aiPrompt, business_name: 'MPTech Plumbing' })
      const next = { ...form }
      if (result.headline) next.title = result.headline
      if (result.subheadline) next.subtitle = result.subheadline
      if (result.cta_text) next.ctaText = result.cta_text
      if (result.cta_link) next.ctaLink = result.cta_link
      if (result.title) next.title = result.title
      if (result.subtitle) next.subtitle = result.subtitle
      setForm(next)
      firePreview(next)
      setAiPrompt('')
    } catch (e) {
      setError('AI generation failed: ' + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSave() {
    if (!section) return
    setSaving(true)
    setError('')
    try {
      const newContent = formToContent(form, section.type, section.content)
      await updateSection(section.id, { content: newContent })
      if (onSave) onSave(section.id, newContent)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-96 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Edit Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Title</label>
            <input type="text" value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Subtitle</label>
            <textarea value={form.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)} rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">CTA Text</label>
            <input type="text" value={form.ctaText}
              onChange={(e) => handleChange('ctaText', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">CTA Link</label>
            <input type="text" value={form.ctaLink}
              onChange={(e) => handleChange('ctaLink', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
        </div>

        {section?.type === 'services_grid' && (
          <div className="border-t border-slate-700 pt-4 mt-4">
            <label className="block text-xs text-slate-400 mb-2 font-semibold">Services (drag to reorder)</label>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
              if (!e.over || e.active.id === e.over.id) return
              moveService(parseInt(e.active.id), parseInt(e.over.id))
            }}>
              <SortableContext items={(form.services || []).map((_, i) => String(i))} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {(form.services || []).map((svc, i) => (
                    <SortableServiceItem key={i} id={String(i)} svc={svc} index={i}
                      onUpdate={updateService} onRemove={removeService} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <button onClick={() => handleChange('services', [...(form.services || []), { icon: '🔧', title: '', description: '' }])}
              className="mt-3 w-full border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 rounded-lg py-2 text-xs transition">
              + Add Service
            </button>
          </div>
        )}

        {section?.type === 'reviews' && (
          <div className="border-t border-slate-700 pt-4 mt-4">
            <label className="block text-xs text-slate-400 mb-2 font-semibold">Customer Reviews</label>
            <div className="space-y-3">
              {(form.reviews || []).map((rev, i) => (
                <div key={i} className="bg-slate-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select value={rev.rating || 5} onChange={(e) => {
                      const next = [...form.reviews]; next[i] = { ...next[i], rating: parseInt(e.target.value) }
                      handleChange('reviews', next)
                    }} className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs">
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5-r)}</option>)}
                    </select>
                    <input type="text" value={rev.author || ''} onChange={(e) => {
                      const next = [...form.reviews]; next[i] = { ...next[i], author: e.target.value }
                      handleChange('reviews', next)
                    }} placeholder="Author name" className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs" />
                    <button onClick={() => handleChange('reviews', form.reviews.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300 text-sm px-1">&times;</button>
                  </div>
                  <textarea value={rev.text || ''} onChange={(e) => {
                    const next = [...form.reviews]; next[i] = { ...next[i], text: e.target.value }
                    handleChange('reviews', next)
                  }} placeholder="Review text" rows={2}
                    className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs" />
                </div>
              ))}
              <button onClick={() => handleChange('reviews', [...(form.reviews || []), { rating: 5, author: '', text: '' }])}
                className="w-full border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 rounded-lg py-2 text-xs transition">
                + Add Review
              </button>
            </div>
          </div>
        )}

        {section?.type === 'site_footer' && (
          <div className="border-t border-slate-700 pt-4 mt-4">
            <label className="block text-xs text-slate-400 mb-2 font-semibold">Footer</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Copyright Text</label>
                <input type="text" value={form.copyright || ''} onChange={(e) => handleChange('copyright', e.target.value)}
                  placeholder="(c) 2026 MPTech Plumbing. All rights reserved."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tagline</label>
                <input type="text" value={form.tagline || ''} onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="Licensed - Insured - Bonded"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-2">Social Links</label>
                <div className="space-y-2">
                  {(form.socials || []).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-700 rounded-lg p-2">
                      <select value={s.platform || 'facebook'} onChange={(e) => {
                        const next = [...form.socials]; next[i] = { ...next[i], platform: e.target.value }
                        handleChange('socials', next)
                      }} className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs w-24">
                        {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input type="text" value={s.url || ''} onChange={(e) => {
                        const next = [...form.socials]; next[i] = { ...next[i], url: e.target.value }
                        handleChange('socials', next)
                      }} placeholder="https://..." className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs" />
                      <button onClick={() => handleChange('socials', form.socials.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-300 text-sm px-1">&times;</button>
                    </div>
                  ))}
                  <button onClick={() => handleChange('socials', [...(form.socials || []), { platform: 'facebook', url: '' }])}
                    className="w-full border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 rounded-lg py-2 text-xs transition">
                    + Add Social Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {section?.type === 'project_gallery' && (
          <div className="border-t border-slate-700 pt-4 mt-4">
            <label className="block text-xs text-slate-400 mb-2 font-semibold">Projects (each with thumbnail + gallery)</label>
            <div className="space-y-4">
              {(form.projects || []).map((project, i) => (
                <div key={project.id || i} className="bg-slate-700 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm font-bold">#{i + 1}</span>
                    <input type="text" value={project.title || ''} onChange={(e) => updateProject(i, { title: e.target.value })}
                      placeholder="Project title" className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs" />
                    <button onClick={() => removeProject(i)} className="text-red-400 hover:text-red-300 text-sm px-1">&times;</button>
                  </div>

                  <input type="text" value={project.location || ''} onChange={(e) => updateProject(i, { location: e.target.value })}
                    placeholder="Location (e.g. Kathmandu)" className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs" />

                  <textarea value={project.description || ''} onChange={(e) => updateProject(i, { description: e.target.value })}
                    placeholder="Short description" rows={2}
                    className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs" />

                  {/* Thumbnail */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wide">Thumbnail</label>
                    <div className="flex items-center gap-2">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt="" className="w-16 h-12 object-cover rounded border border-slate-600 shrink-0" />
                      ) : (
                        <div className="w-16 h-12 rounded border border-dashed border-slate-500 flex items-center justify-center text-slate-500 text-xs shrink-0">none</div>
                      )}
                      <input type="text" value={project.thumbnail || ''} onChange={(e) => updateProject(i, { thumbnail: e.target.value })}
                        placeholder="Paste URL or upload" className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs" />
                      <label className="shrink-0 bg-slate-600 hover:bg-slate-500 text-white text-[10px] px-2 py-1.5 rounded cursor-pointer transition">
                        Upload
                        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleProjectImageUpload(e, i, true)} />
                      </label>
                    </div>
                  </div>

                  {/* Gallery images */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wide">Gallery ({project.images?.length || 0} photos)</label>
                    {project.images?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {project.images.map((img, j) => (
                          <div key={j} className="relative">
                            <img src={img} alt="" className="w-14 h-10 object-cover rounded border border-slate-600" />
                            <button onClick={() => removeProjectImage(i, j)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-400 text-white text-[10px] rounded-full flex items-center justify-center">&times;</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex items-center justify-center w-full border border-dashed border-slate-500 text-slate-400 hover:text-white hover:border-slate-400 rounded-lg py-2 text-xs transition cursor-pointer">
                      {uploading ? 'Uploading...' : '+ Add Photo'}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleProjectImageUpload(e, i, false)} />
                    </label>
                  </div>
                </div>
              ))}

              <button onClick={() => handleChange('projects', [...(form.projects || []), { id: 'p' + Date.now(), title: '', location: '', thumbnail: '', images: [], description: '' }])}
                className="w-full border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 rounded-lg py-2 text-xs transition">
                + Add Project
              </button>
            </div>
          </div>
        )}

        {section?.type === 'hero_3d' && (
          <div className="border-t border-slate-700 pt-4 mt-4 space-y-3">
            <label className="block text-xs text-slate-400 mb-2 font-semibold">Conversion Settings</label>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Secondary CTA Text</label>
              <input type="text" value={form.secondaryCtaText || ''} onChange={(e) => handleChange('secondaryCtaText', e.target.value)}
                placeholder="Book a Plumber Directly"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Secondary CTA Link</label>
              <input type="text" value={form.secondaryCtaLink || ''} onChange={(e) => handleChange('secondaryCtaLink', e.target.value)}
                placeholder="#services"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Emergency Phone</label>
              <input type="text" value={form.emergencyPhone || ''} onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                placeholder="+977-9800000000"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Trust Stats (JSON — label/value pairs)</label>
              <textarea value={form.trustStats?.length ? JSON.stringify(form.trustStats, null, 2) : ''}
                onChange={(e) => { try { handleChange('trustStats', JSON.parse(e.target.value)) } catch { /* allow typing */ } }}
                rows={4} placeholder='[{"label":"Avg Rating","value":"4.8★"},{"label":"Jobs","value":"3,200+"}]'
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            </div>
          </div>
        )}

        {section?.type === 'emergency_call' && (
          <div className="border-t border-slate-700 pt-4 mt-4 space-y-3">
            <label className="block text-xs text-slate-400 mb-2 font-semibold">Emergency Call Settings</label>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Emergency Phone</label>
              <input type="text" value={form.emergencyPhone || ''} onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Response Time</label>
              <input type="text" value={form.responseTime || ''} onChange={(e) => handleChange('responseTime', e.target.value)}
                placeholder="30 minutes"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Service Hours</label>
              <input type="text" value={form.serviceHours || ''} onChange={(e) => handleChange('serviceHours', e.target.value)}
                placeholder="24/7"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
        )}

        {section?.type === 'ai_diagnosis' && (
          <div className="border-t border-slate-700 pt-4 mt-4 space-y-3">
            <label className="block text-xs text-slate-400 mb-2 font-semibold">AI Diagnosis Widget</label>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Upload CTA</label>
              <input type="text" value={form.uploadCta || ''} onChange={(e) => handleChange('uploadCta', e.target.value)}
                placeholder="Take Photo / Upload"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Urgency Text</label>
              <input type="text" value={form.urgencyText || ''} onChange={(e) => handleChange('urgencyText', e.target.value)}
                placeholder="3 plumbers near you available now"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
        )}

        {section?.type === 'trust_banner' && (
          <div className="border-t border-slate-700 pt-4 mt-4 space-y-3">
            <label className="block text-xs text-slate-400 mb-2 font-semibold">Trust Settings</label>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Stats (JSON override — leave blank for defaults)</label>
              <textarea value={form.trustStats?.length ? JSON.stringify(form.trustStats, null, 2) : ''}
                onChange={(e) => { try { handleChange('trustStats', JSON.parse(e.target.value)) } catch {} }}
                rows={4} placeholder='[{"value":4.8,"suffix":"★","label":"Rating"},...]'
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            </div>
          </div>
        )}

        {section?.type === 'plumbing_tool_3d' && (
          <div className="border-t border-slate-700 pt-4 mt-4 space-y-3">
            <label className="block text-xs text-slate-400 mb-2 font-semibold">Tool Belt 3D Settings</label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Enabled</label>
              <input type="checkbox" checked={form.enabled !== false}
                onChange={(e) => handleChange('enabled', e.target.checked)}
                className="w-4 h-4 accent-brand-accent" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Belt Color</label>
              <input type="color" value={form.beltColor || '#8B4513'}
                onChange={(e) => handleChange('beltColor', e.target.value)}
                className="w-full h-8 rounded cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tool Color</label>
              <input type="color" value={form.toolColor || '#C0C0C0'}
                onChange={(e) => handleChange('toolColor', e.target.value)}
                className="w-full h-8 rounded cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Position X ({form.positionX ?? 0})</label>
              <input type="range" min="-5" max="5" step="0.1" value={form.positionX ?? 0}
                onChange={(e) => handleChange('positionX', parseFloat(e.target.value))}
                className="w-full accent-brand-accent" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Position Y ({form.positionY ?? 0})</label>
              <input type="range" min="-5" max="5" step="0.1" value={form.positionY ?? 0}
                onChange={(e) => handleChange('positionY', parseFloat(e.target.value))}
                className="w-full accent-brand-accent" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Position Z ({form.positionZ ?? 0})</label>
              <input type="range" min="-5" max="5" step="0.1" value={form.positionZ ?? 0}
                onChange={(e) => handleChange('positionZ', parseFloat(e.target.value))}
                className="w-full accent-brand-accent" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Motion Speed ({form.motionSpeed ?? 1.0}x)</label>
              <input type="range" min="0" max="3" step="0.1" value={form.motionSpeed ?? 1.0}
                onChange={(e) => handleChange('motionSpeed', parseFloat(e.target.value))}
                className="w-full accent-brand-accent" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Animation Style</label>
              <select value={form.animationStyle || 'float'}
                onChange={(e) => handleChange('animationStyle', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                <option value="float">Float</option>
                <option value="rotate">Rotate</option>
                <option value="bob">Bob</option>
                <option value="pulse">Pulse</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tools</label>
              <div className="space-y-1">
                {[
                  { value: 'wrench', label: 'Wrench' },
                  { value: 'plunger', label: 'Plunger' },
                  { value: 'pipe_cutter', label: 'Pipe Cutter' },
                  { value: 'tape_measure', label: 'Tape Measure' },
                ].map((t) => (
                  <label key={t.value} className="flex items-center gap-2 text-xs text-slate-300">
                    <input type="checkbox" checked={(form.tools || []).includes(t.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...(form.tools || []), t.value]
                          : (form.tools || []).filter((x) => x !== t.value)
                        handleChange('tools', next)
                      }}
                      className="w-4 h-4 accent-brand-accent" />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-700 pt-4 mt-4">
          <label className="block text-xs text-slate-400 mb-2 font-semibold">AI Generate</label>
          <div className="flex gap-2">
            <input type="text" value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the content you want..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()} />
            <button onClick={handleAIGenerate} disabled={aiLoading || !aiPrompt.trim()}
              className="bg-brand-copper hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition disabled:opacity-50">
              {aiLoading ? '...' : 'Generate'}
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-1">AI fills fields above. Review and edit before saving.</p>
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-brand-accent hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Apply & Save Draft'}
          </button>
        </div>
      </div>
    </div>
  )
}
