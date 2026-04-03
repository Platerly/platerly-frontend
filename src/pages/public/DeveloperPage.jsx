/**
 * DeveloperPage.jsx — Layer: Public / Developer documentation
 *
 * Full API reference for the Recipzee Allergen Intelligence B2B API.
 * Accessible at /developer (subdomain: developer.recipzee.com → www.recipzee.com/developer)
 *
 * Features:
 *  - Sticky sidebar navigation with section anchors
 *  - Language tabs (cURL, JavaScript, Python) persisted across all examples
 *  - Copy-to-clipboard on every code block
 *  - Covers: Auth, Allergen Intelligence, Nickel Load, Recipe Safety,
 *    Substitution Engine, Data Enrichment, Nutrition, Regional Demand,
 *    Dietary Trends, Widget, Webhooks
 */
import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Copy, Check, ChevronRight, Menu, X, FlaskConical } from 'lucide-react'
import Footer from '../../components/Footer'

const BASE_URL = 'https://api.recipzee.com'

// ── Sidebar sections ──────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'response-format', label: 'Response Format' },
  { id: 'allergen-intelligence', label: 'Allergen Intelligence' },
  { id: 'nickel-load', label: 'Nickel Load' },
  { id: 'recipe-safety', label: 'Recipe Safety Audit' },
  { id: 'substitutions', label: 'Substitution Engine' },
  { id: 'data-enrichment', label: 'Data Enrichment' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'regional-demand', label: 'Regional Demand' },
  { id: 'dietary-trends', label: 'Dietary Trends' },
  { id: 'widget', label: 'White-Label Widget' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'errors', label: 'Error Codes' },
]

// ── Code examples per endpoint ────────────────────────────────────────────────

