import React, { useState, useEffect, useMemo, memo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Heart, Repeat2, Wand2, Share2, LinkIcon, Mail, Flame, X, Check } from 'lucide-react'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { usePremium } from '../../hooks/usePremium'
import { useScanStatus } from '../../hooks/useScanStatus'
import { norm, variants, isSevere, sevRank } from '../../utils/allergenHelpers'
import { logger } from '../../utils/logger'
import { TAGS_INLINE_MAX } from '../../constants/limits'
import { getRecipeUrl, getRecipeShareUrl } from '../../utils/recipeUrl'

const PRIORITY = {
  sensitivity: ['low nickel','nut free','soy free','egg free','shellfish free','peanut free','gluten free','dairy free'],
  diet: ['vegan','vegetarian','keto','paleo','low carb','high protein'],
  course: ['breakfast','lunch','dinner','snack','dessert'],
  style: ['quick','one-pot','one pan','budget','family friendly','spicy'],
}
const BUCKETS = ['sensitivity','diet','course','style']

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

const severityTextClass = (severity) => {
  switch ((severity || '').toLowerCase()) {
    case 'high':   return 'text-red-400 font-semibold'
    case 'medium': return 'text-amber-400 font-medium'
    case 'low':    return 'text-recipzee-green'
    default:       return 'text-recipzee-subtle'
  }
}
// Allergen helpers imported from utils/allergenHelpers.js

