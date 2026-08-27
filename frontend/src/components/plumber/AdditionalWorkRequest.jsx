import { useState } from 'react'
import { requestAdditionalWork } from '../../services/plumberApi'
import { useWorkOrder } from '../../hooks/useWorkOrder'
import { toast } from '../ui/Toast'

export default function AdditionalWorkRequest({ workOrderId, bookingId, onChanged }) {
  const [form, setForm] = useState({ description: '', estimated_cost: 0 })
  const [busy, setBusy] = useState(false)
  const { data, refresh } = useWorkOrder(workOrderId)

  const pending = (data?.additional_work || []).filter((a) => a.status === 'pending')

  async function submit(e) {
    e.preventDefault()
    if (!form.description.trim()) return
    setBusy(true)
    try {
      await requestAdditionalWork(workOrderId, form)
      setForm({ description: '', estimated_cost: 0 })
      refresh(); onChanged?.()
      toast('Request sent to customer', 'success')
    } catch (err) {
      toast(err.message || 'Failed to send request', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-xl border border-brand-border bg-brand-surface p-3 text-sm">
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the extra work needed…" rows={3} required
          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text" />
        <input type="number" min="0" step="any" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
          placeholder="Estimated cost (Rs)" className="mt-2 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text" />
        <button type="submit" disabled={busy} className="btn-3d mt-2 w-full rounded-lg py-2 font-semibold text-brand-bg disabled:opacity-40">
          {busy ? 'Sending…' : 'Request additional work'}
        </button>
        <p className="mt-1 text-[11px] text-brand-text-muted">Customer must approve before it can be billed.</p>
      </form>

      <ul className="space-y-2">
        {(data?.additional_work || []).map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface p-3 text-sm">
            <div>
              <p className="font-medium text-brand-text">{a.description}</p>
              <p className="text-xs text-brand-text-muted">Est. Rs {Number(a.estimated_cost).toLocaleString()}</p>
              {a.rejection_reason && <p className="text-xs text-red-400">Rejected: {a.rejection_reason}</p>}
            </div>
            <span className={`text-xs font-semibold ${a.status === 'approved' ? 'text-emerald-400' : a.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}`}>
              {a.status}
            </span>
          </li>
        ))}
        {!data?.additional_work?.length && <p className="text-sm text-brand-text-muted">No additional work requests.</p>}
      </ul>
      {pending.length > 0 && <p className="text-xs text-amber-400">Waiting for customer approval…</p>}
    </div>
  )
}
