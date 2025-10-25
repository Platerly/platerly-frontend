import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const RightColumn = () => {
  const { user, token, loading } = useAuth()
  const authed = !!(user || token || (typeof window !== 'undefined' && (localStorage.getItem('token') || sessionStorage.getItem('token'))))

  // --- Quick search ---
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // --- Trending (sidebar) ---
  const [trending, setTrending] = useState([])
  const [tLoading, setTLoading] = useState(true)
  const [tError, setTError] = useState(null)

  // --- Feed filters (mirror URL) ---
  const [sp] = useSearchParams()
  const navigate = useNavigate()

  const difficulty = sp.get('difficulty') || 'any'
  const tags = sp.get('tags') || ''
  const requireAllTags = sp.get('requireAllTags') === 'true'
  const hideRemixes = sp.get('hideRemixes') === 'true'
  const hideMyAllergens = sp.get('hideMyAllergens') === 'true'

  // ---------- Search (typeahead) ----------
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => fetchSuggestions(query), 300)
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

  const highlightMatch = (text, q) => {
    const escaped = q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    return text.replace(new RegExp(escaped, 'gi'), (m) => `<strong>${m}</strong>`)
  }

  // ---------- Filters (write to URL so Feed.jsx picks them up) ----------
  const updateParam = (key, value) => {
    const next = new URLSearchParams(sp)
    if (value === undefined || value === null || value === '' || value === 'any') {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }
    next.delete('page') // reset paging
    navigate({ pathname: '/feed', search: `?${next.toString()}` }, { replace: true })
  }

  const handleDifficulty = (e) => updateParam('difficulty', e.target.value)
  const handleTags = (e) => updateParam('tags', e.target.value)
  const handleRequireAll = (e) => updateParam('requireAllTags', e.target.checked)
  const handleHideRemixes = (e) => updateParam('hideRemixes', e.target.checked)
  const handleHideAllergens = (e) => updateParam('hideMyAllergens', e.target.checked)

  // ---------- Trending fetch ----------
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

  return (
    <div className="bg-platerly-light w-[320px] hidden lg:block fixed right-0 top-0 px-6 py-8 h-screen overflow-y-auto border-l border-platerly-border text-platerly-text">
      <div className="space-y-6">

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search recipes or users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full rounded-full bg-platerly-card text-platerly-text px-4 py-2 placeholder-platerly-subtle focus:outline-none"
          />
          {showDropdown && (
            <div className="absolute top-11 left-0 right-0 bg-platerly-card border border-platerly-border rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto text-sm">
              {loadingSearch ? (
                <p className="p-4 text-center text-gray-400">Searching...</p>
              ) : suggestions.length === 0 ? (
                <p className="p-4 text-center text-gray-500">No results found</p>
              ) : (
                <ul>
                  {suggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleSelect(item)}
                      className="px-4 py-2 hover:bg-platerly-green/10 cursor-pointer transition"
                    >
                      {item.type === 'user' ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: `👤 @${highlightMatch(item.username, query)} — ${item.displayName}`
                          }}
                        />
                      ) : (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: `🍽️ ${highlightMatch(item.title, query)}`
                          }}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>

        {/* Refine feed (hidden if not authed) */}
        {authed && (
          <div className="rounded-xl border border-platerly-border bg-platerly-card/60 backdrop-blur-sm p-4">
            <h3 className="text-sm font-semibold text-platerly-subtle mb-3 tracking-wide">Refine feed</h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-platerly-subtle mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={handleDifficulty}
                  className="w-full bg-platerly-card border border-platerly-border rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value="any">Any</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-platerly-subtle mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={handleTags}
                  placeholder="vegan, low nickel"
                  className="w-full bg-platerly-card border border-platerly-border rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input id="reqall" type="checkbox" checked={requireAllTags} onChange={handleRequireAll} />
                <label htmlFor="reqall" className="text-sm">Require all tags</label>
              </div>

              <div className="flex items-center gap-2">
                <input id="hideremix" type="checkbox" checked={hideRemixes} onChange={handleHideRemixes} />
                <label htmlFor="hideremix" className="text-sm">Hide remixes</label>
              </div>

              <div className="flex items-center gap-2">
                <input id="hideall" type="checkbox" checked={hideMyAllergens} onChange={handleHideAllergens} />
                <label htmlFor="hideall" className="text-sm">Hide my allergens</label>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 Trending (sidebar module) */}
        <div className="rounded-xl border border-platerly-border bg-platerly-card/60 backdrop-blur-sm p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-platerly-subtle tracking-wide">🔥 Trending</h3>
            <button
              onClick={() => navigate('/feed?sort=trending')}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              See all
            </button>
          </div>

          {tLoading && (
            <ul className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <li key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="h-12 w-16 rounded-md bg-white/10" />
                    <div className="flex-1">
                      <div className="h-3 w-2/3 rounded bg-white/10 mb-2" />
                      <div className="h-3 w-1/3 rounded bg-white/10" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!tLoading && tError && (
            <div className="text-xs text-red-300">{tError}</div>
          )}

          {!tLoading && !tError && (
            <ul className="space-y-3">
              {trending.map((it) => (
                <li key={it.id}>
                  <button
                    onClick={() => navigate(`/recipe/${it.id}`)}
                    className="group flex w-full gap-3 text-left"
                  >
                    <div className="relative">
                      <img
                        src={it.imageUrl}
                        alt={it.title}
                        className="h-12 w-16 rounded-md object-cover ring-1 ring-white/10"
                        loading="lazy"
                      />
                      <span className="absolute -left-2 -top-2 rounded-md bg-orange-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                        #{it.rank}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium group-hover:underline">
                        {it.title}
                      </div>
                      <div className="mt-0.5 text-xs opacity-70">
                        by <span className="font-medium">{it.username}</span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}

export default RightColumn
