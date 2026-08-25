import { useEffect, useState } from 'react'
import { adminBookings } from '../../../services/dispatchApi'
import StatusBadge from '../../ui/StatusBadge'
import Spinner from '../../ui/Spinner'

const ACTIVE = ['scheduled', 'assigned', 'accepted', 'en_route', 'arrived', 'in_progress', 'awaiting_approval']

const STATUS_ICON = {
  scheduled: '📅',
  assigned: '👷',
  accepted: '✅',
  en_route: '🚗',
  arrived: '📍',
  in_progress: '🔧',
  awaiting_approval: '📋',
}

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
          className="block rounded-xl border border-brand-border bg-brand-surface p-4 transition hover:border-brand-accent hover:bg-brand-surface/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-lg flex-shrink-0">
                {STATUS_ICON[b.status] || '🔧'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-brand-text truncate">{b.title}</p>
                <p className="text-xs text-brand-text-muted">{b.booking_number} · {b.preferred_date || 'unscheduled'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={b.status} />
            </div>
          </div>
          {b.assigned_plumber_id && (
            <div className="mt-3 flex items-center gap-2 text-xs text-brand-text-muted">
              <span>👷 {b.plumber_name || 'Assigned plumber'}</span>
              {b.scheduled_start_at && (
                <span className="flex items-center gap-1">
                  🕐 {new Date(b.scheduled_start_at).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </a>
      ))}
    </div>
  )
}
