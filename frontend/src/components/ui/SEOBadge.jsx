export default function SEOBadge({ score = 0, report = {} }) {
  const color = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const bg = score >= 80 ? 'bg-green-900/30 border-green-700' : score >= 50 ? 'bg-amber-900/30 border-amber-700' : 'bg-red-900/30 border-red-700'

  return (
    <div className={`rounded-lg border ${bg} p-4`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-3xl font-bold ${color}`}>{score}</div>
        <div>
          <p className="text-white text-sm font-semibold">SEO Score</p>
          <p className="text-slate-400 text-xs">out of 100</p>
        </div>
      </div>
      {report.keyword_density !== undefined && (
        <p className="text-slate-300 text-xs">Keyword density: {(report.keyword_density * 100).toFixed(1)}%</p>
      )}
      {report.readability_score !== undefined && (
        <p className="text-slate-300 text-xs">Readability: {report.readability_score}/100</p>
      )}
      {report.suggestions && report.suggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-slate-400 text-xs font-semibold mb-1">Suggestions:</p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
            {report.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
