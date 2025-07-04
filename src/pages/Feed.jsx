import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RecipeCard from '../components/ui/RecipeCard'
import { isAuthenticated } from '../utils/auth'
import { API_BASE_URL } from '../utils/api'

const Feed = () => {
  const [recipes, setRecipes] = useState([])
  const [activeTab, setActiveTab] = useState('explore')
  const [userAllergies, setUserAllergies] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchFeed = async (tab) => {
      try {
        const token = localStorage.getItem('platerly_token')
        const res = await fetch(`${API_BASE_URL}/api/feed/${tab}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) throw new Error('Failed to fetch feed')
        const data = await res.json()
        setRecipes(data)
      } catch (err) {
        console.error(err)
      }
    }

    const fetchUserAllergies = async () => {
      try {
        const token = localStorage.getItem('platerly_token')
        const res = await fetch(`${API_BASE_URL}/api/Allergy/my-allergies`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUserAllergies(data.map(name => name.toLowerCase()))
        }
      } catch (err) {
        console.error('Failed to fetch allergies:', err)
      }
    }

    const fetchCurrentUserId = async () => {
      try {
        const token = localStorage.getItem('platerly_token')
        const res = await fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setCurrentUserId(data.id)
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err)
      }
    }

    const init = async () => {
      if (isAuthenticated()) {
        await fetchUserAllergies()
        await fetchCurrentUserId()
      }
      await fetchFeed(activeTab)
    }

    init()
  }, [activeTab])

  return (
    <div className="flex flex-col bg-platerly-dark text-platerly-text min-h-screen">

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-platerly-dark py-4 border-b border-platerly-border">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              activeTab === 'explore'
                ? 'bg-platerly-green text-white shadow'
                : 'bg-platerly-card text-platerly-subtle hover:bg-platerly-green/20'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated()) return navigate('/login')
              setActiveTab('following')
            }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              activeTab === 'following'
                ? 'bg-platerly-green text-white shadow'
                : 'bg-platerly-card text-platerly-subtle hover:bg-platerly-green/20'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-6 px-6 py-8">
        {recipes.length === 0 ? (
          <p className="text-platerly-subtle text-center">No recipes found.</p>
        ) : (
          recipes.map((recipe) => (
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
              userAllergies={userAllergies}
              userId={recipe.postedBy?.userId}
              isFollowing={recipe.isFollowing}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default Feed
