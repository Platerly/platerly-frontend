import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'

const UserProfilePage = () => {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [cookbooks, setCookbooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [userRes, cookbooksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/user/profile/${username}`),
          fetch(`${API_BASE_URL}/api/user/profile/${username}/cookbooks`)
        ])

        if (!userRes.ok || !cookbooksRes.ok) throw new Error('Failed to load profile.')

        const userData = await userRes.json()
        setProfile(userData.user)
        setRecipes(userData.recipes)
        setCookbooks(await cookbooksRes.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [username])

  if (loading) return <p className="text-center text-gray-400 py-6">Loading profile...</p>
  if (!profile) return <p className="text-center text-red-400 py-6">User not found.</p>

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 text-white space-y-10">
      {/* Profile header */}
      <div className="flex items-center gap-6">
        {profile.profileImageUrl ? (
          <img
            src={profile.profileImageUrl}
            alt={`${profile.username} avatar`}
            className="w-20 h-20 rounded-full object-cover border border-neutral-700"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-neutral-700 flex items-center justify-center text-2xl font-bold">
            {profile.username[0].toUpperCase()}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold">@{profile.username}</h1>
          <p className="text-platerly-subtle">{profile.displayName}</p>
          {profile.bio && <p className="mt-2 text-gray-300 text-sm">{profile.bio}</p>}
        </div>
      </div>

      {/* Public Cookbooks */}
      {cookbooks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">📚 Public Cookbooks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cookbooks.map(cb => (
              <Link to={`/cookbook/${cb.id}`} key={cb.id} className="block bg-neutral-900 rounded-xl border border-neutral-800 p-4 hover:bg-neutral-800 transition">
                <h3 className="text-lg font-semibold text-platerly-text mb-1">{cb.title}</h3>
                <p className="text-xs text-platerly-subtle">
                  Created {new Date(cb.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posted Recipes */}
      {recipes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">🍽️ Recipes</h2>
          <div className="grid gap-4">
            {recipes.map(recipe => (
              <Link
                key={recipe.recipeId}
                to={`/recipe/${recipe.recipeId}`}
                className="block bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:bg-neutral-800 transition"
              >
                <h3 className="font-bold text-platerly-text">{recipe.title}</h3>
                <p className="text-sm text-platerly-subtle line-clamp-2">{recipe.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfilePage
