import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../../utils/api'

const RightColumn = () => {
  // --- Quick search ---
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // --- Feed filters (mirror URL) ---
  const [sp, setSp] = useSearchParams()
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
    setLoading(true)
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
      setLoading(false)
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
    // Reset paging when filters change
    next.delete('page')
    navigate({ pathname: '/feed', search: `?${next.toString()}` }, { replace: true })
  }

  const handleDifficulty = (e) => updateParam('difficulty', e.target.value)
  const handleTags = (e) => updateParam('tags', e.target.value)
  const handleRequireAll = (e) => updateParam('requireAllTags', e.target.checked)
  const handleHideRemixes = (e) => updateParam('hideRemixes', e.target.checked)
  const handleHideAllergens = (e) => updateParam('hideMyAllergens', e.target.checked)

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
              {loading ? (
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

        {/* Refine feed */}
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

      </div>
    </div>
  )
}

export default RightColumn
