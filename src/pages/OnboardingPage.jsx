import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'
import { toast } from 'react-hot-toast'
import logger from '../utils/logger'
import { User, AlertTriangle, ChevronRight, Check, RefreshCw } from 'lucide-react'

// Common allergens - matches database Allergy.Name values
// FDA Big 9 + EU allergens + Nickel
const COMMON_ALLERGENS = [
  { name: 'Peanuts', label: 'Peanuts' },
  { name: 'Tree Nuts', label: 'Tree Nuts' },
  { name: 'Milk', label: 'Dairy/Milk' },
  { name: 'Eggs', label: 'Eggs' },
  { name: 'Gluten', label: 'Wheat/Gluten' },
  { name: 'Soy', label: 'Soy' },
  { name: 'Fish', label: 'Fish' },
  { name: 'Shellfish', label: 'Shellfish' },
  { name: 'Sesame', label: 'Sesame' },
  { name: 'Sulfites', label: 'Sulfites' },
  { name: 'Mustard', label: 'Mustard' },
  { name: 'Celery', label: 'Celery' },
  { name: 'Lupin', label: 'Lupin' },
  { name: 'Nickel', label: 'Nickel' },
]

export default function OnboardingPage() {
  const { user, token, setUser } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1 = username, 2 = allergies
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [selectedAllergens, setSelectedAllergens] = useState([]) // Array of allergen names
  const [allAllergies, setAllAllergies] = useState([]) // Array of {id, name} from API
  const [loading, setLoading] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [isCustomUsername, setIsCustomUsername] = useState(false)

  // Fetch all allergies from the database
  useEffect(() => {
    const fetchAllergies = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Allergy/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (res.ok) {
          const data = await res.json()
          setAllAllergies(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        logger.error('Failed to fetch allergies', err)
      }
    }
    fetchAllergies()
  }, [token])

  // Fetch username suggestions
  const fetchSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/User/suggest-usernames?count=5`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        // Auto-populate first suggestion if user hasn't typed a custom username
        if (data.suggestions?.length > 0 && !isCustomUsername) {
          setUsername(data.suggestions[0])
          setUsernameError('')
        }
      }
    } catch (err) {
      logger.error('Failed to fetch username suggestions', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Initialize with current user data and fetch suggestions
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username?.split('@')[0] || '')
      // Fetch suggestions for new users (those with email-based usernames)
      const currentUsername = user.username || ''
      if (currentUsername.includes('@')) {
        fetchSuggestions()
      } else {
        // Existing user with proper username
        setUsername(currentUsername)
      }
    }
  }, [user])

  // Check if username is available
  const checkUsername = async (name) => {
    if (!name || name.length < 3) {
      setUsernameError(name.length > 0 ? 'Username must be at least 3 characters' : '')
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      setUsernameError('Only letters, numbers, and underscores allowed')
      return false
    }

    // If same as current username, it's valid
    if (name.toLowerCase() === user?.username?.toLowerCase()) {
      setUsernameError('')
      return true
    }

    setCheckingUsername(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/User/check-username?username=${encodeURIComponent(name)}`)
      const data = await res.json()

      if (data.available) {
        setUsernameError('')
        return true
      } else {
        setUsernameError('Username already taken')
        return false
      }
    } catch (err) {
      logger.error('Username check failed', err)
      setUsernameError('')
      return true // Allow to proceed on error
    } finally {
      setCheckingUsername(false)
    }
  }

  const toggleAllergen = (name) => {
    setSelectedAllergens(prev =>
      prev.includes(name)
        ? prev.filter(a => a !== name)
        : [...prev, name]
    )
  }

  const handleUsernameStep = async () => {
    // Only check availability for custom usernames (suggestions are pre-verified unique)
    if (isCustomUsername) {
      const valid = await checkUsername(username)
      if (!valid) return
    }

    // Update username if changed
    if (username.toLowerCase() !== user?.username?.toLowerCase() || displayName !== user?.displayName) {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/User/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            username: username,
            displayName: displayName || username
          })
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Failed to update profile')
        }

        const updatedUser = await res.json()
        setUser({ ...user, ...updatedUser })
        localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }))
      } catch (err) {
        logger.error('Profile update failed', err)
        toast.error(err.message || 'Failed to update profile')
        setLoading(false)
        return
      }
      setLoading(false)
    }

    setStep(2)
  }

  const handleAllergiesStep = async () => {
    setLoading(true)
    try {
      // Map selected allergen names to their database IDs
      const selectedIds = selectedAllergens
        .map(name => {
          const allergy = allAllergies.find(a =>
            a.name.toLowerCase() === name.toLowerCase()
          )
          return allergy?.id
        })
        .filter(Boolean)

      // Update allergies using the correct endpoint
      await fetch(`${API_BASE_URL}/api/Allergy/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(selectedIds)
      })

      toast.success('Setup complete!')
      navigate('/feed', { replace: true })
    } catch (err) {
      logger.error('Allergy setup failed', err)
      toast.error('Failed to save allergies')
    } finally {
      setLoading(false)
    }
  }

  const skipAllergies = () => {
    navigate('/feed', { replace: true })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-platerly-dark flex items-center justify-center">
        <div className="text-platerly-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-platerly-dark text-platerly-text flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background gradient orbs - hidden on mobile for performance */}
      <div className="hidden sm:block absolute top-1/4 -left-32 w-80 h-80 bg-platerly-green/10 rounded-full blur-[120px]" />
      <div className="hidden sm:block absolute bottom-1/4 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-platerly-green' : 'bg-platerly-border'}`} />
          <div className={`w-12 h-0.5 transition-colors ${step >= 2 ? 'bg-platerly-green' : 'bg-platerly-border'}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-platerly-green' : 'bg-platerly-border'}`} />
        </div>

        <div className="bg-platerly-card sm:bg-platerly-card/80 sm:backdrop-blur-md border border-platerly-border rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8">
          {step === 1 ? (
            /* Step 1: Username & Display Name */
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-platerly-green/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-platerly-green" />
                </div>
                <h1 className="text-2xl font-bold">Welcome to Platerly!</h1>
                <p className="text-platerly-subtle mt-2">
                  Let's set up your profile
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Username
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomUsername(false)
                        fetchSuggestions()
                      }}
                      disabled={loadingSuggestions}
                      className="flex items-center gap-1.5 text-xs text-platerly-green hover:text-platerly-green/80 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                      New suggestions
                    </button>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                      setUsername(val)
                      setUsernameError('')
                      setIsCustomUsername(true)
                    }}
                    onBlur={() => {
                      // Only check availability for custom usernames (suggestions are pre-verified)
                      if (isCustomUsername) {
                        checkUsername(username)
                      }
                    }}
                    placeholder="your_username"
                    className="w-full px-4 py-3 rounded-xl bg-platerly-light border border-platerly-border text-platerly-text placeholder-platerly-muted focus:outline-none focus:ring-2 focus:ring-platerly-green/40"
                  />
                  {usernameError && (
                    <p className="mt-2 text-sm text-red-400">{usernameError}</p>
                  )}
                  {checkingUsername && (
                    <p className="mt-2 text-sm text-platerly-subtle">Checking availability...</p>
                  )}

                  {/* Username suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-platerly-muted mb-2">Or pick one of these:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.slice(0, 5).map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              setUsername(suggestion)
                              setUsernameError('')
                              setIsCustomUsername(false)
                            }}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                              username === suggestion
                                ? 'bg-platerly-green/20 border-platerly-green text-platerly-green'
                                : 'bg-platerly-light border-platerly-border hover:border-platerly-green/50 text-platerly-text'
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-platerly-muted">
                    This will be your unique @handle on Platerly
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 rounded-xl bg-platerly-light border border-platerly-border text-platerly-text placeholder-platerly-muted focus:outline-none focus:ring-2 focus:ring-platerly-green/40"
                  />
                  <p className="mt-2 text-xs text-platerly-muted">
                    This is how your name will appear on your recipes
                  </p>
                </div>

                <button
                  onClick={handleUsernameStep}
                  disabled={loading || checkingUsername || !username || usernameError}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-platerly-green text-platerly-dark font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Saving...' : 'Continue'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            /* Step 2: Allergies */
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold">Any food allergies?</h1>
                <p className="text-platerly-subtle mt-2">
                  We'll warn you about recipes with these ingredients
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {COMMON_ALLERGENS.map(allergen => (
                  <button
                    key={allergen.name}
                    onClick={() => toggleAllergen(allergen.name)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      selectedAllergens.includes(allergen.name)
                        ? 'bg-platerly-green/20 border-platerly-green text-platerly-green'
                        : 'bg-platerly-light border-platerly-border hover:border-platerly-green/30'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 ${
                      selectedAllergens.includes(allergen.name)
                        ? 'bg-platerly-green border-platerly-green'
                        : 'border-platerly-border'
                    }`}>
                      {selectedAllergens.includes(allergen.name) && (
                        <Check className="w-3 h-3 text-platerly-dark" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{allergen.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAllergiesStep}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-platerly-green text-platerly-dark font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Saving...' : selectedAllergens.length > 0 ? 'Save & Continue' : 'Continue'}
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={skipAllergies}
                  className="w-full px-6 py-3 rounded-xl text-platerly-subtle hover:text-platerly-text transition-colors"
                >
                  Skip for now
                </button>

                <p className="text-xs text-center text-platerly-muted">
                  You can always update this in Settings
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
