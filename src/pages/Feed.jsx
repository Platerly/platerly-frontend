/**
 * Feed
 *
 * Layer: Main social feed — the home screen for logged-in users.
 * Route: /feed (query params: tab, difficulty, recipeType, tags, requireAllTags,
 *               hideRemixes, hideMyAllergens)
 *
 * What this page does:
 *  - Two tabs: "Explore" (all public recipes, server-filtered) and
 *    "Following" (recipes from accounts the user follows, client-filtered)
 *  - Explore tab: filters are passed as query params to GET /api/feed/explore
 *  - Following tab: full list is fetched, then filtered client-side because the
 *    following endpoint does not support server-side filter params
 *  - Infinite scroll via IntersectionObserver on a sentinel div at the bottom
 *  - Recipe type pill filter row displayed under the sticky tab bar
 *
 * Feed fetch note — onClick={() => fetchFeed()} vs onClick={fetchFeed}:
 *  The "Try again" button uses `onClick={() => fetchFeed()}` (arrow wrapper) deliberately.
 *  If written as `onClick={fetchFeed}`, React passes the SyntheticEvent object as the
 *  first argument, which would be received as `pageNum`, causing fetchFeed to try to
 *  build a URL with pageNum = [object Object] instead of the default value of 1.
 *
 * State managed:
 *  - recipes — current page of loaded recipe cards
 *  - userAllergies — cached in sessionStorage (rz_allergies_v1) for in-session reuse
 *  - tab, difficulty, recipeType, tags, hideRemixes, hideMyAllergens — URL search params
 *  - page, hasMore, loading, loadingMore — pagination / infinite scroll state
 */
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import RecipeCard from '../components/ui/RecipeCard'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../utils/fetchWithAuth'
import { norm, variants, isSevere } from '../utils/allergenHelpers'
import { logger } from '../utils/logger'

const PAGE_SIZE = 20

const SkeletonPost = () => (
  <div className="rounded-xl bg-recipzee-card border border-recipzee-light p-4 animate-pulse">
    <div className="w-full h-40 rounded-lg bg-recipzee-light/40 mb-4" />
    <div className="h-4 w-2/3 bg-recipzee-light/60 rounded mb-2" />
    <div className="h-3 w-1/2 bg-recipzee-light/40 rounded mb-2" />
    <div className="h-3 w-3/4 bg-recipzee-light/30 rounded" />
  </div>
)

