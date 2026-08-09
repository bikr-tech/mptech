import { useState } from 'react'
import { addNote } from '../../services/plumberApi'
import { useWorkOrder } from '../../hooks/useWorkOrder'
import { toast } from '../ui/Toast'

export default function WorkNotes({ workOrderId }) {
  const [note, setNote] = useState('')
  const { data, refresh } = useWorkOrder(workOrderId)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!note.trim()) return
    setBusy(true)
    try {
      await addNote(workOrderId, { note })
      setNote('')
      refresh()
    } catch (err) {
      toast(err.message || 'Failed to save note', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…"
          className="flex-1 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text" />
        <button type="submit" disabled={busy || !note.trim()} className="btn-3d rounded-lg px-4 py-2 text-sm font-semibold text-brand-bg disabled:opacity-40">
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {(data?.notes || []).slice().reverse().map((n) => (
          <li key={n.id} className="rounded-xl border border-brand-border bg-brand-surface p-3">
            <p className="text-sm text-brand-text">{n.note}</p>
            <p className="mt-1 text-[11px] text-brand-text-muted">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</p>
          </li>
        ))}
        {!data?.notes?.length && <p className="text-sm text-brand-text-muted">No notes yet.</p>}
      </ul>
    </div>
  )
}
