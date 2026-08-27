import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBookings } from '../../hooks/useBookings'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('')
  const { data, loading, error } = useBookings(tab || undefined)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">My bookings</h1>
          <p className="text-sm text-brand-text-muted">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/book" className="btn-3d rounded-lg px-4 py-2 text-sm font-semibold text-brand-bg">+ New booking</Link>
          <button onClick={logout} className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text-secondary">Sign out</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === t.key ? 'bg-brand-accent text-brand-bg' : 'bg-brand-surface text-brand-text-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <p className="text-sm text-red-400">Failed to load bookings.</p>}
      {!loading && !error && data.length === 0 && (
        <p className="py-10 text-center text-sm text-brand-text-muted">No bookings yet. <Link to="/book" className="underline">Create one</Link>.</p>
      )}

      <div className="space-y-3">
        {data.map((b) => (
          <Link key={b.id} to={`/account/bookings/${b.id}`}
            className="block rounded-xl border border-brand-border bg-brand-surface p-4 transition hover:border-brand-accent">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-brand-text">{b.title}</p>
                <p className="truncate text-xs text-brand-text-muted">{b.booking_number} · {b.service_type} · {b.address || 'no address'}</p>
                {b.preferred_date && <p className="mt-1 text-xs text-brand-text-muted">{b.preferred_date} {b.preferred_start_time}–{b.preferred_end_time}</p>}
              </div>
              <StatusBadge status={b.status} />
            </div>
            {b.estimated_cost > 0 && <p className="mt-2 text-xs text-brand-text-muted">Est. Rs {Number(b.estimated_cost).toLocaleString()}</p>}
          </Link>
        ))}
      </div>
    </div>
  )
}
