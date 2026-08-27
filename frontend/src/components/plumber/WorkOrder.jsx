/** Work-order header: status, window, task progress, running totals. */
export default function WorkOrder({ booking, workOrder, detail }) {
  const d = detail || {}
  const tasks = d.tasks || []
  const done = tasks.filter((t) => t.status === 'completed').length
  const totals = d.totals || {}

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm">
      <p className="font-semibold text-brand-text">Work order</p>
      <dl className="mt-2 space-y-1.5">
        <Row k="Status" v={d.status || workOrder?.status || '—'} />
        <Row k="Priority" v={d.priority || 'normal'} />
        <Row k="Window" v={d.scheduled_start_at ? `${d.scheduled_start_at.slice(0, 16)} → ${d.scheduled_end_at?.slice(0, 16)}` : '—'} />
        <Row k="Started" v={d.actual_start_at ? d.actual_start_at.slice(0, 16) : '—'} />
        <Row k="Tasks" v={`${done}/${tasks.length} done`} />
        {totals.final_amount != null && (
          <>
            <Row k="Materials" v={`Rs ${Number(totals.materials || 0).toLocaleString()}`} />
            <Row k="Labor" v={`Rs ${Number(totals.labor || 0).toLocaleString()}`} />
            <Row k="Final" v={<b className="text-brand-accent">Rs {Number(totals.final_amount).toLocaleString()}</b>} />
          </>
        )}
      </dl>
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
