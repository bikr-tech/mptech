import { useEffect, useState } from 'react'
import { dashboard } from '../../../services/dispatchApi'
import Spinner from '../../ui/Spinner'

const CARDS = [
  ['pending', 'Pending review'],
  ['unassigned', 'Unassigned'],
  ['today', 'Scheduled today'],
  ['active', 'Active jobs'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['rejected', 'Rejected'],
]

export default function DispatchDashboard() {
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    dashboard().then(setCounts).catch(() => setError('Failed to load dashboard'))
  }, [])

  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!counts) return <Spinner />

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map(([key, label]) => (
        <div key={key} className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <p className="text-3xl font-bold text-brand-text">{counts[key] ?? 0}</p>
          <p className="mt-1 text-xs text-brand-text-muted">{label}</p>
        </div>
      ))}
    </div>
  )
}
