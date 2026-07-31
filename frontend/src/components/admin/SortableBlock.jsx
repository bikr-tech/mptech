import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const typeColors = {
  hero_3d: 'border-blue-500 bg-blue-500/10',
  emergency_call: 'border-red-500 bg-red-500/10',
  services_grid: 'border-teal-500 bg-teal-500/10',
  reviews: 'border-amber-500 bg-amber-500/10',
  plumbing_tool_3d: 'border-amber-700 bg-amber-700/10',
}

const typeLabels = {
  hero_3d: 'Hero 3D',
  emergency_call: 'Emergency Call',
  services_grid: 'Services Grid',
  reviews: 'Reviews',
  plumbing_tool_3d: 'Tool Belt 3D',
}

function PreviewContent({ section }) {
  const c = section.content || {}
  return (
    <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400 space-y-1">
      {c.description && (
        <p><span className="text-slate-500">Description:</span> {c.description}</p>
      )}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {Object.entries(c).filter(([k]) => k !== 'description').slice(0, 4).map(([k, v]) => (
          <div key={k}>
            <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
            <span className="text-white">{String(v ?? '').slice(0, 60)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SortableBlock({ section, onTogglePublish, onDelete, onUpdateContent, onEditSettings }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const [expanded, setExpanded] = useState(false)
  const [descDraft, setDescDraft] = useState(section.content?.description || '')

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function saveDescription() {
    onUpdateContent(section.id, { ...section.content, description: descDraft })
  }

  return (
    <div ref={setNodeRef} style={style} className={`border-2 rounded-xl mb-3 ${typeColors[section.type] || 'border-slate-600 bg-slate-800'}`}>
      <div className="flex items-center gap-3 p-4">
        <button {...attributes} {...listeners} className="cursor-grab text-slate-500 hover:text-white text-lg px-2">
          ⠿
        </button>
        <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {typeLabels[section.type] || section.type}
          </span>
          <p className="text-white text-sm mt-0.5">
            {section.content?.description || `Order: ${section.order_index}`}
          </p>
        </button>
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={section.is_published}
              onChange={() => onTogglePublish(section.id, !section.is_published)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-accent" />
          </label>
          <span className="text-xs text-slate-400 w-8">{section.is_published ? 'Live' : 'Draft'}</span>
          <button
            onClick={() => onEditSettings(section)}
            className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-3 py-1.5 rounded transition"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(section.id)}
            className="text-xs bg-red-600/50 hover:bg-red-600 text-white px-3 py-1.5 rounded transition"
          >
            ×
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <PreviewContent section={section} />
          <div className="mt-3 flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">Description</label>
              <input
                type="text"
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                placeholder="Short admin description..."
              />
            </div>
            <button
              onClick={saveDescription}
              className="text-xs bg-brand-accent hover:bg-blue-600 text-white px-3 py-1.5 rounded transition"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
