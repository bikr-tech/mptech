const ACTION_LABELS = {
  booking_created: 'Booking created',
  booking_admin_review: 'Sent to review',
  booking_scheduled: 'Scheduled',
  booking_assigned: 'Assigned to plumber',
  booking_reassigned: 'Reassigned',
  booking_cancelled: 'Cancelled',
  booking_rejected: 'Rejected',
  booking_completed: 'Completed',
  customer_confirmed: 'Customer confirmed',
  plumber_accept: 'Plumber accepted',
  plumber_reject: 'Plumber rejected',
  'plumber_en-route': 'En route',
  plumber_arrived: 'Arrived',
  plumber_start: 'Work started',
  plumber_complete: 'Work completed',
}

export default function JobTimeline({ events = [] }) {
  const items = Array.isArray(events) ? events : []
  if (!items.length) return <p className="text-sm text-brand-text-muted">No activity yet.</p>

  return (
    <ol className="space-y-0 border-l border-brand-border pl-4">
      {items.slice().reverse().map((e) => (
        <li key={e.id || e.created_at} className="relative pb-4">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-accent" />
          <p className="text-sm font-medium text-brand-text">
            {ACTION_LABELS[e.action] || (e.to_status ? `Status: ${e.to_status}` : e.action)}
          </p>
          <p className="text-xs text-brand-text-muted">
            {e.to_status ? `${e.from_status || '—'} → ${e.to_status} · ` : ''}
            {e.actor_role ? `${e.actor_role} · ` : ''}
            {e.created_at ? new Date(e.created_at).toLocaleString() : ''}
          </p>
        </li>
      ))}
    </ol>
  )
}
