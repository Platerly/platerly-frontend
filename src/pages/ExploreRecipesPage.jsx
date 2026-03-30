import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, SlidersHorizontal, ShieldCheck, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePremium } from '../hooks/usePremium'
import { useScanStatus } from '../hooks/useScanStatus'
import { API_BASE_URL } from '../utils/api'
import { logger } from '../utils/logger'
import IndexedRecipeCard from '../components/recipe/IndexedRecipeCard'
import IndexedSaveToCookbookModal from '../components/recipe/IndexedSaveToCookbookModal'

// ── Nickel filter options (display label → API value) ─────────────────────
const NICKEL_OPTIONS = [
  { label: 'All',      value: ''         },
  { label: 'Low',      value: 'SAFE'     },
  { label: 'Moderate', value: 'MODERATE' },
  { label: 'High',     value: 'EXCEEDED' },
]

const CUISINE_OPTIONS = [
  '', 'American', 'British', 'Canadian', 'Chinese', 'Croatian', 'Dutch',
  'Egyptian', 'Filipino', 'French', 'Greek', 'Indian', 'Irish', 'Italian',
  'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican', 'Moroccan',
  'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai', 'Tunisian',
  'Turkish', 'Ukrainian', 'Unknown', 'Vietnamese',
]

const PAGE_SIZE = 20

// ── Loading skeleton ───────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-recipzee-border bg-recipzee-card overflow-hidden animate-pulse">
      <div className="h-44 bg-recipzee-light" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-recipzee-light rounded w-3/4" />
        <div className="h-3 bg-recipzee-light rounded w-1/2" />
        <div className="flex gap-1.5">
          <div className="h-5 w-20 bg-recipzee-light rounded-full" />
          <div className="h-5 w-16 bg-recipzee-light rounded-full" />
        </div>
        <div className="space-y-1.5 pt-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 bg-recipzee-light rounded" style={{ width: `${75 - i * 8}%` }} />
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t border-recipzee-border">
          <div className="h-8 flex-1 bg-recipzee-light rounded-xl" />
          <div className="h-8 flex-1 bg-recipzee-light rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ── Allergen multi-select dropdown ─────────────────────────────────────────
