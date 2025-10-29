import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SaveToCookbookSection from '../pages/SaveToCookbookSection'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import {
  MoreVertical, Pencil, Trash2, RefreshCw, BookmarkPlus,
  AlertTriangle, Clock, Tag as TagIcon, Globe, BookOpenText, ListChecks
} from 'lucide-react'

const DIFFICULTY_MAP = { 0: 'Easy', 1: 'Medium', 2: 'Hard' }

/* ---------- Pills ---------- */
const PILL_BASE = 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm border shadow-sm'
const PILL_NEUTRAL = `${PILL_BASE} bg-white/5 border-platerly-border text-platerly-text`
const PILL_SUCCESS = `${PILL_BASE} bg-emerald-900/30 border-emerald-400/30 text-emerald-200`

/* ---------- Severity classes ---------- */
const SEVERITY_CLASS = {
  high:   'bg-red-900/60 border-red-500 text-red-100',
  medium: 'bg-orange-900/60 border-orange-500 text-orange-100',
  low:    'bg-amber-900/40 border-amber-500/70 text-amber-100',
  safe:   'bg-emerald-900/30 border-emerald-600/70 text-emerald-100',
}
const qtyTint = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'high': return 'text-red-200'
    case 'medium': return 'text-orange-200'
    case 'low': return 'text-amber-200'
    default: return 'text-emerald-200'
  }
}

/* ---------- Helpers ---------- */
const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ')
const variants = (s) => {
  const x = norm(s); if (!x) return []
  const out = new Set([x]); x.endsWith('s') ? out.add(x.slice(0,-1)) : out.add(`${x}s`)
  return [...out]
}
const isSevere = (s) => ['high','medium'].includes(String(s||'').toLowerCase())

function coerceTags(recipeObj, topLevel) {
  const arr =
    (Array.isArray(topLevel?.tagNames) && topLevel.tagNames) ||
    (Array.isArray(recipeObj?.tagNames) && recipeObj.tagNames) ||
    (Array.isArray(recipeObj?.tags) && recipeObj.tags)

  if (Array.isArray(arr)) return arr.filter(Boolean)

  const csv =
    (typeof topLevel?.recipe?.tags === 'string' && topLevel.recipe.tags) ||
    (typeof recipeObj?.tags === 'string' && recipeObj.tags) || ''
  return String(csv).split(',').map(t => t.trim()).filter(Boolean)
}

const fmtMinutes = (m) => {
  if (m==null) return null
  const h=Math.floor(m/60), mm=m%60
  if(h&&mm) return `${h} hr ${mm} min`
  if(h) return `${h} hr`
  return `${mm} min`
}
const toMinutes = (v) => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n=parseInt(String(v??0),10)
  return Number.isNaN(n)?0:n
}

/* ---------- Premium shells ---------- */
const Card = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-platerly-border bg-platerly-card/70 backdrop-blur-sm shadow-[0_6px_24px_rgba(0,0,0,0.25)] ${className}`}>
    {children}
  </div>
)

const Section = ({ icon: Icon, title, children }) => (
  <Card>
    <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-2 bg-white/5 border-b border-platerly-border/70">
      {Icon && <Icon className="w-4 h-4 text-platerly-muted" aria-hidden />}
      <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
    </div>
    <div className="px-4 sm:px-5 py-4">{children}</div>
  </Card>
)

/* ---------- Confirm modal ---------- */
function ConfirmModal({ open, title='Are you sure?', description, confirmText='Confirm', cancelText='Cancel', onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <Card className="relative w-full sm:w-[420px] mx-3 mb-3 sm:mx-0 sm:mb-0">
        <div className="px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="mt-1.5 text-sm text-platerly-muted">{description}</p>}
          <div className="mt-5 flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-platerly-border text-platerly-text hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-platerly-accent/40">
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-platerly-accent/40 ${
                danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-platerly-accent text-black hover:brightness-110'
              }`}>
              {confirmText}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

const RecipeDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [recipe, setRecipe] = useState(null)
  const [remixMeta, setRemixMeta] = useState(null)
  const [topLevelForTags, setTopLevelForTags] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  const [severityMap, setSeverityMap] = useState({})
  const [menuOpen, setMenuOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const menuRef = useRef(null)

  /* Close kebab on outside click + Escape */
  useEffect(() => {
    const onDocClick = (e) => { if (!menuRef.current) return; if (!menuRef.current.contains(e.target)) setMenuOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('click', onDocClick)
    window.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('click', onDocClick); window.removeEventListener('keydown', onEsc) }
  }, [])

  /* ---------- Load ---------- */
  useEffect(() => {
    setRecipe(null); setRemixMeta(null); setTopLevelForTags(null)
    setSeverityMap({}); setLoading(true); setNotFound(false); setError('')
    const ctl = new AbortController()
    const auth = token ? { Authorization: `Bearer ${token}` } : {}

    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, { headers: auth, signal: ctl.signal })
        if (res.status === 404) { setNotFound(true); setLoading(false); return }
        if (!res.ok) throw new Error(`Failed to fetch recipe (${res.status})`)
        const data = await res.json()
        setTopLevelForTags(data)
        const core = data.recipe ?? data
        setRecipe(core)
        setRemixMeta(data.remixMeta ?? null)

        const sevMap = core?.matchedAllergenSeverity && typeof core.matchedAllergenSeverity === 'object'
          ? core.matchedAllergenSeverity : {}
        const normalized = {}
        Object.entries(sevMap).forEach(([k, v]) => { if (k) normalized[norm(k)] = String(v || '').toLowerCase() })
        setSeverityMap(normalized)
        setLoading(false)
      } catch (e) {
        if (!ctl.signal.aborted) { console.error(e); setError('Something went wrong loading this recipe.'); setLoading(false) }
      }
    })()

    ;(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, { headers: auth })
        if (r.ok) setComments(await r.json())
      } catch {}
    })()

    return () => ctl.abort()
  }, [id, token])

  /* ---------- Derived ---------- */
  const severeKeySet = useMemo(() => {
    const s = new Set()
    Object.entries(severityMap).forEach(([k, v]) => { if (k && isSevere(v)) s.add(norm(k)) })
    return s
  }, [severityMap])

  const bannerTerms = useMemo(() => {
    if (!recipe?.ingredients || !severeKeySet.size) return []
    const out = new Set()
    for (const ing of recipe.ingredients) {
      const n = norm(ing?.name)
      for (const v of variants(n)) if (severeKeySet.has(v)) { out.add(ing.name); break }
    }
    return [...out]
  }, [recipe?.ingredients, severeKeySet])

  const hasAnyAllergen = bannerTerms.length > 0

  const lookupSeverity = (ingredientName, ing) => {
    const candidates = [ing?.globalIngredientName, ing?.globalIngredient?.name, ingredientName]
      .map(norm).filter(Boolean)
    for (const c of candidates) for (const v of variants(c)) {
      const sev = severityMap[v]; if (sev) return sev
    }
    return null
  }

  const difficultyRaw = recipe?.difficulty ?? recipe?.difficultyLevel
  const difficulty = typeof difficultyRaw === 'number'
    ? (DIFFICULTY_MAP[difficultyRaw] ?? String(difficultyRaw))
    : difficultyRaw

  const prepMin  = toMinutes(recipe?.prepTimeMinutes ?? recipe?.prepMinutes ?? recipe?.prepTime)
  const cookMin  = toMinutes(recipe?.cookTimeMinutes ?? recipe?.cookMinutes ?? recipe?.cookTime)
  const prep     = prepMin ? fmtMinutes(prepMin) : null
  const cook     = cookMin ? fmtMinutes(cookMin) : null
  const totalFmt = (prepMin + cookMin) > 0 ? fmtMinutes(prepMin + cookMin) : null
  const tags     = coerceTags(recipe, topLevelForTags)

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
      if (res.status === 204 || (res.ok && res.status >= 200 && res.status < 300)) { window.location.assign('/feed'); return }
      if (res.status === 401 || res.status === 403) { window.location.assign('/login'); return }
      let msg = ''; try { msg = await res.text() } catch {}
      throw new Error(`Delete failed (${res.status})${msg ? `: ${msg}` : ''}`)
    } catch (e) { console.error('Delete error:', e); alert('Sorry, delete failed.') }
  }

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-10 text-platerly-muted">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 max-w-md bg-platerly-card rounded" />
          <div className="h-[40svh] w-full bg-platerly-card rounded" />
          <div className="h-4 w-3/4 bg-platerly-card rounded" />
          <div className="h-4 w-2/3 bg-platerly-card rounded" />
        </div>
      </div>
    )
  }
  if (notFound) return <div className="px-4 sm:px-6 py-12"><p className="text-red-400 text-lg font-medium">Recipe not found.</p></div>
  if (error)    return <div className="px-4 sm:px-6 py-12"><p className="text-red-400">{error}</p></div>

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-platerly-text">
      {/* HERO image */}
      <div className="relative w-full aspect-[5/4] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[220px] rounded-[22px] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.45)] ring-1 ring-platerly-border bg-platerly-light">
        {recipe?.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title || 'Recipe image'}
            className="w-full h-full object-cover [image-rendering:auto]"
            fetchpriority="high"
            decoding="async"
            loading="eager"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 900px"
          />
        ) : (
          <div className="w-full h-full bg-platerly-card" />
        )}

        {/* gradient + inset ring */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
        </div>

        {/* Kebab (top-right) */}
        <div ref={menuRef} className="absolute top-2 sm:top-3 right-2 sm:right-3 z-40">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-full bg-black/60 hover:bg-black/75 border border-white/10 text-white shadow focus:outline-none focus:ring-2 focus:ring-platerly-accent/40"
            aria-label="Actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-platerly-card border border-platerly-border shadow-xl overflow-hidden backdrop-blur">
              {isOwner && (
                <>
                  <button onClick={goEdit} className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmOpen(true) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 text-red-300 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <div className="h-px bg-platerly-border" />
                </>
              )}
              <button onClick={goRemix} className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Remix
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP/TABLET overlay (md+): pills + Save inline and anchored at bottom */}
        <div className="hidden md:block absolute inset-x-0 bottom-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {recipe?.title || 'Untitled recipe'}
              </h1>
              <div className="mt-1 text-sm text-platerly-muted">
                {recipe?.authorUsername ? (
                  <Link to={`/profile/${recipe.authorUsername}`} className="hover:text-platerly-accent hover:underline transition-colors">
                    @{recipe.authorUsername}
                  </Link>
                ) : '—'}
                {recipe?.createdAt && (
                  <>
                    <span className="mx-2 opacity-60">•</span>
                    <span>{new Date(recipe.createdAt).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' })}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {difficulty && <span className={PILL_SUCCESS}><span className="font-semibold">Difficulty:</span> {difficulty}</span>}
              {(prep || cook) && <span className={PILL_NEUTRAL}><Clock className="w-4 h-4" /> {prep && `${prep} prep`}{prep && cook ? ', ' : ''}{cook && `${cook} cook`}</span>}
              {totalFmt && <span className={PILL_NEUTRAL}><Clock className="w-4 h-4" /> Total: {totalFmt}</span>}
              {remixMeta?.isRemix && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 backdrop-blur px-3 py-1 text-xs text-white">
                  <span className="opacity-80">Lineage</span>
                  <span className="opacity-50">•</span>
                  {remixMeta.parentRecipeId
                    ? <Link to={`/recipe/${remixMeta.parentRecipeId}`} className="underline hover:no-underline">source</Link>
                    : <span className="opacity-60">source</span>}
                  <span className="opacity-50">·</span>
                  {remixMeta.originalRecipeId
                    ? <Link to={`/recipe/${remixMeta.originalRecipeId}`} className="underline hover:no-underline">origin</Link>
                    : <span className="opacity-60">origin</span>}
                </span>
              )}
            </div>

            {token && (
              <button
                onClick={() => setSaveOpen(v => !v)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-platerly-accent text-black px-3 py-1.5 text-sm font-medium hover:brightness-110 shadow focus:outline-none focus:ring-2 focus:ring-black/30"
              >
                <BookmarkPlus className="w-4 h-4" /> Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE header card: pills row that wraps; Save sits in the SAME row and flows with it */}
      <Card className="mt-3 px-4 py-3 sm:px-5 sm:py-4 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-platerly-text break-words">
              {recipe?.title || 'Untitled recipe'}
            </h1>
            <div className="mt-1 text-xs text-platerly-muted">
              {recipe?.authorUsername ? (
                <Link to={`/profile/${recipe.authorUsername}`} className="hover:text-platerly-accent hover:underline">
                  @{recipe.authorUsername}
                </Link>
              ) : '—'}
              {recipe?.createdAt && (
                <>
                  <span className="mx-2 opacity-60">•</span>
                  <span>{new Date(recipe.createdAt).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' })}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* The Save button is part of this wrapping row; ml-auto pushes it to the right when space allows */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {difficulty && <span className={PILL_SUCCESS}><span className="font-semibold">Difficulty:</span> {difficulty}</span>}
          {(prep || cook) && <span className={PILL_NEUTRAL}><Clock className="w-4 h-4" /> {prep && `${prep} prep`}{prep && cook ? ', ' : ''}{cook && `${cook} cook`}</span>}
          {totalFmt && <span className={PILL_NEUTRAL}><Clock className="w-4 h-4" /> Total: {totalFmt}</span>}
          {remixMeta?.isRemix && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              <span className="opacity-80">Lineage</span>
              <span className="opacity-50">•</span>
              {remixMeta.parentRecipeId
                ? <Link to={`/recipe/${remixMeta.parentRecipeId}`} className="underline hover:no-underline">source</Link>
                : <span className="opacity-60">source</span>}
              <span className="opacity-50">·</span>
              {remixMeta.originalRecipeId
                ? <Link to={`/recipe/${remixMeta.originalRecipeId}`} className="underline hover:no-underline">origin</Link>
                : <span className="opacity-60">origin</span>}
            </span>
          )}

          {token && (
            <button
              onClick={() => setSaveOpen(v => !v)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-platerly-accent text-black px-3 py-1.5 text-sm font-medium hover:brightness-110 shadow focus:outline-none focus:ring-2 focus:ring-black/30"
            >
              <BookmarkPlus className="w-4 h-4" /> Save
            </button>
          )}
        </div>
      </Card>

      {token && saveOpen && recipe?.id && (
        <Card className="mt-3 p-4">
          <SaveToCookbookSection recipeId={recipe.id} />
        </Card>
      )}

      {/* Tags */}
      {Array.isArray(tags) && tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="rounded-full bg-emerald-900/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-700/40">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Allergy alert */}
      {token && hasAnyAllergen && (
        <Card className="mt-6 border-red-500/60">
          <div className="px-5 py-3 flex items-start gap-3">
            <div className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 ring-1 ring-red-500/40">
              <AlertTriangle className="w-4 h-4 text-red-200" />
            </div>
            <div>
              <p className="font-semibold text-red-100">Potential allergens detected</p>
              <p className="text-sm text-red-100/90 mt-0.5">
                Matched: <span className="font-semibold">{bannerTerms.join(', ')}</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-5 mt-8 sm:mt-10">
        <Section icon={Globe} title="Region">
          <div className="text-platerly-muted">{recipe?.region || '—'}</div>
        </Section>

        <Section icon={BookOpenText} title="Description">
          <div className="leading-relaxed text-platerly-text/95">{recipe?.description || 'No description provided.'}</div>
        </Section>

        <Section icon={ListChecks} title="Instructions">
          <div className="leading-relaxed whitespace-pre-line text-platerly-text/95">{recipe?.instructions || 'No instructions provided.'}</div>
        </Section>

        <Section icon={TagIcon} title="Ingredients">
          <div className="flex flex-wrap gap-2.5">
            {(recipe?.ingredients || []).map((ing, i) => {
              const sev = lookupSeverity(ing?.name, ing)
              const visual = sev || 'safe'
              const cls =
                visual === 'high'   ? SEVERITY_CLASS.high   :
                visual === 'medium' ? SEVERITY_CLASS.medium :
                visual === 'low'    ? SEVERITY_CLASS.low    :
                                       SEVERITY_CLASS.safe
              return (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-full text-sm border ${cls} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}
                  title={sev ? `Severity: ${sev}` : undefined}>
                  {(visual === 'high' || visual === 'medium') && <span className="mr-1">⚠</span>}
                  {ing.quantity && <span className={`${qtyTint(visual)} font-semibold mr-1`}>{ing.quantity}</span>}
                  <span>{ing.name}</span>
                </span>
              )
            })}
          </div>
        </Section>
      </div>

      {/* Comments */}
      {token && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Comments</h3>
            <span className="text-sm text-platerly-muted">({comments.length})</span>
          </div>

          <Card className="p-4">
            <div className="space-y-3">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment…"
                className="w-full bg-platerly-card border border-platerly-border text-platerly-text rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-platerly-accent/40"
              />
              <button
                onClick={async () => {
                  if (!newComment.trim()) return
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
                      method: 'POST',
                      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
                      body: JSON.stringify({ recipeId: id, content: newComment }),
                    })
                    if (!res.ok) throw new Error('Failed to post comment')
                    setNewComment('')
                    const refreshed = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
                    const updated = await refreshed.json()
                    setComments(Array.isArray(updated) ? updated : [])
                  } catch (err) { console.error(err) }
                }}
                className="px-5 py-2 bg-platerly-accent text-black rounded-lg font-medium transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-platerly-accent/40">
                Post Comment
              </button>
            </div>

            {comments.length > 0 && (
              <div className="mt-6 space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-platerly-border bg-white/5 p-3">
                    <div className="flex justify-between items-center text-sm text-platerly-muted mb-1.5">
                      <Link to={`/profile/${comment.username}`} className="font-medium hover:text-platerly-accent transition-colors">
                        @{comment.username}
                      </Link>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-platerly-text/95">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
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
