export default function DesignReference() {
  const colors = [
    { name: 'brand-bg', token: '--color-brand-bg', value: '#0f172a', class: 'bg-[#0f172a]' },
    { name: 'brand-surface', token: '--color-brand-surface', value: '#1e293b', class: 'bg-[#1e293b]' },
    { name: 'brand-accent', token: '--color-brand-accent', value: '#2563eb', class: 'bg-[#2563eb]' },
    { name: 'brand-copper', token: '--color-brand-copper', value: '#d97706', class: 'bg-[#d97706]' },
    { name: 'brand-emergency', token: '--color-brand-emergency', value: '#dc2626', class: 'bg-[#dc2626]' },
    { name: 'brand-text', token: '--color-brand-text', value: '#f8fafc', class: 'bg-[#f8fafc]' },
  ]

  const grayScale = [
    { name: 'slate-50', value: '#f8fafc' },
    { name: 'slate-100', value: '#f1f5f9' },
    { name: 'slate-200', value: '#e2e8f0' },
    { name: 'slate-300', value: '#cbd5e1' },
    { name: 'slate-400', value: '#94a3b8' },
    { name: 'slate-500', value: '#64748b' },
    { name: 'slate-600', value: '#475569' },
    { name: 'slate-700', value: '#334155' },
    { name: 'slate-800', value: '#1e293b' },
    { name: 'slate-900', value: '#0f172a' },
    { name: 'slate-950', value: '#020617' },
  ]

  const spacing = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64]

  const Section = ({ title, id, children }) => (
    <section id={id} className="mb-16 scroll-mt-20">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <div className="w-16 h-1 bg-brand-accent rounded-full mb-8" />
      {children}
    </section>
  )

  const Swatch = ({ label, classBg, value }) => (
    <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-3 border border-slate-700">
      <div className={`w-12 h-12 rounded-lg border border-slate-600 shrink-0 ${classBg}`} />
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-slate-400 text-xs">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Design Reference</h1>
          <nav className="flex gap-4 text-sm">
            <a href="#colors" className="text-slate-400 hover:text-white transition">Colors</a>
            <a href="#typography" className="text-slate-400 hover:text-white transition">Typography</a>
            <a href="#spacing" className="text-slate-400 hover:text-white transition">Spacing</a>
            <a href="#buttons" className="text-slate-400 hover:text-white transition">Buttons</a>
            <a href="#forms" className="text-slate-400 hover:text-white transition">Forms</a>
            <a href="#cards" className="text-slate-400 hover:text-white transition">Cards</a>
            <a href="#components" className="text-slate-400 hover:text-white transition">Components</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">

        {/* Colors */}
        <Section title="Colors" id="colors">
          <h3 className="text-lg font-semibold text-slate-300 mb-4">Brand Palette</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-10">
            {colors.map((c) => (
              <Swatch key={c.name} label={c.name} classBg={c.class} value={c.value} />
            ))}
          </div>

          <h3 className="text-lg font-semibold text-slate-300 mb-4">Neutral Scale</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {grayScale.map((c) => (
              <Swatch key={c.name} label={c.name} classBg={`bg-${c.name}`} value={c.value} />
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography" id="typography">
          <div className="space-y-6 bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div>
              <p className="text-xs text-slate-500 mb-1">Display</p>
              <p className="text-5xl font-bold text-white">MPTech Plumbing</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Heading 1</p>
              <h1 className="text-4xl font-bold text-white">24/7 Emergency Services</h1>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Heading 2</p>
              <h2 className="text-3xl font-bold text-white">Residential & Commercial</h2>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Heading 3</p>
              <h3 className="text-2xl font-semibold text-white">Trusted Since 2010</h3>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Body Large</p>
              <p className="text-lg text-slate-300">Serving the greater metro area with reliable plumbing solutions.</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Body</p>
              <p className="text-base text-slate-400">From minor fixes to full system installations, our licensed plumbers handle it all with professionalism and care.</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Small / Caption</p>
              <p className="text-sm text-slate-500">Licensed &bull; Insured &bull; Bonded</p>
            </div>
          </div>
        </Section>

        {/* Spacing */}
        <Section title="Spacing Scale" id="spacing">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-xs text-slate-500 mb-4">Tailwind spacing tokens (rem)</p>
            <div className="space-y-2">
              {spacing.map((s) => (
                <div key={s} className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs w-8 text-right">{s}</span>
                  <div className="h-4 bg-brand-accent rounded" style={{ width: `${s * 0.25}rem` }} />
                  <span className="text-slate-500 text-xs">{s * 0.25}rem</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons" id="buttons">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-6">
            <div>
              <p className="text-xs text-slate-500 mb-3">Variants</p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-brand-accent hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg transition">Primary</button>
                <button className="bg-brand-copper hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg transition">Copper</button>
                <button className="bg-brand-emergency hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition">Emergency</button>
                <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-5 py-2.5 rounded-lg transition">Secondary</button>
                <button className="border border-slate-600 hover:border-slate-500 text-slate-300 font-semibold px-5 py-2.5 rounded-lg transition">Outline</button>
                <button className="text-slate-400 hover:text-white font-semibold px-5 py-2.5 rounded-lg transition">Ghost</button>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-3">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <button className="bg-brand-accent hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">Small</button>
                <button className="bg-brand-accent hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">Default</button>
                <button className="bg-brand-accent hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition">Large</button>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-3">States</p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-brand-accent text-white font-semibold px-5 py-2.5 rounded-lg opacity-50 cursor-not-allowed">Disabled</button>
                <button className="bg-brand-accent text-white font-semibold px-5 py-2.5 rounded-lg relative">
                  Loading
                  <span className="ml-2 inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* Forms */}
        <Section title="Form Elements" id="forms">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-5">
            <div>
              <p className="text-xs text-slate-500 mb-3">Text Input</p>
              <label className="block text-slate-300 text-sm mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full max-w-sm bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent transition"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-3">With Error</p>
              <label className="block text-slate-300 text-sm mb-1">Email</label>
              <input
                type="email"
                defaultValue="bad-email"
                className="w-full max-w-sm bg-slate-700 border border-red-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-400 transition"
              />
              <p className="text-red-400 text-xs mt-1">Please enter a valid email</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-3">Textarea</p>
              <label className="block text-slate-300 text-sm mb-1">Message</label>
              <textarea
                rows={3}
                placeholder="Describe your issue..."
                className="w-full max-w-md bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent transition"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-3">Select</p>
              <label className="block text-slate-300 text-sm mb-1">Service Type</label>
              <select className="w-full max-w-sm bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-accent transition">
                <option>Residential</option>
                <option>Commercial</option>
                <option>Emergency</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards & Containers" id="cards">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="w-10 h-10 bg-brand-accent/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-brand-accent text-lg">&#x1f50b;</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Standard Card</h3>
              <p className="text-slate-400 text-sm">Used for services, features, and info panels. Rounded-xl with subtle border.</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 border-dashed">
              <h3 className="text-lg font-semibold text-white mb-2">Dashed Variant</h3>
              <p className="text-slate-400 text-sm">For drop zones, empty states, or secondary containers.</p>
            </div>
            <div className="bg-gradient-to-br from-brand-accent/10 to-transparent rounded-xl p-6 border border-brand-accent/30">
              <h3 className="text-lg font-semibold text-white mb-2">Accent Card</h3>
              <p className="text-slate-300 text-sm">Highlighted container with accent gradient and border.</p>
            </div>
            <div className="bg-gradient-to-br from-brand-emergency/10 to-transparent rounded-xl p-6 border border-brand-emergency/30">
              <h3 className="text-lg font-semibold text-white mb-2">Emergency Card</h3>
              <p className="text-slate-300 text-sm">For urgent call-to-action or alert sections.</p>
            </div>
          </div>
        </Section>

        {/* Component Previews */}
        <Section title="Component Previews" id="components">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">SEOBadge</h3>
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl font-bold text-green-400">92</div>
                  <div>
                    <p className="text-white text-sm font-semibold">SEO Score</p>
                    <p className="text-slate-400 text-xs">out of 100</p>
                  </div>
                </div>
                <p className="text-slate-300 text-xs">Keyword density: 2.4%</p>
                <p className="text-slate-300 text-xs">Readability: 78/100</p>
                <div className="mt-3">
                  <p className="text-slate-400 text-xs font-semibold mb-1">Suggestions:</p>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                    <li>Add meta description</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Login Form Theme</h3>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 text-center">Admin Login</h3>
                <div className="mb-3">
                  <label className="block text-slate-300 text-sm mb-1">Email</label>
                  <input className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-accent" placeholder="admin@example.com" />
                </div>
                <div className="mb-4">
                  <label className="block text-slate-300 text-sm mb-1">Password</label>
                  <input type="password" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-accent" placeholder="••••••••" />
                </div>
                <button className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">Sign In</button>
              </div>
            </div>
          </div>
        </Section>

      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        <p>MPTech Plumbing Solutions — Design Reference v1.0</p>
      </footer>
    </div>
  )
}
