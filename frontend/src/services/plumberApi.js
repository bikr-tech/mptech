import { api } from '../lib/api'

export function plumberJobs() {
  return api('/plumber/jobs')
}

export function plumberJob(id) {
  return api(`/plumber/jobs/${id}`)
}

export function jobAction(bookingId, action) {
  return api(`/plumber/jobs/${bookingId}/action?action=${action}`, { method: 'POST', body: JSON.stringify({}) })
}

export function taskAction(bookingId, taskId, action) {
  return api(`/plumber/jobs/${bookingId}/tasks/${taskId}/${action}`, { method: 'POST', body: JSON.stringify({}) })
}

export function addMaterial(workOrderId, payload) {
  return api(`/plumber/work-orders/${workOrderId}/materials`, { method: 'POST', body: JSON.stringify(payload) })
}

export function addLabor(workOrderId, payload) {
  return api(`/plumber/work-orders/${workOrderId}/labor`, { method: 'POST', body: JSON.stringify(payload) })
}

export function addNote(workOrderId, payload) {
  return api(`/plumber/work-orders/${workOrderId}/notes`, { method: 'POST', body: JSON.stringify(payload) })
}

export function addPhoto(workOrderId, payload) {
  return api(`/plumber/work-orders/${workOrderId}/photos`, { method: 'POST', body: JSON.stringify(payload) })
}

export function requestAdditionalWork(workOrderId, payload) {
  return api(`/plumber/work-orders/${workOrderId}/additional-work`, { method: 'POST', body: JSON.stringify(payload) })
}

export function completeJob(bookingId, completionNotes = '') {
  return api(`/plumber/jobs/${bookingId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ completion_notes: completionNotes }),
  })
}