const RecipeCard = ({
  id, author, title, description, imageUrl,
  photoCredit, photoCreditUrl,
  likes = 0, isLiked = false,
  reposts = 0, isRepostedByCurrentUser = false,
  ingredientNames = [],
  allergenSeverity = {},
  prepTime, cookTime, difficulty,
  tags = '',
  isTrending = false,
  trendingRank = null,
  // SEO-friendly URL fields
  slug = null,
  authorUsername = null,
}) => {
  const [isLikedState, setIsLikedState] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const [isReposted, setIsReposted] = useState(isRepostedByCurrentUser)
  const [repostCount, setRepostCount] = useState(typeof reposts === 'number' ? reposts : 0)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const navigate = useNavigate()
  const { token } = useAuth()
  const { isPremium, isOnTrial } = usePremium()
  const { atLimit } = useScanStatus()
  const [remixUpgradeOpen, setRemixUpgradeOpen] = useState(false)

  const safeImg = imageUrl || '/placeholder.png'
  // Use /api/share/ so social media crawlers get OG meta tags
  const shareUrl = getRecipeShareUrl({ id })
  // Build the recipe object for URL generation
  const recipeForUrl = { id, slug, authorUsername }

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

  const handleCardClick = () => navigate(getRecipeUrl(recipeForUrl))
  const handleProfileClick = (e) => { e.stopPropagation(); navigate(`/profile/${author}`) }

  useEffect(() => setIsLikedState(isLiked), [isLiked])
  useEffect(() => setIsReposted(isRepostedByCurrentUser), [isRepostedByCurrentUser])
  useEffect(() => setRepostCount(typeof reposts === 'number' && !isNaN(reposts) ? reposts : 0), [reposts])

  const handleLikeToggle = async () => {
    // Optimistic update
    const wasLiked = isLikedState
    const prevCount = likeCount
    setIsLikedState(!wasLiked)
    setLikeCount(prev => prev + (wasLiked ? -1 : 1))

    const method = wasLiked ? 'DELETE' : 'POST'
    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/like`, { method, headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) {
        // Revert on failure
        setIsLikedState(wasLiked)
        setLikeCount(prevCount)
        throw new Error('Like/unlike failed')
      }
    } catch (err) {
      setIsLikedState(wasLiked)
      setLikeCount(prevCount)
      logger.error('Like action failed', err)
    }
  }

  const handleRepostToggle = async () => {
    // Optimistic update
    const wasReposted = isReposted
    const prevCount = repostCount
    setIsReposted(!wasReposted)
    setRepostCount(prev => prev + (wasReposted ? -1 : 1))

    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/repost`, {
        method: wasReposted ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (wasReposted && res.status === 404) {
          // Already unreposted on server, keep UI state
          return
        }
        // Revert on failure
        setIsReposted(wasReposted)
        setRepostCount(prevCount)
        throw new Error('Repost toggle failed.')
      }
    } catch (err) {
      setIsReposted(wasReposted)
      setRepostCount(prevCount)
      logger.error('Repost action failed', err)
    }
  }

  const handleRemixClick = () => {
    if (isPremium || isOnTrial) {
      navigate(`/remix/${id}`)
    } else {
      setRemixUpgradeOpen(true)
    }
  }

  const formatCount = (count) => {
    if (typeof count !== 'number' || isNaN(count)) return '0'
    if (count >= 1_000_000) return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
    return count.toString()
  }

  const toggleShareMenu = (e) => {
    e.stopPropagation()
    setShareOpen((v) => !v)
  }

  const shareTo = (e, platform) => {
    e.stopPropagation()
    const text = `Check out this recipe: ${title}`
    const links = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(text)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`,
      email: `mailto:?subject=${encodeURIComponent('Check this recipe on Recipzee')}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`
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
    } catch (err) { logger.error('Copy link failed', err) }
  }

  // eslint-disable-next-line no-unused-vars
  const Pill = ({ as: Comp = 'span', className = '', children, ...rest }) => (
    <Comp
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-recipzee-green/20 text-recipzee-text border border-recipzee-green/20',
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
      className="relative rounded-2xl bg-recipzee-card border border-recipzee-border shadow-md hover:shadow-lg cursor-pointer transition"
    >
      {/* Image */}
      <div className="relative">
        <img
          src={safeImg}
          alt={title}
          className="w-full h-44 sm:h-52 md:h-56 object-cover rounded-t-2xl brightness-[0.95] hover:brightness-100 transition duration-300"
          loading="lazy"
          decoding="async"
        />
        {/* Trending Badge */}
        {isTrending && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            <Flame className="w-3.5 h-3.5" />
            {trendingRank ? `#${trendingRank}` : 'Trending'}
          </div>
        )}
        {/* Photo Credit */}
        {photoCredit && (
          <div className="absolute bottom-2 right-2">
            {photoCreditUrl ? (
              <a
                href={photoCreditUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-white/70 hover:text-white bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm transition-colors"
              >
                Photo by {photoCredit} on Pexels
              </a>
            ) : (
              <span className="text-[10px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                Photo by {photoCredit} on Pexels
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold text-recipzee-text tracking-wide mb-1 line-clamp-2">{title}</h2>

        {author && (
          <p
            onClick={handleProfileClick}
            className="text-[13px] sm:text-sm text-recipzee-green hover:text-recipzee-green/80 cursor-pointer mb-2 transition-colors"
          >
            by {author}
          </p>
        )}

        {description && (
          <p className="text-sm text-recipzee-subtle mb-2 line-clamp-2 md:line-clamp-3">{description}</p>
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
          <div className="text-sm font-medium mb-2 flex flex-wrap items-center gap-x-1 gap-y-0.5">
            <span>⚠️ Potential allergens</span>
            {atLimit ? (
              <>
                <span className="blur-sm select-none">
                  {severeIngredients.map((name) => (
                    <span key={name} className="mr-2">{name}</span>
                  ))}
                </span>
                <Link
                  to="/settings?tab=subscription"
                  onClick={(e) => e.stopPropagation()}
                  className="text-yellow-400 text-xs font-semibold hover:text-yellow-300 underline underline-offset-2 whitespace-nowrap"
                >
                  Unlock
                </Link>
              </>
            ) : (
              severeIngredients.map((name) => {
                const sev = severityForIngredient(name)
                return (
                  <span key={name} className={`mr-2 ${severityTextClass(sev)}`}>{name}</span>
                )
              })
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-4 sm:gap-6 items-center text-sm text-recipzee-subtle">
            <button
              onClick={(e) => { e.stopPropagation(); handleLikeToggle() }}
              className={`flex items-center gap-1 min-h-[44px] ${isLikedState ? 'text-red-500' : 'text-recipzee-subtle hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 sm:w-4 sm:h-4 ${isLikedState ? 'fill-red-500 text-red-500' : ''}`} />
              {formatCount(likeCount)}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleRepostToggle() }}
              className={`flex items-center gap-1 hover:text-recipzee-green ${isReposted ? 'text-recipzee-green' : ''} min-h-[44px]`}
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

          {remixUpgradeOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm"
            >
              <span className="text-yellow-200">Remixing requires Premium</span>
              <div className="flex items-center gap-2">
                <Link
                  to="/settings?tab=subscription"
                  onClick={(e) => e.stopPropagation()}
                  className="text-yellow-400 font-medium hover:text-yellow-300 underline-offset-2 underline whitespace-nowrap"
                >
                  Upgrade
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); setRemixUpgradeOpen(false) }}
                  className="text-recipzee-subtle hover:text-recipzee-text"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <button
              onClick={toggleShareMenu}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-recipzee-subtle hover:text-recipzee-green min-h-[44px]"
              aria-haspopup="menu"
              aria-expanded={shareOpen}
            >
              <Share2 className="w-5 h-5 sm:w-4 sm:h-4" />
              Share
            </button>

            {shareOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:bottom-auto w-full sm:w-64 rounded-t-2xl sm:rounded-xl border border-recipzee-border bg-recipzee-card shadow-2xl z-40 overflow-hidden"
                role="menu"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-recipzee-border bg-recipzee-light/30">
                  <span className="text-sm font-semibold text-recipzee-text">Share Recipe</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShareOpen(false) }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-recipzee-subtle hover:text-recipzee-text hover:bg-recipzee-light transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2 max-h-[60vh] sm:max-h-none overflow-y-auto">
                  {/* Social Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <button
                      onClick={(e) => shareTo(e, 'twitter')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-recipzee-light/50 transition-colors group"
                      role="menuitem"
                      title="Share on X"
                    >
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                        <XIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] text-recipzee-subtle">X</span>
                    </button>

                    <button
                      onClick={(e) => shareTo(e, 'facebook')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-recipzee-light/50 transition-colors group"
                      role="menuitem"
                      title="Share on Facebook"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FacebookIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] text-recipzee-subtle">Facebook</span>
                    </button>

                    <button
                      onClick={(e) => shareTo(e, 'whatsapp')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-recipzee-light/50 transition-colors group"
                      role="menuitem"
                      title="Share on WhatsApp"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <WhatsAppIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] text-recipzee-subtle">WhatsApp</span>
                    </button>

                    <button
                      onClick={(e) => shareTo(e, 'pinterest')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-recipzee-light/50 transition-colors group"
                      role="menuitem"
                      title="Share on Pinterest"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#E60023] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PinterestIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] text-recipzee-subtle">Pinterest</span>
                    </button>

                    <button
                      onClick={(e) => shareTo(e, 'linkedin')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-recipzee-light/50 transition-colors group"
                      role="menuitem"
                      title="Share on LinkedIn"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <LinkedInIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] text-recipzee-subtle">LinkedIn</span>
                    </button>

                    <button
                      onClick={(e) => shareTo(e, 'reddit')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-recipzee-light/50 transition-colors group"
                      role="menuitem"
                      title="Share on Reddit"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FF4500] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <RedditIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] text-recipzee-subtle">Reddit</span>
                    </button>

                    <button
                      onClick={(e) => shareTo(e, 'email')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-recipzee-light/50 transition-colors group"
                      role="menuitem"
                      title="Share via Email"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] text-recipzee-subtle">Email</span>
                    </button>

                    <button
                      onClick={copyLink}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-recipzee-light/50 transition-colors group"
                      role="menuitem"
                      title="Copy Link"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${copied ? 'bg-recipzee-green' : 'bg-recipzee-light border border-recipzee-border'}`}>
                        {copied ? <Check className="w-5 h-5 text-white" /> : <LinkIcon className="w-5 h-5 text-recipzee-text" />}
                      </div>
                      <span className="text-[11px] text-recipzee-subtle">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
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

export default memo(RecipeCard)
