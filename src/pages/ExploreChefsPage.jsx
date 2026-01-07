import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'

const SkeletonCard = () => (
  <div className="bg-platerly-card border border-platerly-light rounded-xl p-4 shadow">
    <div className="animate-pulse">
      <div className="w-16 h-16 rounded-full bg-platerly-light/50 mb-3" />
      <div className="h-4 bg-platerly-light/60 rounded w-3/5 mb-2" />
      <div className="h-3 bg-platerly-light/40 rounded w-2/5 mb-3" />
      <div className="h-3 bg-platerly-light/30 rounded w-full mb-1" />
      <div className="h-3 bg-platerly-light/30 rounded w-4/5" />
    </div>
  </div>
)

const ExploreChefsPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/User/explore`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (alive) {
          setUsers(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Failed to fetch chefs', err)
        if (alive) setError('Could not load chefs right now.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const onCardKeyDown = (e, username) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/profile/${username}`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-platerly-text">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">🍽️ Explore Chefs</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-platerly-light bg-platerly-card p-6">
          <p className="text-platerly-subtle"> {error} </p>
          <button
            onClick={() => { setLoading(true); setError(''); window.location.reload() }}
            className="mt-4 inline-flex items-center rounded-md bg-platerly-green text-platerly-dark px-4 py-2 hover:opacity-90"
          >
            Try again
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-platerly-light bg-platerly-card p-6">
          <p className="text-platerly-subtle">No public profiles available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {users.map((user) => {
            const username = user.username || 'user'
            const displayName = user.displayName || username
            const bio = user.bio || ''
            const avatar = user.profileImageUrl || '/default-avatar.svg'

            return (
              <div
                key={username}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/profile/${username}`)}
                onKeyDown={(e) => onCardKeyDown(e, username)}
                className="cursor-pointer bg-platerly-card border border-platerly-light rounded-xl p-4 shadow transition
                           focus:outline-none focus:ring-2 focus:ring-platerly-green/40
                           md:hover:shadow-md md:hover:-translate-y-0.5 md:transition-transform"
                aria-label={`Open profile for ${displayName}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={avatar}
                    alt={`${displayName} avatar`}
                    loading="lazy"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-platerly-light"
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold truncate">{displayName}</h2>
                    <p className="text-sm text-platerly-subtle truncate">@{username}</p>
                  </div>
                </div>

                {bio ? (
                  <p className="text-sm text-platerly-subtle/90 line-clamp-2">
                    {bio}
                  </p>
                ) : (
                  <p className="text-sm text-platerly-subtle/70 italic">No bio yet.</p>
                )}

                {/* footer (optional future: counts/follow button) */}
                {/* <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-platerly-subtle">123 followers</span>
                  <button className="text-sm px-3 py-1.5 rounded-md border border-platerly-light hover:bg-platerly-light/40">
                    Follow
                  </button>
                </div> */}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ExploreChefsPage
