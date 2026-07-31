import { useState, useRef, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion, DURATIONS, EASES } from '../../lib/animations'

gsap.registerPlugin(ScrollTrigger)

const STEPS = ['upload', 'scanning', 'results', 'booking']

function ScanningOverlay({ progress }) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <div className="w-full h-1 bg-slate-700/50 absolute top-0">
        <div className="h-full bg-gradient-to-r from-brand-accent via-brand-copper to-green-400 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-brand-accent/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-brand-accent rounded-full animate-spin" />
          </div>
          <p className="text-white text-lg font-semibold">AI Analyzing Your Photo...</p>
          <p className="text-slate-400 text-sm mt-1">Scanning for pipe issues, leaks, blockages</p>
        </div>
      </div>
    </div>
  )
}

function DiagnosisResult({ result, onSeePlumbers }) {
  return (
    <div className="space-y-4">
      <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-green-300 font-semibold">Diagnosis Complete</p>
        <p className="text-green-200 text-sm mt-1">Confidence: {result.confidence}%</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <p className="text-slate-300 text-sm font-medium">Identified Issue</p>
        <p className="text-white text-lg font-bold mt-1">{result.issue}</p>
        <p className="text-slate-400 text-xs mt-1">Estimated repair: {result.estimate}</p>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-3 text-center">
        <p className="text-amber-400 text-sm font-semibold">{result.plumbers_available}</p>
        <p className="text-slate-400 text-xs">Average response: {result.avg_response}</p>
      </div>

      <button onClick={onSeePlumbers}
        className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg">
        See Available Plumbers
      </button>

      <p className="text-slate-500 text-xs text-center">
        We&apos;ve diagnosed {result.similar_cases} similar issues this month
      </p>
    </div>
  )
}

function UploadZone({ onFileSelected, isDragging, onDragState }) {
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
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragging
          ? 'border-brand-accent bg-brand-accent/10 scale-[1.02]'
          : 'border-slate-600 hover:border-brand-accent/50 bg-slate-800/50 hover:bg-slate-800'
      }`}
    >
      <div className="text-5xl mb-4">📸</div>
      <p className="text-white text-lg font-semibold mb-2">Upload a photo of your plumbing issue</p>
      <p className="text-slate-400 text-sm mb-4">Or drag and drop here</p>
      <button className="inline-block bg-brand-copper hover:bg-amber-600 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all hover:scale-105">
        Take Photo / Upload
      </button>
      <p className="text-slate-500 text-xs mt-3">JPEG, PNG, HEIC — Max 10MB</p>
      <input ref={inputRef} type="file" accept="image/*,video/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files[0] && onFileSelected(e.target.files[0])} />
    </div>
  )
}

export default function AIDiagnosisBlock({ content }) {
  const { headline, subheadline, upload_cta, urgency_text } = content || {}
  const [step, setStep] = useState('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [result, setResult] = useState(null)
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const widgetRef = useRef(null)
  const reduced = useReducedMotion()

  // Demo result — real impl would call backend
  const demoResult = {
    confidence: 94,
    issue: 'Pipe joint leak — threaded connection',
    estimate: 'Rs 1,200 - Rs 2,500',
    plumbers_available: '3 plumbers near you available now',
    avg_response: '15 minutes',
    similar_cases: 847,
  }

  useGSAP(() => {
    if (reduced) return
    gsap.from(headerRef.current?.children, { immediateRender: false, y: 30, opacity: 0, stagger: 0.1, duration: DURATIONS.reveal, ease: EASES.out, scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } })
    gsap.from(widgetRef.current, { immediateRender: false, y: 40, opacity: 0, duration: DURATIONS.normal, ease: EASES.out, scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } })
  }, { scope: sectionRef, dependencies: [reduced] })

  function handleFileSelected() {
    setStep('scanning')
    setScanProgress(0)
    const interval = setInterval(() => {
      setScanProgress((p) => {
        const next = p + Math.random() * 15 + 5
        if (next >= 100) {
          clearInterval(interval)
          setResult(demoResult)
          setStep('results')
          return 100
        }
        return next
      })
    }, 400)
  }

  function handleSeePlumbers() {
    // scroll to services / booking section
    const el = document.getElementById('plumbers')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

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

        <div ref={widgetRef} className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl max-w-lg mx-auto">
          {step === 'upload' && (
            <UploadZone onFileSelected={handleFileSelected} isDragging={isDragging} onDragState={setIsDragging} />
          )}

          {step === 'scanning' && (
            <div className="relative min-h-[300px] flex items-center justify-center">
              <UploadZone onFileSelected={handleFileSelected} isDragging={false} onDragState={() => {}} />
              <ScanningOverlay progress={scanProgress} />
            </div>
          )}

          {step === 'results' && result && (
            <DiagnosisResult result={result} onSeePlumbers={handleSeePlumbers} />
          )}

          {urgency_text && step !== 'results' && (
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
      </div>
    </section>
  )
}
