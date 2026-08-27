const STATUS_STYLES = {
  pending: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  admin_review: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  scheduled: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
  assigned: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
  accepted: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  en_route: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  arrived: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  awaiting_approval: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  customer_confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  paused: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const LABELS = {
  pending: 'Pending', admin_review: 'Review', scheduled: 'Scheduled',
  assigned: 'Assigned', accepted: 'Accepted', en_route: 'En route',
  arrived: 'Arrived', in_progress: 'In progress', awaiting_approval: 'Awaiting approval',
  completed: 'Completed', customer_confirmed: 'Confirmed', cancelled: 'Cancelled',
  rejected: 'Rejected', paused: 'Paused', draft: 'Draft',
}

export default function StatusBadge({ status }) {
  const s = String(status || '').replace(/ /g, '_')
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[s] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {LABELS[s] || status}
    </span>
  )
}
