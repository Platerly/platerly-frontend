import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Repeat2, Wand2, Share2, LinkIcon, Mail, MessageSquare } from 'lucide-react'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const PRIORITY = {
  sensitivity: ['low nickel','nut free','soy free','egg free','shellfish free','peanut free','gluten free','dairy free'],
  diet: ['vegan','vegetarian','keto','paleo','low carb','high protein'],
  course: ['breakfast','lunch','dinner','snack','dessert'],
  style: ['quick','one-pot','one pan','budget','family friendly','spicy'],
}
const BUCKETS = ['sensitivity','diet','course','style']

const TAGS_INLINE_MAX = 2 // show at most 2 tags in the condensed pill

const severityTextClass = (severity) => {
  switch ((severity || '').toLowerCase()) {
    case 'high':   return 'text-red-400 font-semibold'
    case 'medium': return 'text-orange-400 font-medium'
    case 'low':    return 'text-green-400'
    default:       return 'text-platerly-subtle'
  }
}
const sevRank = (s) => (s === 'high' ? 3 : s === 'medium' ? 2 : s === 'low' ? 1 : 0)
const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ')
const variants = (s) => {
  const x = norm(s); if (!x) return []
  const out = new Set([x])
  x.endsWith('s') ? out.add(x.slice(0, -1)) : out.add(`${x}s`)
  return Array.from(out)
}
const isSevere = (s) => ['high','medium'].includes(String(s||'').toLowerCase())