const EXAMPLES = {
  auth: {
    curl: `curl https://api.recipzee.com/api/AllergenAnalytics/prevalence \\
  -H "X-API-Key: YOUR_API_KEY"`,
    javascript: `const res = await fetch(
  'https://api.recipzee.com/api/AllergenAnalytics/prevalence',
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)
const data = await res.json()`,
    python: `import requests

res = requests.get(
    'https://api.recipzee.com/api/AllergenAnalytics/prevalence',
    headers={'X-API-Key': 'YOUR_API_KEY'}
)
data = res.json()`,
  },

  allergenSafeIngredients: {
    curl: `curl "${BASE_URL}/api/AllergenAnalytics/safe-ingredients?allergens=peanut,tree_nut&take=20" \\
  -H "X-API-Key: YOUR_API_KEY"`,
    javascript: `const params = new URLSearchParams({
  allergens: 'peanut,tree_nut',
  take: 20,
  excludeMayContain: true,
})
const res = await fetch(
  \`https://api.recipzee.com/api/AllergenAnalytics/safe-ingredients?\${params}\`,
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)
const { data } = await res.json()`,
    python: `import requests

res = requests.get(
    'https://api.recipzee.com/api/AllergenAnalytics/safe-ingredients',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    params={'allergens': 'peanut,tree_nut', 'take': 20, 'excludeMayContain': True}
)
data = res.json()`,
  },

  allergenIngredients: {
    curl: `curl "${BASE_URL}/api/AllergenAnalytics/ingredients/peanut?severity=HIGH&take=50" \\
  -H "X-API-Key: YOUR_API_KEY"`,
    javascript: `const res = await fetch(
  'https://api.recipzee.com/api/AllergenAnalytics/ingredients/peanut?severity=HIGH&take=50',
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)
const { data } = await res.json()`,
    python: `res = requests.get(
    'https://api.recipzee.com/api/AllergenAnalytics/ingredients/peanut',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    params={'severity': 'HIGH', 'take': 50}
)`,
  },

  nickelLoad: {
    curl: `curl -X POST ${BASE_URL}/api/b2b/nickel/daily-load \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "meals": [
      {
        "label": "Breakfast",
        "ingredients": [
          { "name": "oats", "quantityGrams": 80 },
          { "name": "almonds", "quantityGrams": 30 }
        ]
      }
    ]
  }'`,
    javascript: `const res = await fetch(
  'https://api.recipzee.com/api/b2b/nickel/daily-load',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meals: [
        {
          label: 'Breakfast',
          ingredients: [
            { name: 'oats', quantityGrams: 80 },
            { name: 'almonds', quantityGrams: 30 },
          ],
        },
      ],
    }),
  }
)
const { data } = await res.json()`,
    python: `import requests

res = requests.post(
    'https://api.recipzee.com/api/b2b/nickel/daily-load',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    json={
        'meals': [
            {
                'label': 'Breakfast',
                'ingredients': [
                    {'name': 'oats', 'quantityGrams': 80},
                    {'name': 'almonds', 'quantityGrams': 30},
                ]
            }
        ]
    }
)
data = res.json()`,
  },

  recipeSafety: {
    curl: `curl -X POST ${BASE_URL}/api/RecipeSafety/audit \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ingredients": ["flour", "eggs", "butter", "almonds"],
    "allergenProfile": ["gluten", "egg", "dairy", "tree_nut"]
  }'`,
    javascript: `const res = await fetch(
  'https://api.recipzee.com/api/RecipeSafety/audit',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ingredients: ['flour', 'eggs', 'butter', 'almonds'],
      allergenProfile: ['gluten', 'egg', 'dairy', 'tree_nut'],
    }),
  }
)
const { data } = await res.json()`,
    python: `res = requests.post(
    'https://api.recipzee.com/api/RecipeSafety/audit',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    json={
        'ingredients': ['flour', 'eggs', 'butter', 'almonds'],
        'allergenProfile': ['gluten', 'egg', 'dairy', 'tree_nut'],
    }
)`,
  },

  substitutions: {
    curl: `# Top substitutions globally
curl "${BASE_URL}/api/SubstitutionAnalytics/top?reason=allergy&take=10" \\
  -H "X-API-Key: YOUR_API_KEY"

# Substitutes for a specific ingredient (by ID)
curl "${BASE_URL}/api/SubstitutionAnalytics/{ingredientId}?take=10" \\
  -H "X-API-Key: YOUR_API_KEY"`,
    javascript: `// Top substitutions
const top = await fetch(
  'https://api.recipzee.com/api/SubstitutionAnalytics/top?reason=allergy&take=10',
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)

// Substitutes for a specific ingredient
const subs = await fetch(
  \`https://api.recipzee.com/api/SubstitutionAnalytics/\${ingredientId}?take=10\`,
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)`,
    python: `# Top substitutions
top = requests.get(
    'https://api.recipzee.com/api/SubstitutionAnalytics/top',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    params={'reason': 'allergy', 'take': 10}
)

# Substitutes for a specific ingredient
subs = requests.get(
    f'https://api.recipzee.com/api/SubstitutionAnalytics/{ingredient_id}',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    params={'take': 10}
)`,
  },

  dataEnrichment: {
    curl: `curl -X POST ${BASE_URL}/api/DataEnrichment/recipe \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Almond Flour Pancakes",
    "ingredients": ["almond flour", "eggs", "coconut milk", "baking powder"],
    "region": "CA"
  }'`,
    javascript: `const res = await fetch(
  'https://api.recipzee.com/api/DataEnrichment/recipe',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Almond Flour Pancakes',
      ingredients: ['almond flour', 'eggs', 'coconut milk', 'baking powder'],
      region: 'CA',
    }),
  }
)`,
    python: `res = requests.post(
    'https://api.recipzee.com/api/DataEnrichment/recipe',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    json={
        'title': 'Almond Flour Pancakes',
        'ingredients': ['almond flour', 'eggs', 'coconut milk', 'baking powder'],
        'region': 'CA',
    }
)`,
  },

  nutrition: {
    curl: `curl -X POST ${BASE_URL}/api/Nutrition/estimate \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ingredients": ["200g chicken breast", "100g broccoli", "1 tbsp olive oil"],
    "servings": 2
  }'`,
    javascript: `const res = await fetch(
  'https://api.recipzee.com/api/Nutrition/estimate',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ingredients: ['200g chicken breast', '100g broccoli', '1 tbsp olive oil'],
      servings: 2,
    }),
  }
)`,
    python: `res = requests.post(
    'https://api.recipzee.com/api/Nutrition/estimate',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    json={
        'ingredients': ['200g chicken breast', '100g broccoli', '1 tbsp olive oil'],
        'servings': 2,
    }
)`,
  },

  regionalDemand: {
    curl: `curl "${BASE_URL}/api/RegionalDemand/forecast?region=CA&days=30&take=20" \\
  -H "X-API-Key: YOUR_API_KEY"`,
    javascript: `const res = await fetch(
  'https://api.recipzee.com/api/RegionalDemand/forecast?region=CA&days=30&take=20',
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)`,
    python: `res = requests.get(
    'https://api.recipzee.com/api/RegionalDemand/forecast',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    params={'region': 'CA', 'days': 30, 'take': 20}
)`,
  },

  dietaryTrends: {
    curl: `# Trend data for a dietary tag
curl "${BASE_URL}/api/DietaryDeepDive/tag/low-nickel" \\
  -H "X-API-Key: YOUR_API_KEY"

# Crossover between dietary tags
curl "${BASE_URL}/api/DietaryDeepDive/crossover?take=20" \\
  -H "X-API-Key: YOUR_API_KEY"`,
    javascript: `// Tag detail
const tag = await fetch(
  'https://api.recipzee.com/api/DietaryDeepDive/tag/low-nickel',
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)

// Crossover
const crossover = await fetch(
  'https://api.recipzee.com/api/DietaryDeepDive/crossover?take=20',
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)`,
    python: `tag = requests.get(
    'https://api.recipzee.com/api/DietaryDeepDive/tag/low-nickel',
    headers={'X-API-Key': 'YOUR_API_KEY'}
)

crossover = requests.get(
    'https://api.recipzee.com/api/DietaryDeepDive/crossover',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    params={'take': 20}
)`,
  },

  widget: {
    curl: `curl -X POST ${BASE_URL}/api/Widget/configure \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "theme": "dark",
    "branding": { "primaryColor": "#22c55e", "logoUrl": "https://yoursite.com/logo.png" },
    "filters": { "allergens": ["peanut", "gluten"] }
  }'`,
    javascript: `const res = await fetch(
  'https://api.recipzee.com/api/Widget/configure',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      theme: 'dark',
      branding: { primaryColor: '#22c55e', logoUrl: 'https://yoursite.com/logo.png' },
      filters: { allergens: ['peanut', 'gluten'] },
    }),
  }
)
const { data } = await res.json()
// data.embedUrl — drop this into an <iframe>`,
    python: `res = requests.post(
    'https://api.recipzee.com/api/Widget/configure',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    json={
        'theme': 'dark',
        'branding': {'primaryColor': '#22c55e'},
        'filters': {'allergens': ['peanut', 'gluten']},
    }
)
embed_url = res.json()['data']['embedUrl']`,
  },

  webhooks: {
    curl: `# Subscribe to events
curl -X POST ${BASE_URL}/api/Webhook/subscribe \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yoursite.com/webhooks/recipzee",
    "eventTypes": ["ingredient.allergen_updated", "ingredient.substitution_added"]
  }'

# List subscriptions
curl ${BASE_URL}/api/Webhook \\
  -H "X-API-Key: YOUR_API_KEY"

# Delete a subscription
curl -X DELETE ${BASE_URL}/api/Webhook/{id} \\
  -H "X-API-Key: YOUR_API_KEY"`,
    javascript: `// Subscribe
const sub = await fetch(
  'https://api.recipzee.com/api/Webhook/subscribe',
  {
    method: 'POST',
    headers: { 'X-API-Key': 'YOUR_API_KEY', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://yoursite.com/webhooks/recipzee',
      eventTypes: ['ingredient.allergen_updated', 'ingredient.substitution_added'],
    }),
  }
)

// List all subscriptions
const list = await fetch(
  'https://api.recipzee.com/api/Webhook',
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)

// Delete
await fetch(
  \`https://api.recipzee.com/api/Webhook/\${id}\`,
  { method: 'DELETE', headers: { 'X-API-Key': 'YOUR_API_KEY' } }
)`,
    python: `# Subscribe
sub = requests.post(
    'https://api.recipzee.com/api/Webhook/subscribe',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    json={
        'url': 'https://yoursite.com/webhooks/recipzee',
        'eventTypes': ['ingredient.allergen_updated', 'ingredient.substitution_added'],
    }
)

# List
subs = requests.get(
    'https://api.recipzee.com/api/Webhook',
    headers={'X-API-Key': 'YOUR_API_KEY'}
)

# Delete
requests.delete(
    f'https://api.recipzee.com/api/Webhook/{sub_id}',
    headers={'X-API-Key': 'YOUR_API_KEY'}
)`,
  },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }
  return (
    <button
      onClick={copy}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-recipzee-muted hover:text-recipzee-text"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-recipzee-green" /> : <Copy size={13} />}
    </button>
  )
}

