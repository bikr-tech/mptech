import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePlumberJobs } from '../../hooks/usePlumberJobs'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import JobDetails from '../../components/plumber/JobDetails'

export default function PlumberPage() {
  const { user, logout } = useAuth()
  const { data, loading, refresh } = usePlumberJobs()
  const [selectedId, setSelectedId] = useState(null)

  const selected = selectedId ? data.find((j) => String(j.booking.id) === String(selectedId)) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">My jobs</h1>
          <p className="text-sm text-brand-text-muted">{user?.email}</p>
        </div>
        <button onClick={logout} className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text-secondary">Sign out</button>
      </div>

      {loading && <Spinner />}
      {!loading && data.length === 0 && <p className="py-16 text-center text-sm text-brand-text-muted">No jobs assigned to you yet.</p>}

      {selected ? (
        <JobDetails booking={selected.booking} workOrder={selected.work_order} onBack={() => setSelectedId(null)} onChanged={refresh} />
      ) : (
        <div className="space-y-3">
          {data.map((j) => {
            const b = j.booking
            return (
              <button key={b.id} onClick={() => setSelectedId(b.id)}
                className="w-full rounded-xl border border-brand-border bg-brand-surface p-4 text-left transition hover:border-brand-accent">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-text">{b.title}</p>
                    <p className="truncate text-xs text-brand-text-muted">{b.booking_number} · {b.address || 'no address'}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-2 text-xs text-brand-text-muted">
                  {j.task_counts?.completed ?? 0}/{j.task_counts?.total ?? 0} tasks done
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
