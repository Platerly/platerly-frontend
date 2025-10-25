import { useEffect, useState } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from "../utils/api";
import { useAuth } from '../context/AuthContext'

// Single-select groups (all required: exactly one each)
const TAG_GROUPS = [
  {
    key: 'course',
    label: 'Course',
    placeholder: 'Select course…',
    options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'],
  },
  {
    key: 'diet',
    label: 'Diet',
    placeholder: 'Select diet…',
    options: ['Vegan', 'Vegetarian', 'Gluten Free', 'Dairy Free', 'Keto', 'Paleo', 'Low Carb', 'High Protein'],
  },
  {
    key: 'style',
    label: 'Style',
    placeholder: 'Select style…',
    options: ['Quick', 'One-Pot', 'Budget', 'Family Friendly', 'Spicy'],
  },
  {
    key: 'health',
    label: 'Healthiness',
    placeholder: 'Select healthiness…',
    options: ['Healthy', 'Unhealthy', 'Comfort', 'Treat'],
  },
]

// Multi-select group (at least one required)
const SENSITIVITY_OPTIONS = ['Low Nickel', 'Nut Free', 'Soy Free', 'Egg Free', 'Shellfish Free']

const CreateRecipe = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    region: '',
    ingredients: [{ name: '', quantity: '' }],
    imageFile: null,
    imageUrl: '',
    imageBlobName: '',
    prepTime: '',
    cookTime: '',
    difficulty: 'Easy',
  })

  // exactly one selection required per single-select group
  const [selectedGroups, setSelectedGroups] = useState({
    course: '',
    diet: '',
    style: '',
    health: '',
  })

  // one or more required
  const [selectedSensitivities, setSelectedSensitivities] = useState([])

  // NEW: tag autocomplete state (for extra, user-typed tags)
  const [tagQuery, setTagQuery] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([]) // [{id, name, usageCount}]
  const [tagLoading, setTagLoading] = useState(false)
  const [extraTags, setExtraTags] = useState([]) // chips: string[]

  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { token } = useAuth()

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'imageFile') {
      const file = files?.[0]
      if (file) {
        setForm((prev) => ({ ...prev, imageFile: file }))
        setPreviewUrl(URL.createObjectURL(file))
      }
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleGroupChange = (key, value) => {
    setSelectedGroups(prev => ({ ...prev, [key]: value }))
  }

  const toggleSensitivity = (value) => {
    setSelectedSensitivities(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  // Upload and capture BOTH imageUrl + imageBlobName
  const uploadImage = async () => {
    if (!form.imageFile) throw new Error('Please select an image first')

    const fd = new FormData()
    fd.append('file', form.imageFile)

    const res = await fetch(`${API_BASE_URL}/api/Recipe/upload-recipe-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    if (!res.ok) throw new Error('Image upload failed')
    const data = await res.json()

    const blobName = data.imageBlobName ?? data.blobName
    if (!data.imageUrl || !blobName) throw new Error('Upload did not return imageUrl/blobName')

    setForm(prev => ({ ...prev, imageUrl: data.imageUrl, imageBlobName: blobName }))
    return { imageUrl: data.imageUrl, blobName }
  }

  // Derived UI state
  const singlesNeeded = Object.keys(selectedGroups).length
  const singlesChosen = Object.values(selectedGroups).filter(Boolean).length
  const singlesComplete = singlesChosen === singlesNeeded
  const hasSensitivity = selectedSensitivities.length > 0
  const hasBasics = form.title.trim() && form.instructions.trim()
  const hasImageReady = !!form.imageFile || (!!form.imageUrl && !!form.imageBlobName)
  const canSubmit = singlesComplete && hasSensitivity && hasBasics && hasImageReady && !loading

  // === Autocomplete logic for extra tags ===
  // Debounced query to /api/tags
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
      // UX nicety: backspace with empty input removes last chip
      removeExtraTag(extraTags[extraTags.length - 1])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // enforce mandatory picks: all singles + at least 1 sensitivity
      const missingSingles = Object.entries(selectedGroups).filter(([, v]) => !v)
      if (missingSingles.length > 0) {
        throw new Error('Please select one option for Course, Diet, Style, and Healthiness.')
      }
      if (selectedSensitivities.length === 0) {
        throw new Error('Please select at least one Sensitivity.')
      }

      // Ensure image present/uploaded
      const { imageUrl, blobName } =
        form.imageUrl && form.imageBlobName
          ? { imageUrl: form.imageUrl, blobName: form.imageBlobName }
          : await uploadImage()

      // Ingredients
      const ingredients = (form.ingredients || []).filter(i => (i.name || '').trim().length > 0)

      // Merge mandatory tags + extraTags (de-dup, case-insensitive)
      const mandatorySingles = Object.values(selectedGroups)            // 4 strings
      const mandatoryMultis  = selectedSensitivities                    // 1+ strings
      const tagMap = new Map()
      ;[...mandatorySingles, ...mandatoryMultis, ...extraTags].forEach(t => {
        const k = t.toLowerCase()
        if (!tagMap.has(k)) tagMap.set(k, t) // keep first casing encountered
      })
      const tags = Array.from(tagMap.values())

      const payload = {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        region: form.region,
        imageUrl,
        imageBlobName: blobName,
        ingredients,
        tags, // singles + sensitivities + autocomplete extras
        prepTimeMinutes: Number(form.prepTime) || 0,
        cookTimeMinutes: Number(form.cookTime) || 0,
        difficulty: form.difficulty
      }

      const res = await fetch(`${API_BASE_URL}/api/Recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Recipe creation failed')
      }

      const created = await res.json()
      navigate(`/recipe/${created.id}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 bg-platerly-card border border-platerly-border rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold text-center text-white mb-8">
        🍽️ Create a New Recipe
      </h1>

      {/* Required tags progress */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-emerald-2 00">
        <span className="rounded-full bg-emerald-900/30 border border-emerald-600/30 px-2 py-0.5">
          Required tags: <strong className="ml-1">{singlesChosen}/{singlesNeeded} single-select</strong>
        </span>
        <span className={`rounded-full px-2 py-0.5 border ${hasSensitivity ? 'bg-emerald-900/30 border-emerald-600/30' : 'bg-neutral-900 border-neutral-700 text-neutral-300'}`}>
          {hasSensitivity ? 'Sensitivity ✓' : 'Sensitivity required'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Recipe Title" name="title" value={form.title} onChange={handleChange} required />
        <Input label="Region or Cuisine" name="region" value={form.region} onChange={handleChange} />
        <Textarea label="Description" name="description" value={form.description} onChange={handleChange} required />
        <Textarea label="Instructions" name="instructions" value={form.instructions} onChange={handleChange} required />

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">Ingredients</label>
          {form.ingredients?.map((ingredient, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) => {
                  const newIngredients = [...form.ingredients]
                  newIngredients[index].name = e.target.value
                  setForm((prev) => ({ ...prev, ingredients: newIngredients }))
                }}
                className="flex-1 rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white"
                required
              />
              <input
                type="text"
                placeholder="Quantity"
                value={ingredient.quantity}
                onChange={(e) => {
                  const newIngredients = [...form.ingredients]
                  newIngredients[index].quantity = e.target.value
                  setForm((prev) => ({ ...prev, ingredients: newIngredients }))
                }}
                className="w-1/3 rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const updated = [...form.ingredients]
                  if (updated.length > 1) {
                    updated.splice(index, 1)
                    setForm((prev) => ({ ...prev, ingredients: updated }))}
                }}
                disabled={form.ingredients.length === 1}
                className={`text-red-400 hover:text-red-500 text-sm transition ${form.ingredients.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                ingredients: [...(prev.ingredients || []), { name: '', quantity: '' }],
              }))
            }
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

        {/* Multi-select Sensitivity */}
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

        <div className="flex space-x-4">
          <Input label="Prep Time (mins)" name="prepTime" value={form.prepTime} onChange={handleChange} type="number" min="0" />
          <Input label="Cook Time (mins)" name="cookTime" value={form.cookTime} onChange={handleChange} type="number" min="0" />
        </div>

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-1">Difficulty</label>
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-2"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-1">Recipe Image</label>
          <input
            type="file"
            name="imageFile"
            accept="image/*"
            onChange={handleChange}
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
            required
          />
          {previewUrl && (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className="mt-4 w-full h-56 object-cover rounded-lg border border-neutral-700 shadow-sm"
              />
              {form.imageBlobName && (
                <p className="mt-2 text-xs text-gray-400">
                  uploaded ✓ <code>{form.imageBlobName}</code>
                </p>
              )}
            </>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" size="lg" className="w-full mt-2" disabled={!canSubmit}>
          {loading ? 'Publishing...' : 'Post Recipe'}
        </Button>

        {!canSubmit && (
          <p className="mt-2 text-xs text-neutral-400 text-center">
            Select one option for <strong>Course</strong>, <strong>Diet</strong>, <strong>Style</strong>, <strong>Healthiness</strong>, and at least one <strong>Sensitivity</strong>.
          </p>
        )}
      </form>
    </div>
  )
}

export default CreateRecipe
