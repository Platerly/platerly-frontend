import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { RefreshCw, Plus, X, Check, Clock, Flame, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { usePremium } from '../hooks/usePremium'
import Button from '../components/ui/Button'
import { logger } from '../utils/logger'
import { parseApiError } from '../utils/parseApiError'
import ProhibitedIngredientsError from '../components/ui/ProhibitedIngredientsError'

// --- Same taxonomy as CreateRecipe ---
const TAG_GROUPS = [
  { key: 'course', label: 'Course', placeholder: 'Select course…',
    options: ['Breakfast','Lunch','Dinner','Snack','Dessert'] },
  { key: 'diet', label: 'Diet', placeholder: 'Select diet…',
    options: ['Vegan','Vegetarian','Gluten Free','Dairy Free','Keto','Paleo','Low Carb','High Protein'] },
  { key: 'style', label: 'Style', placeholder: 'Select style…',
    options: ['Quick','One-Pot','Budget','Family Friendly','Spicy'] },
  { key: 'health', label: 'Healthiness', placeholder: 'Select healthiness…',
    options: ['Healthy','Unhealthy','Comfort','Treat'] },
]
const SENSITIVITY_OPTIONS = ['Low Nickel','Nut Free','Soy Free','Egg Free','Shellfish Free']

const RemixPage = () => {
  const { originalId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { isPremium, isOnTrial, loading: premiumLoading } = usePremium()

  // Form state (consolidated to prevent re-render issues)
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    region: '',
    difficulty: 'Easy',
    prepTime: '',
    cookTime: '',
    type: 'Meal',
    imageUrl: '',
    imageBlobName: '',
  })

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Image upload state
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState('')

  // Image constraints
  const MAX_IMAGE_SIZE_MB = 5
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  // Ingredients
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }])

  // Required tag groups (single select)
  const [selectedGroups, setSelectedGroups] = useState({
    course: '',
    diet: '',
    style: '',
    health: '',
  })

  // Sensitivities (multi select, at least one)
  const [selectedSensitivities, setSelectedSensitivities] = useState([])

  // NEW: autocomplete state for extra tags
  const [tagQuery, setTagQuery] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([]) // [{id,name,usageCount}]
  const [tagLoading, setTagLoading] = useState(false)
  const [extraTags, setExtraTags] = useState([]) // chips

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // { message, violations } or null

  const setGroupIfMatch = (groupKey, valueLower, original) => {
    const group = TAG_GROUPS.find(g => g.key === groupKey)
    if (!group) return false
    const hit = group.options.find(opt => opt.toLowerCase() === valueLower)
    if (!hit) return false
    setSelectedGroups(prev => ({ ...prev, [groupKey]: original }))
    return true
  }

  // Pre-fill from original recipe
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Recipe/${originalId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error('Failed to fetch original recipe')
        const payload = await res.json()
        const recipe = payload.recipe || payload // fallback

        setForm({
          title: recipe.title || '',
          description: recipe.description || '',
          instructions: recipe.instructions || '',
          region: recipe.region || '',
          difficulty: recipe.difficulty || 'Easy',
          prepTime: String(recipe.prepTimeMinutes ?? ''),
          cookTime: String(recipe.cookTimeMinutes ?? ''),
          type: recipe.type || 'Meal',
          imageUrl: recipe.imageUrl || '',
          imageBlobName: '',
        })

        const ing = (recipe.ingredients || []).map(i => ({
          name: i.name || '',
          quantity: i.quantity || ''
        }))
        setIngredients(ing.length ? ing : [{ name: '', quantity: '' }])

        // Prefer array if backend sends it; else split legacy comma string
        const rawArray = payload.tagNames && Array.isArray(payload.tagNames) && payload.tagNames.length
          ? payload.tagNames
          : (recipe.tags || '')
              .split(',')
              .map(t => (t || '').trim())
              .filter(Boolean)

        const sensitivitiesLower = new Set(SENSITIVITY_OPTIONS.map(s => s.toLowerCase()))
        const leftovers = []
        const lowerSeen = new Set()

        for (const t of rawArray) {
          const lower = t.toLowerCase()
          if (lowerSeen.has(lower)) continue
          lowerSeen.add(lower)

          if (setGroupIfMatch('course', lower, t)) continue
          if (setGroupIfMatch('diet', lower, t)) continue
          if (setGroupIfMatch('style', lower, t)) continue
          if (setGroupIfMatch('health', lower, t)) continue

          if (sensitivitiesLower.has(lower)) {
            setSelectedSensitivities(prev => (prev.includes(t) ? prev : [...prev, t]))
            continue
          }
          leftovers.push(t)
        }
        setExtraTags(leftovers)
        setLoading(false)
      } catch (e) {
        logger.error(e)
        setError({ message: e?.message || 'Failed to load original recipe', violations: null })
        setLoading(false)
      }
    }
    load()
  }, [originalId, token])

  const handleGroupChange = (key, value) => {
    setSelectedGroups(prev => ({ ...prev, [key]: value }))
  }

  const toggleSensitivity = (value) => {
    setSelectedSensitivities(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    setImageError('') // Clear previous errors

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Please select a valid image (JPEG, PNG, WebP, or GIF)')
      e.target.value = '' // Reset input
      return
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB. Your image is ${(file.size / 1024 / 1024).toFixed(1)}MB.`)
      e.target.value = '' // Reset input
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_BASE_URL}/api/Recipe/upload-recipe-image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd
      })
      if (!res.ok) throw new Error('Image upload failed')
      const data = await res.json()
      setForm(prev => ({
        ...prev,
        imageUrl: data.imageUrl,
        imageBlobName: data.imageBlobName || data.blobName
      }))
    } catch (e) {
      logger.error(e)
      setImageError('Image upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Derived UI state like CreateRecipe
  const singlesNeeded = Object.keys(selectedGroups).length
  const singlesChosen = Object.values(selectedGroups).filter(Boolean).length
  const singlesComplete = singlesChosen === singlesNeeded
  const hasSensitivity = selectedSensitivities.length > 0
  const hasBasics = form.title.trim() && form.instructions.trim()
  const hasImageReady = !!form.imageUrl // remix can reuse original; upload optional
  const canSubmit = useMemo(
    () => singlesComplete && hasSensitivity && hasBasics && hasImageReady && !uploading && !loading,
    [singlesComplete, hasSensitivity, hasBasics, hasImageReady, uploading, loading]
  )

  // === Autocomplete for extra tags ===
  useEffect(() => {
    const q = tagQuery.trim()
    if (!q) {
      setTagSuggestions([])
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        setTagLoading(true)
        const res = await fetch(`${API_BASE_URL}/api/tags?search=${encodeURIComponent(q)}&take=12`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error('Failed to fetch tags')
        const data = await res.json()
        setTagSuggestions(Array.isArray(data) ? data : [])
      } catch {
        if (!ctrl.signal.aborted) setTagSuggestions([])
      } finally {
        setTagLoading(false)
      }
    }, 200)
    return () => {
      ctrl.abort()
      clearTimeout(t)
    }
  }, [tagQuery])

  const addExtraTag = (name) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return
    setExtraTags(prev => {
      const lower = new Set(prev.map(t => t.toLowerCase()))
      return lower.has(trimmed.toLowerCase()) ? prev : [...prev, trimmed]
    })
    setTagQuery('')
    setTagSuggestions([])
  }

  const removeExtraTag = (name) => {
    setExtraTags(prev => prev.filter(t => t.toLowerCase() !== name.toLowerCase()))
  }

  const handleExtraTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addExtraTag(tagQuery)
    }
    if (e.key === 'Backspace' && !tagQuery && extraTags.length) {
      removeExtraTag(extraTags[extraTags.length - 1])
    }
  }

  const handleSubmit = async () => {
    setError(null)
    try {
      if (!canSubmit) {
        toast.error('Please complete all required fields and tags before posting the remix.')
        return
      }

      // Merge tags: required singles + selected sensitivities + extra tags
      const mandatorySingles = Object.values(selectedGroups)
      const mandatoryMultis = selectedSensitivities

      const tagMap = new Map()
      ;[...mandatorySingles, ...mandatoryMultis, ...extraTags].forEach(t => {
        const k = t.toLowerCase()
        if (!tagMap.has(k)) tagMap.set(k, t)
      })
      const tags = Array.from(tagMap.values())

      const payload = {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        region: form.region,
        imageUrl: form.imageUrl,
        imageBlobName: form.imageBlobName,
        ingredients,
        tags,                               // array expected by Remix endpoint (CreateRecipeDto)
        prepTimeMinutes: Number(form.prepTime) || 0,
        cookTimeMinutes: Number(form.cookTime) || 0,
        difficulty: form.difficulty
      }

      const response = await fetch(`${API_BASE_URL}/api/Recipe/${originalId}/remix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const txt = await response.text().catch(() => '')
        const parsed = parseApiError(txt || 'Remix creation failed')
        setError(parsed)
        // Show toast for non-violation errors
        if (!parsed.violations) {
          toast.error(parsed.message)
        }
        return
      }

      navigate('/feed')
    } catch (e) {
      logger.error(e)
      setError({ message: e?.message || 'Failed to post remix.', violations: null })
      toast.error(e?.message || 'Failed to post remix.')
    }
  }

  // Premium gate — show upgrade prompt for free users (wait for premium status to load)
  if (!premiumLoading && !isPremium && !isOnTrial) {
    return (
      <div className="min-h-screen bg-recipzee-dark flex items-center justify-center px-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
            <Lock className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-recipzee-text mb-1">Premium feature</p>
            <p className="text-sm text-recipzee-muted">
              Recipe remixing is available on the Premium plan.
            </p>
          </div>
          <Link
            to="/settings?tab=subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 font-semibold hover:bg-yellow-500/30 transition-colors"
          >
            Upgrade to Premium
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-recipzee-subtle hover:text-recipzee-text transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-recipzee-dark flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-recipzee-green animate-spin mx-auto mb-4" />
          <p className="text-recipzee-subtle">Loading original recipe…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-recipzee-green/5 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-recipzee-card/80 backdrop-blur-sm border border-recipzee-border rounded-2xl shadow-2xl p-5 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-recipzee-green/20 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-7 h-7 text-recipzee-green" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Remix Recipe</h1>
            <p className="text-recipzee-subtle mt-2">Put your own spin on this recipe</p>
          </div>

          {/* Required tags progress */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ${
              singlesComplete
                ? 'bg-recipzee-green/10 text-recipzee-green ring-recipzee-green/30'
                : 'bg-recipzee-light text-recipzee-subtle ring-recipzee-border'
            }`}>
              {singlesComplete && <Check className="w-3.5 h-3.5" />}
              Required tags: <strong className="ml-1">{singlesChosen}/{singlesNeeded}</strong>
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ${
              hasSensitivity
                ? 'bg-recipzee-green/10 text-recipzee-green ring-recipzee-green/30'
                : 'bg-recipzee-light text-recipzee-subtle ring-recipzee-border'
            }`}>
              {hasSensitivity && <Check className="w-3.5 h-3.5" />}
              {hasSensitivity ? 'Sensitivity' : 'Sensitivity required'}
            </span>
          </div>

          <div className="space-y-6">
            {/* Title / Region / Description / Instructions */}
            <div>
              <label className="block text-sm font-medium text-recipzee-muted mb-2">
                Recipe Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-recipzee-light border border-recipzee-border rounded-xl text-recipzee-text placeholder:text-recipzee-subtle focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-recipzee-muted mb-2">Region or Cuisine</label>
              <input
                type="text"
                name="region"
                value={form.region}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-recipzee-light border border-recipzee-border rounded-xl text-recipzee-text placeholder:text-recipzee-subtle focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-recipzee-muted mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows={3}
                className="w-full px-4 py-3 bg-recipzee-light border border-recipzee-border rounded-xl text-recipzee-text placeholder:text-recipzee-subtle resize-y focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-recipzee-muted mb-2">
                Instructions <span className="text-red-400">*</span>
              </label>
              <textarea
                name="instructions"
                value={form.instructions}
                onChange={handleFormChange}
                rows={4}
                className="w-full px-4 py-3 bg-recipzee-light border border-recipzee-border rounded-xl text-recipzee-text placeholder:text-recipzee-subtle resize-y focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
                required
              />
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-recipzee-muted mb-2">Ingredients</label>
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChange={(e) => {
                      const updated = [...ingredients]
                      updated[index].name = e.target.value
                      setIngredients(updated)
                    }}
                    className="flex-1 px-4 py-2.5 bg-recipzee-light border border-recipzee-border text-recipzee-text placeholder:text-recipzee-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
                  />
                  <input
                    type="text"
                    placeholder="Quantity"
                    value={ingredient.quantity}
                    onChange={(e) => {
                      const updated = [...ingredients]
                      updated[index].quantity = e.target.value
                      setIngredients(updated)
                    }}
                    className="sm:w-1/3 px-4 py-2.5 bg-recipzee-light border border-recipzee-border text-recipzee-text placeholder:text-recipzee-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (ingredients.length === 1) return
                      const updated = [...ingredients]
                      updated.splice(index, 1)
                      setIngredients(updated)
                    }}
                    disabled={ingredients.length === 1}
                    className={`w-10 h-10 rounded-xl border border-recipzee-border text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30 transition flex items-center justify-center sm:self-center ${ingredients.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setIngredients(prev => [...prev, { name: '', quantity: '' }])}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-recipzee-green/10 text-recipzee-green border border-recipzee-green/30 hover:bg-recipzee-green/20 transition"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </button>
            </div>

            {/* Four mandatory single-select groups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TAG_GROUPS.map(group => (
                <div key={group.key}>
                  <label className="block text-sm font-medium text-recipzee-muted mb-2">
                    {group.label} <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedGroups[group.key]}
                    onChange={(e) => handleGroupChange(group.key, e.target.value)}
                    className={`w-full bg-recipzee-light border rounded-xl px-4 py-2.5 text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition ${selectedGroups[group.key] ? 'border-recipzee-border' : 'border-red-500/40'}`}
                  >
                    <option value="">{group.placeholder}</option>
                    {group.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Sensitivity (multi, required) */}
            <div>
              <label className="block text-sm font-medium text-recipzee-muted mb-2">
                Sensitivity <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SENSITIVITY_OPTIONS.map(opt => (
                  <label
                    key={opt}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer select-none transition ${
                      selectedSensitivities.includes(opt)
                        ? 'bg-recipzee-green/15 text-recipzee-text ring-1 ring-recipzee-green/40'
                        : 'bg-recipzee-light text-recipzee-subtle ring-1 ring-recipzee-border hover:ring-recipzee-green/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSensitivities.includes(opt)}
                      onChange={() => toggleSensitivity(opt)}
                      className="accent-recipzee-green"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-recipzee-subtle">Pick one or more.</p>
            </div>

            {/* Extra tags with autocomplete + chips */}
            <div>
              <label className="block text-sm font-medium text-recipzee-muted mb-2">Extra Tags (optional)</label>

              {/* chips */}
              {extraTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {extraTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-recipzee-green/10 text-recipzee-green ring-1 ring-recipzee-green/30 text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeExtraTag(tag)}
                        className="text-recipzee-green/60 hover:text-recipzee-green transition"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* input */}
              <input
                type="text"
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                onKeyDown={handleExtraTagKeyDown}
                placeholder="Type to search tags… press Enter to add"
                className="w-full rounded-xl bg-recipzee-light border border-recipzee-border px-4 py-2.5 text-sm text-recipzee-text placeholder:text-recipzee-subtle focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
              />

              {/* suggestions */}
              {tagLoading && <div className="text-xs text-recipzee-subtle mt-2">Searching…</div>}
              {!tagLoading && !!tagSuggestions.length && (
                <ul className="mt-2 max-h-56 overflow-auto rounded-xl border border-recipzee-border bg-recipzee-card/95 backdrop-blur shadow-lg">
                  {tagSuggestions.map(s => {
                    const disabled = extraTags.some(t => t.toLowerCase() === s.name.toLowerCase())
                    return (
                      <li key={s.id} className="border-b border-recipzee-border last:border-none">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => addExtraTag(s.name)}
                          title={`${s.usageCount ?? 0} uses`}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-recipzee-light transition ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {s.name} <span className="text-recipzee-subtle">({s.usageCount ?? 0})</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Times + Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-recipzee-muted mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Prep Time (mins)
                </label>
                <input
                  type="number"
                  name="prepTime"
                  value={form.prepTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 bg-recipzee-light border border-recipzee-border rounded-xl text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-recipzee-muted mb-2">
                  <Flame className="w-4 h-4 inline mr-1" />
                  Cook Time (mins)
                </label>
                <input
                  type="number"
                  name="cookTime"
                  value={form.cookTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 bg-recipzee-light border border-recipzee-border rounded-xl text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-recipzee-muted mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 bg-recipzee-light border border-recipzee-border rounded-xl text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green transition"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-recipzee-muted mb-2">Recipe Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="block w-full text-sm text-recipzee-text file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-recipzee-green file:text-recipzee-dark hover:file:bg-recipzee-green/90 disabled:file:opacity-60 transition"
              />
              <p className="mt-1 text-xs text-recipzee-subtle">Max size: {MAX_IMAGE_SIZE_MB}MB. Formats: JPEG, PNG, WebP, GIF</p>
              {imageError && (
                <p className="mt-2 text-sm text-red-400">{imageError}</p>
              )}
              {form.imageUrl && !imageError && (
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="mt-4 w-full h-56 object-cover rounded-xl border border-recipzee-border shadow-lg"
                />
              )}
            </div>

            {/* Submit */}
            {error && error.violations ? (
              <ProhibitedIngredientsError message={error.message} violations={error.violations} />
            ) : error ? (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error.message}
              </div>
            ) : null}

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={uploading}
                size="lg"
                fullWidth
              >
                <RefreshCw className="w-5 h-5" />
                Post Remix
              </Button>
              {!canSubmit && (
                <p className="mt-3 text-xs text-recipzee-subtle text-center">
                  Select one option for <strong>Course</strong>, <strong>Diet</strong>, <strong>Style</strong>, <strong>Healthiness</strong>, and at least one <strong>Sensitivity</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RemixPage
