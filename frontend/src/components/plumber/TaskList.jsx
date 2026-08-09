import { useEffect, useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getWorkOrder, reorderTasks } from '../../services/workOrderApi'
import { taskAction } from '../../services/plumberApi'
import { toast } from '../ui/Toast'
import Spinner from '../ui/Spinner'

function SortableTask({ task, bookingId, disabled, onChanged }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id, disabled })
  const style = { transform: CSS.Transform.toString(transform), transition }

  async function act(action) {
    try {
      await taskAction(bookingId, task.id, action)
      toast(action === 'start' ? 'Task started' : 'Task completed', 'success')
      onChanged?.()
    } catch (e) {
      toast(e.message || 'Action failed', 'error')
    }
  }

  const done = task.status === 'completed'
  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 rounded-xl border p-3 ${done ? 'border-brand-border bg-brand-surface/40 opacity-70' : 'border-brand-border bg-brand-surface'}`}>
      <button {...attributes} {...listeners} className="cursor-grab text-brand-text-muted" aria-label="Reorder task">⋮⋮</button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? 'text-brand-text-muted line-through' : 'text-brand-text'}`}>{task.title}</p>
        {task.description && <p className="truncate text-xs text-brand-text-muted">{task.description}</p>}
        <p className="text-[11px] text-brand-text-muted">
          {task.priority} · est {task.estimated_minutes ?? '—'}m{task.actual_minutes != null ? ` · actual ${task.actual_minutes}m` : ''}
        </p>
      </div>
      {!done ? (
        <button onClick={() => act('start')} className="btn-3d rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-bg">
          {task.status === 'in_progress' ? 'Complete' : 'Start'}
        </button>
      ) : (
        <span className="text-xs text-emerald-400">✓ Done</span>
      )}
    </div>
  )
}

export default function TaskList({ bookingId, workOrderId, onChanged }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    if (!workOrderId) return
    getWorkOrder(workOrderId)
      .then((wo) => setTasks((wo.tasks || []).slice().sort((a, b) => a.position - b.position)))
      .catch(() => toast('Failed to load tasks', 'error'))
      .finally(() => setLoading(false))
  }, [workOrderId, version])

  async function onDragEnd(e) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = tasks.findIndex((t) => String(t.id) === String(active.id))
    const newIdx = tasks.findIndex((t) => String(t.id) === String(over.id))
    const next = arrayMove(tasks, oldIdx, newIdx)
    setTasks(next)
    try {
      await reorderTasks(workOrderId, next.map((t) => t.id))
      toast('Order saved', 'success')
      onChanged?.()
    } catch (err) {
      toast(err.message || 'Reorder failed', 'error')
      setVersion((v) => v + 1)
    }
  }

  if (loading) return <Spinner className="py-4" />
  if (!tasks.length) return <p className="text-sm text-brand-text-muted">No tasks yet.</p>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((t) => (
            <SortableTask key={t.id} task={t} bookingId={bookingId} disabled={t.status === 'completed'} onChanged={() => { setVersion((v) => v + 1); onChanged?.() }} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