const RecipeCard = ({
  id, author, title, description, imageUrl,
  likes = 0, isLiked = false,
  reposts = 0, isRepostedByCurrentUser = false,
  ingredientNames = [],
  matchedAllergenTerms = [],
  allergenSeverity = {},
  prepTime, cookTime, difficulty,
  tags = '',
}) => {
  const [isLikedState, setIsLikedState] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const [isReposted, setIsReposted] = useState(isRepostedByCurrentUser)
  const [repostCount, setRepostCount] = useState(typeof reposts === 'number' ? reposts : 0)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const navigate = useNavigate()
  const { token } = useAuth()

  const safeImg = imageUrl || '/placeholder.png'
  const shareUrl = `${window.location.origin}/api/share/recipe/${id}`

  // --- Tag normalization + prioritization ---
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
  const condensedText = (() => {
    if (!allDisplayTags.length) return ''
    const visible = allDisplayTags.slice(0, TAGS_INLINE_MAX)
    const hidden = allDisplayTags.length - visible.length
    const base = visible.map(t => `#${t}`).join(' · ')
    return hidden > 0 ? `${base} · +${hidden}` : base
  })()

  const prep = Number.isFinite(prepTime) ? prepTime : undefined
  const cook = Number.isFinite(cookTime) ? cookTime : undefined

  // --- Severity prep ---
  const severityMap = useMemo(() => {
    const out = {}
    Object.entries(allergenSeverity || {}).forEach(([k, v]) => {
      if (!k) return
      out[norm(k)] = String(v || '').toLowerCase()
    })
    return out
  }, [allergenSeverity])

  const severeKeySet = useMemo(() => {
    const s = new Set()
    Object.entries(severityMap).forEach(([k, v]) => { if (isSevere(v)) s.add(k) })
    return s
  }, [severityMap])

  const severityForIngredient = (name) => {
    const n = norm(name)
    let best = null; let bestRank = 0
    for (const v of variants(n)) {
      const sev = severityMap[v]
      const rank = sevRank(sev)
      if (rank > bestRank) { best = sev; bestRank = rank }
    }
    return best
  }

  const severeIngredients = useMemo(() => {
    const out = []
    for (const ing of ingredientNames) {
      const n = norm(ing)
      for (const v of variants(n)) {
        if (severeKeySet.has(v)) { out.push(ing); break }
      }
    }
    return Array.from(new Set(out))
  }, [ingredientNames, severeKeySet])

  const hasAllergyMatch = severeIngredients.length > 0

  const handleCardClick = () => navigate(`/recipe/${id}`)
  const handleProfileClick = (e) => { e.stopPropagation(); navigate(`/profile/${author}`) }

  useEffect(() => setIsLikedState(isLiked), [isLiked])
  useEffect(() => setIsReposted(isRepostedByCurrentUser), [isRepostedByCurrentUser])
  useEffect(() => setRepostCount(typeof reposts === 'number' && !isNaN(reposts) ? reposts : 0), [reposts])

  const handleLikeToggle = async () => {
    const method = isLikedState ? 'DELETE' : 'POST'
    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/like`, { method, headers: { Authorization: `Bearer ${token}` } })
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
          setIsReposted(false); setRepostCount(prev => Math.max(prev - 1, 0)); return
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

  const openNativeShare = async (e) => {
    e.stopPropagation()
    if (navigator.share) {
      try {
        const versioned = `${shareUrl}?v=${Date.now()}`
        await navigator.share({ title, text: title, url: versioned })
      } catch (err) { console.error('Native share failed:', err) }
    } else {
      setShareOpen((v) => !v)
    }
  }

  const shareTo = (e, platform) => {
    e.stopPropagation()
    const text = `${title}`
    const versioned = `${shareUrl}?v=${Date.now()}`
    const links = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(versioned)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(versioned)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(versioned)}&description=${encodeURIComponent(text)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + versioned)}`,
      email: `mailto:?subject=${encodeURIComponent('Check this recipe on Platerly')}&body=${encodeURIComponent(text + '\n' + versioned)}`
    }
    const u = links[platform]
    if (u) window.open(u, '_blank', 'noopener,noreferrer')
    setShareOpen(false)
  }

  const copyLink = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) { console.error('Copy link failed:', err) }
  }

  const Pill = ({ as: Comp = 'span', className = '', children, ...rest }) => (
    <Comp
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-emerald-800/25 text-emerald-100 border border-emerald-500/20',
        'backdrop-blur-sm shadow-sm transition-all duration-150',
        'whitespace-nowrap select-none',
        className
      ].join(' ')}
      {...rest}
    >
      {children}
    </Comp>
  )

  const LabelPill = ({ label, children }) => (
    <Pill><span className="font-semibold">{label}:</span><span>{children}</span></Pill>
  )

  return (
    <div
      onClick={handleCardClick}
      className="relative rounded-2xl bg-platerly-card border border-platerly-border shadow-md hover:shadow-lg cursor-pointer transition"
    >
      {/* Image */}
      <img
        src={safeImg}
        alt={title}
        className="w-full h-44 sm:h-52 md:h-56 object-cover rounded-t-2xl brightness-[0.95] hover:brightness-100 transition duration-300"
        loading="lazy"
        decoding="async"
      />

      <div className="p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold text-emerald-50 tracking-wide mb-1 line-clamp-2">{title}</h2>

        {author && (
          <p
            onClick={handleProfileClick}
            className="text-[13px] sm:text-sm text-emerald-400 hover:text-emerald-300 cursor-pointer mb-2 transition-colors"
          >
            by {author}
          </p>
        )}

        {description && (
          <p className="text-sm text-platerly-subtle mb-2 line-clamp-2 md:line-clamp-3">{description}</p>
        )}

        {/* Compact meta row */}
        <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2.5 text-[13px] leading-relaxed">
          {!!difficulty && <LabelPill label="Difficulty">{difficulty}</LabelPill>}
          {(!!prep || !!cook) && (
            <LabelPill label="Time">
              {prep ? `${prep} min prep` : ''}{prep && cook ? ', ' : ''}{cook ? `${cook} min cook` : ''}
            </LabelPill>
          )}
          {!!healthTag && <LabelPill label="Health">{healthTag}</LabelPill>}

          {/* Condensed tags (single pill) */}
          {condensedText && (
            <Pill title={allDisplayTags.map(t => `#${t}`).join(', ')}>
              {condensedText}
            </Pill>
          )}
        </div>

        {hasAllergyMatch && (
          <div className="text-sm font-medium mb-2">
            ⚠️ Potential allergens{' '}
            {severeIngredients.map((name) => {
              const sev = severityForIngredient(name)
              return (
                <span key={name} className={`mr-2 ${severityTextClass(sev)}`}>{name}</span>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-4 sm:gap-6 items-center text-sm text-platerly-subtle">
            <button
              onClick={(e) => { e.stopPropagation(); handleLikeToggle() }}
              className="flex items-center gap-1 hover:text-red-500 min-h-[44px]"
            >
              <Heart className={`w-5 h-5 sm:w-4 sm:h-4 ${isLikedState ? 'fill-red-500 text-red-500' : ''}`} />
              {formatCount(likeCount)}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleRepostToggle() }}
              className={`flex items-center gap-1 hover:text-green-500 ${isReposted ? 'text-green-500' : ''} min-h-[44px]`}
            >
              <Repeat2 className="w-5 h-5 sm:w-4 sm:h-4" />
              {formatCount(repostCount)}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleRemixClick() }}
              className="flex items-center gap-1 hover:text-purple-400 min-h-[44px]"
            >
              <Wand2 className="w-5 h-5 sm:w-4 sm:h-4" />
              Remix
            </button>
          </div>

          <div className="relative">
            <button
              onClick={openNativeShare}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-platerly-subtle hover:text-emerald-300 min-h-[44px]"
              aria-haspopup="menu"
              aria-expanded={shareOpen}
            >
              <Share2 className="w-5 h-5 sm:w-4 sm:h-4" />
              Share
            </button>

            {shareOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:bottom-auto w-full sm:w-56 rounded-t-2xl sm:rounded-xl border border-platerly-border bg-platerly-card/95 shadow-2xl p-1 z-40"
                role="menu"
              >
                <div className="max-h-[60vh] sm:max-h-none overflow-y-auto">
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-emerald-900/30 text-left" onClick={(e) => shareTo(e, 'twitter')} role="menuitem">
                    <MessageSquare className="w-5 h-5" />
                    Share on X (Twitter)
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-emerald-900/30 text-left" onClick={(e) => shareTo(e, 'facebook')} role="menuitem">
                    <MessageSquare className="w-5 h-5" />
                    Share on Facebook
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-emerald-900/30 text-left" onClick={(e) => shareTo(e, 'pinterest')} role="menuitem">
                    <MessageSquare className="w-5 h-5" />
                    Share on Pinterest
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-emerald-900/30 text-left" onClick={(e) => shareTo(e, 'whatsapp')} role="menuitem">
                    <MessageSquare className="w-5 h-5" />
                    Share on WhatsApp
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-emerald-900/30 text-left" onClick={(e) => shareTo(e, 'email')} role="menuitem">
                    <Mail className="w-5 h-5" />
                    Share via Email
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-emerald-900/30 text-left" onClick={copyLink} role="menuitem">
                    <LinkIcon className="w-5 h-5" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {shareOpen && (
        <button
          aria-hidden
          className="fixed inset-0 cursor-default z-30 bg-black/20 sm:bg-transparent"
          onClick={(e) => { e.stopPropagation(); setShareOpen(false) }}
        />
      )}
    </div>
  )
}

export default RecipeCard
