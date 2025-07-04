import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Repeat2, Wand2 } from 'lucide-react'
import { API_BASE_URL } from '../../utils/api'

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
  ingredients = [],
  userAllergies = [],
}) => {
  const [isLikedState, setIsLikedState] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const [isReposted, setIsReposted] = useState(isRepostedByCurrentUser)
  const [repostCount, setRepostCount] = useState(typeof reposts === 'number' ? reposts : 0)
  const navigate = useNavigate()

  const handleCardClick = () => navigate(`/recipe/${id}`)
  const handleProfileClick = (e) => {
    e.stopPropagation()
    navigate(`/profile/${author}`)
  }

  const matchingAllergies = ingredients
    .map(i => i.name?.toLowerCase())
    .filter(name => userAllergies.includes(name))
  const hasAllergyMatch = matchingAllergies.length > 0

  useEffect(() => setIsLikedState(isLiked), [isLiked])
  useEffect(() => setIsReposted(isRepostedByCurrentUser), [isRepostedByCurrentUser])
  useEffect(() => {
    setRepostCount(typeof reposts === 'number' && !isNaN(reposts) ? reposts : 0)
  }, [reposts])

  const handleLikeToggle = async () => {
    const token = localStorage.getItem('platerly_token')
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
    const token = localStorage.getItem('platerly_token')
    const intendedToUnrepost = isReposted

    try {
      const response = await fetch(`${API_BASE_URL}/api/Recipe/${id}/repost`, {
        method: intendedToUnrepost ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (intendedToUnrepost && response.status === 404) {
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
        src={imageUrl}
        alt={title}
        className="w-full h-52 object-cover rounded-t-2xl"
      />
      <div className="p-5">
        <h2 className="text-xl font-semibold text-platerly-text mb-1">{title}</h2>

        <p
          onClick={handleProfileClick}
          className="text-sm text-green-400 hover:underline cursor-pointer mb-2"
        >
          by {author}
        </p>

        <p className="text-sm text-platerly-subtle mb-2">{description}</p>

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
