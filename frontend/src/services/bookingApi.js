import { api } from '../lib/api'

export function createBooking(payload) {
  return api('/bookings', { method: 'POST', body: JSON.stringify(payload) })
}

export function getBookings(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return api(`/bookings${qs}`)
}

export function getBooking(id) {
  return api(`/bookings/${id}`)
}

export function cancelBooking(id, reason = '') {
  return api(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) })
}

export function confirmCompletion(id) {
  return api(`/bookings/${id}/confirm-completion`, { method: 'POST', body: JSON.stringify({}) })
}

export function approveAdditional(id, reason = '') {
  return api(`/bookings/${id}/approve-additional`, { method: 'POST', body: JSON.stringify({ reason }) })
}

export function rejectAdditional(id, reason) {
  return api(`/bookings/${id}/reject-additional`, { method: 'POST', body: JSON.stringify({ reason }) })
}

export function getBookingReport(id) {
  return api(`/bookings/${id}/report`)
}

export function getBookingTimeline(id) {
  return api(`/bookings/${id}/timeline`)
}
