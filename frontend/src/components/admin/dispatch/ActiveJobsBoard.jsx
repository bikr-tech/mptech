import { useEffect, useState } from 'react'
import { adminBookings } from '../../../services/dispatchApi'
import StatusBadge from '../../ui/StatusBadge'
import Spinner from '../../ui/Spinner'

const ACTIVE = ['scheduled', 'assigned', 'accepted', 'en_route', 'arrived', 'in_progress', 'awaiting_approval']

/** Live board of jobs in flight (each with assigned plumber). */
export default function ActiveJobsBoard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all(ACTIVE.map((s) => adminBookings(s).catch(() => [])))
      .then((groups) => {
        const seen = new Map()
        groups.flat().forEach((b) => seen.set(b.id, b))
        if (!cancelled) setRows([...seen.values()].sort((a, b) => (a.preferred_date || '').localeCompare(b.preferred_date || '')))
      })
      .finally(() => !cancelled && setLoading(false))
    const t = setInterval(() => setVersion((v) => v + 1), 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [version])

  if (loading) return <Spinner />
  if (!rows.length) return <p className="py-10 text-center text-sm text-brand-text-muted">No active jobs right now.</p>

  return (
    <div className="space-y-3">
      {rows.map((b) => (
        <a key={b.id} href={`/admin?dispatch=${b.id}`}
          className="block rounded-xl border border-brand-border bg-brand-surface p-4 transition hover:border-brand-accent">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-brand-text">{b.title}</p>
              <p className="text-xs text-brand-text-muted">{b.booking_number} · {b.preferred_date || 'unscheduled'}</p>
            </div>
            <StatusBadge status={b.status} />
          </div>
          {b.assigned_plumber_id && <p className="mt-1 text-xs text-brand-text-muted">Plumber assigned</p>}
        </a>
      ))}
    </div>
  )
}
