import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Repeat2, Wand2 } from 'lucide-react'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const RecipeCard = ({
  id,
  author, // string (e.g., authorUsername)
  title,
  description,
  imageUrl,
  likes = 0,
  isLiked = false,
  reposts = 0,
  isRepostedByCurrentUser = false,
  ingredients = [],            // can be [{ name, quantity }] or [{ globalIngredient: { name }, quantity }]
  userAllergies = [],          // array of lowercased keywords the user wants to avoid
  prepTime,                    // or prepTimeMinutes
  cookTime,                    // or cookTimeMinutes
  difficulty,                  // string: "Easy" | "Medium" | "Hard" (from backend)
  tags = ''                    // can be string "a,b" or array ["a","b"]
}) => {
  const [isLikedState, setIsLikedState] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const [isReposted, setIsReposted] = useState(isRepostedByCurrentUser)
  const [repostCount, setRepostCount] = useState(typeof reposts === 'number' ? reposts : 0)
  const navigate = useNavigate()
  const { token } = useAuth()

  // --- Normalizations ---
  const safeImg = imageUrl || '/placeholder.png'

  const tagList = Array.isArray(tags)
    ? tags.filter(t => (t || '').trim() !== '')
    : (typeof tags === 'string'
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : [])

  const prep = typeof prepTime === 'number' ? prepTime : undefined
  const cook = typeof cookTime === 'number' ? cookTime : undefined

  const lowerAllergies = (userAllergies || []).map(a => (a || '').toLowerCase().trim()).filter(Boolean)

  const ingredientNamesLower = (ingredients || []).map(i =>
    ((i?.globalIngredient?.name) ?? i?.name ?? '').toLowerCase()
  )

  const matchingAllergies = ingredientNamesLower.filter(n => lowerAllergies.includes(n))
  const hasAllergyMatch = matchingAllergies.length > 0

  const handleCardClick = () => navigate(`/recipe/${id}`)
  const handleProfileClick = (e) => {
    e.stopPropagation()
    navigate(`/profile/${author}`)
  }

  useEffect(() => setIsLikedState(isLiked), [isLiked])
  useEffect(() => setIsReposted(isRepostedByCurrentUser), [isRepostedByCurrentUser])
  useEffect(() => {
    setRepostCount(typeof reposts === 'number' && !isNaN(reposts) ? reposts : 0)
  }, [reposts])

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
    } catch (err) {
      console.error(err)
    }
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
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemixClick = () => navigate(`/remix/${id}`)

  const formatCount = (count) => {
    if (typeof count !== 'number' || isNaN(count)) return '0'
    if (count >= 1_000_000) return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
    return count.toString()
  }

  return (
    <div
      onClick={handleCardClick}
      className="relative rounded-2xl bg-platerly-card border border-platerly-border shadow-md hover:shadow-lg cursor-pointer transition"
    >
      <img
        src={safeImg}
        alt={title}
        className="w-full h-52 object-cover rounded-t-2xl"
        loading="lazy"
      />

      <div className="p-5">
        <h2 className="text-xl font-semibold text-platerly-text mb-1">{title}</h2>

        {author && (
          <p
            onClick={handleProfileClick}
            className="text-sm text-green-400 hover:underline cursor-pointer mb-2"
          >
            by {author}
          </p>
        )}

        {description && (
          <p className="text-sm text-platerly-subtle mb-2">{description}</p>
        )}

        <div className="text-sm text-platerly-subtle mb-2 flex flex-wrap gap-x-2 gap-y-1">
          {!!difficulty && (
            <span>
              <span className="font-semibold text-white">Difficulty:</span> {difficulty}
            </span>
          )}

          {(!!prep || !!cook) && (
            <span>
              <span className="font-semibold text-white">Time:</span>{' '}
              {prep ? `${prep} min prep` : ''}
              {prep && cook ? ', ' : ''}
              {cook ? `${cook} min cook` : ''}
            </span>
          )}

          {tagList.length > 0 && (
            <span>
              <span className="font-semibold text-white">Tags:</span>{' '}
              {tagList.join(', ')}
            </span>
          )}
        </div>

        {hasAllergyMatch && (
          <div className="text-sm text-red-400 font-medium mb-2">
            ⚠️ Contains: {matchingAllergies.join(', ')}
          </div>
        )}

        <div className="flex gap-6 items-center text-sm text-platerly-subtle">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleLikeToggle()
            }}
            className="flex items-center gap-1 hover:text-red-500"
          >
            <Heart className={`w-4 h-4 ${isLikedState ? 'fill-red-500 text-red-500' : ''}`} />
            {formatCount(likeCount)}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRepostToggle()
            }}
            className={`flex items-center gap-1 hover:text-green-500 ${isReposted ? 'text-green-500' : ''}`}
          >
            <Repeat2 className="w-4 h-4" />
            {formatCount(repostCount)}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemixClick()
            }}
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
