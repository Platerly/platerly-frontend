import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'
import { toast } from 'react-hot-toast'
import logger from '../utils/logger'
import { User, AlertTriangle, ChevronRight, Check } from 'lucide-react'

const COMMON_ALLERGENS = [
  { id: 'peanuts', label: 'Peanuts', icon: null },
  { id: 'tree-nuts', label: 'Tree Nuts', icon: null },
  { id: 'milk', label: 'Dairy/Milk', icon: null },
  { id: 'eggs', label: 'Eggs', icon: null },
  { id: 'wheat', label: 'Wheat/Gluten', icon: null },
  { id: 'soy', label: 'Soy', icon: null },
  { id: 'fish', label: 'Fish', icon: null },
  { id: 'shellfish', label: 'Shellfish', icon: null },
  { id: 'sesame', label: 'Sesame', icon: null },
  { id: 'nickel', label: 'Nickel', icon: null },
]

export default function OnboardingPage() {
  const { user, token, setUser } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1 = username, 2 = allergies
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [selectedAllergens, setSelectedAllergens] = useState([])
  const [loading, setLoading] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)

  // Initialize with current user data
  useEffect(() => {
    if (user) {
      // For OAuth users, username might be their email - suggest a cleaner version
      const currentUsername = user.username || ''
      if (currentUsername.includes('@')) {
        setUsername(currentUsername.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''))
      } else {
        setUsername(currentUsername)
      }
      setDisplayName(user.displayName || user.username?.split('@')[0] || '')
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

  const toggleAllergen = (id) => {
    setSelectedAllergens(prev =>
      prev.includes(id)
        ? prev.filter(a => a !== id)
        : [...prev, id]
    )
  }

  const handleUsernameStep = async () => {
    const valid = await checkUsername(username)
    if (!valid) return

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
      // Get existing allergies first
      const existingRes = await fetch(`${API_BASE_URL}/api/User/allergies`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const existingData = existingRes.ok ? await existingRes.json() : []
      const existingIds = existingData.map(a => a.allergenId || a.id)

      // Add new allergies
      for (const allergenId of selectedAllergens) {
        if (!existingIds.includes(allergenId)) {
          await fetch(`${API_BASE_URL}/api/User/allergies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              allergenId: allergenId,
              severity: 'high'
            })
          })
        }
      }

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
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-platerly-green/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-platerly-green' : 'bg-platerly-border'}`} />
          <div className={`w-12 h-0.5 transition-colors ${step >= 2 ? 'bg-platerly-green' : 'bg-platerly-border'}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-platerly-green' : 'bg-platerly-border'}`} />
        </div>

        <div className="bg-platerly-card/80 backdrop-blur-md border border-platerly-border rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8">
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
                  <label className="block text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      setUsernameError('')
                    }}
                    onBlur={() => checkUsername(username)}
                    placeholder="your_username"
                    className="w-full px-4 py-3 rounded-xl bg-platerly-light border border-platerly-border text-platerly-text placeholder-platerly-muted focus:outline-none focus:ring-2 focus:ring-platerly-green/40"
                  />
                  {usernameError && (
                    <p className="mt-2 text-sm text-red-400">{usernameError}</p>
                  )}
                  {checkingUsername && (
                    <p className="mt-2 text-sm text-platerly-subtle">Checking availability...</p>
                  )}
                  <p className="mt-2 text-xs text-platerly-muted">
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
                    key={allergen.id}
                    onClick={() => toggleAllergen(allergen.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      selectedAllergens.includes(allergen.id)
                        ? 'bg-platerly-green/20 border-platerly-green text-platerly-green'
                        : 'bg-platerly-light border-platerly-border hover:border-platerly-green/30'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 ${
                      selectedAllergens.includes(allergen.id)
                        ? 'bg-platerly-green border-platerly-green'
                        : 'border-platerly-border'
                    }`}>
                      {selectedAllergens.includes(allergen.id) && (
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
