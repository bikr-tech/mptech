import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useBooking } from '../../hooks/useBooking'
import { cancelBooking, confirmCompletion, approveAdditional, rejectAdditional, getBookingReport } from '../../services/bookingApi'
import { useWorkOrder } from '../../hooks/useWorkOrder'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import JobTimeline from '../../components/jobs/JobTimeline'
import { toast } from '../../components/ui/Toast'

export default function BookingDetailsPage() {
  const { id } = useParams()
  const { data: booking, timeline, loading, error, refresh } = useBooking(id)
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)

  const workOrderId = report?.work_order?.id || null
  const { data: wo } = useWorkOrder(workOrderId)

  // awaiting_approval → pull the report so the approve/reject banner appears.
  useEffect(() => {
    if (booking?.status === 'awaiting_approval' && !report) {
      getBookingReport(id).then(setReport).catch(() => {})
    }
  }, [booking?.status, report, id])

  async function act(fn, successMsg) {
    setBusy(true)
    try { await fn(); toast(successMsg, 'success'); refresh(); setReport(null) }
    catch (e) { toast(e.message || 'Action failed', 'error') }
    finally { setBusy(false) }
  }

  if (loading) return <Spinner />
  if (error) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-red-400">Booking not found or unavailable.</div>

  const pendingExtra = booking?.additional_work_pending || (report?.additional_work || []).find((a) => a.status === 'pending')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/account" className="text-sm text-brand-text-muted hover:text-brand-text">← My bookings</Link>
      <div className="mt-2 mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-text">{booking.title}</h1>
          <p className="text-xs text-brand-text-muted">{booking.booking_number} · {booking.service_type}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm">
          <p className="mb-2 font-semibold text-brand-text">Details</p>
          <dl className="space-y-1.5">
            <Detail k="Description" v={booking.description || '—'} />
            <Detail k="Urgency" v={booking.urgency} />
            <Detail k="Address" v={booking.address || '—'} />
            <Detail k="Preferred" v={booking.preferred_date ? `${booking.preferred_date} ${booking.preferred_start_time}–${booking.preferred_end_time}` : '—'} />
            <Detail k="Est. cost" v={booking.estimated_cost > 0 ? `Rs ${Number(booking.estimated_cost).toLocaleString()}` : '—'} />
            <Detail k="Assigned plumber" v={booking.plumber_name || '—'} />
          </dl>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm">
          <p className="mb-2 font-semibold text-brand-text">AI diagnosis</p>
          {booking.ai_diagnosis?.diagnosis ? (
            <>
              <p className="text-brand-text-secondary">{booking.ai_diagnosis.diagnosis}</p>
              {booking.ai_diagnosis.root_cause && <p className="mt-1 text-xs text-brand-text-muted">Root cause: {booking.ai_diagnosis.root_cause}</p>}
              {booking.ai_diagnosis.cost_estimation?.total_plumber_npr != null && (
                <p className="mt-1 font-medium text-brand-accent">Est. Rs {Number(booking.ai_diagnosis.cost_estimation.total_plumber_npr).toLocaleString()}</p>
              )}
            </>
          ) : (
            <p className="text-brand-text-muted">None — booked without diagnosis.</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {booking.status === 'completed' && (
          <button onClick={() => act(() => confirmCompletion(id), 'Thank you! Booking confirmed.')} disabled={busy}
            className="btn-3d rounded-lg px-4 py-2 text-sm font-semibold text-brand-bg">Confirm completion</button>
        )}
        {['pending', 'admin_review', 'scheduled', 'assigned', 'accepted', 'en_route'].includes(booking.status) && (
          <button onClick={() => act(() => cancelBooking(id, 'Cancelled by customer'), 'Booking cancelled')} disabled={busy}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-400">Cancel booking</button>
        )}
        {pendingExtra && booking.status === 'awaiting_approval' && (
          <div className="w-full rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
            <p className="text-sm font-semibold text-brand-text">Additional work proposed</p>
            <p className="mt-1 text-sm text-brand-text-secondary">{pendingExtra.description}</p>
            <p className="mt-1 text-xs text-brand-text-muted">Est. Rs {Number(pendingExtra.estimated_cost).toLocaleString()}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => act(() => approveAdditional(id), 'Approved — plumber notified')} disabled={busy}
                className="btn-3d rounded-lg px-4 py-2 text-sm font-semibold text-brand-bg">Approve</button>
              <button onClick={() => act(() => rejectAdditional(id, 'Declined by customer'), 'Declined')} disabled={busy}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text-secondary">Decline</button>
            </div>
          </div>
        )}
        {booking.status !== 'customer_confirmed' && booking.status !== 'cancelled' && booking.status !== 'rejected' && (
          <button onClick={() => act(async () => setReport(await getBookingReport(id)), '')}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text-secondary">
            {report ? 'Refresh report' : 'View report'}
          </button>
        )}
      </div>

      {report && (
        <div className="mt-4 rounded-xl border border-brand-border bg-brand-surface p-4 text-sm">
          <p className="mb-2 font-semibold text-brand-text">Completion report</p>
          {wo?.totals && (
            <dl className="space-y-1.5">
              <Detail k="Materials" v={`Rs ${Number(wo.totals.materials).toLocaleString()}`} />
              <Detail k="Labor" v={`Rs ${Number(wo.totals.labor).toLocaleString()}`} />
              <Detail k="Additional work" v={`Rs ${Number(wo.totals.additional_work).toLocaleString()}`} />
              <Detail k="Final amount" v={<b className="text-brand-accent">Rs {Number(wo.totals.final_amount).toLocaleString()}</b>} />
            </dl>
          )}
          {wo?.tasks?.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 font-medium text-brand-text-secondary">Tasks ({wo.tasks.filter((t) => t.status === 'completed').length}/{wo.tasks.length})</p>
              <ul className="space-y-1">
                {wo.tasks.map((t) => (
                  <li key={t.id} className={`flex justify-between text-xs ${t.status === 'completed' ? 'text-brand-text-secondary' : 'text-brand-text-muted'}`}>
                    <span>{t.title}</span>
                    <span>{t.status === 'completed' ? `✓ ${t.actual_minutes ?? '—'} min` : t.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 font-semibold text-brand-text">Timeline</p>
        <JobTimeline events={timeline} />
      </div>
    </div>
  )
}

function Detail({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-brand-text-muted">{k}</dt>
      <dd className="text-right text-brand-text">{v}</dd>
    </div>
  )
}
