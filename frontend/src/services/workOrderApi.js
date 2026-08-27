import { api } from '../lib/api'

export function getWorkOrder(id) {
  return api(`/work-orders/${id}`)
}

export function addTask(workOrderId, payload) {
  return api(`/work-orders/${workOrderId}/tasks`, { method: 'POST', body: JSON.stringify(payload) })
}

export function reorderTasks(workOrderId, taskIds) {
  return api(`/work-orders/${workOrderId}/tasks/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ task_ids: taskIds }),
  })
}

export function updateTask(taskId, payload) {
  return api(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}
