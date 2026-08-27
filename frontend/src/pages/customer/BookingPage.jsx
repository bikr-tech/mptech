import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBooking } from '../../services/bookingApi'
import { diagnoseStart, diagnoseResume } from '../../lib/api'
import { toast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/ui/Navbar'

const SERVICES = [
  'Leak repair', 'Pipe replacement', 'Drain cleaning', 'Water heater service',
  'Toilet repair', 'Faucet / fixture', 'Bathroom remodeling', 'Emergency callout',
]

const STEPS = ['Service', 'Details', 'Address & time', 'Review']

/** Minimal self-contained AI diagnosis embed: photo → HITL questions → result
 * object that becomes the booking's ai_diagnosis (recommendation only). */
function DiagnosisEmbed({ onResult }) {
  const [file, setFile] = useState(null)
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function start(f) {
    setBusy(true); setErr(''); setResult(null)
    try {
      const data = await diagnoseStart(f)
      if (data.error) {
        setErr(data.error)
      } else if (data.status === 'NEEDS_CLARIFICATION') {
        setSession(data)
        setQuestions(data.clarifying_questions || [])
      } else if (data.status === 'COMPLETED') {
        setResult(data)
        onResult(data)
      } else {
        setErr(data.refusal_reason || 'Could not analyze this image.')
      }
    } catch (e) {
      setErr(e.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  async function submitAnswers(answers) {
    if (!session) return
    setBusy(true)
    try {
      const data = await diagnoseResume(session.thread_id, answers)
      if (data.status === 'COMPLETED') {
        setResult(data)
        onResult(data)
      } else {
        setErr(data.error || 'Diagnosis could not be completed.')
      }
    } catch (e) {
      setErr(e.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">AI diagnosis (recommendation)</p>
        <p className="mt-1 text-sm text-white/70">{result.diagnosis}</p>
        {result.root_cause && <p className="text-xs text-white/50">Root cause: {result.root_cause}</p>}
        {result.cost_estimation?.total_plumber_npr != null && (
          <p className="mt-1 text-sm font-medium text-electric-300">
            Est. plumber cost: Rs {Number(result.cost_estimation.total_plumber_npr).toLocaleString()}
          </p>
        )}
        <button onClick={() => { setResult(null); onResult(null) }} className="mt-2 text-xs text-white/50 underline">
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4">
      <p className="mb-2 text-sm font-semibold text-white">Add a photo for AI diagnosis <span className="font-normal text-white/50">(optional)</span></p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) start(f) }}
        className="text-sm text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-electric-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
      />
      {busy && <p className="mt-2 text-xs text-white/50">Analyzing…</p>}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
      {questions.length > 0 && (
        <form onSubmit={(e) => {
          e.preventDefault()
          const answers = questions.map((q, i) => e.target[i]?.value || '')
          submitAnswers(answers)
        }} className="mt-3 space-y-2">
          {questions.map((q, i) => (
            <label key={i} className="block">
              <span className="text-xs text-white/70">{q}</span>
              <input required className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/40" />
            </label>
          ))}
          <button type="submit" disabled={busy} className="btn-3d rounded-lg px-4 py-2 text-sm font-semibold text-white">
            {busy ? 'Working…' : 'Submit answers'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function BookingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) navigate('/login?next=/book', { replace: true })
  }, [user, loading, navigate])

  const [form, setForm] = useState({
    service_type: SERVICES[0],
    title: '',
    description: '',
    urgency: 'medium',
    address: '',
    latitude: null,
    longitude: null,
    preferred_date: '',
    preferred_start_time: '',
    preferred_end_time: '',
  })
  const [aiDiagnosis, setAiDiagnosis] = useState(null)
  const [photos, setPhotos] = useState([])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function locate() {
    if (!navigator.geolocation) return toast('Geolocation not supported', 'error')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
        toast('Location captured')
      },
      () => toast('Could not read location — enter address manually', 'error'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  async function uploadBookingPhoto() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      const path = `${user.id}/${Date.now()}-${f.name}`
      const { error } = await supabase.storage.from('work-photos').upload(path, f)
      if (error) return toast(error.message, 'error')
      setPhotos((p) => [...p, { storage_path: path, caption: '', photo_type: 'before' }])
      toast('Photo added')
    }
    input.click()
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await createBooking({
        ...form,
        title: form.title || `${form.service_type} — ${form.address || 'no address'}`,
        ai_diagnosis: aiDiagnosis || {},
        photos,
      })
      toast('Booking submitted', 'success')
      navigate('/account')
    } catch (e) {
      toast(e.message || 'Failed to submit booking', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const canNext = () => {
    if (step === 0) return true
    if (step === 1) return form.title || form.description
    if (step === 2) return form.address && form.preferred_date && form.preferred_start_time && form.preferred_end_time
    return true
  }

  const inputCls = 'mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-electric-300 focus:outline-none'

  return (
    <div className="min-h-screen bg-luminous">
      <Navbar />
      <div className="relative mx-auto max-w-2xl px-4 py-10 md:py-16">
        {/* Hero header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-electric-300 px-4 py-1.5 rounded-full glass-frost">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-300 shadow-[0_0_8px_#4fc3ff]" />
            Smart booking
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-bold text-white tracking-[-0.03em]">
            Book a plumber
          </h1>
          <p className="mt-3 text-white/60 text-lg max-w-md mx-auto">
            Tell us what&apos;s wrong and we&apos;ll match you with the right pro.
          </p>
        </div>

        {/* Step pills */}
        <div className="mt-8 mb-8 flex gap-1 rounded-full glass-frost p-1.5">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              className={`flex-1 rounded-full px-2 py-2 text-xs font-semibold transition ${i === step ? 'btn-3d text-white' : i < step ? 'text-white/70 hover:bg-white/10' : 'text-white/40'}`}>
              {i + 1} · {s}
            </button>
          ))}
        </div>

        {/* Step panel */}
        <div className="glass-frost rounded-3xl p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">What do you need?</p>
              {SERVICES.map((s) => (
                <button key={s} onClick={() => { setForm((f) => ({ ...f, service_type: s })); setStep(1) }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${form.service_type === s ? 'border-electric-400 bg-white/15 text-white' : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-white">Short title</span>
                <input value={form.title} onChange={set('title')} placeholder="e.g. Kitchen sink leak" className={inputCls} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-white">Describe the problem</span>
                <textarea value={form.description} onChange={set('description')} rows={4}
                  placeholder="What's happening, since when, any sounds/smells…" className={inputCls} />
              </label>
              <DiagnosisEmbed onResult={setAiDiagnosis} />
              <div>
                <button onClick={uploadBookingPhoto} className="btn-3d rounded-lg px-3 py-2 text-sm font-semibold text-white">
                  + Add reference photo
                </button>
                {photos.length > 0 && <p className="mt-1 text-xs text-white/50">{photos.length} photo(s) attached</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-white">Service address</span>
                <input value={form.address} onChange={set('address')} placeholder="Street, ward, city" className={inputCls} />
              </label>
              <button type="button" onClick={locate} className="btn-3d rounded-lg px-3 py-2 text-sm font-semibold text-white">
                📍 Use my location
              </button>
              {form.latitude && <p className="text-xs text-white/50">GPS: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}</p>}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-white">Preferred date</span>
                  <input type="date" value={form.preferred_date} onChange={set('preferred_date')} className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-white">Urgency</span>
                  <select value={form.urgency} onChange={set('urgency')} className={inputCls}>
                    <option value="low" className="bg-slate-900">Low</option>
                    <option value="medium" className="bg-slate-900">Medium</option>
                    <option value="high" className="bg-slate-900">High</option>
                    <option value="emergency" className="bg-slate-900">Emergency</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-white">Start time</span>
                  <input type="time" value={form.preferred_start_time} onChange={set('preferred_start_time')} className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-white">End time</span>
                  <input type="time" value={form.preferred_end_time} onChange={set('preferred_end_time')} className={inputCls} />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm">
              <dl className="space-y-2">
                <Row k="Service" v={form.service_type} />
                <Row k="Title" v={form.title || '—'} />
                <Row k="Description" v={form.description || '—'} />
                <Row k="Urgency" v={form.urgency} />
                <Row k="Address" v={form.address} />
                <Row k="When" v={form.preferred_date ? `${form.preferred_date} ${form.preferred_start_time}–${form.preferred_end_time}` : '—'} />
                <Row k="AI diagnosis" v={aiDiagnosis ? 'Included (recommendation)' : 'None'} />
                <Row k="Photos" v={`${photos.length} attached`} />
              </dl>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}
                className="btn-3d ml-auto rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
                Continue
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="btn-emerald ml-auto rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
                {submitting ? 'Submitting…' : 'Submit booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/50">{k}</dt>
      <dd className="text-right text-white">{v}</dd>
    </div>
  )
}
