import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'

const ExploreChefsPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/User/explore`)
        const data = await res.json()
        setUsers(data)
      } catch (err) {
        console.error('Failed to fetch chefs', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 text-platerly-text">
      <h1 className="text-3xl font-bold mb-6">🍽️ Explore Chefs</h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">No public profiles available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.username}
              onClick={() => navigate(`/profile/${user.username}`)}
              className="cursor-pointer bg-platerly-card border border-platerly-border rounded-xl p-4 shadow hover:shadow-md transition"
            >
              <img
                src={user.profileImageUrl || '/default-avatar.png'}
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover mb-3"
              />
              <h2 className="text-lg font-semibold">{user.displayName}</h2>
              <p className="text-sm text-platerly-subtle">@{user.username}</p>
              <p className="text-sm text-gray-400 mt-2 line-clamp-2">{user.bio}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExploreChefsPage
