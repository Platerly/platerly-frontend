import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SaveToCookbookSection from '../pages/SaveToCookbookSection'
import ConfirmDialog from '../components/common/ConfirmDialog'
import CommentsSection from '../components/comments/CommentsSection'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { norm, variants, isSevere } from '../utils/allergenHelpers'
import { logger } from '../utils/logger'
import { toast } from 'react-hot-toast'
import {
  MoreVertical, Pencil, Trash2, RefreshCw, BookmarkPlus,
  AlertTriangle, Clock, Tag as TagIcon, Globe, BookOpenText, ListChecks,
  Plus, Minus, Share2, Mail, LinkIcon, X, Check
} from 'lucide-react'

// Social media brand icons
const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const PinterestIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
)

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const LinkedInIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const RedditIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
)
import ShoppingListSection from '../components/recipe/ShoppingListSection'
import RecipeLineage from '../components/recipe/RecipeLineage'

const DIFFICULTY_MAP = { 0: 'Easy', 1: 'Medium', 2: 'Hard' }

/* ---------- Pills ---------- */
const PILL_BASE = 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm border shadow-sm'
const PILL_NEUTRAL = `${PILL_BASE} bg-white/5 border-platerly-border text-platerly-text`
const PILL_SUCCESS = `${PILL_BASE} bg-emerald-900/30 border-emerald-400/30 text-emerald-200`

/* ---------- Severity classes ---------- */
const SEVERITY_CLASS = {
  high: 'bg-red-900/60 border-red-500 text-red-100',
  medium: 'bg-orange-900/60 border-orange-500 text-orange-100',
  low: 'bg-amber-900/40 border-amber-500/70 text-amber-100',
  safe: 'bg-emerald-900/30 border-emerald-600/70 text-emerald-100'
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
// Allergen helpers (norm, variants, isSevere) imported from utils/allergenHelpers.js

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
  if (m == null) return null
  const h = Math.floor(m / 60), mm = m % 60
  if (h && mm) return `${h} hr ${mm} min`
  if (h) return `${h} hr`
  return `${mm} min`
}

/* ---------- Scale quantity helper ---------- */
const scaleQuantity = (quantity, scale) => {
  if (!quantity || scale === 1) return quantity
  const qtyMatch = String(quantity).match(/^([\d./]+)\s*(.*)$/)
  if (!qtyMatch) return quantity

  const numPart = qtyMatch[1]
  const unitPart = qtyMatch[2]

  let num = 0
  if (numPart.includes('/')) {
    const [numer, denom] = numPart.split('/')
    num = parseFloat(numer) / parseFloat(denom)
  } else {
    num = parseFloat(numPart)
  }

  if (isNaN(num)) return quantity

  const scaled = num * scale
  if (scaled === Math.floor(scaled)) return `${scaled} ${unitPart}`.trim()
  if (scaled === 0.5) return `1/2 ${unitPart}`.trim()
  if (scaled === 0.25) return `1/4 ${unitPart}`.trim()
  if (scaled === 0.75) return `3/4 ${unitPart}`.trim()
  if (Math.abs(scaled - 0.333) < 0.01) return `1/3 ${unitPart}`.trim()
  if (Math.abs(scaled - 0.666) < 0.01) return `2/3 ${unitPart}`.trim()
  return `${scaled.toFixed(2).replace(/\.?0+$/, '')} ${unitPart}`.trim()
}
const toMinutes = (v) => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = parseInt(String(v ?? 0), 10)
  return Number.isNaN(n) ? 0 : n
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


const RecipeDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [recipe, setRecipe] = useState(null)
  const [remixMeta, setRemixMeta] = useState(null)
  const [topLevelForTags, setTopLevelForTags] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [severityMap, setSeverityMap] = useState({})
  const [allergenHits, setAllergenHits] = useState([])
  const [hitsLoading, setHitsLoading] = useState(false)

  const [menuOpen, setMenuOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [ingredientScale, setIngredientScale] = useState(1)

  const menuRef = useRef(null)

  /* Close kebab menu */
  useEffect(() => {
    const onDocClick = (e) => { if (!menuRef.current) return; if (!menuRef.current.contains(e.target)) setMenuOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('click', onDocClick)
    window.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('click', onDocClick); window.removeEventListener('keydown', onEsc) }
  }, [])

  /* ---------- Load recipe (kept for core page data) ---------- */
  const loadRecipe = async (signal) => {
    setRecipe(null); setRemixMeta(null); setTopLevelForTags(null)
    setSeverityMap({}); setLoading(true); setNotFound(false); setError('')
    const auth = token ? { Authorization: `Bearer ${token}` } : {}

    try {
      // NOTE: keep this if your API still supports it; highlighting no longer relies on it
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}?allergyMin=medium`, { headers: auth, signal })
      if (res.status === 404) { setNotFound(true); setLoading(false); return }
      if (!res.ok) throw new Error(`Failed to fetch recipe (${res.status})`)
      const data = await res.json()

      setTopLevelForTags(data)
      const core = data.recipe ?? data
      setRecipe(core)
      setRemixMeta(data.remixMeta ?? null)

      // legacy map (optional fallback)
      const sevMap = core?.matchedAllergenSeverity || {}
      const normalized = {}
      Object.entries(sevMap).forEach(([k, v]) => {
        if (k) normalized[norm(k)] = String(v || '').toLowerCase()
      })
      setSeverityMap(normalized)

      setLoading(false)
    } catch (e) {
      if (!signal || !signal.aborted) {
        logger.error('Recipe operation failed', e)
        setError('Something went wrong loading this recipe.')
        setLoading(false)
      }
    }
  }

  /* ---------- NEW: load hits for highlighting ---------- */
  const loadAllergenHits = async (signal) => {
    if (!token) { setAllergenHits([]); return }

    try {
      setHitsLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/Allergy/hits?recipeId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      if (!res.ok) {
        setAllergenHits([])
        return
      }
      const data = await res.json()
      setAllergenHits(Array.isArray(data) ? data : [])
    } catch (e) {
      if (!signal || !signal.aborted) {
        logger.error('Recipe operation failed', e)
        setAllergenHits([])
      }
    } finally {
      setHitsLoading(false)
    }
  }

  /* ---------- Load on mount ---------- */
  useEffect(() => {
    const ctl = new AbortController()
    loadRecipe(ctl.signal)
    loadAllergenHits(ctl.signal)

    ; (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (r.ok) setComments(await r.json())
      } catch { /* ignore */ }
    })()

    return () => ctl.abort()
  }, [id, token])

  /* ---------- Track view for trending ---------- */
  useEffect(() => {
    if (!id || loading || notFound || error) return

    // Fire and forget - don't await or handle errors
    fetch(`${API_BASE_URL}/api/Recipe/${id}/view`, { method: 'POST' }).catch(() => {})
  }, [id, loading, notFound, error])

  /* ---------- Derived ---------- */
  const hitSeverityByIngredientId = useMemo(() => {
    const rank = { low: 1, medium: 2, high: 3 }
    const map = {}
    for (const h of (allergenHits || [])) {
      const idKey = String(h?.ingredientId || '')
      if (!idKey) continue
      const sev = String(h?.hitSeverity || '').toLowerCase()
      if (!map[idKey]) map[idKey] = sev
      else {
        const a = rank[map[idKey]] || 0
        const b = rank[sev] || 0
        if (b > a) map[idKey] = sev
      }
    }
    return map
  }, [allergenHits])

  const severeKeySet = useMemo(() => {
    const s = new Set()
    Object.entries(severityMap).forEach(([k, v]) => { if (k && isSevere(v)) s.add(norm(k)) })
    return s
  }, [severityMap])

  const bannerTerms = useMemo(() => {
    // Prefer new hits for banner (high/medium), fallback to old map if needed
    if (!token || !recipe?.ingredients) return []

    const out = new Set()
    const byId = hitSeverityByIngredientId

    for (const ing of (recipe.ingredients || [])) {
      const idKey = String(ing?.id || ing?.ingredientId || '')
      const sev = idKey ? (byId[idKey] || null) : null
      if (sev && isSevere(sev)) out.add(ing.name)
    }

    // fallback (old)
    if (out.size === 0 && severeKeySet.size) {
      for (const ing of recipe.ingredients) {
        const n = norm(ing?.name)
        for (const v of variants(n)) if (severeKeySet.has(v)) { out.add(ing.name); break }
      }
    }

    return [...out]
  }, [token, recipe?.ingredients, hitSeverityByIngredientId, severeKeySet])

  const hasAnyAllergen = bannerTerms.length > 0

  const lookupSeverityFallback = (ingredientName, ing) => {
    const candidates = [ing?.globalIngredientName, ing?.globalIngredient?.name, ing?.Name, ingredientName]
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

  const prepMin = toMinutes(recipe?.prepTimeMinutes ?? recipe?.prepMinutes ?? recipe?.prepTime)
  const cookMin = toMinutes(recipe?.cookTimeMinutes ?? recipe?.cookMinutes ?? recipe?.cookTime)
  const prep = prepMin ? fmtMinutes(prepMin) : null
  const cook = cookMin ? fmtMinutes(cookMin) : null
  const totalFmt = (prepMin + cookMin) > 0 ? fmtMinutes(prepMin + cookMin) : null

  const tags = coerceTags(recipe, topLevelForTags)

  const isOwner = useMemo(() => {
    if (!user?.username || !recipe?.authorUsername) return false
    return String(user.username).toLowerCase() === String(recipe.authorUsername).toLowerCase()
  }, [user?.username, recipe?.authorUsername])

  const goEdit = () => navigate(`/edit-recipe/${id}`)
  const goRemix = () => navigate(`/remix/${id}`)

  // Share functionality
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  // Use /api/share/ so social media crawlers get OG meta tags
  const shareUrl = `${window.location.origin}/api/share/recipe/${id}`

  const handleShare = () => {
    setShareOpen(true)
  }

  const shareTo = (platform) => {
    const text = `Check out this recipe: ${recipe?.title || 'Recipe'}`
    const links = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(text)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(recipe?.title || 'Recipe')}`,
      email: `mailto:?subject=${encodeURIComponent('Check this recipe on Platerly')}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`
    }
    const u = links[platform]
    if (u) window.open(u, '_blank', 'noopener,noreferrer')
    setShareOpen(false)
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
    setShareOpen(false)
  }

  const doDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.status === 204 || res.ok) {
        window.location.assign('/feed'); return
      }
      if (res.status === 401 || res.status === 403) {
        window.location.assign('/login'); return
      }
      let msg = ''; try { msg = await res.text() } catch { /* ignore */ }
      throw new Error(`Delete failed (${res.status}): ${msg}`)
    } catch (e) {
      logger.error('Delete failed', e)
      toast.error('Sorry, delete failed.')
    }
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
  if (error) return <div className="px-4 sm:px-6 py-12"><p className="text-red-400">{error}</p></div>

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-platerly-text">

      {/* HERO */}
      <div className="relative w-full aspect-[5/4] sm:aspect-[16/9] lg:aspect-[21/9]
                      min-h-[220px] rounded-[22px] overflow-hidden
                      shadow-[0_25px_80px_rgba(0,0,0,0.45)]
                      ring-1 ring-platerly-border bg-platerly-light">
        {recipe?.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title || 'Recipe image'}
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            loading="eager"
          />
        ) : <div className="w-full h-full bg-platerly-card" />}

        {/* gradient overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
        </div>

        {/* Photo Credit */}
        {recipe?.photoCredit && (
          <div className="absolute top-3 left-3 z-30">
            {recipe.photoCreditUrl ? (
              <a
                href={recipe.photoCreditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/70 hover:text-white bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm transition-colors"
              >
                Photo by {recipe.photoCredit} on Pexels
              </a>
            ) : (
              <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                Photo by {recipe.photoCredit} on Pexels
              </span>
            )}
          </div>
        )}

        {/* kebab */}
        <div ref={menuRef} className="absolute top-2 sm:top-3 right-2 sm:right-3 z-40">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-full bg-black/60 hover:bg-black/75 border border-white/10 text-white shadow">
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-platerly-card border border-platerly-border shadow-xl overflow-hidden">
              {isOwner && (
                <>
                  <button onClick={goEdit} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5">
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmOpen(true) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-white/5">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <div className="h-px bg-platerly-border" />
                </>
              )}
              <button onClick={goRemix} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5">
                <RefreshCw className="w-4 h-4" /> Remix
              </button>
              <button onClick={handleShare} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP/TABLET meta */}
        <div className="hidden md:block absolute inset-x-0 bottom-0 p-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white drop-shadow-sm">
            {recipe?.title || 'Untitled recipe'}
          </h1>
          <div className="mt-1 text-sm text-platerly-muted">
            {recipe?.authorUsername ? (
              <Link to={`/profile/${recipe.authorUsername}`} className="hover:text-platerly-accent hover:underline">
                @{recipe.authorUsername}
              </Link>
            ) : '—'}

            {recipe?.createdAt && (
              <>
                <span className="mx-2 opacity-60">•</span>
                <span>{new Date(recipe.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {difficulty && <span className={PILL_SUCCESS}><span className="font-semibold">Difficulty:</span> {difficulty}</span>}
            {(prep || cook) && (
              <span className={PILL_NEUTRAL}><Clock className="w-4 h-4" /> {prep && `${prep} prep`}{prep && cook ? ', ' : ''}{cook && `${cook} cook`}</span>
            )}
            {totalFmt && <span className={PILL_NEUTRAL}><Clock className="w-4 h-4" /> Total: {totalFmt}</span>}

            {token && (
              <button
                onClick={() => setSaveOpen(v => !v)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-platerly-accent text-black px-3 py-1.5 text-sm hover:brightness-110 shadow">
                <BookmarkPlus className="w-4 h-4" /> Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE header */}
      <Card className="mt-3 px-4 py-3 md:hidden">
        <h1 className="text-xl font-extrabold">{recipe?.title || 'Untitled recipe'}</h1>

        <div className="mt-1 text-xs text-platerly-muted">
          {recipe?.authorUsername ? (
            <Link to={`/profile/${recipe.authorUsername}`} className="hover:text-platerly-accent hover:underline">
              @{recipe.authorUsername}
            </Link>
          ) : '—'}

          {recipe?.createdAt && (
            <>
              <span className="mx-2 opacity-60">•</span>
              <span>{new Date(recipe.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {difficulty && <span className={PILL_SUCCESS}><span className="font-semibold">Difficulty:</span> {difficulty}</span>}
          {(prep || cook) && <span className={PILL_NEUTRAL}><Clock className="w-4 h-4" /> {prep && `${prep} prep`}{prep && cook ? ', ' : ''}{cook && `${cook} cook`}</span>}
          {totalFmt && <span className={PILL_NEUTRAL}><Clock className="w-4 h-4" /> Total: {totalFmt}</span>}

          {token && (
            <button
              onClick={() => setSaveOpen(v => !v)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-platerly-accent text-black px-3 py-1.5 text-sm hover:brightness-110 shadow">
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

      {/* Recipe Lineage / Evolution */}
      <div className="mt-6">
        <RecipeLineage
          recipeId={id}
          isRemix={!!recipe?.parentRecipeId || !!remixMeta?.originalRecipeId}
          remixCount={recipe?.remixCount || remixMeta?.remixCount || 0}
        />
      </div>

      {/* Allergy Alert */}
      {token && hasAnyAllergen && (
        <Card className="mt-6 border-red-500/60">
          <div className="px-5 py-3 flex items-start gap-3">
            <div className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full bg-red-500/20 ring-1 ring-red-500/40">
              <AlertTriangle className="w-4 h-4 text-red-200" />
            </div>
            <div>
              <p className="font-semibold text-red-100">Potential allergens detected</p>
              <p className="text-sm text-red-100/90 mt-0.5">
                Matched: <span className="font-semibold">{bannerTerms.join(', ')}</span>
                {hitsLoading && <span className="ml-2 text-xs text-red-100/70">(checking…)</span>}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-5 mt-8">
        <Section icon={Globe} title="Region">
          <div className="text-platerly-muted">{recipe?.region || '—'}</div>
        </Section>

        <Section icon={BookOpenText} title="Description">
          <div className="text-platerly-text/95 whitespace-pre-line">{recipe?.description || 'No description provided.'}</div>
        </Section>

        <Section icon={ListChecks} title="Instructions">
          <div className="text-platerly-text/95 whitespace-pre-line">{recipe?.instructions || 'No instructions provided.'}</div>
        </Section>

        <Card>
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between bg-white/5 border-b border-platerly-border/70">
            <div className="flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-platerly-muted" aria-hidden />
              <h2 className="text-base sm:text-lg font-semibold">Ingredients</h2>
            </div>
            {/* Scale Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-platerly-subtle mr-1">Scale:</span>
              <button
                onClick={() => setIngredientScale(s => Math.max(0.5, s - 0.5))}
                disabled={ingredientScale <= 0.5}
                className="w-7 h-7 rounded-lg bg-platerly-card border border-platerly-border flex items-center justify-center hover:bg-platerly-light disabled:opacity-50 transition-colors"
                aria-label="Decrease scale"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-medium text-platerly-text">
                {ingredientScale}x
              </span>
              <button
                onClick={() => setIngredientScale(s => Math.min(10, s + 0.5))}
                disabled={ingredientScale >= 10}
                className="w-7 h-7 rounded-lg bg-platerly-card border border-platerly-border flex items-center justify-center hover:bg-platerly-light disabled:opacity-50 transition-colors"
                aria-label="Increase scale"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {ingredientScale !== 1 && (
                <button
                  onClick={() => setIngredientScale(1)}
                  className="ml-1 text-xs text-platerly-subtle hover:text-platerly-green transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="px-4 sm:px-5 py-4">
            <div className="flex flex-wrap gap-2.5">
              {(recipe?.ingredients || []).map((ing, i) => {
                // ✅ Primary: by IngredientId from /api/Allergy/hits
                const idKey = String(ing?.id || ing?.ingredientId || '')
                const sevFromHits = idKey ? (hitSeverityByIngredientId[idKey] || null) : null

                // Optional fallback: legacy matchedAllergenSeverity name-based
                const sevFallback = lookupSeverityFallback(ing?.name, ing)
                const sev = sevFromHits || sevFallback

                const visual = sev || 'safe'
                const cls =
                  visual === 'high' ? SEVERITY_CLASS.high :
                    visual === 'medium' ? SEVERITY_CLASS.medium :
                      visual === 'low' ? SEVERITY_CLASS.low :
                        SEVERITY_CLASS.safe

                const scaledQty = scaleQuantity(ing.quantity, ingredientScale)

                return (
                  <span
                    key={i}
                    className={`px-3 py-1.5 rounded-full text-sm border ${cls}`}
                    title={sev ? `Severity: ${sev}` : undefined}
                  >
                    {(visual === 'high' || visual === 'medium') && <span className="mr-1">⚠</span>}
                    {scaledQty && <span className={`${qtyTint(visual)} font-semibold mr-1`}>{scaledQty}</span>}
                    <span>{ing.name}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Shopping List */}
        <ShoppingListSection
          ingredients={recipe?.ingredients || []}
          servings={recipe?.servings || 1}
          recipeTitle={recipe?.title || ''}
          recipeId={id}
        />
      </div>

      {/* Comments */}
      <div className="mt-10">
        <CommentsSection recipeId={id} initialComments={comments} />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete recipe?"
        description="This will hide the recipe for everyone else. You can't recover it here."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        tone="danger"
      />

      {/* Share Modal */}
      {shareOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShareOpen(false)}
          />
          <div className="fixed inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-80 rounded-2xl bg-platerly-card border border-platerly-border shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-platerly-border bg-platerly-light/30">
              <h3 className="font-semibold text-platerly-text">Share Recipe</h3>
              <button
                onClick={() => setShareOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-platerly-subtle hover:text-platerly-text hover:bg-platerly-light transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3">
              {/* Social Grid */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => shareTo('twitter')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-platerly-light/50 transition-colors group"
                  title="Share on X"
                >
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                    <XIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] text-platerly-subtle">X</span>
                </button>

                <button
                  onClick={() => shareTo('facebook')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-platerly-light/50 transition-colors group"
                  title="Share on Facebook"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FacebookIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] text-platerly-subtle">Facebook</span>
                </button>

                <button
                  onClick={() => shareTo('whatsapp')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-platerly-light/50 transition-colors group"
                  title="Share on WhatsApp"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <WhatsAppIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] text-platerly-subtle">WhatsApp</span>
                </button>

                <button
                  onClick={() => shareTo('pinterest')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-platerly-light/50 transition-colors group"
                  title="Share on Pinterest"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E60023] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PinterestIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] text-platerly-subtle">Pinterest</span>
                </button>

                <button
                  onClick={() => shareTo('linkedin')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-platerly-light/50 transition-colors group"
                  title="Share on LinkedIn"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LinkedInIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] text-platerly-subtle">LinkedIn</span>
                </button>

                <button
                  onClick={() => shareTo('reddit')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-platerly-light/50 transition-colors group"
                  title="Share on Reddit"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF4500] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <RedditIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] text-platerly-subtle">Reddit</span>
                </button>

                <button
                  onClick={() => shareTo('email')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-platerly-light/50 transition-colors group"
                  title="Share via Email"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] text-platerly-subtle">Email</span>
                </button>

                <button
                  onClick={copyShareLink}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-platerly-light/50 transition-colors group"
                  title="Copy Link"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${copied ? 'bg-platerly-green' : 'bg-platerly-light border border-platerly-border'}`}>
                    {copied ? <Check className="w-5 h-5 text-white" /> : <LinkIcon className="w-5 h-5 text-platerly-text" />}
                  </div>
                  <span className="text-[11px] text-platerly-subtle">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

export default RecipeDetailsPage
