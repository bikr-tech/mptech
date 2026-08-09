import { useState } from 'react'
import Modal from '../../ui/Modal'
import { assignPlumber, reassignPlumber } from '../../../services/dispatchApi'
import { toast } from '../../ui/Toast'

export default function PlumberAssignmentModal({ open, onClose, booking, plumber, isReassign, onAssigned }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        plumber_id: plumber.id,
        scheduled_start_at: start ? new Date(start).toISOString() : null,
        scheduled_end_at: end ? new Date(end).toISOString() : null,
      }
      if (isReassign) await reassignPlumber(booking.id, payload)
      else await assignPlumber(booking.id, payload)
      toast(`${plumber.name} assigned`, 'success')
      onAssigned?.()
      onClose()
    } catch (err) {
      toast(err.message || 'Assignment failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isReassign ? `Reassign to ${plumber?.name}` : `Assign ${plumber?.name}`}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-brand-text-muted">Start (datetime)</span>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text" />
          </label>
          <label className="block text-sm">
            <span className="text-brand-text-muted">End (datetime)</span>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text" />
          </label>
        </div>
        {booking?.preferred_date && (
          <p className="text-xs text-brand-text-muted">
            Preferred: {booking.preferred_date} {booking.preferred_start_time}–{booking.preferred_end_time} (leave blank to use it)
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text-secondary">Cancel</button>
          <button type="submit" disabled={busy} className="btn-3d rounded-lg px-4 py-2 text-sm font-semibold text-brand-bg">
            {busy ? 'Saving…' : isReassign ? 'Reassign' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
