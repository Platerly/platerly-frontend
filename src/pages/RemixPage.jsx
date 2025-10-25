import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'

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

  // Scalars
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [region, setRegion] = useState('')
  const [difficulty, setDifficulty] = useState('Easy')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')

  // Image
  const [imageUrl, setImageUrl] = useState('')
  const [imageBlobName, setImageBlobName] = useState('')
  const [uploading, setUploading] = useState(false)

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
  const [error, setError] = useState('')

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
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch original recipe')
        const payload = await res.json()
        const recipe = payload.recipe || payload // fallback

        setTitle(recipe.title || '')
        setDescription(recipe.description || '')
        setInstructions(recipe.instructions || '')
        setRegion(recipe.region || '')
        setDifficulty(recipe.difficulty || 'Easy')
        setPrepTime((recipe.prepTimeMinutes ?? '').toString())
        setCookTime((recipe.cookTimeMinutes ?? '').toString())
        setImageUrl(recipe.imageUrl || '')

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
        console.error(e)
        setError(e?.message || 'Failed to load original recipe')
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
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_BASE_URL}/api/Recipe/upload-recipe-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })
      if (!res.ok) throw new Error('Image upload failed')
      const data = await res.json()
      setImageUrl(data.imageUrl)
      setImageBlobName(data.imageBlobName || data.blobName)
    } catch (e) {
      console.error(e)
      alert('Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // Derived UI state like CreateRecipe
  const singlesNeeded = Object.keys(selectedGroups).length
  const singlesChosen = Object.values(selectedGroups).filter(Boolean).length
  const singlesComplete = singlesChosen === singlesNeeded
  const hasSensitivity = selectedSensitivities.length > 0
  const hasBasics = title.trim() && instructions.trim()
  const hasImageReady = !!imageUrl // remix can reuse original; upload optional
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
    try {
      if (!canSubmit) {
        alert('Please complete all required fields and tags before posting the remix.')
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
        title,
        description,
        instructions,
        region,
        imageUrl,
        imageBlobName,
        ingredients,
        tags,                               // array expected by Remix endpoint (CreateRecipeDto)
        prepTimeMinutes: Number(prepTime) || 0,
        cookTimeMinutes: Number(cookTime) || 0,
        difficulty
      }

      const response = await fetch(`${API_BASE_URL}/api/Recipe/${originalId}/remix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const txt = await response.text().catch(() => '')
        throw new Error(txt || 'Remix creation failed')
      }

      navigate('/feed')
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Failed to post remix.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-emerald-100">
        Loading original recipe…
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 bg-platerly-card border border-platerly-border rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold text-center text-white mb-8">🎧 Remix Recipe</h1>

      {/* Required tags progress (match CreateRecipe) */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-emerald-200">
        <span className="rounded-full bg-emerald-900/30 border border-emerald-600/30 px-2 py-0.5">
          Required tags: <strong className="ml-1">{singlesChosen}/{singlesNeeded} single-select</strong>
        </span>
        <span className={`rounded-full px-2 py-0.5 border ${hasSensitivity ? 'bg-emerald-900/30 border-emerald-600/30' : 'bg-neutral-900 border-neutral-700 text-neutral-300'}`}>
          {hasSensitivity ? 'Sensitivity ✓' : 'Sensitivity required'}
        </span>
      </div>

      <div className="space-y-6">
        {/* Title / Region / Description / Instructions */}
        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">
            Recipe Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">Region or Cuisine</label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">
            Instructions <span className="text-red-500">*</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white resize-none"
            required
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">Ingredients</label>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) => {
                  const updated = [...ingredients]
                  updated[index].name = e.target.value
                  setIngredients(updated)
                }}
                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded"
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
                className="w-1/3 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded"
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
                className={`text-red-400 hover:text-red-600 ${ingredients.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setIngredients(prev => [...prev, { name: '', quantity: '' }])}
            className="mt-2 px-3 py-1 rounded-full text-sm bg-green-700 text-white hover:bg-green-800"
          >
            + Add Ingredient
          </button>
        </div>

        {/* Four mandatory single-select groups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TAG_GROUPS.map(group => (
            <div key={group.key}>
              <label className="block text-sm font-medium text-platerly-subtle mb-1">
                {group.label} <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedGroups[group.key]}
                onChange={(e) => handleGroupChange(group.key, e.target.value)}
                className={`w-full bg-neutral-900 border rounded-lg px-4 py-2 text-white ${selectedGroups[group.key] ? 'border-neutral-700' : 'border-red-500/40'}`}
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
          <label className="block text-sm font-medium text-platerly-subtle mb-1">
            Sensitivity <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SENSITIVITY_OPTIONS.map(opt => (
              <label
                key={opt}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${selectedSensitivities.includes(opt) ? 'border-emerald-500 bg-emerald-900/30' : 'border-neutral-700 bg-neutral-900'}`}
              >
                <input
                  type="checkbox"
                  checked={selectedSensitivities.includes(opt)}
                  onChange={() => toggleSensitivity(opt)}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-white">{opt}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-400">Pick one or more.</p>
        </div>

        {/* NEW: Extra tags with autocomplete + chips */}
        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-1">Extra Tags (optional)</label>

          {/* chips */}
          {extraTags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {extraTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-white text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeExtraTag(tag)}
                    className="text-neutral-400 hover:text-red-400"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
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
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white"
          />

          {/* suggestions */}
          {tagLoading && <div className="text-xs text-neutral-400 mt-1">Searching…</div>}
          {!tagLoading && !!tagSuggestions.length && (
            <ul className="mt-2 max-h-56 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900/80 backdrop-blur">
              {tagSuggestions.map(s => {
                const disabled = extraTags.some(t => t.toLowerCase() === s.name.toLowerCase())
                return (
                  <li key={s.id} className="border-b border-neutral-800 last:border-none">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => addExtraTag(s.name)}
                      title={`${s.usageCount ?? 0} uses`}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {s.name} <span className="text-neutral-400">({s.usageCount ?? 0})</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Times + Difficulty */}
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-platerly-subtle mb-2">Prep Time (mins)</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              min="0"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium text-platerly-subtle mb-2">Cook Time (mins)</label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">Recipe Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-4 w-full h-56 object-cover rounded-lg border border-neutral-700 shadow-sm"
            />
          )}
        </div>

        {/* Submit */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full px-6 py-3 rounded-lg font-semibold transition ${
              canSubmit ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600/40 text-white/60 cursor-not-allowed'
            }`}
          >
            Post Remix
          </button>
          {!canSubmit && (
            <p className="mt-2 text-xs text-neutral-400 text-center">
              Select one option for <strong>Course</strong>, <strong>Diet</strong>, <strong>Style</strong>, <strong>Healthiness</strong>, and at least one <strong>Sensitivity</strong>.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default RemixPage
