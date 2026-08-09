import { useState } from 'react'
import { plumberJob, jobAction } from '../../services/plumberApi'
import { useWorkOrder } from '../../hooks/useWorkOrder'
import StatusBadge from '../ui/StatusBadge'
import Spinner from '../ui/Spinner'
import WorkOrder from './WorkOrder'
import TaskList from './TaskList'
import WorkNotes from './WorkNotes'
import MaterialEntry from './MaterialEntry'
import LaborEntry from './LaborEntry'
import PhotoUpload from './PhotoUpload'
import AdditionalWorkRequest from './AdditionalWorkRequest'
import CompletionReport from './CompletionReport'
import { toast } from '../ui/Toast'

const SECTIONS = ['Overview', 'Tasks', 'Notes', 'Materials', 'Labor', 'Photos', 'Extra work']

/** One job: status-driven action bar + detail tabs (plumber app). */
export default function JobDetails({ booking, workOrder, onBack, onChanged }) {
  const [tab, setTab] = useState('Overview')
  const [detail, setDetail] = useState(null)   // full work order detail
  const [busy, setBusy] = useState(false)

  const { data: wo, refresh } = useWorkOrder(workOrder?.id)
  const active = detail || wo || null

  async function act(action) {
    setBusy(true)
    try {
      const res = await jobAction(booking.id, action)
      toast((res.booking_status || action).replace('-', ' ') + ' — saved', 'success')
      await Promise.all([refresh(), onChanged?.()])
      await loadDetail()
    } catch (e) {
      toast(e.message || 'Action failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function loadDetail() {
    try { setDetail(await plumberJob(booking.id)) } catch { /* not fatal */ }
  }

  const can = (s) => {
    switch (s) {
      case 'accept': return booking.status === 'assigned'
      case 'reject': return booking.status === 'assigned'
      case 'en-route': return booking.status === 'accepted'
      case 'arrived': return booking.status === 'en_route'
      case 'start': return booking.status === 'arrived'
      case 'complete': return ['in_progress', 'awaiting_approval'].includes(booking.status)
      case 'pause': return booking.status === 'in_progress'
      case 'resume': return booking.status === 'in_progress'
      default: return false
    }
  }

  const btn = (s, label) => can(s) && (
    <button key={s} onClick={() => act(s)} disabled={busy}
      className="btn-3d rounded-lg px-4 py-2 text-sm font-semibold text-brand-bg disabled:opacity-40">
      {label}
    </button>
  )

  const statusOK = !['cancelled', 'rejected', 'completed', 'customer_confirmed'].includes(booking.status)
  const workId = active?.id || workOrder?.id

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-brand-text-muted hover:text-brand-text">← All jobs</button>
        <StatusBadge status={booking.status} />
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-text">{booking.title}</h2>
            <p className="text-xs text-brand-text-muted">{booking.booking_number} · {booking.service_type}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-brand-text-secondary">{booking.description}</p>
        <p className="mt-1 text-xs text-brand-text-muted">{booking.address}</p>
        {booking.preferred_date && (
          <p className="mt-1 text-xs text-brand-text-muted">Preferred: {booking.preferred_date} {booking.preferred_start_time}–{booking.preferred_end_time}</p>
        )}
        <p className="mt-1 text-xs text-brand-text-muted">Urgency: {booking.urgency}</p>
        {booking.ai_diagnosis?.diagnosis && (
          <p className="mt-2 rounded-lg bg-brand-accent/10 p-2 text-xs text-brand-text-secondary">
            AI: {booking.ai_diagnosis.diagnosis}
            {(booking.ai_diagnosis.required_skills || []).length > 0 && ` · Skills: ${booking.ai_diagnosis.required_skills.join(', ')}`}
          </p>
        )}
      </div>

      {statusOK && (
        <div className="mt-3 flex flex-wrap gap-2">
          {btn('accept', 'ACCEPT JOB')}
          {btn('reject', 'REJECT')}
          {btn('en-route', 'START TRAVEL')}
          {btn('arrived', 'ARRIVED')}
          {btn('start', 'START WORK')}
          {btn('pause', 'PAUSE')}
          {btn('resume', 'RESUME')}
          {btn('complete', 'COMPLETE')}
        </div>
      )}

      {booking.status === 'completed' && (
        <CompletionReport booking={booking} workOrderId={workId} onChanged={onChanged} />
      )}

      {workId && statusOK && (
        <>
          <div className="mt-5 flex flex-wrap gap-1">
            {SECTIONS.map((s) => (
              <button key={s} onClick={() => setTab(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === s ? 'bg-brand-accent text-brand-bg' : 'bg-brand-surface text-brand-text-secondary'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="mt-3">
            {tab === 'Overview' && <WorkOrder booking={booking} workOrder={workOrder} detail={active} />}
            {tab === 'Tasks' && <TaskList booking={booking} workOrderId={workId} onChanged={() => { refresh(); onChanged?.() }} />}
            {tab === 'Notes' && <WorkNotes workOrderId={workId} />}
            {tab === 'Materials' && <MaterialEntry workOrderId={workId} onChanged={refresh} />}
            {tab === 'Labor' && <LaborEntry workOrderId={workId} onChanged={refresh} />}
            {tab === 'Photos' && <PhotoUpload workOrderId={workId} />}
            {tab === 'Extra work' && <AdditionalWorkRequest workOrderId={workId} bookingId={booking.id} onChanged={refresh} />}
          </div>
        </>
      )}
    </div>
  )
}
