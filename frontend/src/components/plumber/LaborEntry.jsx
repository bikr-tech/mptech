import { useState } from 'react'
import { addLabor } from '../../services/plumberApi'
import { useWorkOrder } from '../../hooks/useWorkOrder'
import { toast } from '../ui/Toast'

export default function LaborEntry({ workOrderId, onChanged }) {
  const [form, setForm] = useState({ hours: 1, rate: 0, notes: '' })
  const [busy, setBusy] = useState(false)
  const { data, refresh } = useWorkOrder(workOrderId)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await addLabor(workOrderId, form)
      setForm({ hours: 1, rate: 0, notes: '' })
      refresh(); onChanged?.()
      toast('Labor added', 'success')
    } catch (err) {
      toast(err.message || 'Failed to add labor', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid grid-cols-2 gap-2 rounded-xl border border-brand-border bg-brand-surface p-3 text-sm">
        <input type="number" min="0" step="any" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}
          className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text" placeholder="Hours" required />
        <input type="number" min="0" step="any" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })}
          className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text" placeholder="Rate (Rs/hr)" required />
        <button type="submit" disabled={busy} className="btn-3d col-span-2 rounded-lg py-2 font-semibold text-brand-bg disabled:opacity-40">
          {busy ? 'Adding…' : '+ Add labor'}
        </button>
      </form>
      <ul className="space-y-2">
        {(data?.labor || []).map((l) => (
          <li key={l.id} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface p-3 text-sm">
            <div>
              <p className="font-medium text-brand-text">{l.hours} hr × Rs {Number(l.rate).toLocaleString()}</p>
              {l.notes && <p className="text-xs text-brand-text-muted">{l.notes}</p>}
            </div>
            <p className="font-semibold text-brand-text">Rs {Number(l.total).toLocaleString()}</p>
          </li>
        ))}
        {!data?.labor?.length && <p className="text-sm text-brand-text-muted">No labor entries yet.</p>}
      </ul>
    </div>
  )
}