/** @returns {JSX.Element} */
const Feed = () => {
  const [recipes, setRecipes] = useState([])
  const [userAllergies, setUserAllergies] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loaderRef = useRef(null)
  const [sp, setSp] = useSearchParams()
  const navigate = useNavigate()
  const { authed, token, loading: authLoading } = useAuth()
  const { apiFetch } = useApi()

  // Active tab: "explore" is the default; "following" requires auth
  // Unauthenticated users trying to access ?tab=following silently fall back to explore
  const rawTab = sp.get('tab')
  const tab = authed && rawTab === 'following' ? 'following' : 'explore'

  const difficulty = (sp.get('difficulty') || '').trim()
  const recipeType = (sp.get('recipeType') || '').trim()
  const tagsQs = (sp.get('tags') || '').trim()
  const requireAllTags = sp.get('requireAllTags') === 'true'
  const hideRemixes = sp.get('hideRemixes') === 'true'
  const hideMyAllergens = sp.get('hideMyAllergens') === 'true'

  const RECIPE_TYPES = ['', 'Meal', 'Shake', 'Dessert', 'Snack', 'Appetizer', 'Side', 'Beverage']

  const tags = useMemo(() => {
    if (!tagsQs) return []
    return Array.from(new Set(tagsQs.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)))
  }, [tagsQs])

  const updateParams = (updates) => {
    const next = new URLSearchParams(sp)
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || v === false) next.delete(k)
      else next.set(k, String(v))
    })
    setSp(next, { replace: true })
  }

  const goExplore = () => updateParams({ tab: 'explore' })
  const goFollowing = () => {
    if (!authed) return navigate('/login')
    updateParams({ tab: 'following' })
  }

  const buildExploreUrl = (pageNum) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('pageSize', String(PAGE_SIZE))
    if (difficulty) params.set('difficulty', difficulty)
    if (recipeType) params.set('recipeType', recipeType)
    if (tagsQs) params.set('tags', tagsQs)
    if (requireAllTags) params.set('requireAllTags', 'true')
    if (hideRemixes) params.set('hideRemixes', 'true')
    if (hideMyAllergens) params.set('hideMyAllergens', 'true')
    return `/api/feed/explore?${params.toString()}`
  }

  const fetchUserAllergies = async () => {
    if (!token) return
    const cacheKey = 'rz_allergies_v1'
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        setUserAllergies(JSON.parse(cached))
        return
      }
      const res = await apiFetch('/api/Allergy/my-allergies')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data.map(n => (n || '').toLowerCase()) : []
        setUserAllergies(list)
        sessionStorage.setItem(cacheKey, JSON.stringify(list))
      }
    } catch (err) {
      logger.error('Failed to fetch allergies', err)
    }
  }

  const fetchCurrentUserId = async () => {
    if (!token) return
    try {
      const res = await apiFetch('/api/User/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUserId(data?.id || null)
      }
    } catch (err) {
      logger.error('Failed to fetch current user', err)
    }
  }

  const fetchFeed = async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setRecipes([])
      }
      setError('')

      const path = tab === 'explore'
        ? buildExploreUrl(pageNum)
        : `/api/feed/following?page=${pageNum}&pageSize=${PAGE_SIZE}`
      const res = await apiFetch(path)
      if (!res.ok) throw new Error('Failed to fetch feed')
      const data = await res.json()
      const newRecipes = Array.isArray(data) ? data : []

      if (append) {
        setRecipes(prev => [...prev, ...newRecipes])
      } else {
        setRecipes(newRecipes)
      }

      setHasMore(newRecipes.length >= PAGE_SIZE)
    } catch (err) {
      logger.error('Feed fetch failed', err)
      if (!append) {
        setError('Could not load feed.')
        setRecipes([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchFeed(nextPage, true)
  }, [page, loadingMore, hasMore, tab, difficulty, recipeType, tagsQs, requireAllTags, hideRemixes, hideMyAllergens])

  // Allergen helpers imported from utils/allergenHelpers.js

  const getIngredientNames = (r) => {
    if (Array.isArray(r.ingredientNames)) return r.ingredientNames
    if (Array.isArray(r.ingredients)) {
      return r.ingredients.map(i => (i?.globalIngredient?.name || i?.name || '')).filter(Boolean)
    }
    return []
  }

  const hasSevereAllergen = (r) => {
    const sevMap = r?.matchedAllergenSeverity
    if (!sevMap || typeof sevMap !== 'object') return false

    const severeKeys = new Set()
    for (const [k, v] of Object.entries(sevMap)) {
      if (k && isSevere(v)) severeKeys.add(norm(k))
    }
    if (severeKeys.size === 0) return false

    const names = getIngredientNames(r)
    for (const n of names) {
      for (const v of variants(n)) {
        if (severeKeys.has(v)) return true
      }
    }
    return false
  }

  const filteredFollowing = useMemo(() => {
    if (tab !== 'following') return recipes

    let list = recipes
    if (hideRemixes) list = list.filter(r => !r.isRemix)
    if (difficulty) list = list.filter(r => (r.difficulty || '').toLowerCase() === difficulty.toLowerCase())

    if (tags.length > 0) {
      list = list.filter(r => {
        const recipeTags = Array.isArray(r.tags) ? r.tags.map(t => (t || '').toLowerCase()) : []
        return requireAllTags
          ? tags.every(t => recipeTags.some(rt => rt.includes(t)))
          : tags.some(t => recipeTags.some(rt => rt.includes(t)))
      })
    }

    if (hideMyAllergens) {
      list = list.filter(r => !hasSevereAllergen(r))
    }

    return list
  }, [tab, recipes, hideRemixes, difficulty, tags, requireAllTags, hideMyAllergens])

  // Reset pagination when filters/tab change
  useEffect(() => {
    setPage(1)
    setHasMore(true)
  }, [tab, difficulty, recipeType, tagsQs, requireAllTags, hideRemixes, hideMyAllergens])

  // Main effect
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (authLoading) return
      if (cancelled) return

      if (token) {
        await Promise.all([fetchUserAllergies(), fetchCurrentUserId()])
      } else {
        setUserAllergies([])
        setCurrentUserId(null)
      }

      await fetchFeed(1, false)
    }

    init()
    return () => { cancelled = true }
  }, [
    tab,
    difficulty,
    recipeType,
    tagsQs,
    requireAllTags,
    hideRemixes,
    hideMyAllergens,
    token,
    authed,
    authLoading
  ])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadMore])

  const renderList = tab === 'following' ? filteredFollowing : recipes

  return (
    <div className="flex flex-col bg-recipzee-dark text-recipzee-text min-h-screen">
      <Helmet>
        <title>Explore Allergen-Aware Recipes — Recipzee</title>
        <meta name="description" content="Browse thousands of allergen-aware recipes on Recipzee — low-nickel, gluten-free, dairy-free, halal, vegan and more. Filter by your allergen profile and make informed food choices." />
        <meta property="og:title" content="Explore Allergen-Aware Recipes — Recipzee" />
        <meta property="og:description" content="Browse thousands of allergen-aware recipes on Recipzee — low-nickel, gluten-free, dairy-free, halal, vegan and more." />
        <link rel="canonical" href="https://recipzee.com/feed" />
      </Helmet>
      {/* Sticky tabs */}
      <div className="sticky top-0 z-20 bg-recipzee-dark/95 backdrop-blur py-3 border-b border-recipzee-light">
        <div className="max-w-4xl mx-auto px-4 flex justify-center gap-2 sm:gap-4">
          <button
            onClick={goExplore}
            className={`px-5 sm:px-6 py-2.5 sm:py-2 rounded-full text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 active:scale-95
              ${tab === 'explore'
                ? 'bg-recipzee-green text-recipzee-dark shadow'
                : 'bg-recipzee-card text-recipzee-subtle active:bg-recipzee-light'}`}
          >
            Explore
          </button>

          {authed && (
            <button
              onClick={goFollowing}
              className={`px-5 sm:px-6 py-2.5 sm:py-2 rounded-full text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 active:scale-95
                ${tab === 'following'
                  ? 'bg-recipzee-green text-recipzee-dark shadow'
                  : 'bg-recipzee-card text-recipzee-subtle active:bg-recipzee-light'}`}
            >
              Following
            </button>
          )}
        </div>
      </div>

      {/* Recipe type filter */}
      <div className="max-w-4xl mx-auto pt-4 px-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {RECIPE_TYPES.map(type => (
            <button
              key={type || 'all'}
              onClick={() => updateParams({ recipeType: type || undefined })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition active:scale-95
                ${recipeType === type || (!recipeType && !type)
                  ? 'bg-recipzee-green text-recipzee-dark'
                  : 'bg-recipzee-card text-recipzee-subtle active:bg-recipzee-light'}`}
            >
              {type || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Feed content */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {(loading || authLoading) && (
          <div className="grid grid-cols-1 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonPost key={i} />)}
          </div>
        )}

        {!loading && !authLoading && error && (
          <div className="rounded-xl border border-recipzee-light bg-recipzee-card p-6 text-center">
            <p className="text-recipzee-subtle">{error}</p>
            <button
              // Arrow wrapper is intentional: onClick={fetchFeed} would pass the
              // SyntheticEvent as `pageNum`, producing a broken API URL.
              onClick={() => fetchFeed()}
              className="mt-4 inline-flex items-center rounded-md bg-recipzee-green text-recipzee-dark px-4 py-2 hover:opacity-90"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !authLoading && !error && renderList.length === 0 && (
          <div className="rounded-xl border border-recipzee-light bg-recipzee-card p-6 text-center">
            <p className="text-recipzee-subtle">No recipes found.</p>
          </div>
        )}

        {!loading && !authLoading && !error && renderList.map((recipe) => {
          const rid = recipe?.recipeId ?? recipe?.id
          if (!rid) {
            // If this ever happens, your API is returning an unexpected shape.
            // We skip rendering to avoid React key collisions.
            return null
          }

          return (
            <RecipeCard
              key={`${rid}-${recipe.type || 'original'}`}
              id={rid}
              author={recipe.authorUsername}
              title={recipe.title}
              description={recipe.description}
              imageUrl={recipe.imageUrl}
              photoCredit={recipe.photoCredit}
              photoCreditUrl={recipe.photoCreditUrl}
              likes={recipe.likes}
              isLiked={recipe.isLikedByCurrentUser}
              reposts={recipe.repostCount}
              isRepostedByCurrentUser={recipe.isRepostedByCurrentUser}
              ingredients={recipe.ingredients}
              ingredientNames={recipe.ingredientNames}
              allergenMatches={recipe.allergenMatches}
              matchedAllergenTerms={recipe.matchedAllergenTerms}
              userAllergies={userAllergies}
              allergenSeverity={recipe.matchedAllergenSeverity}
              userId={recipe.postedBy?.userId}
              isFollowing={recipe.isFollowing}
              currentUserId={currentUserId}
              prepTime={recipe.prepTimeMinutes}
              cookTime={recipe.cookTimeMinutes}
              difficulty={recipe.difficulty}
              tags={recipe.tags}
              slug={recipe.slug}
              authorUsername={recipe.authorUsername}
            />
          )
        })}

        {/* Infinite scroll loader */}
        {!loading && !authLoading && !error && renderList.length > 0 && (
          <div ref={loaderRef} className="py-8 flex justify-center">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-recipzee-subtle">
                <div className="w-5 h-5 border-2 border-recipzee-green border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            ) : hasMore ? (
              <div className="h-10" />
            ) : (
              <p className="text-sm text-recipzee-subtle">You've reached the end</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Feed
