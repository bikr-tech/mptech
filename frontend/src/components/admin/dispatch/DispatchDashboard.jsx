import { useEffect, useState } from 'react'
import { dashboard } from '../../../services/dispatchApi'
import Spinner from '../../ui/Spinner'

const CARDS = [
  { key: 'pending', label: 'Pending review', icon: '⏳', color: 'amber' },
  { key: 'unassigned', label: 'Unassigned', icon: '📋', color: 'blue' },
  { key: 'today', label: 'Scheduled today', icon: '📅', color: 'purple' },
  { key: 'active', label: 'Active jobs', icon: '🔧', color: 'orange' },
  { key: 'completed', label: 'Completed', icon: '✨', color: 'emerald' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌', color: 'red' },
  { key: 'rejected', label: 'Rejected', icon: '🚫', color: 'rose' },
]

const COLOR_STYLES = {
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  red: 'bg-red-500/10 border-red-500/20 text-red-400',
  rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
}

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
      {CARDS.map(({ key, label, icon, color }) => (
        <div key={key} className="rounded-xl border bg-brand-surface p-4 transition hover:border-brand-accent/30 hover:shadow-lg hover:shadow-brand-accent/5">
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${COLOR_STYLES[color]}`}>
              {icon}
            </div>
            <p className="text-3xl font-bold text-brand-text">{counts[key] ?? 0}</p>
          </div>
          <p className="mt-2 text-xs text-brand-text-muted">{label}</p>
        </div>
      ))}
    </div>
  )
}
