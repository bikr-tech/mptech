import { useState, useRef, useEffect } from 'react'

function MicrophoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function QuestionControl({ question, value, onChange }) {
  const q = String(question).trim()
  const yesNo = ['yes', 'no', 'not sure'].includes(String(value).toLowerCase())
  const [isRecording, setIsRecording] = useState(false)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  const hasSpeechRecognition = 'webkitSpeechRecognition' in window

  const startRecording = () => {
    if (!hasSpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome for this feature.')
      return
    }

    const SpeechRecognition = window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      console.log('Voice recognition started.')
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('')
      onChange(transcript)
      console.log('Transcript:', transcript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      alert(`Speech recognition error: ${event.error}. Please try again.`)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      console.log('Voice recognition ended.')
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  useEffect(() => {
    // Clean up recognition if component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return (
    <div className="glass-frost rounded-2xl p-4">
      <p className="text-white text-sm font-semibold mb-3">{q}</p>
      <div className="flex flex-wrap gap-2">
        {['Yes', 'No', 'Not sure'].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              yesNo && String(value).toLowerCase() === opt.toLowerCase()
                ? 'btn-3d'
                : 'bg-white/10 text-white/75 hover:bg-white/20 border border-white/10'
            }`}
          >
            {opt}
          </button>
        ))}
        <div className="relative flex-1 min-w-[160px] flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={yesNo ? '' : String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => yesNo && onChange('')}
            placeholder="Type or speak your answer…"
            className="flex-1 bg-white/10 border border-white/15 rounded-full pl-4 pr-12 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-electric-400"
            disabled={isRecording}
          />
          {hasSpeechRecognition && (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`absolute right-2.5 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                isRecording ? 'bg-emergency-500/80 text-white' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {hasSpeechRecognition && (
        <p className="text-white/40 text-xs mt-2 text-center">
          For best voice input experience, use Chrome.
        </p>
      )}
    </div>
  )
}

export default function HITLQuestionsModal({ questions, imageUrl, onSubmit, onCancel, submitting }) {
  const [answers, setAnswers] = useState({})
  const valid = questions.every((q) => String(answers[q] ?? '').trim().length > 0)

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl glass-frost rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-white text-lg font-bold">Before we diagnose</h3>
            <p className="text-white/50 text-xs mt-0.5">Our AI needs 2-3 quick answers to sharpen the result</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {imageUrl && (
            <div className="flex items-center gap-3 glass-frost rounded-xl p-3">
              <img
                src={imageUrl}
                alt="Your plumbing issue"
                className="w-16 h-16 object-cover rounded-lg border border-white/20"
              />
              <div>
                <p className="text-white/85 text-sm font-medium">Your uploaded photo</p>
                <p className="text-white/40 text-xs">Visual inspection complete — see findings below</p>
              </div>
            </div>
          )}

          {(questions || []).map((q) => (
            <QuestionControl
              key={q}
              question={q}
              value={answers[q]}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q]: v }))}
            />
          ))}
        </div>

        <div className="px-6 py-4 border-t border-white/10">
          <button
            type="button"
            disabled={!valid || submitting}
            onClick={() => onSubmit(answers)}
            className="w-full btn-3d disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-full text-base transition-all hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
          >
            {submitting ? 'Analyzing your answers…' : 'Submit Answers & Get Diagnosis'}
          </button>
          {!valid && (
            <p className="text-white/40 text-xs text-center mt-2">Answer every question to continue.</p>
          )}
        </div>
      </div>
    </div>
  )
}
