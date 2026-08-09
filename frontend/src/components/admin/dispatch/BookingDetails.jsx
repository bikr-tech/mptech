import { useEffect, useState } from 'react'
import { adminBooking, adminStatus, adminCancel, adminPlumbers } from '../../../services/dispatchApi'
import StatusBadge from '../../ui/StatusBadge'
import Spinner from '../../ui/Spinner'
import JobTimeline from '../../jobs/JobTimeline'
import PlumberRecommendationList from './PlumberRecommendationList'
import PlumberAssignmentModal from './PlumberAssignmentModal'
import ScheduleJobModal from './ScheduleJobModal'
import Modal from '../../ui/Modal'
import { toast } from '../../ui/Toast'

export default function BookingDetails({ bookingId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [plumbers, setPlumbers] = useState([])
  const [pick, setPick] = useState(null)      // {plumber, isReassign}
  const [schedule, setSchedule] = useState(false)
  const [statusMenu, setStatusMenu] = useState(false)

  async function load() {
    try {
      setData(await adminBooking(bookingId))
      setError(null)
    } catch {
      setError('Booking not found')
    }
  }
  useEffect(() => { load() }, [bookingId])

  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!data) return <Spinner />

  const b = data.booking
  const work = data.work_order
  const STATUSES = ['pending', 'admin_review', 'scheduled', 'assigned', 'accepted', 'en_route', 'arrived', 'in_progress', 'awaiting_approval', 'completed', 'customer_confirmed']

  async function openPlumberPicker(isReassign) {
    try {
      setPlumbers(await adminPlumbers())
      setPick({ plumber: null, isReassign })
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  async function changeStatus(to) {
    try {
      await adminStatus(bookingId, to)
      toast(`Status → ${to}`, 'success')
      setStatusMenu(false)
      await load()
    } catch (e) {
      toast(e.message || 'Status change failed', 'error')
    }
  }

  async function cancelIt() {
    try {
      await adminCancel(bookingId)
      toast('Booking cancelled', 'success')
      await load()
    } catch (e) {
      toast(e.message || 'Cancel failed', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-text">{b.title}</h2>
          <p className="text-xs text-brand-text-muted">{b.booking_number} · {b.service_type} · created {b.created_at?.slice(0, 10)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={b.status} />
          <div className="relative">
            <button onClick={() => setStatusMenu(!statusMenu)} className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text-secondary">Set status</button>
            {statusMenu && (
              <div className="absolute right-0 top-10 z-20 max-h-64 w-52 overflow-y-auto rounded-xl border border-brand-border bg-brand-surface p-1 shadow-xl">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => changeStatus(s)}
                    className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-brand-text hover:bg-brand-surface-hover">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={cancelIt} className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-400">Cancel</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm">
          <p className="mb-2 font-semibold text-brand-text">Customer</p>
          <dl className="space-y-1.5">
            <Row k="Name" v={data.customer?.name || '—'} />
            <Row k="Phone" v={data.customer?.phone || '—'} />
            <Row k="Email" v={data.customer?.email || '—'} />
          </dl>
          <p className="mb-1 mt-3 font-semibold text-brand-text">Job</p>
          <dl className="space-y-1.5">
            <Row k="Urgency" v={b.urgency} />
            <Row k="Address" v={b.address || '—'} />
            <Row k="GPS" v={b.latitude != null ? `${Number(b.latitude).toFixed(5)}, ${Number(b.longitude).toFixed(5)}` : '—'} />
            <Row k="Preferred" v={b.preferred_date ? `${b.preferred_date} ${b.preferred_start_time}–${b.preferred_end_time}` : '—'} />
            <Row k="Assigned" v={data.plumber_name || '—'} />
          </dl>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm">
          <p className="mb-2 font-semibold text-brand-text">AI diagnosis</p>
          {b.ai_diagnosis?.diagnosis ? (
            <>
              <p className="text-brand-text-secondary">{b.ai_diagnosis.diagnosis}</p>
              {b.ai_diagnosis.root_cause && <p className="mt-1 text-xs text-brand-text-muted">Root cause: {b.ai_diagnosis.root_cause}</p>}
              {(b.ai_diagnosis.required_skills || []).length > 0 && (
                <p className="mt-1 text-xs text-brand-text-muted">Skills: {b.ai_diagnosis.required_skills.join(', ')}</p>
              )}
            </>
          ) : (
            <p className="text-brand-text-muted">None.</p>
          )}
          <p className="mb-1 mt-3 font-semibold text-brand-text">Work order</p>
          {work ? (
            <dl className="space-y-1.5">
              <Row k="Status" v={work.status} />
              <Row k="Window" v={work.scheduled_start_at ? `${work.scheduled_start_at.slice(0, 16)} → ${work.scheduled_end_at?.slice(11, 16)}` : '—'} />
              <Row k="Tasks" v={`${work.tasks?.filter((t) => t.status === 'completed').length || 0}/${work.tasks?.length || 0} done`} />
              <Row k="Final amount" v={`Rs ${Number(work.totals?.final_amount || 0).toLocaleString()}`} />
            </dl>
          ) : (
            <p className="text-brand-text-muted">Not assigned yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-brand-text">Recommended plumbers</p>
          <div className="flex gap-2">
            <button onClick={() => setSchedule(true)} className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text-secondary">Schedule</button>
            <button onClick={() => openPlumberPicker(false)} className="btn-3d rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-bg">Assign…</button>
            {data.plumber_name && (
              <button onClick={() => openPlumberPicker(true)} className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text-secondary">Reassign…</button>
            )}
          </div>
        </div>
        <PlumberRecommendationList bookingId={bookingId} onPick={(p) => setPick({ plumber: p, isReassign: false })} />
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
        <p className="mb-2 font-semibold text-brand-text">Timeline</p>
        <JobTimeline events={data.timeline} />
      </div>

      {/* Pick from full roster (assign or reassign) */}
      <Modal open={!!pick} onClose={() => setPick(null)} title={pick?.isReassign ? 'Reassign job' : 'Assign job'}>
        {plumbers.length === 0 && <p className="text-sm text-brand-text-muted">No plumbers on the roster yet.</p>}
        <div className="space-y-2">
          {plumbers.map((p) => (
            <button key={p.id} onClick={() => setPick({ plumber: p, isReassign: pick.isReassign })}
              className={`w-full rounded-xl border p-3 text-left text-sm ${pick?.plumber?.id === p.id ? 'border-brand-accent bg-brand-accent/10' : 'border-brand-border bg-brand-bg'}`}>
              <p className="font-semibold text-brand-text">{p.name}</p>
              <p className="text-xs text-brand-text-muted">{p.status} · {p.skills?.length || 0} skills · ★ {p.rating ?? '—'}</p>
            </button>
          ))}
        </div>
      </Modal>

      {pick?.plumber && (
        <PlumberAssignmentModal
          open onClose={() => setPick(null)} booking={b} plumber={pick.plumber} isReassign={pick.isReassign} onAssigned={load} />
      )}
      {schedule && <ScheduleJobModal open onClose={() => setSchedule(false)} booking={b} onScheduled={load} />}
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-brand-text-muted">{k}</dt>
      <dd className="text-right text-brand-text">{v}</dd>
    </div>
  )
}
