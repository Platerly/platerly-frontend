import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SaveToCookbookSection from '../pages/SaveToCookbookSection'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { MoreVertical, Pencil, Trash2, RefreshCw, BookmarkPlus } from 'lucide-react'

const DIFFICULTY_MAP = { 0: 'Easy', 1: 'Medium', 2: 'Hard' }

// ---------- Severity classes (match RecipeCard palette) ----------
const SEVERITY_CLASS = {
  high:   'bg-red-900/60 border-red-500 text-red-100',
  medium: 'bg-orange-900/60 border-orange-500 text-orange-100',
  low:    'bg-green-900/40 border-green-600 text-green-100',
  safe:   'bg-green-900/40 border-green-600 text-green-100',
}
const getSeverityTextColor = (severity) => {
  switch ((severity || '').toLowerCase()) {
    case 'high': return 'text-red-200'
    case 'medium': return 'text-orange-200'
    case 'low': return 'text-green-300'
    default: return 'text-green-300'
  }
}

// normalize like backend: lowercase + single spaces
const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ')

// plural/singular tolerance: "almond" <-> "almonds"
const variants = (s) => {
  const x = norm(s)
  if (!x) return []
  const out = new Set([x])
  if (x.endsWith('s')) out.add(x.slice(0, -1))
  else out.add(`${x}s`)
  return Array.from(out)
}

// Only medium/high count as banner-worthy
const isSevere = (s) => {
  const x = String(s || '').toLowerCase()
  return x === 'high' || x === 'medium'
}

// Prefer arrays from either top-level or recipe object; fallback to legacy CSV
function coerceTags(recipeObj, topLevel) {
  const arr =
    (Array.isArray(topLevel?.tagNames) && topLevel.tagNames) ||
    (Array.isArray(recipeObj?.tagNames) && recipeObj.tagNames) ||
    (Array.isArray(recipeObj?.tags) && recipeObj.tags)

  if (Array.isArray(arr)) return arr.filter(Boolean)

  const csv =
    (typeof topLevel?.recipe?.tags === 'string' && topLevel.recipe.tags) ||
    (typeof recipeObj?.tags === 'string' && recipeObj.tags) ||
    ''

  return String(csv).split(',').map(t => t.trim()).filter(Boolean)
}

