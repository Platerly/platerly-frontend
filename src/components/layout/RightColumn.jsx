import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { usePremium } from '../../hooks/usePremium'
import classNames from 'classnames'
import { Filter, Search, TrendingUp, TrendingDown, X, ChevronRight, SlidersHorizontal, Flame, Heart, Wand2, Carrot, Lock, Sparkles } from 'lucide-react'

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

const TrendIndicator = ({ delta }) => {
  if (delta === 0 || delta === undefined || delta === null) return null
  const isUp = delta > 0
  return (
    <span className={classNames(
      'inline-flex items-center gap-0.5 text-xs font-medium',
      isUp ? 'text-green-400' : 'text-red-400'
    )}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(delta)}
    </span>
  )
}

/* ---------- bottom sheet (mobile) ---------- */
function BottomSheet({ open, onClose, title, icon: Icon, children }) {
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-recipzee-border bg-recipzee-card p-5 shadow-2xl animate-[slide-up_180ms_ease-out]"
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-recipzee-border mx-auto mb-4" />

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-recipzee-green/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-recipzee-green" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-recipzee-text">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-recipzee-subtle hover:bg-recipzee-light hover:text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 transition-colors"
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
  const { isPremium } = usePremium()
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
  const [trendingPeriod, setTrendingPeriod] = useState('week')

  // hidden gems
  const [hiddenGems, setHiddenGems] = useState([])
  const [gemsLoading, setGemsLoading] = useState(true)
  const [gemsError, setGemsError] = useState(null)

  // dietary trends
  const [dietaryTags, setDietaryTags] = useState([])
  const [tagsLoading, setTagsLoading] = useState(true)
  const [tagsError, setTagsError] = useState(null)


  // trending ingredients (premium)
  const [trendingIngredients, setTrendingIngredients] = useState([])
  const [tiLoading, setTiLoading] = useState(false)
  const [tiError, setTiError] = useState(null)

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
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(text)}&pageSize=10`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      // API returns { users: [], recipes: [], ... } - combine into flat array
      const users = Array.isArray(data.users) ? data.users : []
      const recipes = Array.isArray(data.recipes) ? data.recipes : []
      // Interleave users and recipes for better UX, limit to 8 total
      const combined = [...users.slice(0, 4), ...recipes.slice(0, 4)]
      setSuggestions(combined)
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
        setTError(null)
        const res = await fetch(`${API_BASE_URL}/api/feed/trending-top?limit=5&period=${trendingPeriod}`)
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
  }, [trendingPeriod])

  /* ---------- hidden gems ---------- */
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setGemsLoading(true)
        setGemsError(null)
        const res = await fetch(`${API_BASE_URL}/api/feed/hidden-gems?limit=5`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (mounted) setHiddenGems(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        if (mounted) setGemsError('Failed to load')
      } finally {
        if (mounted) setGemsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  /* ---------- dietary trends ---------- */
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setTagsLoading(true)
        setTagsError(null)
        const res = await fetch(`${API_BASE_URL}/api/feed/trending-tags?limit=10`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (mounted) setDietaryTags(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        if (mounted) setTagsError('Failed to load')
      } finally {
        if (mounted) setTagsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  /* ---------- trending ingredients (premium) ---------- */
  useEffect(() => {
    if (!isPremium || !token) return
    let mounted = true
    ;(async () => {
      try {
        setTiLoading(true)
        setTiError(null)
        const res = await fetch(`${API_BASE_URL}/api/feed/trending-ingredients?limit=8`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          if (res.status === 402) {
            setTiError('Premium required')
          } else {
            throw new Error(`HTTP ${res.status}`)
          }
          return
        }
        const data = await res.json()
        if (mounted) setTrendingIngredients(data.items ?? [])
      } catch (err) {
        console.error(err)
        if (mounted) setTiError('Failed to load')
      } finally {
        if (mounted) setTiLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [isPremium, token])

  /* ---------- shared UI blocks ---------- */
  const SearchBox = (
    <form onSubmit={handleSearchSubmit} className="relative" role="search">
      <div className="flex items-center gap-3 rounded-xl border border-recipzee-border bg-recipzee-light/50 px-4 py-3 transition-all duration-200 focus-within:border-recipzee-green/40 focus-within:ring-2 focus-within:ring-recipzee-green/20 focus-within:bg-recipzee-light">
        <Search className="h-5 w-5 text-recipzee-subtle shrink-0" />
        <input
          type="text"
          placeholder="Search recipes or users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="w-full bg-transparent text-sm text-recipzee-text placeholder-recipzee-subtle focus:outline-none"
          aria-label="Search recipes or users"
        />
      </div>
      {showDropdown && (
        <div
          className="absolute top-14 left-0 right-0 z-50 max-h-80 overflow-y-auto rounded-xl border border-recipzee-border bg-recipzee-card shadow-xl shadow-black/20"
          role="listbox"
        >
          {loadingSearch ? (
            <div className="p-6 text-center">
              <div className="w-6 h-6 border-2 border-recipzee-green/30 border-t-recipzee-green rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-recipzee-subtle">Searching...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-recipzee-subtle mx-auto mb-2" />
              <p className="text-sm text-recipzee-subtle">No results found</p>
            </div>
          ) : (
            <ul className="py-2">
              {suggestions.map((item, idx) => (
                <li key={idx}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-recipzee-green/10 transition-colors"
                    role="option"
                  >
                    {item.type === 'user' ? (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-recipzee-light flex items-center justify-center text-recipzee-subtle">
                          👤
                        </div>
                        <div>
                          <div className="text-recipzee-text font-medium">
                            @<Highlight text={item.username} query={query} />
                          </div>
                          <div className="text-xs text-recipzee-subtle">{item.displayName}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-recipzee-light flex items-center justify-center text-recipzee-subtle">
                          🍽️
                        </div>
                        <div className="text-recipzee-text font-medium">
                          <Highlight text={item.title} query={query} />
                        </div>
                      </>
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
    <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/60 backdrop-blur-sm p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-recipzee-green/15 flex items-center justify-center">
          <SlidersHorizontal className="w-4 h-4 text-recipzee-green" />
        </div>
        <h3 className="text-sm font-semibold text-recipzee-text">Refine Feed</h3>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-recipzee-subtle">Difficulty</label>
          <select
            value={difficulty}
            onChange={handleDifficulty}
            className="w-full rounded-xl border border-recipzee-border bg-recipzee-light px-3 py-2.5 text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green/50 transition-all"
          >
            <option value="any">Any</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-recipzee-subtle">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={handleTags}
            placeholder="vegan, low nickel"
            className="w-full rounded-xl border border-recipzee-border bg-recipzee-light px-3 py-2.5 text-recipzee-text placeholder:text-recipzee-subtle focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green/50 transition-all"
          />
        </div>

        <div className="space-y-2.5 pt-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={requireAllTags} onChange={handleRequireAll} className="w-4 h-4 rounded border-recipzee-border text-recipzee-green focus:ring-recipzee-green/40" />
            <span className="text-recipzee-text/90 group-hover:text-recipzee-text transition-colors">Require all tags</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={hideRemixes} onChange={handleHideRemixes} className="w-4 h-4 rounded border-recipzee-border text-recipzee-green focus:ring-recipzee-green/40" />
            <span className="text-recipzee-text/90 group-hover:text-recipzee-text transition-colors">Hide remixes</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={hideMyAllergens} onChange={handleHideAllergens} className="w-4 h-4 rounded border-recipzee-border text-recipzee-green focus:ring-recipzee-green/40" />
            <span className="text-recipzee-text/90 group-hover:text-recipzee-text transition-colors">Hide my allergens</span>
          </label>
        </div>
      </div>
    </div>
  )

  const periodLabels = { today: 'Today', week: 'Week', month: 'Month' }

  const Trending = (
    <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/60 backdrop-blur-sm p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
        <h3 className="text-sm font-semibold text-recipzee-text">Trending Now</h3>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 mb-4">
        {['today', 'week', 'month'].map((p) => (
          <button
            key={p}
            onClick={() => setTrendingPeriod(p)}
            className={classNames(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              trendingPeriod === p
                ? 'bg-recipzee-green text-recipzee-dark'
                : 'bg-recipzee-light text-recipzee-subtle hover:text-recipzee-text hover:bg-recipzee-light/80'
            )}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {tLoading && (
        <ul className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <li key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-recipzee-light shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded-lg bg-recipzee-light" />
                  <div className="h-3 w-1/2 rounded-lg bg-recipzee-light/70" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!tLoading && tError && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
          {tError}
        </div>
      )}

      {!tLoading && !tError && (
        <>
          <ul className="space-y-2">
            {trending.map((it) => (
              <li key={it.id}>
                <button
                  onClick={() => navigate(`/recipe/${it.id}`)}
                  className="group w-full text-left p-2 -mx-2 rounded-xl hover:bg-recipzee-light/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* thumb */}
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-recipzee-border shrink-0 group-hover:border-recipzee-green/30 transition-colors">
                      {it.imageUrl ? (
                        <img
                          src={it.imageUrl}
                          alt={it.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-recipzee-light flex items-center justify-center">
                          <Flame className="w-5 h-5 text-recipzee-subtle" />
                        </div>
                      )}
                      <span className="absolute left-1 top-1 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        #{it.rank}
                      </span>
                    </div>

                    {/* text */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-recipzee-text group-hover:text-recipzee-green transition-colors">
                        {it.title}
                      </div>
                      <div className="mt-0.5 text-xs text-recipzee-subtle">
                        by <span className="font-medium text-recipzee-text/80">{it.username}</span>
                      </div>
                      {/* Engagement metrics */}
                      <div className="mt-1 flex items-center gap-3 text-xs text-recipzee-subtle">
                        {it.likeCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {it.likeCount}
                          </span>
                        )}
                        {it.remixCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Wand2 className="w-3 h-3" />
                            {it.remixCount}
                          </span>
                        )}
                        <TrendIndicator delta={it.rankDelta} />
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/trending')}
            className="w-full mt-4 py-2 text-sm font-medium text-recipzee-subtle hover:text-orange-400 transition-colors flex items-center justify-center gap-1.5"
          >
            View all trending
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  )


  const HiddenGems = (
    <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-violet-400" />
        </div>
        <h3 className="text-sm font-semibold text-recipzee-text">Hidden Gems</h3>
      </div>

      {gemsLoading && (
        <ul className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-recipzee-light shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded-lg bg-recipzee-light" />
                  <div className="h-3 w-1/2 rounded-lg bg-recipzee-light/70" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!gemsLoading && gemsError && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
          {gemsError}
        </div>
      )}

      {!gemsLoading && !gemsError && hiddenGems.length === 0 && (
        <p className="text-sm text-recipzee-subtle text-center py-4">No hidden gems found yet.</p>
      )}

      {!gemsLoading && !gemsError && hiddenGems.length > 0 && (
        <ul className="space-y-2">
          {hiddenGems.map(gem => (
            <li key={gem.id}>
              <button
                onClick={() => navigate(`/recipe/${gem.id}`)}
                className="group w-full text-left p-2 -mx-2 rounded-xl hover:bg-recipzee-light/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-recipzee-border shrink-0 group-hover:border-violet-500/30 transition-colors">
                    {gem.imageUrl ? (
                      <img
                        src={gem.imageUrl}
                        alt={gem.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-recipzee-light flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-violet-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-recipzee-text group-hover:text-violet-400 transition-colors">
                      {gem.title}
                    </div>
                    <div className="mt-0.5 text-xs text-recipzee-subtle">
                      by <span className="font-medium text-recipzee-text/80">{gem.authorUsername}</span>
                    </div>
                    <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                      {gem.engagementRate}% engaged
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const DietaryTrends = (
    <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-sky-400" />
        </div>
        <h3 className="text-sm font-semibold text-recipzee-text">Dietary Trends</h3>
      </div>

      {tagsLoading && (
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse h-7 w-20 rounded-full bg-recipzee-light" />
          ))}
        </div>
      )}

      {!tagsLoading && tagsError && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
          {tagsError}
        </div>
      )}

      {!tagsLoading && !tagsError && dietaryTags.length === 0 && (
        <p className="text-sm text-recipzee-subtle text-center py-4">No tag data yet.</p>
      )}

      {!tagsLoading && !tagsError && dietaryTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dietaryTags.slice(0, 8).map(tag => (
            <button
              key={tag.name}
              onClick={() => navigate(`/feed?tags=${encodeURIComponent(tag.name)}`)}
              className={classNames(
                'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors hover:brightness-110',
                tag.trend === 'rising'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : tag.trend === 'falling'
                  ? 'bg-recipzee-light text-recipzee-subtle border-recipzee-border'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
              )}
            >
              {tag.trend === 'rising' && <TrendingUp className="w-3 h-3" />}
              {tag.trend === 'falling' && <TrendingDown className="w-3 h-3" />}
              #{tag.name}
              {tag.trend !== 'stable' && (
                <span className={tag.trend === 'rising' ? 'text-emerald-500' : 'text-recipzee-subtle'}>
                  {tag.growthRate > 0 ? '+' : ''}{tag.growthRate}%
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // Trending Ingredients (Premium Feature)
  const TrendingIngredients = authed && (
    <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/60 backdrop-blur-sm p-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Carrot className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-recipzee-text">Trending Ingredients</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-[10px] font-bold text-amber-400 border border-amber-500/20">
            <Sparkles className="w-2.5 h-2.5" />
            PRO
          </span>
        </div>
      </div>

      {isPremium ? (
        // Premium user content
        <>
          {tiLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-recipzee-light" />
                  <div className="flex-1 h-4 rounded bg-recipzee-light" />
                </div>
              ))}
            </div>
          )}
          {!tiLoading && tiError && (
            <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
              {tiError}
            </div>
          )}
          {!tiLoading && !tiError && trendingIngredients.length > 0 && (
            <ul className="space-y-2">
              {trendingIngredients.map((ing, idx) => (
                <li key={idx} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-recipzee-light/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-recipzee-light flex items-center justify-center text-lg">
                    🥬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-recipzee-text truncate capitalize">
                      {ing.ingredient}
                    </div>
                    <div className="text-xs text-recipzee-subtle">
                      {ing.recipeCount} recipe{ing.recipeCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {ing.growthPercent > 0 && (
                    <span className="text-xs font-medium text-green-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      {Math.round(ing.growthPercent)}%
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!tiLoading && !tiError && trendingIngredients.length === 0 && (
            <p className="text-sm text-recipzee-subtle text-center py-4">No trending ingredients data available.</p>
          )}
        </>
      ) : (
        // Non-premium blur + CTA
        <>
          {/* Blurred preview */}
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none">
              <ul className="space-y-2 opacity-60">
                {['Avocado', 'Kimchi', 'Tahini', 'Miso', 'Sriracha'].map((name, i) => (
                  <li key={i} className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 rounded-lg bg-recipzee-light flex items-center justify-center text-lg">🥬</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-recipzee-text">{name}</div>
                      <div className="text-xs text-recipzee-subtle">{Math.floor(Math.random() * 50 + 10)} recipes</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Overlay CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-recipzee-card/80 rounded-xl">
              <Lock className="w-8 h-8 text-recipzee-subtle mb-3" />
              <p className="text-sm font-medium text-recipzee-text mb-1">Premium Feature</p>
              <p className="text-xs text-recipzee-subtle text-center mb-3 px-4">
                See what ingredients are trending in recipes
              </p>
              <button
                onClick={() => navigate('/settings?tab=subscription')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:brightness-110 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )


  /* ---------- render ---------- */
  return (
    <>
      {/* Desktop right rail */}
      <aside className="bg-recipzee-card/50 backdrop-blur-sm text-recipzee-text fixed right-0 top-0 hidden h-screen w-[320px] overflow-y-auto border-l border-recipzee-border px-5 py-8 lg:block">
        <div className="space-y-5">
          {SearchBox}
          {Filters}
          {DietaryTrends}
          {Trending}
          {HiddenGems}
          {TrendingIngredients}
        </div>
      </aside>

      {/* Mobile floating action + bottom sheet */}
      <div className="lg:hidden">
        {/* FAB */}
        <button
          onClick={() => setOpenSheet(true)}
          className="fixed bottom-20 right-4 inline-flex items-center gap-2 rounded-xl bg-recipzee-green px-5 py-3.5 text-sm font-semibold text-recipzee-dark shadow-lg shadow-recipzee-green/25 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-recipzee-green/50 focus:ring-offset-2 focus:ring-offset-recipzee-dark transition-all duration-200 active:scale-95"
          aria-label="Open explore panel"
        >
          <Search className="h-4 w-4" />
          Explore
        </button>

        <BottomSheet open={openSheet} onClose={() => setOpenSheet(false)} title="Explore" icon={Search}>
          <div className="space-y-5">
            {SearchBox}
            {Filters}
            {DietaryTrends}
            {Trending}
            {HiddenGems}
            {TrendingIngredients}
          </div>
        </BottomSheet>
      </div>
    </>
  )
}

export default RightColumn
