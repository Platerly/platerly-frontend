import React, { useEffect, useState } from 'react'
import { useParams,Link } from 'react-router-dom'
import SaveToCookbookSection from '../pages/SaveToCookbookSection'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'


const DIFFICULTY_MAP = { 0: 'Easy', 1: 'Medium', 2: 'Hard' }

function fmtMinutes(mins) {
  if (mins === null || mins === undefined) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr`
  return `${m} min`
}

function coerceTags(v) {
  if (!v) return []
  return Array.isArray(v)
    ? v
    : String(v).split(',').map(t => t.trim()).filter(Boolean)
}

function toMinutes(v) {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  // be forgiving if backend sends "10" or "10 min"
  const n = parseInt(String(v), 10)
  return Number.isNaN(n) ? 0 : n
}

const RecipeDetailsPage = () => {
  const { id } = useParams()
  const [recipe, setRecipe] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  const [userAllergies, setUserAllergies] = useState([])
  const [matchingAllergens, setMatchingAllergens] = useState([])
  const { token } = useAuth()
  
  // Fetch recipe & comments
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch recipe')
        const data = await res.json()
        setRecipe(data.recipe)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const fetchComments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch comments')
        const data = await res.json()
        setComments(data)
      } catch (err) {
        console.error(err)
      }
    }

    fetchRecipe()
    fetchComments()
  }, [id, token])

  // Fetch allergy list
  useEffect(() => {
    const fetchAllergies = async () => {
      if (!token) return
      try {
        const res = await fetch(`${API_BASE_URL}/api/Allergy/my-allergies`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const allergyData = await res.json()
        const lowerAllergies = allergyData.map((a) => a.toLowerCase())
        setUserAllergies(lowerAllergies)
      } catch (err) {
        console.error('Error loading allergies:', err)
      }
    }

    fetchAllergies()
  }, [token])

  // Compare recipe ingredients to allergies
  useEffect(() => {
    if (!recipe || !userAllergies.length) return

    const matched = (recipe.ingredients || [])
      .map(i => i.name?.toLowerCase())
      .filter(name => !!name && userAllergies.includes(name))

    setMatchingAllergens(matched)
  }, [recipe, userAllergies])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: id,
          content: newComment,
        }),
      })

      if (!res.ok) throw new Error('Failed to post comment')
      setNewComment('')

      const refreshed = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const updated = await refreshed.json()
      setComments(updated)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <p className="text-gray-400 p-4">Loading recipe...</p>
  if (!recipe) return <p className="text-red-500 p-4">Recipe not found.</p>

  // --- Derived fields for the info row ---
  const difficultyRaw = recipe.difficulty ?? recipe.difficultyLevel
  const difficulty = typeof difficultyRaw === 'number'
    ? (DIFFICULTY_MAP[difficultyRaw] ?? String(difficultyRaw))
    : difficultyRaw

  const prepRaw = recipe.prepTimeMinutes ?? recipe.prepMinutes ?? recipe.prepTime
  const cookRaw = recipe.cookTimeMinutes ?? recipe.cookMinutes ?? recipe.cookTime
  const prepMin = toMinutes(prepRaw)
  const cookMin = toMinutes(cookRaw)
  const prep = prepMin ? fmtMinutes(prepMin) : null
  const cook = cookMin ? fmtMinutes(cookMin) : null
  const totalFmt = (prepMin + cookMin) > 0 ? fmtMinutes(prepMin + cookMin) : null

  const tags = coerceTags(recipe.tags)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-platerly-text">
      {/* Header Image Section */}
      <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-lg">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 flex flex-col justify-end">
          <h1 className="text-4xl font-bold text-white mb-2">{recipe.title}</h1>
          <div className="flex justify-between items-center text-sm text-gray-300">
            <Link to={`/profile/${recipe.authorUsername}`} className="hover:text-platerly-green hover:underline  text-gray-300 transition-all">
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
      </div>

      {/* Info Row: Difficulty / Time / Total */}
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
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-emerald-900/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-700/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Allergy Notice */}
      {matchingAllergens.length > 0 && (
        <div className="mt-6 bg-red-900/80 border border-red-500 text-red-300 px-5 py-3 rounded-lg shadow-sm">
          ⚠️ <strong>This recipe contains allergens:</strong>{' '}
          <span className="font-semibold">{matchingAllergens.join(', ')}</span>
        </div>
      )}

      {/* Recipe Info Sections */}
      <div className="space-y-8 mt-10">
        <div>
          <h2 className="text-2xl font-semibold border-b border-platerly-border pb-2 mb-2">📍 Region</h2>
          <p className="text-gray-300">{recipe.region}</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold border-b border-platerly-border pb-2 mb-2">📝 Description</h2>
          <p className="text-gray-300">{recipe.description || 'No description provided.'}</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold border-b border-platerly-border pb-2 mb-2">📋 Instructions</h2>
          <p className="text-gray-300 whitespace-pre-line">{recipe.instructions || 'No instructions provided.'}</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold border-b border-platerly-border pb-2 mb-4">🧂 Ingredients</h2>
          <div className="flex flex-wrap gap-3">
            {(recipe.ingredients || []).map((ing, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm bg-neutral-800 border border-neutral-600 text-white"
              >
                <span className="text-green-400 font-semibold">{ing.quantity}</span> {ing.name}
              </span>
            ))}
          </div>
        </div>

        {/* Save to Cookbook (Only if user is logged in)*/}
        {token && recipe?.id && <SaveToCookbookSection recipeId={recipe.id} />}
      </div>

      {/* Comments Section (Only if user is logged in) */}
      {token && (
        <div className="mt-14 pt-10 border-t border-neutral-700 space-y-6">
          <h2 className="text-2xl font-semibold">💬 Comments</h2>

          {/* Comment box */}
          <div className="space-y-3">
            <textarea
              rows="3"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-md p-3 focus:outline-none focus:ring focus:ring-green-500"
            />
            <button
              onClick={handleSubmitComment}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition"
            >
              Post Comment
            </button>
          </div>

         {/* Existing comments */}
{comments.length === 0 ? (
  <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
) : (
  <div className="space-y-4">
    {comments.map((comment) => (
      <div key={comment.id} className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg">
        <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
          <Link
            to={`/profile/${comment.username}`}
            className="font-medium hover:text-platerly-green transition-colors"
          >
            @{comment.username}
          </Link>
          <span>{new Date(comment.createdAt).toLocaleString()}</span>
        </div>
        <p className="text-gray-200">{comment.content}</p>
      </div>
    ))}
  </div>
)}

        </div>
      )}
    </div>
  )
}

export default RecipeDetailsPage
