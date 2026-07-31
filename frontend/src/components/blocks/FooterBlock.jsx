const SOCIAL_ICONS = {
  facebook: { viewBox: '0 0 24 24', path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
  twitter: { viewBox: '0 0 24 24', path: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z' },
  instagram: { viewBox: '0 0 24 24', path: 'M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5m-5 16a5 5 0 1 1 5-5 5 5 0 0 1-5 5m5.5-10.5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5' },
  youtube: { viewBox: '0 0 24 24', path: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58M9.75 15.02V8.98L15.5 12z' },
  linkedin: { viewBox: '0 0 24 24', path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6M2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4' },
}

export default function FooterBlock({ content }) {
  const { copyright, tagline, socials } = content || {}

  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {socials && socials.length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            {socials.map((s, i) => {
              const icon = SOCIAL_ICONS[s.platform]
              if (!icon) return null
              return (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-brand-accent rounded-full flex items-center justify-center border border-slate-700 hover:border-brand-accent transition-all group">
                  <svg viewBox={icon.viewBox} className="w-5 h-5 fill-slate-400 group-hover:fill-white transition">
                    <path d={icon.path} />
                  </svg>
                </a>
              )
            })}
          </div>
        )}
        <p className="text-center text-slate-500 text-sm">{copyright || '© All rights reserved.'}</p>
        {tagline && <p className="text-center text-slate-600 text-xs mt-1">{tagline}</p>}
      </div>
    </footer>
  )
}
