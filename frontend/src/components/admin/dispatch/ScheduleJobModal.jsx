import { useState } from 'react'
import Modal from '../../ui/Modal'
import { scheduleBooking } from '../../../services/dispatchApi'
import { toast } from '../../ui/Toast'

export default function ScheduleJobModal({ open, onClose, booking, onScheduled }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await scheduleBooking(booking.id, {
        scheduled_start_at: new Date(start).toISOString(),
        scheduled_end_at: new Date(end).toISOString(),
      })
      toast('Job scheduled', 'success')
      onScheduled?.()
      onClose()
    } catch (err) {
      toast(err.message || 'Scheduling failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule job">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-brand-text-muted">Start</span>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text" />
          </label>
          <label className="block text-sm">
            <span className="text-brand-text-muted">End</span>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text" />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text-secondary">Cancel</button>
          <button type="submit" disabled={busy} className="btn-3d rounded-lg px-4 py-2 text-sm font-semibold text-brand-bg">{busy ? 'Saving…' : 'Schedule'}</button>
        </div>
      </form>
    </Modal>
  )
}
