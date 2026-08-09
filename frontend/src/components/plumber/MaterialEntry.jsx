import { useState } from 'react'
import { addMaterial } from '../../services/plumberApi'
import { useWorkOrder } from '../../hooks/useWorkOrder'
import { toast } from '../ui/Toast'

export default function MaterialEntry({ workOrderId, onChanged }) {
  const [form, setForm] = useState({ name: '', quantity: 1, unit: 'pcs', unit_price: 0, notes: '' })
  const [busy, setBusy] = useState(false)
  const { data, refresh } = useWorkOrder(workOrderId)

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setBusy(true)
    try {
      await addMaterial(workOrderId, form)
      setForm({ name: '', quantity: 1, unit: 'pcs', unit_price: 0, notes: '' })
      refresh(); onChanged?.()
      toast('Material added', 'success')
    } catch (err) {
      toast(err.message || 'Failed to add material', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid grid-cols-2 gap-2 rounded-xl border border-brand-border bg-brand-surface p-3 text-sm">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Material name" required
          className="col-span-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text" />
        <input type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text" placeholder="Qty" />
        <input type="number" min="0" step="any" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
          className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text" placeholder="Unit price (Rs)" />
        <button type="submit" disabled={busy} className="btn-3d col-span-2 rounded-lg py-2 font-semibold text-brand-bg disabled:opacity-40">
          {busy ? 'Adding…' : '+ Add material'}
        </button>
      </form>
      <ul className="space-y-2">
        {(data?.materials || []).map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface p-3 text-sm">
            <div>
              <p className="font-medium text-brand-text">{m.name}</p>
              <p className="text-xs text-brand-text-muted">{m.quantity} {m.unit} × Rs {Number(m.unit_price).toLocaleString()}</p>
            </div>
            <p className="font-semibold text-brand-text">Rs {Number(m.total_price).toLocaleString()}</p>
          </li>
        ))}
        {!data?.materials?.length && <p className="text-sm text-brand-text-muted">No materials yet.</p>}
      </ul>
    </div>
  )
}
