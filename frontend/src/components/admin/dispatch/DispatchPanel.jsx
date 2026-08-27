import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DispatchDashboard from './DispatchDashboard'
import BookingQueue from './BookingQueue'
import BookingDetails from './BookingDetails'
import ActiveJobsBoard from './ActiveJobsBoard'
import PlumberRoster from './PlumberRoster'

const TABS = [
  { id: 'Overview', label: 'Overview', icon: '📊' },
  { id: 'Queue', label: 'Queue', icon: '📋' },
  { id: 'Active jobs', label: 'Active', icon: '🔧' },
  { id: 'Plumbers', label: 'Plumbers', icon: '👷' },
]

/** Admin dispatch workspace: stats, queue, per-booking detail + assignment. */
export default function DispatchPanel() {
  const [tab, setTab] = useState('Overview')
  const [params] = useSearchParams()
  const bookingId = params.get('dispatch')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-brand-text">Dispatch</h1>
        <div className="flex gap-1 bg-brand-surface rounded-lg p-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition ${tab === t.id ? 'bg-brand-accent text-brand-bg shadow-sm' : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg'}`}>
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {bookingId ? (
        <BookingDetails key={bookingId} bookingId={bookingId} />
      ) : tab === 'Overview' ? (
        <DispatchDashboard />
      ) : tab === 'Queue' ? (
        <BookingQueue />
      ) : tab === 'Plumbers' ? (
        <PlumberRoster />
      ) : (
        <ActiveJobsBoard />
      )}
    </div>
  )
}
