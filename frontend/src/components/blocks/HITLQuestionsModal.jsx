import { useState } from 'react'

function QuestionControl({ question, value, onChange }) {
  const q = String(question).trim()
  const yesNo = ['yes', 'no', 'not sure'].includes(String(value).toLowerCase())
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <p className="text-white text-sm font-semibold mb-3">{q}</p>
      <div className="flex flex-wrap gap-2">
        {['Yes', 'No', 'Not sure'].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              yesNo && String(value).toLowerCase() === opt.toLowerCase()
                ? 'bg-brand-accent text-white shadow-glow-blue'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {opt}
          </button>
        ))}
        <input
          type="text"
          value={yesNo ? '' : String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => yesNo && onChange('')}
          placeholder="Type a custom answer…"
          className="flex-1 min-w-[160px] bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent"
        />
      </div>
    </div>
  )
}

export default function HITLQuestionsModal({ questions, imageUrl, onSubmit, onCancel, submitting }) {
  const [answers, setAnswers] = useState({})
  const valid = questions.every((q) => String(answers[q] ?? '').trim().length > 0)

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h3 className="text-white text-lg font-bold">Before we diagnose</h3>
            <p className="text-slate-400 text-xs mt-0.5">Our AI needs 2-3 quick answers to sharpen the result</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {imageUrl && (
            <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl p-3">
              <img
                src={imageUrl}
                alt="Your plumbing issue"
                className="w-16 h-16 object-cover rounded-lg border border-slate-600"
              />
              <div>
                <p className="text-slate-200 text-sm font-medium">Your uploaded photo</p>
                <p className="text-slate-500 text-xs">Visual inspection complete — see findings below</p>
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

        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900">
          <button
            type="button"
            disabled={!valid || submitting}
            onClick={() => onSubmit(answers)}
            className="w-full bg-brand-accent hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-glow-blue"
          >
            {submitting ? 'Analyzing your answers…' : 'Submit Answers & Get Diagnosis'}
          </button>
          {!valid && (
            <p className="text-slate-500 text-xs text-center mt-2">Answer every question to continue.</p>
          )}
        </div>
      </div>
    </div>
  )
}
