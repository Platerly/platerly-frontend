import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Repeat2, Wand2 } from 'lucide-react'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const PRIORITY = {
  sensitivity: ['low nickel','nut free','soy free','egg free','shellfish free','peanut free','gluten free','dairy free'],
  diet: ['vegan','vegetarian','keto','paleo','low carb','high protein'],
  course: ['breakfast','lunch','dinner','snack','dessert'],
  style: ['quick','one-pot','one pan','budget','family friendly','spicy'],
}
const BUCKETS = ['sensitivity','diet','course','style']
const MAX_INLINE = 2

// Map severity → text color (for the small “Potential allergens” line)
const severityTextClass = (severity) => {
  switch ((severity || '').toLowerCase()) {
    case 'high':   return 'text-red-400 font-semibold'
    case 'medium': return 'text-orange-400 font-medium'
    case 'low':    return 'text-green-400'
    default:       return 'text-platerly-subtle'
  }
}

// Severity rank helper for picking the “strongest”
const sevRank = (s) => (s === 'high' ? 3 : s === 'medium' ? 2 : s === 'low' ? 1 : 0)

// ---- Normalizers / helpers (match details page logic) ----
const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ')
const variants = (s) => {
  const x = norm(s)
  if (!x) return []
  const out = new Set([x])
  if (x.endsWith('s')) out.add(x.slice(0, -1))
  else out.add(`${x}s`)
  return Array.from(out)
}
const isSevere = (s) => {
  const x = String(s || '').toLowerCase()
  return x === 'high' || x === 'medium'
}

const RecipeCard = ({
  id,
  author,
  title,
  description,
  imageUrl,
  likes = 0,
  isLiked = false,
  reposts = 0,
  isRepostedByCurrentUser = false,

  // ✅ Backend-driven allergy inputs
  ingredientNames = [],                  // array of strings
  matchedAllergenTerms = [],             // (unused for rendering now; kept for future)
  allergenSeverity = {},                 // { [normalizedIngredientName]: 'high'|'medium'|'low' }

  // Other recipe metadata
  prepTime,
  cookTime,
  difficulty,
  tags = '',
}) => {
  const [isLikedState, setIsLikedState] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const [isReposted, setIsReposted] = useState(isRepostedByCurrentUser)
  const [repostCount, setRepostCount] = useState(typeof reposts === 'number' ? reposts : 0)
  const [showAllTags, setShowAllTags] = useState(false)

  const navigate = useNavigate()
  const { token } = useAuth()

  const safeImg = imageUrl || '/placeholder.png'

  // ----- Tags: keep your ordering rules -----
  const rawTags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',') : [])
  const lowerToOriginal = useMemo(() => {
    const m = new Map()
    for (const t of rawTags) {
      const original = String(t || '').trim()
      if (!original) continue
      const lower = original.toLowerCase()
      if (!m.has(lower)) m.set(lower, original)
    }
    return m
  }, [rawTags])

  const score = (lower) => {
    for (let b = 0; b < BUCKETS.length; b++) {
      const list = PRIORITY[BUCKETS[b]]
      const idx = list.indexOf(lower)
      if (idx !== -1) return b * 100 + idx
    }
    return 9_999
  }

  const HEALTH = new Set(['healthy','unhealthy','comfort','treat'])
  const orderedLower = Array.from(lowerToOriginal.keys()).sort((a, b) => score(a) - score(b))
  const healthLower = orderedLower.find(t => HEALTH.has(t))
  const healthTag = healthLower ? lowerToOriginal.get(healthLower) : null
  const nonHealthLower = orderedLower.filter(t => !HEALTH.has(t))
  const allDisplayTags = nonHealthLower.map(k => lowerToOriginal.get(k))
  const inlineTags = showAllTags ? allDisplayTags : allDisplayTags.slice(0, MAX_INLINE)
  const hiddenCount = Math.max(allDisplayTags.length - MAX_INLINE, 0)

  const prep = Number.isFinite(prepTime) ? prepTime : undefined
  const cook = Number.isFinite(cookTime) ? cookTime : undefined

  // ----- Backend-only allergy display (medium/high only) -----
  const ingredientNamesLower = useMemo(
    () => (Array.isArray(ingredientNames) ? ingredientNames : [])
      .map(n => norm(n))
      .filter(Boolean),
    [ingredientNames]
  )

  // Normalize severity map keys once (server already uses lowercased keys, but be safe)
  const severityMap = useMemo(() => {
    const out = {}
    Object.entries(allergenSeverity || {}).forEach(([k, v]) => {
      if (!k) return
      out[norm(k)] = String(v || '').toLowerCase()
    })
    return out
  }, [allergenSeverity])

  // Set of only medium/high keys from server
  const severeKeySet = useMemo(() => {
    const s = new Set()
    Object.entries(severityMap).forEach(([k, v]) => { if (isSevere(v)) s.add(k) })
    return s
  }, [severityMap])

  // Strongest severity for a specific ingredient name
  const severityForIngredient = (name) => {
    const n = norm(name)
    let best = null
    let bestRank = 0
    for (const v of variants(n)) {
      const sev = severityMap[v]
      const rank = sevRank(sev)
      if (rank > bestRank) { best = sev; bestRank = rank }
    }
    return best
  }

  // List of ingredient *names* in this recipe that are medium/high per backend
  const severeIngredients = useMemo(() => {
    const out = []
    for (const ing of ingredientNames) {
      const n = norm(ing)
      for (const v of variants(n)) {
        if (severeKeySet.has(v)) { out.push(ing); break }
      }
    }
    // unique, preserve display casing
    return Array.from(new Set(out))
  }, [ingredientNames, severeKeySet])

  // “Any allergen?” -> only if we have any medium/high ingredient matches
  const hasAllergyMatch = severeIngredients.length > 0

  // ----- Actions -----
  const handleCardClick = () => navigate(`/recipe/${id}`)
  const handleProfileClick = (e) => { e.stopPropagation(); navigate(`/profile/${author}`) }

  useEffect(() => setIsLikedState(isLiked), [isLiked])
  useEffect(() => setIsReposted(isRepostedByCurrentUser), [isRepostedByCurrentUser])
  useEffect(() => setRepostCount(typeof reposts === 'number' && !isNaN(reposts) ? reposts : 0), [reposts])

  const handleLikeToggle = async () => {
    const method = isLikedState ? 'DELETE' : 'POST'
    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Like/unlike failed')
      setIsLikedState(!isLikedState)
      setLikeCount(prev => prev + (isLikedState ? -1 : 1))
    } catch (err) { console.error(err) }
  }

  const handleRepostToggle = async () => {
    const intendedToUnrepost = isReposted
    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/repost`, {
        method: intendedToUnrepost ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (intendedToUnrepost && res.status === 404) {
          setIsReposted(false)
          setRepostCount(prev => Math.max(prev - 1, 0))
          return
        }
        throw new Error('Repost toggle failed.')
      }
      setIsReposted(!isReposted)
      setRepostCount(prev => prev + (isReposted ? -1 : 1))
    } catch (err) { console.error(err) }
  }

  const handleRemixClick = () => navigate(`/remix/${id}`)

  const formatCount = (count) => {
    if (typeof count !== 'number' || isNaN(count)) return '0'
    if (count >= 1_000_000) return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
    return count.toString()
  }

  const Pill = ({ as: Comp = 'span', className = '', children, ...rest }) => (
    <Comp
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-emerald-800/25 text-emerald-100 border border-emerald-500/20',
        'backdrop-blur-sm shadow-sm transition-all duration-150 hover:bg-emerald-800/40 hover:scale-[1.02]',
        'whitespace-nowrap select-none',
        className
      ].join(' ')}
      {...rest}
    >
      {children}
    </Comp>
  )

  const LabelPill = ({ label, children }) => (
    <Pill>
      <span className="font-semibold">{label}:</span>
      <span>{children}</span>
    </Pill>
  )

  return (
    <div
      onClick={handleCardClick}
      className="relative rounded-2xl bg-platerly-card border border-platerly-border shadow-md hover:shadow-lg cursor-pointer transition"
    >
      <img
        src={safeImg}
        alt={title}
        className="w-full h-52 object-cover rounded-t-2xl brightness-[0.95] hover:brightness-100 transition duration-300"
        loading="lazy"
      />

      <div className="p-5">
        <h2 className="text-lg font-semibold text-emerald-50 tracking-wide mb-1">{title}</h2>

        {author && (
          <p
            onClick={handleProfileClick}
            className="text-sm text-emerald-400 hover:text-emerald-300 cursor-pointer mb-2 transition-colors"
          >
            by {author}
          </p>
        )}

        {description && (
          <p className="text-sm text-platerly-subtle mb-2">{description}</p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2.5 text-[13px] leading-relaxed">
          {!!difficulty && <LabelPill label="Difficulty">{difficulty}</LabelPill>}

          {(!!prep || !!cook) && (
            <LabelPill label="Time">
              {prep ? `${prep} min prep` : ''}
              {prep && cook ? ', ' : ''}
              {cook ? `${cook} min cook` : ''}
            </LabelPill>
          )}

          {!!healthTag && <LabelPill label="Health">{healthTag}</LabelPill>}

          {allDisplayTags.length > 0 && (
            <>
              <LabelPill label="Tags" />
              {inlineTags.map(tag => (
                <Pill key={tag}>#{tag}</Pill>
              ))}
              {hiddenCount > 0 && !showAllTags && (
                <Pill
                  as="button"
                  onClick={(e) => { e.stopPropagation(); setShowAllTags(true) }}
                >
                  +{hiddenCount} more
                </Pill>
              )}
              {showAllTags && hiddenCount > 0 && (
                <Pill
                  as="button"
                  onClick={(e) => { e.stopPropagation(); setShowAllTags(false) }}
                >
                  Show less
                </Pill>
              )}
            </>
          )}
        </div>

        {/* 🟠 Potential allergens — only show ingredients with medium/high severity */}
        {hasAllergyMatch && (
          <div className="text-sm font-medium mb-2">
            ⚠️ Potential allergens:{' '}
            {severeIngredients.map((name) => {
              const sev = severityForIngredient(name)
              return (
                <span key={name} className={`mr-2 ${severityTextClass(sev)}`}>
                  {name}
                </span>
              )
            })}
          </div>
        )}

        <div className="flex gap-6 items-center text-sm text-platerly-subtle">
          <button
            onClick={(e) => { e.stopPropagation(); handleLikeToggle() }}
            className="flex items-center gap-1 hover:text-red-500"
          >
            <Heart className={`w-4 h-4 ${isLikedState ? 'fill-red-500 text-red-500' : ''}`} />
            {formatCount(likeCount)}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleRepostToggle() }}
            className={`flex items-center gap-1 hover:text-green-500 ${isReposted ? 'text-green-500' : ''}`}
          >
            <Repeat2 className="w-4 h-4" />
            {formatCount(repostCount)}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleRemixClick() }}
            className="flex items-center gap-1 hover:text-purple-400"
          >
            <Wand2 className="w-4 h-4" />
            Remix
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeCard
