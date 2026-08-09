import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DispatchDashboard from './DispatchDashboard'
import BookingQueue from './BookingQueue'
import BookingDetails from './BookingDetails'
import ActiveJobsBoard from './ActiveJobsBoard'
import PlumberRoster from './PlumberRoster'

const TABS = ['Overview', 'Queue', 'Active jobs', 'Plumbers']

/** Admin dispatch workspace: stats, queue, per-booking detail + assignment. */
export default function DispatchPanel() {
  const [tab, setTab] = useState('Overview')
  const [params] = useSearchParams()
  const bookingId = params.get('dispatch')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-brand-text">Dispatch</h1>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === t ? 'bg-brand-accent text-brand-bg' : 'bg-brand-surface text-brand-text-secondary'}`}>
              {t}
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
