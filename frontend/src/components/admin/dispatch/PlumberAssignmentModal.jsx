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
    <Modal open={open} onClose={onClose} title={isReassign ? `Reassign to ${plumber?.name}` : `Assign ${plumber?.name}`} wide>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg border border-brand-border">
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-xl">
            👷
          </div>
          <div>
            <p className="font-semibold text-brand-text">{plumber?.name}</p>
            <p className="text-xs text-brand-text-muted">{plumber?.skills?.join(', ') || 'No skills listed'}</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-medium text-brand-text-muted mb-1">Start time</span>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text focus:border-brand-accent focus:outline-none transition" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-brand-text-muted mb-1">End time</span>
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text focus:border-brand-accent focus:outline-none transition" />
            </label>
          </div>

          {booking?.preferred_date && (
            <div className="rounded-lg bg-brand-accent/5 border border-brand-accent/10 p-3">
              <p className="text-xs text-brand-accent flex items-center gap-1">
                <span>📅</span>
                <span>Preferred: {booking.preferred_date} {booking.preferred_start_time}–{booking.preferred_end_time}</span>
              </p>
              <p className="text-xs text-brand-text-muted mt-1">Leave blank to use preferred time</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <button type="button" onClick={onClose} className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-bg transition">Cancel</button>
            <button type="submit" disabled={busy} className="btn-3d rounded-lg px-5 py-2.5 text-sm font-semibold text-brand-bg">
              {busy ? 'Saving…' : isReassign ? 'Reassign' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
