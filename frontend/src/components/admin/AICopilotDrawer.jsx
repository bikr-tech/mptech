import { useState } from 'react'
import { generateContent } from '../../lib/api'

const typeOptions = [
  { value: 'hero_3d', label: 'Hero 3D Section' },
  { value: 'emergency_call', label: 'Emergency Call Section' },
  { value: 'services_grid', label: 'Services Grid Section' },
  { value: 'reviews', label: 'Reviews Section' },
]

export default function AICopilotDrawer({ isOpen, onClose, onResult, sectionType }) {
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState(sectionType || 'hero_3d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await generateContent(type, { custom_prompt: prompt, business_name: 'MPTech Plumbing' })
      onResult({ ...result, section_type: type })
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-96 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">AI Copilot</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1">Section Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1">Describe the content you want</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            placeholder='e.g. "Add a 24/7 Water Leak Repair hero section with emergency CTA"'
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="flex-1 bg-brand-copper hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}