function CodeBlock({ code, lang = 'bash' }) {
  return (
    <div className="relative">
      <pre className="bg-black/40 border border-white/10 rounded-xl p-4 pr-10 text-xs text-recipzee-subtle font-mono overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
      <CopyButton text={code} />
    </div>
  )
}

function LangTabs({ lang, setLang }) {
  const tabs = ['curl', 'javascript', 'python']
  return (
    <div className="flex gap-1 mb-2">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => setLang(t)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            lang === t
              ? 'bg-recipzee-green text-black'
              : 'text-recipzee-muted hover:text-recipzee-text bg-white/5'
          }`}
        >
          {t === 'javascript' ? 'JavaScript' : t === 'python' ? 'Python' : 'cURL'}
        </button>
      ))}
    </div>
  )
}

function EndpointBadge({ method }) {
  const colors = {
    GET: 'bg-sky-400/15 text-sky-400 border-sky-400/30',
    POST: 'bg-recipzee-green/15 text-recipzee-green border-recipzee-green/30',
    DELETE: 'bg-red-400/15 text-red-400 border-red-400/30',
    PATCH: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${colors[method] ?? 'bg-white/5 text-recipzee-muted border-white/10'}`}>
      {method}
    </span>
  )
}

function Endpoint({ method, path }) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm bg-black/30 border border-white/10 rounded-lg px-3 py-2 my-2">
      <EndpointBadge method={method} />
      <span className="text-recipzee-text">{path}</span>
    </div>
  )
}

function ParamTable({ params }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 my-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="text-left px-3 py-2 text-recipzee-muted font-medium">Parameter</th>
            <th className="text-left px-3 py-2 text-recipzee-muted font-medium">Type</th>
            <th className="text-left px-3 py-2 text-recipzee-muted font-medium">Required</th>
            <th className="text-left px-3 py-2 text-recipzee-muted font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0">
              <td className="px-3 py-2 font-mono text-recipzee-green">{p.name}</td>
              <td className="px-3 py-2 text-sky-400">{p.type}</td>
              <td className="px-3 py-2 text-recipzee-muted">{p.required ? 'Yes' : 'No'}</td>
              <td className="px-3 py-2 text-recipzee-subtle">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionHeading({ id, children }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-recipzee-text mb-1 mt-12 scroll-mt-6">
      {children}
    </h2>
  )
}

function SubHeading({ children }) {
  return <h3 className="text-base font-semibold text-recipzee-text mt-6 mb-1">{children}</h3>
}

function P({ children }) {
  return <p className="text-sm text-recipzee-muted leading-relaxed mb-3">{children}</p>
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeveloperPage() {
  const [lang, setLang] = useState('curl')
  const [activeSection, setActiveSection] = useState('getting-started')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const contentRef = useRef(null)

  // Track active section on scroll
  useEffect(() => {
    const handler = () => {
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id)
        if (el && el.getBoundingClientRect().top <= 80) {
          setActiveSection(SECTIONS[i].id)
          return
        }
      }
      setActiveSection(SECTIONS[0].id)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setSidebarOpen(false)
  }

  const ex = EXAMPLES

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text flex flex-col">
      <Helmet>
        <title>Developer API Reference — Recipzee</title>
        <meta name="description" content="Full API reference for the Recipzee Allergen Intelligence B2B API. Code examples in cURL, JavaScript, and Python." />
        <link rel="canonical" href="https://developer.recipzee.com" />
      </Helmet>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-recipzee-dark/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 text-recipzee-muted hover:text-recipzee-text"
              onClick={() => setSidebarOpen(v => !v)}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <FlaskConical size={18} className="text-recipzee-green" />
              <span className="font-bold text-recipzee-text">Recipzee</span>
              <span className="text-recipzee-muted text-sm font-normal">/ Docs</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/api" className="text-sm text-recipzee-muted hover:text-recipzee-text transition-colors">
              Pricing
            </Link>
            <Link
              to="/b2b/pricing"
              className="text-sm bg-recipzee-green text-black font-medium px-3 py-1.5 rounded-lg hover:bg-recipzee-green/90 transition-colors"
            >
              Get API key
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 flex flex-1 w-full">

        {/* ── Sidebar ── */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-56 bg-recipzee-dark border-r border-white/10 pt-16 pb-8 px-4 overflow-y-auto
          lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:block lg:translate-x-0 lg:w-52 lg:shrink-0 lg:pt-8
          transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="space-y-0.5">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  activeSection === s.id
                    ? 'bg-recipzee-green/10 text-recipzee-green font-medium'
                    : 'text-recipzee-muted hover:text-recipzee-text hover:bg-white/5'
                }`}
              >
                {activeSection === s.id && <ChevronRight size={12} className="shrink-0" />}
                {activeSection !== s.id && <span className="w-3 shrink-0" />}
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main content ── */}
        <main ref={contentRef} className="flex-1 min-w-0 py-10 lg:pl-10 max-w-3xl">

          {/* Language tabs — sticky below header */}
          <div className="sticky top-14 z-10 bg-recipzee-dark/95 backdrop-blur-sm pb-3 mb-2 -mx-1 px-1">
            <LangTabs lang={lang} setLang={setLang} />
          </div>

          {/* ── Getting Started ── */}
          <section>
            <h1 id="getting-started" className="text-3xl font-extrabold mb-2 scroll-mt-20">
              Allergen Intelligence API
            </h1>
            <P>
              The Recipzee B2B API gives your application access to clinical allergen data, per-ingredient nickel content,
              recipe safety auditing, a validated substitution engine, and more — all in a single RESTful API.
            </P>
            <div className="bg-recipzee-card border border-recipzee-border rounded-xl p-4 mb-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-recipzee-muted text-xs font-medium uppercase tracking-wider">Base URL</span>
              </div>
              <code className="text-recipzee-green font-mono">https://api.recipzee.com</code>
            </div>
            <P>
              All endpoints return JSON. All responses are wrapped in a <code className="text-recipzee-green text-xs">SafetyApiResponse</code> envelope
              that includes a safety metadata block alongside the payload.
            </P>
          </section>

          {/* ── Authentication ── */}
          <SectionHeading id="authentication">Authentication</SectionHeading>
          <P>
            Every request must include your API key in the <code className="text-recipzee-green text-xs">X-API-Key</code> header.
            You can generate and manage keys from your{' '}
            <Link to="/b2b/billing" className="text-recipzee-green hover:underline">billing dashboard</Link>.
          </P>
          <CodeBlock code={ex.auth[lang]} />
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 text-xs text-amber-300 mt-3">
            Keep your API key secret. Never expose it in client-side code or public repositories.
            Rotate compromised keys immediately from your dashboard.
          </div>

          {/* ── Response Format ── */}
          <SectionHeading id="response-format">Response Format</SectionHeading>
          <P>Every endpoint wraps its payload in a <code className="text-recipzee-green text-xs">SafetyApiResponse&lt;T&gt;</code> envelope:</P>
          <CodeBlock code={`{
  "data": { ... },           // The endpoint-specific payload
  "safety": {
    "disclaimer": "...",     // Required safety disclaimer text
    "confidence": "HIGH",    // Data confidence: HIGH | MEDIUM | LOW
    "dataFreshnessUtc": "2026-04-03T12:00:00Z",
    "alerts": [
      {
        "severity": "WARNING",   // FATAL | WARNING | INFO
        "code": "CROSS_REACTIVITY",
        "message": "..."
      }
    ]
  }
}`} />

          {/* ── Allergen Intelligence ── */}
          <SectionHeading id="allergen-intelligence">Allergen Intelligence</SectionHeading>
          <P>Query allergen prevalence, find ingredients containing a specific allergen, or get a list of safe ingredients for a given allergen profile.</P>

          <SubHeading>Allergen Prevalence</SubHeading>
          <Endpoint method="GET" path="/api/AllergenAnalytics/prevalence" />
          <P>Returns the platform-wide prevalence distribution across all supported allergens.</P>
          <CodeBlock code={ex.auth[lang]} />

          <SubHeading>Ingredients by Allergen</SubHeading>
          <Endpoint method="GET" path="/api/AllergenAnalytics/ingredients/{allergenType}" />
          <P>Returns ingredients that contain a specific allergen, optionally filtered by severity.</P>
          <ParamTable params={[
            { name: 'allergenType', type: 'string', required: true, desc: 'Allergen slug (e.g. peanut, gluten, tree_nut, dairy, egg, shellfish, soy, sesame, nickel)' },
            { name: 'severity', type: 'string', required: false, desc: 'Filter by severity: HIGH | MEDIUM | LOW' },
            { name: 'take', type: 'integer', required: false, desc: 'Max results (1–200, default 50)' },
          ]} />
          <CodeBlock code={ex.allergenIngredients[lang]} />

          <SubHeading>Safe Ingredients for Allergen Profile</SubHeading>
          <Endpoint method="GET" path="/api/AllergenAnalytics/safe-ingredients" />
          <P>Returns ingredients confirmed safe for a given set of allergens.</P>
          <ParamTable params={[
            { name: 'allergens', type: 'string', required: true, desc: 'Comma-separated allergen slugs (e.g. peanut,tree_nut,gluten)' },
            { name: 'excludeMayContain', type: 'boolean', required: false, desc: 'Exclude "may contain" cross-contact ingredients (default true)' },
            { name: 'excludeCrossContact', type: 'boolean', required: false, desc: 'Exclude cross-contact risk ingredients (default false)' },
            { name: 'category', type: 'string', required: false, desc: 'Filter by ingredient category' },
            { name: 'take', type: 'integer', required: false, desc: 'Max results (1–500, default 100)' },
          ]} />
          <CodeBlock code={ex.allergenSafeIngredients[lang]} />

          {/* ── Nickel Load ── */}
          <SectionHeading id="nickel-load">Nickel Load</SectionHeading>
          <P>
            Calculate the estimated nickel intake for a set of meals. Data sourced from 257 peer-reviewed studies
            and 20,575 clinical measurements — the only commercial API with this coverage.
          </P>
          <Endpoint method="POST" path="/api/b2b/nickel/daily-load" />
          <ParamTable params={[
            { name: 'meals', type: 'array', required: true, desc: 'Array of meal objects (1–10). Each meal has label and ingredients.' },
            { name: 'meals[].label', type: 'string', required: true, desc: 'Meal label (e.g. "Breakfast")' },
            { name: 'meals[].ingredients', type: 'array', required: true, desc: 'Array of ingredient objects (1–50 per meal)' },
            { name: 'meals[].ingredients[].name', type: 'string', required: true, desc: 'Ingredient name (e.g. "oats")' },
            { name: 'meals[].ingredients[].quantityGrams', type: 'number', required: false, desc: 'Quantity in grams. If omitted, a default serving size is assumed.' },
          ]} />
          <CodeBlock code={ex.nickelLoad[lang]} />

          {/* ── Recipe Safety ── */}
          <SectionHeading id="recipe-safety">Recipe Safety Audit</SectionHeading>
          <P>Submit a recipe's ingredients and an allergen profile — get back a full safety report with flagged ingredients, severity levels, and suggested alternatives.</P>

          <SubHeading>Single Recipe Audit</SubHeading>
          <Endpoint method="POST" path="/api/RecipeSafety/audit" />
          <ParamTable params={[
            { name: 'ingredients', type: 'string[]', required: true, desc: 'List of ingredient names (1–200)' },
            { name: 'allergenProfile', type: 'string[]', required: false, desc: 'Allergen slugs to check against (0–30). If omitted, all allergens are checked.' },
          ]} />
          <CodeBlock code={ex.recipeSafety[lang]} />

          <SubHeading>Batch Audit</SubHeading>
          <Endpoint method="POST" path="/api/RecipeSafety/batch" />
          <P>Audit up to 50 recipes in a single request. Same structure per recipe as the single audit.</P>

          {/* ── Substitutions ── */}
          <SectionHeading id="substitutions">Substitution Engine</SectionHeading>
          <P>Find allergen-safe ingredient swaps with confidence scores, conversion ratios, and community validation.</P>

          <SubHeading>Top Substitutions</SubHeading>
          <Endpoint method="GET" path="/api/SubstitutionAnalytics/top" />
          <ParamTable params={[
            { name: 'reason', type: 'string', required: false, desc: 'Filter by reason: allergy | preference | unavailable' },
            { name: 'allergyId', type: 'guid', required: false, desc: 'Filter by allergen GUID' },
            { name: 'region', type: 'string', required: false, desc: 'ISO region code (e.g. CA, US, GB)' },
            { name: 'take', type: 'integer', required: false, desc: 'Max results (1–100, default 20)' },
          ]} />

          <SubHeading>Substitutes for an Ingredient</SubHeading>
          <Endpoint method="GET" path="/api/SubstitutionAnalytics/{ingredientId}" />
          <ParamTable params={[
            { name: 'ingredientId', type: 'guid', required: true, desc: 'The ingredient GUID to find substitutes for' },
            { name: 'reason', type: 'string', required: false, desc: 'Filter by substitution reason' },
            { name: 'take', type: 'integer', required: false, desc: 'Max results (1–200, default 50)' },
          ]} />
          <CodeBlock code={ex.substitutions[lang]} />

          <SubHeading>Substitution Reasons Breakdown</SubHeading>
          <Endpoint method="GET" path="/api/SubstitutionAnalytics/reasons" />
          <P>Returns the breakdown of substitution reasons across the platform.</P>

          {/* ── Data Enrichment ── */}
          <SectionHeading id="data-enrichment">Data Enrichment</SectionHeading>
          <P>Enrich raw ingredient names or recipes with allergen flags, nickel content, dietary tags, and metadata.</P>

          <SubHeading>Ingredient Enrichment</SubHeading>
          <Endpoint method="POST" path="/api/DataEnrichment/ingredients" />
          <ParamTable params={[
            { name: 'ingredientNames', type: 'string[]', required: true, desc: 'Array of ingredient name strings (1–100)' },
          ]} />

          <SubHeading>Recipe Enrichment</SubHeading>
          <Endpoint method="POST" path="/api/DataEnrichment/recipe" />
          <ParamTable params={[
            { name: 'title', type: 'string', required: false, desc: 'Recipe title (used for context scoring)' },
            { name: 'ingredients', type: 'string[]', required: true, desc: 'Array of ingredient names (1–200)' },
            { name: 'region', type: 'string', required: false, desc: 'ISO region code for regional allergen context' },
          ]} />
          <CodeBlock code={ex.dataEnrichment[lang]} />

          {/* ── Nutrition ── */}
          <SectionHeading id="nutrition">Nutrition</SectionHeading>
          <P>USDA-backed macronutrient data for any ingredient list or existing recipe.</P>

          <SubHeading>Estimate Nutrition</SubHeading>
          <Endpoint method="POST" path="/api/Nutrition/estimate" />
          <ParamTable params={[
            { name: 'ingredients', type: 'string[]', required: true, desc: 'Array of ingredient strings with quantities (1–100), e.g. "200g chicken breast"' },
            { name: 'servings', type: 'integer', required: false, desc: 'Number of servings (1–100, default 1)' },
          ]} />
          <CodeBlock code={ex.nutrition[lang]} />

          <SubHeading>Recipe Nutrition (by ID)</SubHeading>
          <Endpoint method="GET" path="/api/Nutrition/recipe/{recipeId}" />
          <P>Returns cached nutrition data for an indexed Recipzee recipe by GUID.</P>

          {/* ── Regional Demand ── */}
          <SectionHeading id="regional-demand">Regional Demand</SectionHeading>
          <P>Ingredient usage trends segmented by geography, season, and cuisine type. Useful for menu planning and procurement.</P>

          <SubHeading>Demand Forecast</SubHeading>
          <Endpoint method="GET" path="/api/RegionalDemand/forecast" />
          <ParamTable params={[
            { name: 'region', type: 'string', required: false, desc: 'ISO region code (e.g. CA, US, GB, AU)' },
            { name: 'days', type: 'integer', required: false, desc: 'Forecast window in days (7–180, default 30)' },
            { name: 'take', type: 'integer', required: false, desc: 'Max results (1–200, default 50)' },
            { name: 'category', type: 'string', required: false, desc: 'Ingredient category filter' },
          ]} />
          <CodeBlock code={ex.regionalDemand[lang]} />

          <SubHeading>Regional Comparison</SubHeading>
          <Endpoint method="GET" path="/api/RegionalDemand/compare" />
          <ParamTable params={[
            { name: 'regions', type: 'string', required: true, desc: 'Comma-separated ISO region codes to compare (e.g. CA,US,GB)' },
            { name: 'ingredientId', type: 'guid', required: false, desc: 'Scope comparison to a specific ingredient' },
            { name: 'take', type: 'integer', required: false, desc: 'Max results (1–100, default 20)' },
          ]} />

          {/* ── Dietary Trends ── */}
          <SectionHeading id="dietary-trends">Dietary Trends</SectionHeading>
          <P>Growth and decline rates for dietary tags — vegan, keto, gluten-free, halal, low-nickel, and more — over configurable windows.</P>

          <SubHeading>Tag Detail</SubHeading>
          <Endpoint method="GET" path="/api/DietaryDeepDive/tag/{tag}" />
          <ParamTable params={[
            { name: 'tag', type: 'string', required: true, desc: 'Dietary tag slug (e.g. low-nickel, vegan, keto, gluten-free, halal, dairy-free)' },
          ]} />

          <SubHeading>Tag Crossover</SubHeading>
          <Endpoint method="GET" path="/api/DietaryDeepDive/crossover" />
          <ParamTable params={[
            { name: 'take', type: 'integer', required: false, desc: 'Max crossover pairs to return (1–200, default 50)' },
          ]} />
          <CodeBlock code={ex.dietaryTrends[lang]} />

          {/* ── Widget ── */}
          <SectionHeading id="widget">White-Label Widget</SectionHeading>
          <P>
            Embed a fully branded allergen scanner into your product. Configure theme, branding, and allergen filters —
            then drop the returned <code className="text-recipzee-green text-xs">embedUrl</code> into an <code className="text-recipzee-green text-xs">&lt;iframe&gt;</code>.
            No backend required on your end.
          </P>

          <SubHeading>Configure Widget</SubHeading>
          <Endpoint method="POST" path="/api/Widget/configure" />
          <CodeBlock code={ex.widget[lang]} />

          <SubHeading>Widget Feed (anonymous)</SubHeading>
          <Endpoint method="GET" path="/api/Widget/feed" />
          <ParamTable params={[
            { name: 'configId', type: 'guid', required: true, desc: 'The config ID returned by /configure' },
          ]} />

          {/* ── Webhooks ── */}
          <SectionHeading id="webhooks">Webhooks</SectionHeading>
          <P>
            Subscribe to real-time push events when allergen data updates, new substitutions are validated,
            or safety thresholds are crossed. Recipzee delivers a signed JSON payload to your HTTPS endpoint.
          </P>

          <SubHeading>Available Event Types</SubHeading>
          <div className="bg-recipzee-card border border-recipzee-border rounded-xl p-4 my-3 grid sm:grid-cols-2 gap-1">
            {[
              'ingredient.allergen_updated',
              'ingredient.substitution_added',
              'ingredient.nickel_updated',
              'recipe.safety_alert',
              'subscription.created',
              'subscription.cancelled',
            ].map(e => (
              <code key={e} className="text-xs text-recipzee-green font-mono">{e}</code>
            ))}
          </div>

          <SubHeading>Subscribe</SubHeading>
          <Endpoint method="POST" path="/api/Webhook/subscribe" />
          <SubHeading>List Subscriptions</SubHeading>
          <Endpoint method="GET" path="/api/Webhook" />
          <SubHeading>Delete Subscription</SubHeading>
          <Endpoint method="DELETE" path="/api/Webhook/{id}" />
          <SubHeading>Send Test Event</SubHeading>
          <Endpoint method="POST" path="/api/Webhook/{id}/test" />
          <CodeBlock code={ex.webhooks[lang]} />

          {/* ── Errors ── */}
          <SectionHeading id="errors">Error Codes</SectionHeading>
          <div className="overflow-x-auto rounded-xl border border-white/10 my-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="text-left px-3 py-2 text-recipzee-muted font-medium">Status</th>
                  <th className="text-left px-3 py-2 text-recipzee-muted font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['200', 'Success'],
                  ['400', 'Bad request — check your request body or query parameters'],
                  ['401', 'Missing or invalid API key'],
                  ['402', 'Quota exceeded — upgrade your plan or wait for monthly reset'],
                  ['403', 'Forbidden — your plan does not include this endpoint'],
                  ['404', 'Resource not found'],
                  ['429', 'Rate limited — slow down requests (per-minute limit exceeded)'],
                  ['500', 'Internal server error — contact api@recipzee.com if persistent'],
                ].map(([code, msg]) => (
                  <tr key={code} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 font-mono text-sky-400">{code}</td>
                    <td className="px-3 py-2 text-recipzee-subtle">{msg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 text-center">
            <p className="text-recipzee-muted text-sm mb-4">
              Questions or need a higher quota?{' '}
              <a href="mailto:api@recipzee.com" className="text-recipzee-green hover:underline">
                api@recipzee.com
              </a>
            </p>
            <Link
              to="/b2b/pricing"
              className="inline-flex items-center gap-2 bg-recipzee-green text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-recipzee-green/90 transition-colors text-sm"
            >
              Get your API key <ChevronRight size={14} />
            </Link>
          </div>

        </main>
      </div>

      <Footer variant="full" />
    </div>
  )
}
