import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, FlaskConical, AlertTriangle, ChevronRight, Info } from 'lucide-react'
import Footer from '../../components/Footer'
import { API_BASE_URL } from '../../utils/api'

// ── Helpers ────────────────────────────────────────────────────────────────────

function nickelBadge(classification) {
  switch (classification?.toLowerCase()) {
    case 'low':      return { label: 'LOW',      bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' }
    case 'moderate': return { label: 'MODERATE', bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/30',   dot: 'bg-amber-400'   }
    case 'high':     return { label: 'HIGH',     bg: 'bg-red-500/15',     text: 'text-red-300',     border: 'border-red-500/30',     dot: 'bg-red-400'     }
    default:         return { label: 'UNKNOWN',  bg: 'bg-white/5',        text: 'text-recipzee-muted', border: 'border-recipzee-border', dot: 'bg-white/30' }
  }
}

const NickelBadge = ({ classification, size = 'sm' }) => {
  const badge = nickelBadge(classification)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
      {badge.label}
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function IngredientsPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/public/ingredients/search?q=${encodeURIComponent(q.trim())}&limit=12`
      )
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch { /* ignore network errors */ }
    finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    debounceRef.current = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, doSearch])

  const classifications = [
    {
      label: 'LOW',
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-400',
      desc: 'Under 10 μg per serving. Generally safe on a low-nickel diet in normal portions.'
    },
    {
      label: 'MODERATE',
      color: 'text-amber-300',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      dot: 'bg-amber-400',
      desc: '10–20 μg per serving. Limit portion size and monitor cumulative daily intake.'
    },
    {
      label: 'HIGH',
      color: 'text-red-300',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      dot: 'bg-red-400',
      desc: 'Over 20 μg per serving. Typically restricted or avoided on a low-nickel diet.'
    },
  ]

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text flex flex-col">
      <Helmet>
        <title>Ingredient Nickel Lookup — Recipzee</title>
        <meta
          name="description"
          content="Look up the nickel content of any ingredient. Sourced from Rebelytics v9.1.1 — 257 peer-reviewed studies, 20,575 measurements. Free to use."
        />
        <link rel="canonical" href="https://www.recipzee.com/ingredients" />
      </Helmet>

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/4 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 flex-1">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-5">
            <FlaskConical className="w-4 h-4" />
            Nickel Content Database
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Ingredient Nickel Lookup
          </h1>

          <p className="text-recipzee-muted text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Find the nickel content of any ingredient — classification, μg per serving,
            and what it means for managing nickel allergy.
          </p>

          {/* Search input */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-recipzee-muted pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search an ingredient — e.g. spinach, oats, almonds"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-recipzee-card border border-recipzee-border text-recipzee-text placeholder:text-recipzee-muted/60 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-base"
              autoFocus
              autoComplete="off"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </section>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {(results.length > 0 || (searched && !loading)) && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
            {results.length === 0 ? (
              <div className="text-center py-10 text-recipzee-muted">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No ingredients found for "<span className="text-recipzee-text">{query}</span>".</p>
                <p className="text-sm mt-1 opacity-70">Try a different spelling or a more general term.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {results.map(r => (
                  <Link
                    key={r.id}
                    to={`/ingredients/${r.slug}`}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-recipzee-card border border-recipzee-border px-4 py-3.5 hover:border-emerald-500/30 hover:bg-recipzee-card/80 transition-all group"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-recipzee-text truncate group-hover:text-emerald-300 transition-colors">
                        {r.name}
                      </span>
                      {r.nutritionalCategory && (
                        <span className="text-xs text-recipzee-muted capitalize">{r.nutritionalCategory}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <NickelBadge classification={r.nickelClassification} />
                      <ChevronRight className="w-4 h-4 text-recipzee-muted group-hover:text-recipzee-text transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Classification guide ─────────────────────────────────────────── */}
        {results.length === 0 && !searched && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
            <h2 className="text-sm font-semibold text-recipzee-muted uppercase tracking-wider mb-4 text-center">
              Nickel classifications explained
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {classifications.map(c => (
                <div
                  key={c.label}
                  className={`rounded-2xl border ${c.border} ${c.bg} p-4 flex flex-col gap-2`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <span className={`text-sm font-bold ${c.color}`}>{c.label}</span>
                  </div>
                  <p className="text-xs text-recipzee-muted leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>

            {/* Popular ingredients */}
            <div className="mt-8 text-center">
              <p className="text-sm text-recipzee-muted mb-4">Common searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['spinach', 'oats', 'almonds', 'chicken', 'broccoli', 'lentils', 'rice', 'tofu', 'salmon', 'peanuts'].map(name => (
                  <button
                    key={name}
                    onClick={() => setQuery(name)}
                    className="px-3 py-1.5 rounded-xl bg-recipzee-card border border-recipzee-border text-sm text-recipzee-muted hover:text-recipzee-text hover:border-emerald-500/30 transition-all capitalize"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Source citation ──────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-10">
          <div className="flex items-start gap-3 rounded-xl bg-recipzee-card border border-recipzee-border/50 px-4 py-3">
            <Info className="w-4 h-4 text-recipzee-muted shrink-0 mt-0.5" />
            <p className="text-xs text-recipzee-muted/80 leading-relaxed">
              <span className="font-semibold text-recipzee-muted">Data source:</span>{' '}
              Rebelytics R&D Inc., <em>Nickel in Foods Summary Tables v9.1.1</em>, September 2025.
              Compiled from 257 international food composition studies, 20,575 individual measurements.
              Clinical thresholds: LOW &lt;10 μg/serving, MODERATE 10–20 μg/serving, HIGH &gt;20 μg/serving
              (Mislankar &amp; Zirwas 2013, daily threshold 150 μg/day).
              Not a substitute for professional dietary advice.
            </p>
          </div>
        </section>

      </div>

      <Footer variant="contained" />
    </div>
  )
}
