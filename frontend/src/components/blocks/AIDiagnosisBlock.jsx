import { useState, useRef, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'
import { diagnoseStart, diagnoseResume } from '../../lib/api'
import HITLQuestionsModal from './HITLQuestionsModal'

gsap.registerPlugin(ScrollTrigger)

const SEVERITY_STYLE = {
  LOW: 'bg-green-500/20 text-green-300 border-green-500/40',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  CRITICAL: 'bg-emergency-500/20 text-emergency-500 border-emergency-500/40',
}

const PIPELINE_STEPS = {
  start: ['Analyzing visual features…', [
    'Scanning photo for pipes & components',
    'Detecting corrosion, leaks, blockages',
  ]],
  resume: ['Analyzing your answers…', [
    'Cross-referencing your answers with visual data',
    'Running safety & cost analysis',
  ]],
}

function LoadingOverlay({ message, phase }) {
  const [title, steps] = phase === 'resume'
    ? PIPELINE_STEPS.resume
    : PIPELINE_STEPS.start

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="relative mb-6">
        {/* outer ripple */}
        <div className="absolute inset-0 rounded-full border-4 border-brand-accent/20 animate-ping" />
        <div className="w-20 h-20 relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-brand-accent/30" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-accent animate-spin" />
          <span className="text-3xl">🔧</span>
        </div>
      </div>

      <p className="text-white text-lg font-semibold mb-1">{message || title}</p>
      <p className="text-slate-400 text-sm mb-6">Running our AI plumbing expert pipeline</p>

      <div className="w-full max-w-xs space-y-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="flex items-center justify-center rounded-full border border-brand-accent/30 px-2 py-0.5 text-[11px] font-bold text-primary-300"
              style={{ animation: `pipeline-step 1.6s ease-in-out ${i * 0.45}s infinite` }}
            >
              {i + 1}
            </span>
            <span className="text-slate-300 text-sm">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DiagnosisResult({ result, onSeePlumbers, onReset }) {
  const severity = (result.severity || 'LOW').toUpperCase()
  const badge = SEVERITY_STYLE[severity] || SEVERITY_STYLE.LOW
  const diy = !!result.is_diy_safe
  const parts = result.cost_estimation?.parts || []
  const diySteps = result.diy_instructions || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-white text-lg font-bold leading-tight">{result.diagnosis || 'Diagnosis'}</p>
          {result.root_cause && <p className="text-slate-400 text-xs mt-1">Root cause: {result.root_cause}</p>}
        </div>
        <span className={`shrink-0 px-3 py-1 rounded-full border text-xs font-bold uppercase ${badge}`}>
          {severity}
        </span>
      </div>

      {/* Visual findings */}
      {result.visual_findings && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Visual Findings</p>
          <p className="text-slate-200 text-sm leading-relaxed">{result.visual_findings}</p>
        </div>
      )}

      {/* DIY or Emergency */}
      {diy ? (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-400 font-bold">🛠️ DIY-Safe Repair</span>
          </div>
          <ol className="space-y-2">
            {diySteps.length > 0 ? (
              diySteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-slate-200 text-sm">
                  <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-green-500/20 text-green-300 text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-300 text-sm">Follow the steps above, then monitor for leaks.</li>
            )}
          </ol>
          {result.pro_recommendation && (
            <p className="text-slate-400 text-xs mt-3">{result.pro_recommendation}</p>
          )}
        </div>
      ) : (
        <div className="bg-emergency-500/10 border border-emergency-500/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emergency-500 font-bold animate-pulse">🚨 Not DIY-Safe — Call a Pro</span>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">{result.pro_recommendation}</p>
        </div>
      )}

      {/* Cost table */}
      {parts.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <p className="text-white text-sm font-semibold">Itemized Cost Estimate</p>
            <span className="text-slate-400 text-xs">{result.cost_estimation.labor_hours}h est. labor</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                <th className="text-left px-4 py-2 font-medium">Part / Service</th>
                <th className="text-left px-4 py-2 font-medium">Source</th>
                <th className="text-right px-4 py-2 font-medium">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p, i) => (
                <tr key={i} className="border-t border-slate-700/60">
                  <td className="px-4 py-2 text-slate-200">{p.name}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.source === 'hardware' ? 'bg-brand-copper/20 text-brand-copper' : 'bg-brand-accent/20 text-primary-300'
                    }`}>
                      {p.source === 'hardware' ? 'Hardware' : 'Plumber'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-200">Rs {Number(p.est_cost_npr).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700 bg-slate-900/50">
                <td className="px-4 py-2 text-white font-semibold" colSpan={2}>
                  {diy ? 'DIY total (parts)' : 'Plumber total (parts + labor)'}
                </td>
                <td className="px-4 py-2 text-right text-brand-copper font-bold">
                  Rs {Number(diy ? result.cost_estimation.total_hardware_npr : result.cost_estimation.total_plumber_npr).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onSeePlumbers}
          className="flex-1 bg-brand-accent hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg">
          See Available Plumbers
        </button>
        <button onClick={onReset}
          className="px-4 py-3.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-all text-sm font-medium">
          New Photo
        </button>
      </div>
    </div>
  )
}

function UploadZone({ onFileSelected, isDragging, onDragState, disabled }) {
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    onDragState(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }, [onFileSelected, onDragState])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragState(true) }}
      onDragLeave={() => onDragState(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragging
          ? 'border-brand-accent bg-brand-accent/10 scale-[1.02]'
          : 'border-slate-600 hover:border-brand-accent/50 bg-slate-800/50 hover:bg-slate-800'
      } ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
    >
      <div className="text-5xl mb-4">📸</div>
      <p className="text-white text-lg font-semibold mb-2">Upload a photo of your plumbing issue</p>
      <p className="text-slate-400 text-sm mb-4">Or drag and drop here</p>
      <button className="inline-block bg-brand-copper hover:bg-amber-600 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all hover:scale-105">
        Take Photo / Upload
      </button>
      <p className="text-slate-500 text-xs mt-3">JPEG, PNG, WEBP, HEIC — Max 10MB</p>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files[0] && onFileSelected(e.target.files[0])} />
    </div>
  )
}

export default function AIDiagnosisBlock({ content }) {
  const { headline, subheadline, upload_cta, urgency_text } = content || {}
  const [step, setStep] = useState('upload') // upload | analyzing | questions | results | error
  const [phase, setPhase] = useState('') // 'start' | 'resume'
  const [file, setFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const widgetRef = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(() => {
    if (reduced) return
    gsap.from(headerRef.current?.children, { immediateRender: false, y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out, scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } })
    gsap.from(widgetRef.current, { immediateRender: false, y: 40, opacity: 0, duration: DURATIONS.normal, ease: EASES.out, scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } })
  }, { scope: sectionRef, dependencies: [reduced] })

  function handleFileSelected(f) {
    setFile(f)
    setError(null)
    setImageUrl('')
    setResult(null)
    setSession(null)
    setPhase('start')
    setStep('analyzing')
    analyze(f)
  }

  async function analyze(f) {
    if (!f) return
    setPhase('start')
    setStep('analyzing')
    setSubmitting(true)
    try {
      const data = await diagnoseStart(f)
      if (data.status === 'NEEDS_CLARIFICATION') {
        setSession(data)
        setImageUrl(data.image_url || '')
        setStep('questions')
      } else {
        setError(data.error || 'The AI could not inspect this image. Please try another photo.')
        setStep('error')
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
      setStep('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitAnswers(answers) {
    if (!session) return
    setPhase('resume')
    setSubmitting(true)
    try {
      const data = await diagnoseResume(session.thread_id, answers)
      if (data.status === 'COMPLETED') {
        setResult(data)
        setStep('results')
      } else {
        setError(data.error || 'Diagnosis could not be completed. Please try again.')
        setStep('error')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setStep('error')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setStep('upload')
    setFile(null)
    setSession(null)
    setImageUrl('')
  }

  function handleReset() {
    setStep('upload')
    setFile(null)
    setSession(null)
    setResult(null)
    setImageUrl('')
  }

  function handleSeePlumbers() {
    const el = document.getElementById('plumbers')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const analyzingMessage = phase === 'resume' ? 'Analyzing your answers…' : 'Analyzing visual features…'

  return (
    <section id="ai-diagnosis" ref={sectionRef} className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div ref={headerRef} className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {headline || 'AI-Powered Plumbing Diagnosis'}
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {subheadline || 'Upload a photo. Get an instant estimate. No visit needed.'}
          </p>
        </div>

        <div ref={widgetRef} className={`relative bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl mx-auto ${step === 'results' ? 'max-w-4xl' : 'max-w-lg'}`}>
          {step === 'upload' && (
            <UploadZone onFileSelected={handleFileSelected} isDragging={false} onDragState={() => {}} />
          )}

          {step === 'analyzing' && <LoadingOverlay message={analyzingMessage} phase={phase} />}

          {step === 'error' && (
            <div className="space-y-4">
              <div className="bg-emergency-500/10 border border-emergency-500/50 rounded-xl p-4">
                <p className="text-emergency-500 font-semibold">Diagnosis failed</p>
                <p className="text-slate-300 text-sm mt-1">{error}</p>
              </div>
              <button onClick={handleReset}
                className="w-full bg-brand-copper hover:bg-amber-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all">
                Try Another Photo
              </button>
            </div>
          )}

          {step === 'results' && result && (
            <DiagnosisResult result={result} onSeePlumbers={handleSeePlumbers} onReset={handleReset} />
          )}

          {urgency_text && step !== 'results' && step !== 'questions' && (
            <p className="text-amber-400 text-sm text-center mt-4 font-medium animate-pulse">
              {urgency_text}
            </p>
          )}
        </div>

        {step === 'upload' && (
          <div className="flex justify-center gap-6 mt-8 text-sm text-slate-500">
            <span>⚡ Diagnose in under 60 seconds</span>
            <span>🔒 Your photos are private</span>
            <span>🎯 97% accuracy rate</span>
          </div>
        )}

        {step === 'questions' && session && (
          <HITLQuestionsModal
            questions={session.questions}
            imageUrl={imageUrl}
            onSubmit={handleSubmitAnswers}
            onCancel={handleCancel}
            submitting={submitting}
          />
        )}
      </div>
    </section>
  )
}
