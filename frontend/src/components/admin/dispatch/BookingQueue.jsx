import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminBookings } from '../../../services/dispatchApi'
import StatusBadge from '../../ui/StatusBadge'
import Spinner from '../../ui/Spinner'

const FILTERS = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['admin_review', 'Review'],
  ['scheduled', 'Scheduled'],
  ['assigned', 'Assigned'],
  ['in_progress', 'Active'],
  ['completed', 'Completed'],
]

export default function BookingQueue() {
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminBookings(status || undefined, q || undefined)
      .then((r) => { if (!cancelled) setRows(r) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [status, q])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number, title, address…"
          className="w-64 rounded-lg border border-brand-border bg-brand-surface px-3 py-1.5 text-sm text-brand-text" />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(([k, label]) => (
            <button key={k} onClick={() => setStatus(k)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${status === k ? 'bg-brand-accent text-brand-bg' : 'bg-brand-surface text-brand-text-secondary'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && <Spinner />}
      {!loading && rows.length === 0 && <p className="py-10 text-center text-sm text-brand-text-muted">No bookings match.</p>}

      <div className="overflow-x-auto rounded-xl border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface text-xs text-brand-text-muted">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Urgency</th>
              <th className="px-3 py-2">Preferred</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.map((b) => (
              <tr key={b.id} className="bg-brand-surface/40 hover:bg-brand-surface">
                <td className="px-3 py-2 font-medium text-brand-text">{b.booking_number}</td>
                <td className="px-3 py-2">
                  <Link to={`/admin?dispatch=${b.id}`} className="text-brand-accent hover:underline">{b.title}</Link>
                </td>
                <td className="px-3 py-2 text-brand-text-secondary">{b.urgency}</td>
                <td className="px-3 py-2 text-brand-text-secondary">{b.preferred_date || '—'}</td>
                <td className="px-3 py-2"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
