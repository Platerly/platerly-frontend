/**
 * RecipeLineage.jsx — Collapsible "Recipe Evolution" panel for a recipe detail page.
 *
 * Layer: Feature / recipe detail.
 *
 * Shows the remix ancestry chain and direct remixes of a given recipe.
 * Content is fetched lazily — only when the user expands the panel.
 *
 * API calls (both fired in parallel on expand):
 *   GET /api/Recipe/:id/lineage  — ordered ancestor chain (oldest first)
 *   GET /api/Recipe/:id/remixes  — direct child remixes
 *
 * Premium gate:
 *   - Free users see a blurred skeleton with an upgrade overlay instead of the
 *     real lineage tree.  The fetch still fires (so the "original recipe" empty
 *     state works for premium), but the blurred overlay prevents free users from
 *     reading the data.
 *   - Premium badge is shown in the header for non-premium users.
 *
 * Colour coding (HoloDot):
 *   - amber  — original (root) recipe
 *   - blue   — intermediate ancestor
 *   - green  — current recipe being viewed
 *
 * Props:
 *   @prop {string|number} recipeId    — The recipe to load lineage for.
 *   @prop {boolean}       isRemix     — Whether this recipe was remixed from another.
 *   @prop {number}        [remixCount=0] — Number of direct remixes (for the sub-heading).
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GitBranch, Crown, ChevronRight, User, Calendar, Sparkles, Lock } from 'lucide-react'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { usePremium } from '../../hooks/usePremium'
import logger from '../../utils/logger'

const cx = (...a) => a.filter(Boolean).join(' ')

// Holo dot component matching meal planner style
const HoloDot = ({ color = 'green', size = 'md' }) => {
  const sizes = {
    sm: { main: 'w-2 h-2', mid: 'w-1.5 h-1.5', small: 'w-1 h-1' },
    md: { main: 'w-3 h-3', mid: 'w-2 h-2', small: 'w-1.5 h-1.5' },
    lg: { main: 'w-4 h-4', mid: 'w-2.5 h-2.5', small: 'w-1.5 h-1.5' }
  }
  const s = sizes[size] || sizes.md

  const colors = {
    green: {
      main: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8),0_0_24px_rgba(52,211,153,0.4)]',
      mid: 'bg-emerald-300/70',
      small: 'bg-emerald-200/50'
    },
    purple: {
      main: 'bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8),0_0_24px_rgba(192,132,252,0.4)]',
      mid: 'bg-purple-300/70',
      small: 'bg-purple-200/50'
    },
    blue: {
      main: 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8),0_0_24px_rgba(96,165,250,0.4)]',
      mid: 'bg-blue-300/70',
      small: 'bg-blue-200/50'
    },
    amber: {
      main: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8),0_0_24px_rgba(251,191,36,0.4)]',
      mid: 'bg-amber-300/70',
      small: 'bg-amber-200/50'
    }
  }
  const c = colors[color] || colors.green

  return (
    <span className="flex items-center flex-shrink-0">
      <span className={cx(s.main, 'rounded-full', c.main)} />
      <span className={cx(s.mid, 'rounded-full ml-0.5', c.mid)} />
      <span className={cx(s.small, 'rounded-full ml-0.5', c.small)} />
    </span>
  )
}

const RecipeLineage = ({ recipeId, isRemix, remixCount = 0 }) => {
  const { token } = useAuth()
  const { isPremium } = usePremium()
  const [lineage, setLineage] = useState([])
  const [remixes, setRemixes] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Fetch lineage data
  useEffect(() => {
    if (!expanded) return

    const fetchLineage = async () => {
      setLoading(true)
      try {
        const [lineageRes, remixesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/Recipe/${recipeId}/lineage`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }),
          fetch(`${API_BASE_URL}/api/Recipe/${recipeId}/remixes`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
        ])

        if (lineageRes.ok) {
          const data = await lineageRes.json()
          setLineage(Array.isArray(data) ? data : [])
        }

        if (remixesRes.ok) {
          const data = await remixesRes.json()
          setRemixes(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        logger.error('Failed to fetch lineage', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLineage()
  }, [recipeId, token, expanded])

  const hasLineage = lineage.length > 1
  const hasRemixes = remixes.length > 0

  return (
    <div className="rounded-2xl border border-recipzee-border bg-gradient-to-br from-recipzee-card via-recipzee-card to-purple-900/10 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-recipzee-text flex items-center gap-2">
              Recipe Evolution
              {!isPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              )}
            </h3>
            <p className="text-sm text-recipzee-subtle">
              {isRemix && 'This recipe was remixed from another'}
              {isRemix && remixCount > 0 && ' • '}
              {remixCount > 0 && `${remixCount} remix${remixCount !== 1 ? 'es' : ''}`}
              {!isRemix && remixCount === 0 && 'See how recipes evolve through community remixes'}
            </p>
          </div>
        </div>
        <ChevronRight className={cx(
          'w-5 h-5 text-recipzee-muted transition-transform duration-300',
          expanded && 'rotate-90'
        )} />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-recipzee-border">
          {loading ? (
            <div className="px-5 py-8 flex items-center justify-center">
              <div className="flex items-center gap-3 text-recipzee-subtle">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading evolution...</span>
              </div>
            </div>
          ) : isPremium ? (
            /* Premium: Full Lineage View */
            <div className="p-5">
              {/* Ancestry Chain */}
              {hasLineage && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <HoloDot color="purple" size="sm" />
                    <span className="text-sm font-medium text-recipzee-subtle uppercase tracking-wider">Ancestry</span>
                  </div>

                  <div className="relative pl-6">
                    {/* Vertical line */}
                    <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gradient-to-b from-purple-500/50 via-blue-500/50 to-emerald-500/50" />

                    {/* Scrollable ancestry list - shows ~2 items */}
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-recipzee-border scrollbar-track-transparent">
                      {lineage.map((recipe, index) => {
                        const isCurrent = recipe.id === recipeId || recipe.recipeId === recipeId
                        const isOriginal = index === 0
                        const dotColor = isOriginal ? 'amber' : isCurrent ? 'green' : 'blue'
                        const username = recipe.authorUsername || recipe.username

                        return (
                          <div
                            key={recipe.id || recipe.recipeId || index}
                            className={cx(
                              'relative flex items-start gap-4 p-3 rounded-xl transition-all',
                              isCurrent
                                ? 'bg-emerald-500/10 border border-emerald-500/30'
                                : 'hover:bg-white/5'
                            )}
                          >
                            {/* Node dot */}
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                              <HoloDot color={dotColor} size="md" />
                            </div>

                            {/* Recipe card */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Link to={`/recipe/${recipe.id || recipe.recipeId}`} className="flex-shrink-0">
                                {recipe.imageUrl ? (
                                  <img
                                    src={recipe.imageUrl}
                                    alt=""
                                    className="w-14 h-14 rounded-lg object-cover hover:ring-2 hover:ring-purple-400/50 transition-all"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-recipzee-border flex items-center justify-center hover:ring-2 hover:ring-purple-400/50 transition-all">
                                    <Sparkles className="w-6 h-6 text-recipzee-muted" />
                                  </div>
                                )}
                              </Link>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {isOriginal && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                                      Original
                                    </span>
                                  )}
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <Link to={`/recipe/${recipe.id || recipe.recipeId}`}>
                                  <h4 className="font-semibold text-recipzee-text truncate mt-1 hover:text-purple-300 transition-colors">
                                    {recipe.title}
                                  </h4>
                                </Link>
                                <div className="flex items-center gap-3 mt-1 text-xs text-recipzee-subtle">
                                  {username ? (
                                    <Link
                                      to={`/profile/${username}`}
                                      className="flex items-center gap-1 hover:text-purple-300 transition-colors"
                                    >
                                      <User className="w-3 h-3" />
                                      @{username}
                                    </Link>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      @unknown
                                    </span>
                                  )}
                                  {recipe.createdAt && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(recipe.createdAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Remixes (Children) */}
              {hasRemixes && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <HoloDot color="green" size="sm" />
                    <span className="text-sm font-medium text-recipzee-subtle uppercase tracking-wider">
                      Remixes ({remixes.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {remixes.slice(0, 6).map((remix, index) => {
                      const remixUsername = remix.username || remix.authorUsername
                      return (
                        <div
                          key={remix.id || index}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <Link to={`/recipe/${remix.id}`} className="flex-shrink-0">
                            {remix.imageUrl ? (
                              <img
                                src={remix.imageUrl}
                                alt=""
                                className="w-12 h-12 rounded-lg object-cover hover:ring-2 hover:ring-green-400/50 transition-all"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-recipzee-border flex items-center justify-center hover:ring-2 hover:ring-green-400/50 transition-all">
                                <Sparkles className="w-5 h-5 text-recipzee-muted" />
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to={`/recipe/${remix.id}`}>
                              <h4 className="font-medium text-recipzee-text text-sm truncate hover:text-green-300 transition-colors">
                                {remix.title}
                              </h4>
                            </Link>
                            {remixUsername ? (
                              <Link
                                to={`/profile/${remixUsername}`}
                                className="text-xs text-recipzee-subtle hover:text-green-300 transition-colors"
                              >
                                by @{remixUsername}
                              </Link>
                            ) : (
                              <p className="text-xs text-recipzee-subtle">
                                by @unknown
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {remixes.length > 6 && (
                    <p className="text-center text-sm text-recipzee-subtle mt-3">
                      +{remixes.length - 6} more remixes
                    </p>
                  )}
                </div>
              )}

              {!hasLineage && !hasRemixes && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-recipzee-text mb-2">Original Recipe</h4>
                  <p className="text-sm text-recipzee-subtle mb-4">
                    This recipe hasn't been remixed yet. Be the first to put your own spin on it!
                  </p>
                  <Link
                    to={`/remix/${recipeId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-medium hover:bg-purple-500/30 transition-colors"
                  >
                    <GitBranch className="w-4 h-4" />
                    Remix This Recipe
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Free: Teaser with upgrade prompt */
            <div className="p-5">
              {/* Blurred preview */}
              <div className="relative">
                <div className="blur-sm opacity-50 pointer-events-none">
                  <div className="flex items-center gap-2 mb-4">
                    <HoloDot color="purple" size="sm" />
                    <span className="text-sm font-medium text-recipzee-subtle uppercase tracking-wider">Ancestry</span>
                  </div>
                  <div className="space-y-3 pl-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <div className="w-14 h-14 rounded-lg bg-recipzee-border" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-recipzee-border rounded" />
                          <div className="h-3 w-24 bg-recipzee-border rounded mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6 rounded-2xl bg-recipzee-card/95 border border-amber-500/30 shadow-2xl max-w-sm">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-7 h-7 text-amber-400" />
                    </div>
                    <h4 className="text-lg font-bold text-recipzee-text mb-2">
                      Unlock Recipe Evolution
                    </h4>
                    <p className="text-sm text-recipzee-subtle mb-4">
                      See how this recipe evolved from its original, explore the full lineage tree, and discover all community remixes.
                    </p>
                    <Link
                      to="/settings?tab=subscription"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-recipzee-dark font-semibold hover:brightness-110 transition-all"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to Premium
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RecipeLineage
