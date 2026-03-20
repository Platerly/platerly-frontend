import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Flame, TrendingUp, TrendingDown, ChefHat, Star, Filter, X, Crown, Award, Medal, Sparkles } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import TrendingRecipeCard from '../components/ui/TrendingRecipeCard'
import Button from '../components/ui/Button'
import classNames from 'classnames'

/* ---------- Trend Indicator ---------- */
const TrendIndicator = ({ delta, size = 'sm' }) => {
  if (delta === 0 || delta === undefined || delta === null) return null
  const isUp = delta > 0
  return (
    <span className={classNames(
      'inline-flex items-center gap-0.5 font-semibold',
      size === 'lg' ? 'text-sm' : 'text-xs',
      isUp ? 'text-green-400' : 'text-red-400'
    )}>
      {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {Math.abs(delta)}
    </span>
  )
}

/* ---------- Featured Recipe Card (Top 3) ---------- */
const FeaturedRecipeCard = ({ recipe, position }) => {
  const navigate = useNavigate()

  const config = {
    1: {
      icon: Crown,
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      border: 'border-yellow-500/30 hover:border-yellow-500/50',
      glow: 'hover:shadow-yellow-500/20'
    },
    2: {
      icon: Award,
      gradient: 'from-slate-300 via-gray-400 to-slate-500',
      border: 'border-gray-500/30 hover:border-gray-400/50',
      glow: 'hover:shadow-gray-400/10'
    },
    3: {
      icon: Medal,
      gradient: 'from-amber-600 via-orange-700 to-amber-800',
      border: 'border-orange-700/30 hover:border-orange-600/50',
      glow: 'hover:shadow-orange-700/15'
    },
  }

  const cfg = config[position]
  const Icon = cfg.icon

  return (
    <article
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      className={classNames(
        'group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300',
        'bg-recipzee-card border hover:shadow-2xl',
        cfg.border, cfg.glow
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={recipe.imageUrl || '/placeholder.png'}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Rank Badge */}
        <div className={classNames(
          'absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
          'bg-gradient-to-r shadow-lg',
          cfg.gradient
        )}>
          <Icon className="w-5 h-5 text-white" />
          <span className="text-white font-bold">#{position}</span>
        </div>

        {/* Trend Indicator */}
        {recipe.rankDelta !== 0 && recipe.rankDelta !== undefined && (
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
            <TrendIndicator delta={recipe.rankDelta} size="lg" />
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 break-words group-hover:text-orange-100 transition-colors">
            {recipe.title}
          </h3>
        </div>
      </div>
    </article>
  )
}

/* ---------- Skeleton Components ---------- */
const FeaturedSkeleton = () => (
  <div className="bg-recipzee-card border border-recipzee-border rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-recipzee-light" />
  </div>
)

const CardSkeleton = () => (
  <div className="flex gap-4 p-4 bg-recipzee-card border border-recipzee-border rounded-2xl animate-pulse">
    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-recipzee-light shrink-0" />
    <div className="flex-1 space-y-3 py-1">
      <div className="h-5 bg-recipzee-light rounded w-3/4" />
      <div className="h-4 bg-recipzee-light/70 rounded w-1/3" />
      <div className="h-4 bg-recipzee-light/50 rounded w-1/2" />
    </div>
  </div>
)

/* ---------- Main Component ---------- */
const TrendingPage = () => {
  const navigate = useNavigate()

  const [recipes, setRecipes] = useState([])
  const [risingStars, setRisingStars] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarLoading, setSidebarLoading] = useState(true)
  const [error, setError] = useState('')

  const [period, setPeriod] = useState('week')
  const [category, setCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const periodLabels = { today: 'Today', week: 'This Week', month: 'This Month' }
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
  ]

  // Fetch trending recipes
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const params = new URLSearchParams({ limit: '20', period })
        if (category) params.set('category', category)
        const res = await fetch(`${API_BASE_URL}/api/feed/trending-top?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (alive) setRecipes(data.items ?? [])
      } catch (err) {
        console.error('Failed to fetch trending', err)
        if (alive) setError('Could not load trending recipes.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [period, category])

  // Fetch sidebar data
  useEffect(() => {
    let alive = true
    setSidebarLoading(true)

    Promise.all([
      fetch(`${API_BASE_URL}/api/feed/rising-stars?limit=5`).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
      fetch(`${API_BASE_URL}/api/feed/trending-creators?limit=5`).then(r => r.ok ? r.json() : { creators: [] }).catch(() => ({ creators: [] }))
    ]).then(([starsData, creatorsData]) => {
      if (alive) {
        setRisingStars(starsData.items ?? [])
        setCreators(creatorsData.creators ?? [])
        setSidebarLoading(false)
      }
    })

    return () => { alive = false }
  }, [])

  const featuredRecipes = recipes.slice(0, 3)
  const otherRecipes = recipes.slice(3)

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text">
      <Helmet>
        <title>Trending Recipes — Recipzee</title>
        <meta name="description" content="Discover what's trending on Recipzee — the most liked and saved allergy-safe recipes right now, including low-nickel, gluten-free, dairy-free, and halal meals." />
        <meta property="og:title" content="Trending Recipes — Recipzee" />
        <meta property="og:description" content="Discover what's trending on Recipzee — the most liked and saved allergy-safe recipes right now, including low-nickel, gluten-free, dairy-free, and halal meals." />
        <link rel="canonical" href="https://www.recipzee.com/trending" />
      </Helmet>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-recipzee-green/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mb-5 shadow-xl shadow-orange-500/25">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Trending Now
            </span>
          </h1>
          <p className="text-recipzee-subtle max-w-xl mx-auto">
            Discover what the community is cooking. Updated based on likes, remixes, and engagement.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-recipzee-card/80 backdrop-blur-sm border border-recipzee-border rounded-2xl p-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-recipzee-dark/50 rounded-xl p-1">
              {Object.entries(periodLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={classNames(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    period === key
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                      : 'text-recipzee-subtle hover:text-recipzee-text'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="hidden sm:block">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-recipzee-dark/50 border border-recipzee-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-2 bg-recipzee-dark/50 border border-recipzee-border rounded-xl text-sm text-recipzee-subtle"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {category && (
              <button
                onClick={() => setCategory('')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium"
              >
                {categories.find(c => c.value === category)?.label}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-recipzee-border sm:hidden">
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setShowFilters(false) }}
                className="w-full bg-recipzee-dark/50 border border-recipzee-border rounded-xl px-4 py-3 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FeaturedSkeleton />
              <FeaturedSkeleton />
              <FeaturedSkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-recipzee-border bg-recipzee-card p-10 text-center max-w-md mx-auto">
            <Flame className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-recipzee-subtle mb-5">{error}</p>
            <Button onClick={() => window.location.reload()} variant="secondary">Try again</Button>
          </div>
        ) : recipes.length === 0 ? (
          <div className="rounded-2xl border border-recipzee-border bg-recipzee-card p-10 text-center max-w-md mx-auto">
            <Flame className="w-12 h-12 text-recipzee-subtle mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trending recipes yet</h3>
            <p className="text-recipzee-subtle">Check back later when more recipes gain traction.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Top 3 Featured */}
            {featuredRecipes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-bold">Top Charts</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {featuredRecipes.map((recipe, idx) => (
                    <FeaturedRecipeCard key={recipe.id} recipe={recipe} position={idx + 1} />
                  ))}
                </div>
              </section>
            )}

            {/* Main Grid + Sidebar */}
            <div className="flex gap-8">
              {/* Recipes */}
              <div className="flex-1 min-w-0">
                {otherRecipes.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-5">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <h2 className="text-lg font-bold">More Trending</h2>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {otherRecipes.map((recipe) => (
                        <TrendingRecipeCard
                          key={recipe.id}
                          id={recipe.id}
                          rank={recipe.rank}
                          title={recipe.title}
                          imageUrl={recipe.imageUrl}
                          author={recipe.username}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <aside className="hidden xl:block w-80 shrink-0 space-y-6">
                {/* Rising Stars */}
                <div className="bg-recipzee-card border border-recipzee-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-bold">Rising Stars</h3>
                  </div>

                  {sidebarLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-12 h-12 rounded-xl bg-recipzee-light" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-recipzee-light rounded w-3/4" />
                            <div className="h-3 bg-recipzee-light/70 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : risingStars.length === 0 ? (
                    <div className="text-center py-6">
                      <Sparkles className="w-8 h-8 text-recipzee-subtle mx-auto mb-2" />
                      <p className="text-sm text-recipzee-subtle">No rising stars yet</p>
                      <p className="text-xs text-recipzee-subtle/70 mt-1">New trending recipes will appear here</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {risingStars.map((recipe) => (
                        <li key={recipe.id}>
                          <button
                            onClick={() => navigate(`/recipe/${recipe.id}`)}
                            className="group w-full text-left flex gap-3 p-2 -mx-2 rounded-xl hover:bg-recipzee-light/30 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-recipzee-border">
                              <img
                                src={recipe.imageUrl || '/placeholder.png'}
                                alt={recipe.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-yellow-400 transition-colors">
                                {recipe.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-recipzee-subtle">@{recipe.username}</span>
                                <TrendIndicator delta={recipe.rankDelta} />
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Hot Creators */}
                <div className="bg-recipzee-card border border-recipzee-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ChefHat className="w-5 h-5 text-recipzee-green" />
                    <h3 className="font-bold">Hot Creators</h3>
                  </div>

                  {sidebarLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-11 h-11 rounded-full bg-recipzee-light" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-recipzee-light rounded w-2/3" />
                            <div className="h-3 bg-recipzee-light/70 rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : creators.length === 0 ? (
                    <div className="text-center py-6">
                      <ChefHat className="w-8 h-8 text-recipzee-subtle mx-auto mb-2" />
                      <p className="text-sm text-recipzee-subtle">No trending creators yet</p>
                      <p className="text-xs text-recipzee-subtle/70 mt-1">Popular chefs will appear here</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {creators.map((creator, idx) => (
                        <li key={creator.userId}>
                          <button
                            onClick={() => navigate(`/profile/${creator.username}`)}
                            className="group w-full text-left flex gap-3 p-2 -mx-2 rounded-xl hover:bg-recipzee-light/30 transition-colors"
                          >
                            <div className="relative">
                              <img
                                src={creator.profileImageUrl || '/default-avatar.svg'}
                                alt={creator.displayName}
                                className="w-11 h-11 rounded-full object-cover ring-2 ring-recipzee-border"
                                loading="lazy"
                              />
                              <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-[10px] font-bold text-white">
                                {idx + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-recipzee-green transition-colors">
                                {creator.displayName || creator.username}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-recipzee-subtle">@{creator.username}</span>
                                {creator.rankDelta > 0 && <TrendIndicator delta={creator.rankDelta} />}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => navigate('/explore-chefs')}
                    className="w-full mt-4 py-2 text-sm text-recipzee-subtle hover:text-recipzee-green transition-colors"
                  >
                    View all creators
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendingPage
