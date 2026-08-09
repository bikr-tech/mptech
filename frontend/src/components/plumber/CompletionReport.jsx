import { useState } from 'react'
import { completeJob } from '../../services/plumberApi'
import { toast } from '../ui/Toast'

/** After all tasks done: submit completion (final amount computed server-side). */
export default function CompletionReport({ booking, workOrderId, onChanged }) {
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await completeJob(booking.id, notes)
      toast('Completion submitted — awaiting customer confirmation', 'success')
      onChanged?.()
    } catch (err) {
      toast(err.message || 'Completion failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <p className="font-semibold text-brand-text">Job ready to complete</p>
      <p className="mt-1 text-xs text-brand-text-muted">Make sure all tasks are done and materials/labor are entered. Final amount is computed by the system.</p>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Completion notes…"
          className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text" />
        <button type="submit" disabled={busy} className="btn-3d rounded-lg px-4 py-2 text-sm font-semibold text-brand-bg disabled:opacity-40">
          {busy ? 'Submitting…' : 'Mark job complete'}
        </button>
      </form>
    </div>
  )
}
