import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import classNames from 'classnames'
import { Filter, Search, TrendingUp, X, ChevronRight } from 'lucide-react'

/* ---------- small utils ---------- */
const useAuthed = (user, token) =>
  !!(user || token || (typeof window !== 'undefined' && (localStorage.getItem('token') || sessionStorage.getItem('token'))))

const Highlight = ({ text = '', query = '' }) => {
  if (!query) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <strong key={i} className="text-white">{p}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}

/* ---------- bottom sheet (mobile) ---------- */
function BottomSheet({ open, onClose, title, children }) {
  const sheetRef = useRef(null)

  // lock scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // close on ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-platerly-dark p-4 shadow-2xl animate-[slide-up_180ms_ease-out]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-platerly-subtle hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
      {/* keyframes (tailwind arbitrary) */}
      <style>{`@keyframes slide-up{from{transform:translateY(16px);opacity:.8}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

/* ---------- main component ---------- */
const RightColumn = () => {
  const { user, token } = useAuth()
  const authed = useAuthed(user, token)

  // quick search
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // trending
  const [trending, setTrending] = useState([])
  const [tLoading, setTLoading] = useState(true)
  const [tError, setTError] = useState(null)

  // filters via URL
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const difficulty = sp.get('difficulty') || 'any'
  const tags = sp.get('tags') || ''
  const requireAllTags = sp.get('requireAllTags') === 'true'
  const hideRemixes = sp.get('hideRemixes') === 'true'
  const hideMyAllergens = sp.get('hideMyAllergens') === 'true'

  // mobile sheet
  const [openSheet, setOpenSheet] = useState(false)

  /* ---------- typeahead ---------- */
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => fetchSuggestions(query), 250)
    return () => clearTimeout(t)
  }, [query])

  const fetchSuggestions = async (text) => {
    setLoadingSearch(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(text)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSuggestions(Array.isArray(data) ? data : [])
      setShowDropdown(true)
    } catch (e) {
      console.error(e)
      setSuggestions([])
    } finally {
      setLoadingSearch(false)
    }
  }

  const handleSelect = (item) => {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    if (item.type === 'user') navigate(`/profile/${item.username}`)
    else if (item.type === 'recipe') navigate(`/recipe/${item.recipeId}`)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setShowDropdown(false)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  /* ---------- filters ---------- */
  const updateParam = (key, value) => {
    const next = new URLSearchParams(sp)
    if (value === undefined || value === null || value === '' || value === 'any') next.delete(key)
    else next.set(key, String(value))
    next.delete('page')
    navigate({ pathname: '/feed', search: `?${next.toString()}` }, { replace: true })
  }
  const handleDifficulty = (e) => updateParam('difficulty', e.target.value)
  const handleTags = (e) => updateParam('tags', e.target.value)
  const handleRequireAll = (e) => updateParam('requireAllTags', e.target.checked)
  const handleHideRemixes = (e) => updateParam('hideRemixes', e.target.checked)
  const handleHideAllergens = (e) => updateParam('hideMyAllergens', e.target.checked)

  /* ---------- trending ---------- */
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setTLoading(true)
        const res = await fetch(`${API_BASE_URL}/api/feed/trending-top?limit=5`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (mounted) setTrending(data.items ?? [])
      } catch (err) {
        console.error(err)
        if (mounted) setTError('Failed to load trending')
      } finally {
        if (mounted) setTLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  /* ---------- shared UI blocks ---------- */
  const SearchBox = (
    <form onSubmit={handleSearchSubmit} className="relative" role="search">
      <div className="flex items-center gap-2 rounded-full border border-platerly-border bg-platerly-card px-3 py-2">
        <Search className="h-4 w-4 text-platerly-subtle" />
        <input
          type="text"
          placeholder="Search recipes or users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="w-full bg-transparent text-sm text-platerly-text placeholder-platerly-subtle focus:outline-none"
          aria-label="Search recipes or users"
        />
      </div>
      {showDropdown && (
        <div
          className="absolute top-11 left-0 right-0 z-50 max-h-72 overflow-y-auto rounded-lg border border-platerly-border bg-platerly-card shadow-lg"
          role="listbox"
        >
          {loadingSearch ? (
            <p className="p-4 text-center text-platerly-subtle">Searching…</p>
          ) : suggestions.length === 0 ? (
            <p className="p-4 text-center text-platerly-subtle">No results</p>
          ) : (
            <ul>
              {suggestions.map((item, idx) => (
                <li key={idx}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item)}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-platerly-green/10"
                    role="option"
                  >
                    {item.type === 'user' ? (
                      <span className="text-platerly-text">
                        👤 @<Highlight text={item.username} query={query} />{' '}
                        <span className="text-platerly-subtle">— {item.displayName}</span>
                      </span>
                    ) : (
                      <span className="text-platerly-text">
                        🍽️ <Highlight text={item.title} query={query} />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  )

  const Filters = authed && (
    <div className="rounded-xl border border-platerly-border bg-platerly-card/60 backdrop-blur-sm p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-platerly-subtle">Refine feed</h3>
      <div className="space-y-3 text-sm">
        <div>
          <label className="mb-1 block text-xs text-platerly-subtle">Difficulty</label>
          <select
            value={difficulty}
            onChange={handleDifficulty}
            className="w-full rounded-lg border border-platerly-border bg-platerly-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="any">Any</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-platerly-subtle">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={handleTags}
            placeholder="vegan, low nickel"
            className="w-full rounded-lg border border-platerly-border bg-platerly-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={requireAllTags} onChange={handleRequireAll} />
          <span>Require all tags</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hideRemixes} onChange={handleHideRemixes} />
          <span>Hide remixes</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hideMyAllergens} onChange={handleHideAllergens} />
          <span>Hide my allergens</span>
        </label>
      </div>
    </div>
  )

  const Trending = (
  <div className="rounded-xl border border-platerly-border bg-platerly-card/60 backdrop-blur-sm p-4">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-orange-400">
        <TrendingUp className="h-4 w-4 stroke-orange-400" />
        <span>Trending</span>
      </h3>

      <button
        onClick={() => navigate('/feed?sort=trending')}
        className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 rounded"
        aria-label="See all trending"
      >
        See all
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>

    {tLoading && (
      <ul className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <li key={i} className="animate-pulse">
            <div className="grid grid-cols-[64px_1fr] items-center gap-3">
              <div className="h-12 w-16 rounded-md bg-white/10" />
              <div className="space-y-2">
                <div className="h-3 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-white/10" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    )}

    {!tLoading && tError && <div className="text-xs text-red-300">{tError}</div>}

    {!tLoading && !tError && (
      <ul className="space-y-3">
        {trending.map((it) => (
          <li key={it.id}>
            <button
              onClick={() => navigate(`/recipe/${it.id}`)}
              className="group w-full text-left"
            >
              <div className="grid grid-cols-[64px_1fr] items-center gap-3">
                {/* thumb */}
                <div className="relative h-12 w-16 overflow-hidden rounded-md ring-1 ring-white/10">
                  <img
                    src={it.imageUrl}
                    alt={it.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute left-1 top-1 rounded-md bg-orange-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                    #{it.rank}
                  </span>
                </div>

                {/* text */}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium group-hover:underline">
                    {it.title}
                  </div>
                  <div className="mt-0.5 text-xs text-platerly-subtle">
                    by <span className="font-medium text-platerly-text/90">{it.username}</span>
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)


  /* ---------- render ---------- */
  return (
    <>
      {/* Desktop right rail */}
      <aside className="bg-platerly-light text-platerly-text fixed right-0 top-0 hidden h-screen w-[320px] overflow-y-auto border-l border-platerly-border px-6 py-8 lg:block">
        <div className="space-y-6">
          {SearchBox}
          {Filters}
          {Trending}
        </div>
      </aside>

      {/* Mobile floating action + bottom sheet */}
      <div className="lg:hidden">
        {/* FAB */}
        <button
          onClick={() => setOpenSheet(true)}
          className="fixed bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          aria-label="Open explore panel"
        >
          <Filter className="h-4 w-4" />
          Explore
        </button>

        <BottomSheet open={openSheet} onClose={() => setOpenSheet(false)} title="Explore">
          <div className="space-y-6">
            {SearchBox}
            {Filters}
            {Trending}
          </div>
        </BottomSheet>
      </div>
    </>
  )
}

export default RightColumn
