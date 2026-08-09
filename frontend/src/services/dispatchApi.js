import { api } from '../lib/api'

export function adminBookings(status, q) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (q) params.set('q', q)
  const qs = params.toString()
  return api(`/admin/bookings${qs ? `?${qs}` : ''}`)
}

export function adminBooking(id) {
  return api(`/admin/bookings/${id}`)
}

export function recommendedPlumbers(bookingId) {
  return api(`/admin/plumbers/recommended?booking_id=${encodeURIComponent(bookingId)}`)
}

export function assignPlumber(bookingId, payload) {
  return api(`/admin/bookings/${bookingId}/assign`, { method: 'POST', body: JSON.stringify(payload) })
}

export function reassignPlumber(bookingId, payload) {
  return api(`/admin/bookings/${bookingId}/reassign`, { method: 'POST', body: JSON.stringify(payload) })
}

export function scheduleBooking(bookingId, payload) {
  return api(`/admin/bookings/${bookingId}/schedule`, { method: 'POST', body: JSON.stringify(payload) })
}

export function adminStatus(bookingId, toStatus) {
  return api(`/admin/bookings/${bookingId}/status`, { method: 'POST', body: JSON.stringify({ to_status: toStatus }) })
}

export function adminCancel(bookingId) {
  return api(`/admin/bookings/${bookingId}/cancel`, { method: 'POST', body: JSON.stringify({}) })
}

export function dashboard() {
  return api('/admin/dashboard')
}

export function adminPlumbers() {
  return api('/admin/plumbers')
}

export function verifyPlumber(id) {
  return api(`/admin/plumbers/${id}/verify`, { method: 'POST' })
}
