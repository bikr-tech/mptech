// Shared defaults for the project_gallery bento (features + stats).
// Used by ProjectGallery.jsx (public render) and SectionSettingsDrawer.jsx (admin editor).
// Admin edits overwrite these via JSONB; normalizeContent merges by id/title.

export const DEFAULT_FEATURES = [
  { id: 'ai-diagnosis', icon: 'camera', tint: 'cyan', size: 'wide', title: 'AI Plumbing Diagnosis', description: 'Upload a photo or use voice. Our AI pinpoints the issue, scores its confidence, and suggests the fix before a plumber arrives.', stat: { label: 'avg. confidence', value: '97%' } },
  { id: 'smart-booking', icon: 'calendar', tint: 'violet', size: 'base', title: 'Smart Booking', description: 'Book a plumber instantly with real-time availability — emergency slots or advance scheduling.' },
  { id: 'live-tracking', icon: 'mapPin', tint: 'emerald', size: 'base', title: 'Live Tracking', description: 'Follow your plumber on the map with live ETA, route updates, and arrival alerts.' },
  { id: 'payments', icon: 'wallet', tint: 'amber', size: 'base', title: 'Payments', description: 'Pay with eSewa, Khalti, IME Pay, or cash. Transparent upfront estimates, no surprises.' },
  { id: 'plumbers', icon: 'shield', tint: 'green', size: 'base', title: 'Professional Plumbers', description: 'Verified profiles with ratings, reviews, licenses, and years of experience you can trust.' },
  { id: 'notifications', icon: 'bell', tint: 'fuchsia', size: 'base', title: 'Notifications', description: 'SMS, email, push, and WhatsApp updates at every step of the job.' },
]

export const DEFAULT_STATS = [
  { value: 25000, suffix: '+', label: 'Repairs completed', count: true },
  { value: '4.8', suffix: '★', label: 'Average rating', count: false },
  { value: 30, suffix: ' min', label: 'Avg response time', count: true },
  { value: 1200, suffix: '+', label: 'Verified plumbers', count: true },
]

export const FEATURE_ICONS = ['camera', 'calendar', 'mapPin', 'wallet', 'shield', 'bell']

export const FEATURE_TINTS = ['cyan', 'violet', 'emerald', 'amber', 'green', 'fuchsia']
