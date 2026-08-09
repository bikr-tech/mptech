import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { addPhoto } from '../../services/plumberApi'
import { useWorkOrder } from '../../hooks/useWorkOrder'
import { toast } from '../ui/Toast'

const TYPES = ['before', 'during', 'after']

export default function PhotoUpload({ workOrderId }) {
  const { user } = useAuth()
  const [type, setType] = useState('during')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const { data, refresh } = useWorkOrder(workOrderId)

  async function pick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      setBusy(true)
      try {
        const path = `${user.id}/${workOrderId}/${Date.now()}-${f.name}`
        const { error } = await supabase.storage.from('work-photos').upload(path, f)
        if (error) throw error
        await addPhoto(workOrderId, { photo_type: type, storage_path: path, caption })
        setCaption('')
        refresh()
        toast('Photo uploaded', 'success')
      } catch (e) {
        toast(e.message || 'Upload failed', 'error')
      } finally {
        setBusy(false)
      }
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-border bg-brand-surface p-3">
        <div className="flex gap-1">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${type === t ? 'bg-brand-accent text-brand-bg' : 'bg-brand-bg text-brand-text-secondary'}`}>
              {t}
            </button>
          ))}
        </div>
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)"
          className="mt-2 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text" />
        <button onClick={pick} disabled={busy} className="btn-3d mt-2 w-full rounded-lg py-2 text-sm font-semibold text-brand-bg disabled:opacity-40">
          {busy ? 'Uploading…' : '📷 Upload photo'}
        </button>
      </div>
      <ul className="space-y-2">
        {(data?.photos || []).map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface p-3 text-sm">
            <div>
              <p className="font-medium text-brand-text">{p.photo_type}</p>
              {p.caption && <p className="text-xs text-brand-text-muted">{p.caption}</p>}
            </div>
            <span className="text-xs text-brand-text-muted">{p.storage_path}</span>
          </li>
        ))}
        {!data?.photos?.length && <p className="text-sm text-brand-text-muted">No photos yet.</p>}
      </ul>
    </div>
  )
}
