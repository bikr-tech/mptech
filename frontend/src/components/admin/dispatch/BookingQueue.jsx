import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminBookings, adminPlumbers, assignPlumber } from '../../../services/dispatchApi'
import StatusBadge from '../../ui/StatusBadge'
import Spinner from '../../ui/Spinner'
import { toast } from '../../ui/Toast'

const FILTERS = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['admin_review', 'Review'],
  ['scheduled', 'Scheduled'],
  ['assigned', 'Assigned'],
  ['in_progress', 'Active'],
  ['completed', 'Completed'],
]

const ASSIGNABLE_STATUSES = ['pending', 'admin_review', 'scheduled']

export default function BookingQueue() {
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [plumbers, setPlumbers] = useState([])
  const [assignModal, setAssignModal] = useState(null) // { bookingId, bookingTitle }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminBookings(status || undefined, q || undefined)
      .then((r) => { if (!cancelled) setRows(r) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [status, q])

  async function loadPlumbers() {
    try {
      setPlumbers(await adminPlumbers())
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  function openAssign(b) {
    setAssignModal({ bookingId: b.id, bookingTitle: b.title })
    loadPlumbers()
  }

  async function doAssign(bookingId, plumberId, e) {
    e.stopPropagation()
    try {
      await assignPlumber(bookingId, { plumber_id: plumberId })
      toast('Plumber assigned', 'success')
      setAssignModal(null)
    } catch (err) {
      toast(err.message || 'Assignment failed', 'error')
    }
  }

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
              <th className="px-3 py-2">Actions</th>
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
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/admin?dispatch=${b.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-text-secondary bg-brand-surface hover:bg-brand-surface-hover">Details</Link>
                    {ASSIGNABLE_STATUSES.includes(b.status) && !b.assigned_plumber_id && (
                      <button onClick={() => openAssign(b)} className="btn-3d rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-bg">Assign</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Plumber Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAssignModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-text">Assign Plumber</h3>
              <button onClick={() => setAssignModal(null)} className="text-brand-text-muted hover:text-brand-text">✕</button>
            </div>
            <p className="mb-3 text-sm text-brand-text-secondary">Booking: {assignModal.bookingTitle}</p>
            {plumbers.length === 0 ? (
              <p className="text-center py-4 text-sm text-brand-text-muted">No plumbers available.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {plumbers.map((p) => (
                  <button key={p.id} onClick={(e) => doAssign(assignModal.bookingId, p.id, e)}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg p-3 text-left transition hover:border-brand-accent hover:bg-brand-surface">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-brand-text">{p.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-brand-text-muted">
                      <span>★ {p.rating ?? '—'}</span>
                      <span>{p.skills?.length || 0} skills</span>
                      <span>{p.total_jobs ?? 0} jobs</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
