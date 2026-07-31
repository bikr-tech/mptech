import { supabase } from './supabase'

const BASE = '/api'

export async function api(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (session) headers['Authorization'] = `Bearer ${session.access_token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(await res.text())
  if (res.status === 204) return null
  return res.json()
}

export async function getPublicSections() {
  return api('/sections/public')
}

export async function getAdminSections() {
  return api('/sections/admin')
}

export async function createSection(data) {
  return api('/sections/', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateSection(id, data) {
  return api(`/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteSection(id) {
  return api(`/sections/${id}`, { method: 'DELETE' })
}

export async function reorderSections(items) {
  return api('/sections/reorder/batch', { method: 'PUT', body: JSON.stringify({ items }) })
}

export async function generateContent(sectionType, businessInfo = {}) {
  return api('/agent/generate', { method: 'POST', body: JSON.stringify({ section_type: sectionType, business_info: businessInfo }) })
}

export async function generateScene(prompt) {
  return api('/agent/scene', { method: 'POST', body: JSON.stringify({ prompt }) })
}

export async function reviewContent(threadId, sectionType, humanEdits, approved) {
  return api('/agent/review', { method: 'POST', body: JSON.stringify({ thread_id: threadId, section_type: sectionType, human_edits: humanEdits, approved }) })
}