function fmtMinutes(mins) {
  if (mins === null || mins === undefined) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr`
  return `${m} min`
}
function toMinutes(v) {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = parseInt(String(v), 10)
  return Number.isNaN(n) ? 0 : n
}

/** Lightweight confirm modal */
function ConfirmModal({ open, title = 'Are you sure?', description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:w-[420px] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl mx-3 mb-3 sm:mx-0 sm:mb-0">
        <div className="px-5 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && <p className="mt-1.5 text-sm text-neutral-300">{description}</p>}
          <div className="mt-5 flex gap-2 justify-end">
            <button onClick={onCancel} className="px-4 py-2 rounded-md border border-neutral-600 text-neutral-200 hover:bg-neutral-800">
              {cancelText}
            </button>
            <button onClick={onConfirm} className={`px-4 py-2 rounded-md text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const RecipeDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  

  // --------- ONE place for hooks (fixed order) ---------
  const [recipe, setRecipe] = useState(null)
  const [remixMeta, setRemixMeta] = useState(null)
  const [topLevelForTags, setTopLevelForTags] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  // Backend allergy data only
  const [backendTerms /* kept for compatibility */, setBackendTerms] = useState([])
  const [severityMap, setSeverityMap] = useState({})   // recipe.matchedAllergenSeverity (normalized)

  // UI state
  const [menuOpen, setMenuOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const menuRef = useRef(null)

  // Close kebab menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  // Fetch recipe + comments in parallel
  useEffect(() => {
    setRecipe(null)
    setRemixMeta(null)
    setTopLevelForTags(null)
    setBackendTerms([])
    setSeverityMap({})
    setLoading(true)
    setNotFound(false)
    setError('')

    const recipeCtl = new AbortController()
    const commentsCtl = new AbortController()
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

    const fetchRecipe = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, {
          headers: authHeader,
          signal: recipeCtl.signal,
        })

        if (res.status === 404) {
          setNotFound(true)
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error(`Failed to fetch recipe (${res.status})`)

        const data = await res.json()
        setTopLevelForTags(data)
        const core = data.recipe ?? data
        setRecipe(core)
        setRemixMeta(data.remixMeta ?? null)

        // ✅ STRICTLY backend fields on the recipe object
        const terms = Array.isArray(core?.matchedAllergenTerms) ? core.matchedAllergenTerms : []
        const sevMap = core?.matchedAllergenSeverity && typeof core.matchedAllergenSeverity === 'object'
          ? core.matchedAllergenSeverity
          : {}

        const normalized = {}
        Object.entries(sevMap).forEach(([k, v]) => {
          if (!k) return
          normalized[norm(k)] = String(v || '').toLowerCase()
        })
        setBackendTerms(terms.map(norm).filter(Boolean))
        setSeverityMap(normalized)

        setLoading(false)
      } catch (err) {
        if (recipeCtl.signal.aborted) return
        console.error(err)
        setError('Something went wrong loading this recipe.')
        setLoading(false)
      }
    }

    const fetchComments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
          headers: authHeader,
          signal: commentsCtl.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        setComments(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!commentsCtl.signal.aborted) console.error(err)
      }
    }

    fetchRecipe()
    fetchComments()

    return () => {
      recipeCtl.abort()
      commentsCtl.abort()
    }
  }, [id, token])

  // Build a set of only medium/high severity keys (normalized)
  const severeKeySet = useMemo(() => {
    const s = new Set()
    Object.entries(severityMap || {}).forEach(([k, v]) => {
      if (k && isSevere(v)) s.add(norm(k))
    })
    return s
  }, [severityMap])

  // ---------- Banner terms: ONLY ingredients that matched medium/high ----------
  const bannerTerms = useMemo(() => {
    if (!recipe?.ingredients || !severeKeySet.size) return []
    const out = []
    for (const ing of recipe.ingredients) {
      const n = norm(ing?.name)
      for (const v of variants(n)) {
        if (severeKeySet.has(v)) {
          out.push(ing.name) // display original-cased ingredient name
          break
        }
      }
    }
    return Array.from(new Set(out)) // unique, preserve first-seen order
  }, [recipe?.ingredients, severeKeySet])

  const hasAnyAllergen = bannerTerms.length > 0

  // ---------- Severity lookup from backend map only ----------
  const lookupSeverity = (ingredientName, ing) => {
    const candidates = [
      ing?.globalIngredientName,
      ing?.globalIngredient?.name,
      ingredientName,
    ].map(norm).filter(Boolean)

    for (const cand of candidates) {
      for (const v of variants(cand)) {
        const sev = severityMap[v]
        if (sev) return sev // 'high'|'medium'|'low'
      }
    }
    return null
  }

  // ---------- Derived fields ----------
  const difficultyRaw = recipe?.difficulty ?? recipe?.difficultyLevel
  const difficulty =
    typeof difficultyRaw === 'number'
      ? (DIFFICULTY_MAP[difficultyRaw] ?? String(difficultyRaw))
      : difficultyRaw

  const prepRaw = recipe?.prepTimeMinutes ?? recipe?.prepMinutes ?? recipe?.prepTime
  const cookRaw = recipe?.cookTimeMinutes ?? recipe?.cookMinutes ?? recipe?.cookTime
  const prepMin = toMinutes(prepRaw)
  const cookMin = toMinutes(cookRaw)
  const prep = prepMin ? fmtMinutes(prepMin) : null
  const cook = cookMin ? fmtMinutes(cookMin) : null
  const totalFmt = (prepMin + cookMin) > 0 ? fmtMinutes(prepMin + cookMin) : null

  const tags = coerceTags(recipe, topLevelForTags)

  // ---------- Ownership & actions ----------
  const isOwner = useMemo(() => {
    if (!user?.username || !recipe?.authorUsername) return false
    return String(user.username).toLowerCase() === String(recipe.authorUsername).toLowerCase()
  }, [user?.username, recipe?.authorUsername])

  const goEdit = () => navigate(`/edit-recipe/${id}`)
  const goRemix = () => navigate(`/remix/${id}`)

  const doDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.status === 204 || (res.ok && res.status >= 200 && res.status < 300)) {
        window.location.assign('/feed')
        return
      }
      if (res.status === 401 || res.status === 403) {
        window.location.assign('/login')
        return
      }
      let msg = ''
      try { msg = await res.text() } catch {}
      throw new Error(`Delete failed (${res.status})${msg ? `: ${msg}` : ''}`)
    } catch (e) {
      console.error('Delete error:', e)
      alert('Sorry, delete failed.')
    }
  }

  // ---------- Render states ----------
  if (loading) {
    return (
      <div className="px-6 py-10 text-platerly-subtle">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/2 bg-platerly-card rounded" />
          <div className="h-80 w-full bg-platerly-card rounded" />
          <div className="h-4 w-3/4 bg-platerly-card rounded" />
          <div className="h-4 w-2/3 bg-platerly-card rounded" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="px-6 py-12">
        <p className="text-red-400 text-lg font-medium">Recipe not found.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-12">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-platerly-text">
      {/* Header Image Section */}
      <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-lg">
        {recipe.imageUrl && (
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        )}

        {/* Dark overlay with title/author/date */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-4xl font-bold text-white">{recipe.title}</h1>
            {remixMeta?.isRemix && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-200/20 text-purple-100 ring-1 ring-purple-300/30">
                Remix
              </span>
            )}
          </div>

          <div className="flex justify-between items-center text-sm text-gray-300">
            <Link to={`/profile/${recipe.authorUsername}`} className="hover:text-platerly-green hover:underline text-gray-300 transition-all">
              @{recipe.authorUsername}
            </Link>
            <span>
              {new Date(recipe.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Kebab actions */}
        <div ref={menuRef} className="absolute top-3 right-3">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-full bg-black/45 hover:bg-black/60 border border-white/10 text-white shadow"
            aria-label="Actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className="mt-2 w-44 rounded-md bg-neutral-900/95 backdrop-blur border border-white/10 shadow-lg overflow-hidden">
              {isOwner && (
                <>
                  <button onClick={goEdit} className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmOpen(true) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 text-red-300 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <div className="h-px bg-white/10" />
                </>
              )}
              <button onClick={goRemix} className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Remix
              </button>
            </div>
          )}
        </div>

        {/* Save button */}
        {token && (
          <div className="absolute top-3 left-3">
            <button
              onClick={() => setSaveOpen(v => !v)}
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow inline-flex items-center gap-1.5"
            >
              <BookmarkPlus className="w-4 h-4" /> Save
            </button>
          </div>
        )}

        {/* Remix lineage pill */}
        {remixMeta?.isRemix && (
          <div className="absolute bottom-3 right-3 text-[11px] sm:text-xs bg-black/45 backdrop-blur rounded-full px-3 py-1.5 border border-white/10 shadow-md">
            <span className="opacity-80 mr-1">Lineage:</span>
            <span className="space-x-1">
              {remixMeta.parentRecipeId ? (
                <Link to={`/recipe/${remixMeta.parentRecipeId}`} className="underline hover:no-underline" title="Direct recipe this was remixed from">
                  source
                </Link>
              ) : (
                <span className="opacity-70">source</span>
              )}
              <span aria-hidden>·</span>
              {remixMeta.originalRecipeId ? (
                <Link to={`/recipe/${remixMeta.originalRecipeId}`} className="underline hover:no-underline" title="Root/original recipe in this remix chain">
                  origin
                </Link>
              ) : (
                <span className="opacity-70">origin</span>
              )}
            </span>
          </div>
        )}
      </div>

      {token && saveOpen && recipe?.id && (
        <div className="mt-3 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
          <SaveToCookbookSection recipeId={recipe.id} />
        </div>
      )}

      {/* Info Row */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {difficulty && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-900/30 px-3 py-1 text-sm text-emerald-200">
            <span className="font-semibold">Difficulty:</span> {difficulty}
          </span>
        )}
        {(prep || cook) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-600 bg-neutral-800 px-3 py-1 text-sm text-neutral-200">
            <span className="font-semibold">Time:</span>
            <span>
              {prep && `${prep} prep`}
              {prep && cook ? ', ' : ''}
              {cook && `${cook} cook`}
            </span>
          </span>
        )}
        {totalFmt && (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-600 bg-neutral-800 px-3 py-1 text-sm text-neutral-200">
            <span className="font-semibold">Total:</span> {totalFmt}
          </span>
        )}
      </div>

      {/* Tags */}
      {Array.isArray(tags) && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="rounded-full bg-emerald-900/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-700/40">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Allergy Notice (backend-only, medium/high only) */}
      {token && hasAnyAllergen && (
        <div className="mt-6 bg-red-900/80 border border-red-500 text-red-200 px-5 py-3 rounded-lg shadow-sm">
          ⚠️ <strong>Potential allergens detected</strong>
          <div className="mt-1 text-sm">
            Matched:{' '}
            <span className="font-semibold">
              {bannerTerms.join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4 mt-10">
        <details open className="rounded-lg border border-neutral-700">
          <summary className="cursor-pointer select-none px-4 py-3 text-lg font-semibold">📍 Region</summary>
          <div className="px-4 pb-4 text-gray-300">{recipe.region || '—'}</div>
        </details>

        <details open className="rounded-lg border border-neutral-700">
          <summary className="cursor-pointer select-none px-4 py-3 text-lg font-semibold">📝 Description</summary>
          <div className="px-4 pb-4 text-gray-300">{recipe.description || 'No description provided.'}</div>
        </details>

        <details open className="rounded-lg border border-neutral-700">
          <summary className="cursor-pointer select-none px-4 py-3 text-lg font-semibold">📋 Instructions</summary>
          <div className="px-4 pb-4 text-gray-300 whitespace-pre-line">{recipe.instructions || 'No instructions provided.'}</div>
        </details>

        {/* 🧂 Ingredients — backend-only severity coloring */}
        <details open className="rounded-lg border border-neutral-700">
          <summary className="cursor-pointer select-none px-4 py-3 text-lg font-semibold">🧂 Ingredients</summary>
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-3">
              {(recipe.ingredients || []).map((ing, i) => {
                const sev = lookupSeverity(ing?.name, ing) // 'high' | 'medium' | 'low' | null
                const visual = sev || 'safe'
                const cls =
                  visual === 'high'   ? SEVERITY_CLASS.high   :
                  visual === 'medium' ? SEVERITY_CLASS.medium :
                                        SEVERITY_CLASS.safe
                const qtyColor = getSeverityTextColor(visual)

                return (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full text-sm border ${cls}`}
                    title={sev ? `Severity: ${sev}` : undefined}
                  >
                    {(visual === 'high' || visual === 'medium') && <span className="mr-1">⚠</span>}
                    <span className={`${qtyColor} font-semibold`}>{ing.quantity}</span> {ing.name}
                  </span>
                )
              })}
            </div>
          </div>
        </details>
      </div>

      {/* Comments */}
      {token && (
        <div className="mt-10 pt-8 border-t border-neutral-700">
          <button
            onClick={() => setCommentsOpen(v => !v)}
            className="mb-4 inline-flex items-center gap-2 text-left text-lg font-semibold hover:text-platerly-green transition"
          >
            <span>💬 Comments</span>
            <span className="text-sm text-neutral-400">({comments.length})</span>
            <span className="text-neutral-400">{commentsOpen ? '▾' : '▸'}</span>
          </button>

          {commentsOpen && (
            <>
              <div className="space-y-3 mb-6">
                <textarea
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-md p-3 focus:outline-none focus:ring focus:ring-green-500"
                />
                <button
                  onClick={async () => {
                    if (!newComment.trim()) return
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
                        method: 'POST',
                        headers: {
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ recipeId: id, content: newComment }),
                      })
                      if (!res.ok) throw new Error('Failed to post comment')
                      setNewComment('')
                      const refreshed = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      })
                      const updated = await refreshed.json()
                      setComments(Array.isArray(updated) ? updated : [])
                      setCommentsOpen(true)
                    } catch (err) { console.error(err) }
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition"
                >
                  Post Comment
                </button>
              </div>

              {comments.length === 0 ? (
                <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
                        <Link to={`/profile/${comment.username}`} className="font-medium hover:text-platerly-green transition-colors">
                          @{comment.username}
                        </Link>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-200">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Delete recipe?"
        description="This will hide the recipe for everyone else. You can’t recover it here."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => { setConfirmOpen(false); await doDelete() }}
        danger
      />
    </div>
  )
}

export default RecipeDetailsPage
