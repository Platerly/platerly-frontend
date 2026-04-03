/**
 * ExploreChefsPage
 *
 * Layer: Public chef/user discovery page.
 * Route: /explore-chefs
 *
 * Fetches GET /api/User/explore and displays a grid of chef cards.
 * Each card shows the chef's avatar, name, recipe count, and a "View Profile" button.
 * The list is read-only and unauthenticated — no follow action here.
 */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Users, ArrowRight } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import Button from '../components/ui/Button'

const SkeletonCard = () => (
  <div className="bg-recipzee-card border border-recipzee-border rounded-2xl p-5 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 rounded-full bg-recipzee-light" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-recipzee-light rounded-lg w-3/4" />
        <div className="h-4 bg-recipzee-light/70 rounded-lg w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-recipzee-light/50 rounded w-full" />
      <div className="h-3 bg-recipzee-light/50 rounded w-4/5" />
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
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-recipzee-green/5 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-recipzee-green/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-recipzee-green" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Explore Chefs</h1>
          </div>
          <p className="text-recipzee-subtle">Discover talented home cooks and follow their culinary journey</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-recipzee-border bg-recipzee-card p-8 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-recipzee-subtle mb-4">{error}</p>
            <Button
              onClick={() => { setLoading(true); setError(''); window.location.reload() }}
              variant="secondary"
            >
              Try again
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-recipzee-border bg-recipzee-card p-8 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-recipzee-light flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-7 h-7 text-recipzee-subtle" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No chefs yet</h3>
            <p className="text-recipzee-subtle">Public profiles will appear here once available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {users.map((user) => {
              const username = user.username || 'user'
              const displayName = user.displayName || username
              const bio = user.bio || ''
              const avatar = user.profileImageUrl || '/default-avatar.svg'

              return (
                <article
                  key={username}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/profile/${username}`)}
                  onKeyDown={(e) => onCardKeyDown(e, username)}
                  className="group cursor-pointer bg-recipzee-card border border-recipzee-border rounded-2xl p-5
                             transition-all duration-200
                             hover:border-recipzee-green/30 hover:shadow-xl hover:shadow-recipzee-green/5 hover:scale-[1.02]
                             focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:ring-offset-2 focus:ring-offset-recipzee-dark
                             active:scale-[0.99]"
                  aria-label={`Open profile for ${displayName}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={avatar}
                      alt={`${displayName} avatar`}
                      loading="lazy"
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-recipzee-border group-hover:ring-recipzee-green/30 transition-all"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold truncate group-hover:text-recipzee-green transition-colors">{displayName}</h2>
                      <p className="text-sm text-recipzee-subtle truncate">@{username}</p>
                    </div>
                  </div>

                  {bio ? (
                    <p className="text-sm text-recipzee-subtle line-clamp-2 mb-4">{bio}</p>
                  ) : (
                    <p className="text-sm text-recipzee-subtle/60 italic mb-4">No bio yet.</p>
                  )}

                  <div className="flex items-center justify-end text-sm text-recipzee-subtle group-hover:text-recipzee-green transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">View profile</span>
                    <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExploreChefsPage
