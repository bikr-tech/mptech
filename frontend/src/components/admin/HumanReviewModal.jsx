import { useState, useMemo } from 'react'
import SEOBadge from '../ui/SEOBadge'
import HeroBlock3D from '../blocks/HeroBlock3D'
import EmergencyBlock from '../blocks/EmergencyBlock'
import ServicesBlock from '../blocks/ServicesBlock'
import ReviewsBlock from '../blocks/ReviewsBlock'
import { reviewContent } from '../../lib/api'

const blockMap = {
  hero_3d: HeroBlock3D,
  emergency_call: EmergencyBlock,
  services_grid: ServicesBlock,
  reviews: ReviewsBlock,
}

const sceneSliderFields = [
  { key: 'waterFlowSpeed', label: 'Water Flow Speed', min: 0, max: 5, step: 0.1 },
  { key: 'pipeCount', label: 'Pipe Count', min: 1, max: 6, step: 1 },
  { key: 'curvature', label: 'Curvature', min: 0, max: 1, step: 0.05 },
  { key: 'metalness', label: 'Metalness', min: 0, max: 1, step: 0.05 },
  { key: 'roughness', label: 'Roughness', min: 0, max: 1, step: 0.05 },
  { key: 'floatIntensity', label: 'Float Intensity', min: 0, max: 2, step: 0.1 },
  { key: 'ambientIntensity', label: 'Ambient Light', min: 0, max: 1, step: 0.05 },
  { key: 'pipeRadius', label: 'Pipe Radius', min: 0.1, max: 0.6, step: 0.05 },
  { key: 'cameraZ', label: 'Camera Distance', min: 4, max: 12, step: 0.5 },
]

export default function HumanReviewModal({ agentState, onClose, onComplete }) {
  const raw = agentState?.raw_content || {}
  const [edits, setEdits] = useState({ ...raw })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const sectionType = agentState?.section_type || 'hero_3d'
  const BlockPreview = blockMap[sectionType]
  const isHero = sectionType === 'hero_3d'
  const scene3d = edits.scene3d || {}

  function handleChange(key, value) {
    setEdits((prev) => ({ ...prev, [key]: value }))
  }

  function handleSceneChange(key, value) {
    setEdits((prev) => ({
      ...prev,
      scene3d: { ...(prev.scene3d || {}), [key]: value },
    }))
  }

  function handleSceneColor(color) {
    setEdits((prev) => ({
      ...prev,
      scene3d: { ...(prev.scene3d || {}), pipeColor: color },
    }))
  }

  function renderField(key, value) {
    const label = key.replace(/_/g, ' ')
    if (key === 'description' || key === 'scene3d') return null
    if (Array.isArray(value)) {
      return (
        <div key={key} className="mb-3">
          <label className="block text-slate-300 text-xs font-semibold mb-1 capitalize">{label}</label>
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try { handleChange(key, JSON.parse(e.target.value)) } catch {}
            }}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-mono h-20"
          />
        </div>
      )
    }
    return (
      <div key={key} className="mb-3">
        <label className="block text-slate-300 text-xs font-semibold mb-1 capitalize">{label}</label>
        <input
          type="text"
          value={typeof value === 'string' ? value : JSON.stringify(value)}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs"
        />
      </div>
    )
  }

  async function handleSubmit(approved) {
    setSubmitting(true)
    setError('')
    try {
      const result = await reviewContent(agentState.thread_id, sectionType, edits, approved)
      onComplete(result)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const previewContent = useMemo(() => ({ ...edits }), [edits])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Review AI-Generated Content</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 p-4">
          {/* Preview pane — 3 cols */}
          <div className="lg:col-span-3 border border-slate-700 rounded-xl overflow-hidden bg-slate-950 min-h-[300px]">
            <p className="text-xs text-slate-500 px-3 py-2 bg-slate-800 border-b border-slate-700">
              Live Preview {isHero && <span className="text-slate-600">(3D scene updates in real time)</span>}
            </p>
            {BlockPreview ? (
              isHero ? (
                <div className="h-[400px]">
                  <HeroBlock3D
                    key={JSON.stringify(scene3d)}
                    content={previewContent}
                    settingsOverrides={{ scene3d }}
                  />
                </div>
              ) : (
                <div className="scale-[0.3] origin-top-left" style={{ width: '333%', height: '333%' }}>
                  <BlockPreview content={previewContent} />
                </div>
              )
            ) : (
              <pre className="p-4 text-xs text-slate-400">{JSON.stringify(previewContent, null, 2)}</pre>
            )}
          </div>

          {/* Editor pane — 2 cols */}
          <div className="lg:col-span-2 space-y-4 overflow-y-auto max-h-[80vh]">
            {/* Content editor */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Content</h3>
              {Object.entries(edits).map(([key, value]) => renderField(key, value))}
            </div>

            {/* 3D Scene editor (hero_3d only) */}
            {isHero && (
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">3D Scene</h3>

                <div className="mb-3">
                  <label className="block text-xs text-slate-400 mb-1">Scene Type</label>
                  <select value={scene3d.sceneType || 'home'} onChange={(e) => handleSceneChange('sceneType', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs">
                    <option value="home">🏠 Home</option>
                    <option value="industrial">🏭 Industrial</option>
                    <option value="luxury">💎 Luxury</option>
                    <option value="outdoor">🌿 Outdoor</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-slate-400 mb-1">Pipe Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={scene3d.pipeColor || '#00aaff'}
                      onChange={(e) => handleSceneColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border border-slate-600"
                    />
                    <span className="text-xs text-slate-400 font-mono">{scene3d.pipeColor || '#00aaff'}</span>
                  </div>
                </div>

                {sceneSliderFields.map((field) => (
                  <div key={field.key} className="mb-3">
                    <label className="block text-xs text-slate-400 mb-1">
                      {field.label}: {scene3d[field.key] ?? field.min}
                    </label>
                    <input
                      type="range"
                      min={field.min} max={field.max} step={field.step}
                      value={scene3d[field.key] ?? field.min}
                      onChange={(e) => handleSceneChange(field.key, parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* SEO */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">SEO Audit</h3>
              <SEOBadge score={agentState?.seo_score || 0} report={agentState?.seo_report || {}} />
            </div>
          </div>
        </div>

        {error && <p className="px-4 text-red-400 text-sm mb-4">{error}</p>}
        <div className="p-4 border-t border-slate-700 flex gap-3 justify-end">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Approve & Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}
