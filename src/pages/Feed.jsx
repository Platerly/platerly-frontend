import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import RecipeCard from '../components/ui/RecipeCard'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../utils/fetchWithAuth'

const SkeletonPost = () => (
  <div className="rounded-xl bg-platerly-card border border-platerly-light p-4 animate-pulse">
    <div className="w-full h-40 rounded-lg bg-platerly-light/40 mb-4" />
    <div className="h-4 w-2/3 bg-platerly-light/60 rounded mb-2" />
    <div className="h-3 w-1/2 bg-platerly-light/40 rounded mb-2" />
    <div className="h-3 w-3/4 bg-platerly-light/30 rounded" />
  </div>
)

const Feed = () => {
  const [recipes, setRecipes] = useState([])
  const [userAllergies, setUserAllergies] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [sp, setSp] = useSearchParams()
  const navigate = useNavigate()
  const { authed, token, loading: authLoading, user } = useAuth()
  const { apiFetch } = useApi()

  // Tabs
  const rawTab = sp.get('tab')
  const tab = authed && rawTab === 'following' ? 'following' : 'explore'

  const difficulty = (sp.get('difficulty') || '').trim()
  const tagsQs = (sp.get('tags') || '').trim()
  const requireAllTags = sp.get('requireAllTags') === 'true'
  const hideRemixes = sp.get('hideRemixes') === 'true'
  const hideMyAllergens = sp.get('hideMyAllergens') === 'true'

  const tags = useMemo(() => {
    if (!tagsQs) return []
    return Array.from(new Set(
      tagsQs.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    ))
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

  const buildExploreUrl = () => {
    const params = new URLSearchParams()
    if (difficulty) params.set('difficulty', difficulty)
    if (tagsQs) params.set('tags', tagsQs)
    if (requireAllTags) params.set('requireAllTags', 'true')
    if (hideRemixes) params.set('hideRemixes', 'true')
    if (hideMyAllergens) params.set('hideMyAllergens', 'true')
    return `/api/feed/explore${params.toString() ? `?${params.toString()}` : ''}`
  }

  const fetchUserAllergies = async () => {
    if (!token) return
    try {
      const res = await apiFetch('/api/Allergy/my-allergies')
      if (res.ok) {
        const data = await res.json()
        setUserAllergies(Array.isArray(data) ? data.map(n => (n || '').toLowerCase()) : [])
      }
    } catch (err) {
      console.error('Failed to fetch allergies:', err)
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
      console.error('Failed to fetch current user:', err)
    }
  }

  const fetchFeed = async () => {
    try {
      setLoading(true)
      setError('')

      const path = tab === 'explore' ? buildExploreUrl() : '/api/feed/following'
      const res = await apiFetch(path)
      if (!res.ok) throw new Error('Failed to fetch feed')
      const data = await res.json()
      setRecipes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setError('Could not load feed.')
      setRecipes([])
    } finally {
      setLoading(false)
    }
  }

  // ---------- helpers for allergen filtering ----------
  const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ')
  const variants = (s) => {
    const x = norm(s); if (!x) return []
    const out = new Set([x])
    if (x.endsWith('s')) out.add(x.slice(0, -1)); else out.add(`${x}s`)
    return Array.from(out)
  }
  const isSevere = (s) => {
    const x = String(s || '').toLowerCase()
    return x === 'high' || x === 'medium'
  }

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

  // Main effect: wait for auth rehydration; re-run when token/authed change
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      // Wait until AuthContext has finished loading (rehydration from storage/refresh)
      if (authLoading) return

      if (!cancelled) {
        if (token) {
          await Promise.all([fetchUserAllergies(), fetchCurrentUserId()])
        } else {
          setUserAllergies([])
          setCurrentUserId(null)
        }
        await fetchFeed()
      }
    }

    init()
    return () => { cancelled = true }
    // include token/authed/authLoading so first page load picks up auth state
  }, [
    tab,
    difficulty,
    tagsQs,
    requireAllTags,
    hideRemixes,
    hideMyAllergens,
    token,
    authed,
    authLoading
  ])

  const renderList = tab === 'following' ? filteredFollowing : recipes

  return (
    <div className="flex flex-col bg-platerly-dark text-platerly-text min-h-screen">
      {/* Sticky tabs */}
      <div className="sticky top-0 z-20 bg-platerly-dark/95 backdrop-blur py-3 border-b border-platerly-light">
        <div className="max-w-4xl mx-auto px-4 flex justify-center gap-3 sm:gap-4">
          <button
            onClick={goExplore}
            className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-platerly-green/40
              ${tab === 'explore'
                ? 'bg-platerly-green text-platerly-dark shadow'
                : 'bg-platerly-card text-platerly-subtle md:hover:bg-platerly-green/20'}`}
          >
            Explore
          </button>

          {authed && (
            <button
              onClick={goFollowing}
              className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-platerly-green/40
                ${tab === 'following'
                  ? 'bg-platerly-green text-platerly-dark shadow'
                  : 'bg-platerly-card text-platerly-subtle md:hover:bg-platerly-green/20'}`}
            >
              Following
            </button>
          )}
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
          <div className="rounded-xl border border-platerly-light bg-platerly-card p-6 text-center">
            <p className="text-platerly-subtle">{error}</p>
            <button
              onClick={fetchFeed}
              className="mt-4 inline-flex items-center rounded-md bg-platerly-green text-platerly-dark px-4 py-2 hover:opacity-90"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !authLoading && !error && renderList.length === 0 && (
          <div className="rounded-xl border border-platerly-light bg-platerly-card p-6 text-center">
            <p className="text-platerly-subtle">No recipes found.</p>
          </div>
        )}

        {!loading && !authLoading && !error && renderList.map((recipe) => (
          <RecipeCard
            key={`${recipe.recipeId}-${recipe.type || 'original'}`}
            id={recipe.recipeId}
            author={recipe.authorUsername}
            title={recipe.title}
            description={recipe.description}
            imageUrl={recipe.imageUrl}
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
          />
        ))}
      </div>
    </div>
  )
}

export default Feed