function AllergenMultiSelect({ allAllergens, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (name) => {
    onChange(selected.includes(name) ? selected.filter(a => a !== name) : [...selected, name])
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-xl border border-recipzee-border bg-recipzee-card px-3 py-2 text-sm text-recipzee-text hover:border-recipzee-green/40 transition-colors min-w-[160px]"
      >
        <span className="flex-1 text-left truncate">
          {selected.length === 0
            ? 'Exclude allergens'
            : `${selected.length} excluded`
          }
        </span>
        {selected.length > 0 && (
          <span
            onClick={e => { e.stopPropagation(); onChange([]) }}
            className="text-recipzee-muted hover:text-recipzee-text"
            role="button"
            aria-label="Clear allergen exclusions"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-recipzee-muted flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 w-64 rounded-xl border border-recipzee-border bg-recipzee-card shadow-xl max-h-64 overflow-y-auto">
          {allAllergens.length === 0 ? (
            <p className="px-4 py-3 text-sm text-recipzee-muted">No allergens in your profile</p>
          ) : (
            allAllergens.map((a) => (
              <label
                key={a.id ?? a.name}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-recipzee-light cursor-pointer text-sm text-recipzee-text"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(a.name)}
                  onChange={() => toggle(a.name)}
                  className="accent-recipzee-green w-4 h-4 flex-shrink-0"
                />
                <span className="truncate">{a.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ExploreRecipesPage() {
  const { token, authed } = useAuth()
  const { isPremium, isOnTrial } = usePremium()
  const { atLimit } = useScanStatus()

  // Filter state
  const [query,         setQuery]         = useState('')
  const [cuisine,       setCuisine]       = useState('')
  const [nickelLoad,    setNickelLoad]    = useState('')
  const [excludedAllergens, setExcludedAllergens] = useState([])
  const [prepTimeMax,   setPrepTimeMax]   = useState('')
  const [showFilters,   setShowFilters]   = useState(false)

  // Results state
  const [results,    setResults]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // User allergens (for multi-select defaults)
  const [allAllergens, setAllAllergens] = useState([])

  // Save modal
  const [saveTarget, setSaveTarget] = useState(null) // recipe being saved

  // Saved recipe IDs (local optimistic state)
  const [savedIds, setSavedIds] = useState(new Set())

  // Debounce ref
  const debounceRef = useRef(null)

  // ── Fetch user's allergens ─────────────────────────────────────────────
  useEffect(() => {
    if (!authed || !token) return
    fetch(`${API_BASE_URL}/api/Allergy/my-allergies`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.items ?? [])
        setAllAllergens(list)
        // Pre-populate exclusions with user's saved allergens
        setExcludedAllergens(list.map(a => a.name))
      })
      .catch(err => logger.warn('Failed to load user allergens', err))
  }, [authed, token])

  // ── Fetch search results ───────────────────────────────────────────────
  const fetchResults = useCallback(async (pageNum, filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pageNum))
      params.set('pageSize', String(PAGE_SIZE))
      if (filters.query)        params.set('query', filters.query.trim())
      if (filters.cuisine)      params.set('cuisine', filters.cuisine)
      if (filters.nickelLoad)   params.set('maxNickelLoad', filters.nickelLoad)
      if (filters.excluded?.length) params.set('excludeAllergens', filters.excluded.join(','))
      if (filters.prepTimeMax)  params.set('prepTimeMax', filters.prepTimeMax)

      const res = await fetch(`${API_BASE_URL}/api/public/recipes/search?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      setResults(data.results ?? [])
      setTotalCount(data.totalCount ?? 0)
      setTotalPages(data.totalPages ?? 0)
    } catch (err) {
      logger.error('Explore recipes fetch failed', err)
      setResults([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // Re-fetch with debounce when filters change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchResults(1, { query, cuisine, nickelLoad, excluded: excludedAllergens, prepTimeMax })
      setPage(1)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, cuisine, nickelLoad, excludedAllergens, prepTimeMax])

  // Re-fetch when page changes (no debounce needed)
  useEffect(() => {
    fetchResults(page, { query, cuisine, nickelLoad, excluded: excludedAllergens, prepTimeMax })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSave(recipe) {
    if (!authed) {
      window.location.href = '/login'
      return
    }
    setSaveTarget(recipe)
  }

  function handleSaved(recipeId) {
    setSavedIds(prev => new Set([...prev, recipeId]))
    setSaveTarget(null)
  }

  return (
    <>
      <Helmet>
        <title>Explore Halal Recipes — Recipzee</title>
        <meta name="description" content="Discover thousands of halal-verified recipes from across the internet — every one screened by the Recipzee Halal Gate and analysed for your allergen profile." />
        <meta property="og:title" content="Explore Halal Recipes — Recipzee" />
        <meta property="og:description" content="Browse halal-verified recipes with full allergen and nickel analysis. Powered by clinical data from 257 peer-reviewed studies." />
        <link rel="canonical" href="https://recipzee.com/explore-recipes" />
      </Helmet>

      <div className="min-h-screen bg-recipzee-dark pb-16">
        <div className="mx-auto max-w-6xl px-4 pt-8 space-y-6">

          {/* ── Halal Verification Banner ───────────────────────────────── */}
          <div className="rounded-2xl border border-recipzee-green/30 bg-recipzee-green/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-recipzee-green flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-semibold text-recipzee-green text-sm">
                All recipes on Recipzee have been verified halal.
              </p>
              <p className="text-xs text-recipzee-muted mt-0.5">
                Allergen analysis powered by clinical data from 257 peer-reviewed studies.
                Every recipe is screened by the Recipzee Halal Gate before being listed here.
              </p>
            </div>
          </div>

          {/* ── Page title ─────────────────────────────────────────────── */}
          <div>
            <h1 className="text-2xl font-bold text-recipzee-text">Explore Recipes</h1>
            <p className="text-sm text-recipzee-muted mt-1">
              {totalCount > 0 && !loading
                ? `${totalCount.toLocaleString()} halal-verified recipes`
                : 'Halal-verified, allergen-analysed recipes from trusted sources'}
            </p>
          </div>

          {/* ── Search bar ─────────────────────────────────────────────── */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-recipzee-muted pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search recipes (e.g. chicken biryani, lentil soup…)"
              className="w-full rounded-2xl border border-recipzee-border bg-recipzee-card py-3 pl-11 pr-4 text-sm text-recipzee-text placeholder-recipzee-muted focus:border-recipzee-green/60 focus:outline-none focus:ring-2 focus:ring-recipzee-green/20 transition-all"
            />
          </div>

          {/* ── Filter row ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Mobile: toggle filters */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className="sm:hidden flex items-center gap-2 text-sm text-recipzee-subtle hover:text-recipzee-text"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showFilters ? 'Hide filters' : 'Show filters'}
            </button>

            <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-3`}>

              {/* Cuisine dropdown */}
              <select
                value={cuisine}
                onChange={e => setCuisine(e.target.value)}
                className="rounded-xl border border-recipzee-border bg-recipzee-card px-3 py-2 text-sm text-recipzee-text focus:border-recipzee-green/60 focus:outline-none focus:ring-2 focus:ring-recipzee-green/20 transition-all"
              >
                <option value="">All Cuisines</option>
                {CUISINE_OPTIONS.filter(Boolean).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Nickel load */}
              <div className="flex items-center gap-1 rounded-xl border border-recipzee-border bg-recipzee-card px-1 py-1">
                {NICKEL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNickelLoad(opt.value)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                      nickelLoad === opt.value
                        ? 'bg-recipzee-green text-recipzee-dark'
                        : 'text-recipzee-muted hover:text-recipzee-text'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Allergen exclusions */}
              <AllergenMultiSelect
                allAllergens={allAllergens}
                selected={excludedAllergens}
                onChange={setExcludedAllergens}
              />

              {/* Prep time slider */}
              <div className="flex items-center gap-2 min-w-[180px]">
                <span className="text-xs text-recipzee-muted whitespace-nowrap">Max time:</span>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={prepTimeMax || 0}
                  onChange={e => setPrepTimeMax(e.target.value === '0' ? '' : e.target.value)}
                  className="flex-1 accent-recipzee-green"
                />
                <span className="text-xs text-recipzee-text w-14 text-right">
                  {prepTimeMax ? `${prepTimeMax}m` : 'Any'}
                </span>
              </div>

              {/* Halal Only — informational, always on */}
              <div
                className="flex items-center gap-2 rounded-xl border border-recipzee-green/30 bg-recipzee-green/5 px-3 py-2 cursor-default"
                title="Every recipe on this page is halal verified — this cannot be disabled"
              >
                <div className="w-8 h-4 rounded-full bg-recipzee-green flex items-center justify-end px-0.5">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <span className="text-xs text-recipzee-green font-medium">Halal Only</span>
                <ShieldCheck className="w-3.5 h-3.5 text-recipzee-green" />
              </div>

            </div>
          </div>

          {/* ── Results grid ───────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-recipzee-light flex items-center justify-center">
                <Search className="w-7 h-7 text-recipzee-muted" />
              </div>
              <div>
                <p className="text-lg font-semibold text-recipzee-text">No recipes found</p>
                <p className="text-sm text-recipzee-muted mt-1 max-w-sm">
                  Try broadening your search — remove some filters, or search for a different cuisine or ingredient.
                </p>
              </div>
              <button
                onClick={() => {
                  setQuery(''); setCuisine(''); setNickelLoad('')
                  setExcludedAllergens([]); setPrepTimeMax('')
                }}
                className="rounded-xl border border-recipzee-border px-4 py-2 text-sm text-recipzee-subtle hover:text-recipzee-text hover:border-recipzee-green/40 transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {results.map(recipe => (
                <IndexedRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  atLimit={atLimit}
                  isAuthenticated={authed}
                  isPremium={isPremium}
                  isOnTrial={isOnTrial}
                  isSaved={savedIds.has(recipe.id)}
                  onSave={handleSave}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-recipzee-border">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1.5 rounded-xl border border-recipzee-border px-4 py-2 text-sm text-recipzee-subtle hover:text-recipzee-text hover:border-recipzee-green/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="text-sm text-recipzee-muted text-center">
                <span className="text-recipzee-text font-medium">Page {page}</span>
                {' '}of {totalPages}
                <span className="hidden sm:inline text-recipzee-muted"> · {totalCount.toLocaleString()} recipes</span>
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 rounded-xl border border-recipzee-border px-4 py-2 text-sm text-recipzee-subtle hover:text-recipzee-text hover:border-recipzee-green/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Save to Cookbook modal (wired up in Part 3) ─────────────────── */}
      {saveTarget && (
        <IndexedSaveToCookbookModal
          recipe={saveTarget}
          onClose={() => setSaveTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
