import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../utils/api'

const RightColumn = () => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    const delay = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)

    return () => clearTimeout(delay)
  }, [query])

  useEffect(() => {
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') setShowDropdown(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const fetchSuggestions = async (search) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSuggestions(Array.isArray(data) ? data : [])
      setShowDropdown(true)
    } catch (err) {
      console.error(err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (item) => {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)

    if (item.type === 'user') {
      navigate(`/profile/${item.username}`)
    } else if (item.type === 'recipe') {
      navigate(`/recipe/${item.recipeId}`)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setShowDropdown(false)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const highlightMatch = (text, query) => {
    const escaped = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    return text.replace(new RegExp(escaped, 'gi'), (match) => `<strong>${match}</strong>`)
  }

  return (
    <div className="bg-platerly-light w-[320px] hidden lg:block fixed right-0 top-0 px-6 py-8 h-screen overflow-y-auto border-l border-platerly-border text-platerly-text">
      <div className="space-y-6">
        {/* Search bar */}
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

          {/* Dropdown */}
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

        {/* Who to follow section temporarily removed */}
      </div>
    </div>
  )
}

export default RightColumn
