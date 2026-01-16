import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Plus, X, Check, Clock, Flame } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'
import { API_BASE_URL } from "../utils/api";
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { parseApiError } from '../utils/parseApiError'
import ProhibitedIngredientsError from '../components/ui/ProhibitedIngredientsError'

// Single-select groups (all required: exactly one each)
const TAG_GROUPS = [
  { key: 'course',  label: 'Course',      placeholder: 'Select course…',      options: ['Breakfast','Lunch','Dinner','Snack','Dessert'] },
  { key: 'diet',    label: 'Diet',        placeholder: 'Select diet…',        options: ['Vegan','Vegetarian','Gluten Free','Dairy Free','Keto','Paleo','Low Carb','High Protein'] },
  { key: 'style',   label: 'Style',       placeholder: 'Select style…',       options: ['Quick','One-Pot','Budget','Family Friendly','Spicy'] },
  { key: 'health',  label: 'Healthiness', placeholder: 'Select healthiness…', options: ['Healthy','Unhealthy','Comfort','Treat'] },
]

// Multi-select group (at least one required)
const SENSITIVITY_OPTIONS = ['Low Nickel','Nut Free','Soy Free','Egg Free','Shellfish Free']

const CreateRecipe = () => {
  const [form, setForm] = useState({
    title: '', description: '', instructions: '', region: '',
    ingredients: [{ name: '', quantity: '' }],
    imageFile: null, imageUrl: '', imageBlobName: '',
    prepTime: '', cookTime: '', difficulty: 'Easy', type: 'Meal',
  })

  const RECIPE_TYPES = ['Meal', 'Shake', 'Dessert', 'Snack', 'Appetizer', 'Side', 'Beverage']

  const [selectedGroups, setSelectedGroups] = useState({ course:'', diet:'', style:'', health:'' })
  const [selectedSensitivities, setSelectedSensitivities] = useState([])

  const [tagQuery, setTagQuery] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [tagLoading, setTagLoading] = useState(false)
  const [extraTags, setExtraTags] = useState([])

  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null) // { message, violations }
  const [imageError, setImageError] = useState('') // image-specific validation errors
  const [loading, setLoading] = useState(false)

  // Image constraints
  const MAX_IMAGE_SIZE_MB = 5
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const navigate = useNavigate()
  const { token } = useAuth()

  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  useEffect(() => { if (!token) navigate(`/login?next=/create`) }, [token, navigate])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'imageFile') {
      const file = files?.[0]
      setImageError('') // Clear previous image errors

      if (file) {
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

        setForm((prev) => ({ ...prev, imageFile: file, imageUrl: '', imageBlobName: '' }))
        const url = URL.createObjectURL(file)
        setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return url })
      }
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleGroupChange = (key, value) => setSelectedGroups(prev => ({ ...prev, [key]: value }))
  const toggleSensitivity = (value) =>
    setSelectedSensitivities(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])

  // Upload and capture BOTH imageUrl + imageBlobName
  const uploadImage = async () => {
    if (!form.imageFile) throw new Error('Please select an image first')
    const fd = new FormData()
    fd.append('file', form.imageFile)
    const res = await fetch(`${API_BASE_URL}/api/Recipe/upload-recipe-image`, { method: 'POST', headers: { ...authHeader }, body: fd })
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
  useEffect(() => {
    const q = tagQuery.trim()
    if (!q) { setTagSuggestions([]); return }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        setTagLoading(true)
        const res = await fetch(`${API_BASE_URL}/api/tags?search=${encodeURIComponent(q)}&take=12`, { signal: ctrl.signal })
        if (!res.ok) throw new Error('Failed to fetch tags')
        const data = await res.json()
        setTagSuggestions(Array.isArray(data) ? data : [])
      } catch {
        if (!ctrl.signal.aborted) setTagSuggestions([])
      } finally {
        setTagLoading(false)
      }
    }, 200)
    return () => { ctrl.abort(); clearTimeout(t) }
  }, [tagQuery])

  const addExtraTag = (name) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return
    setExtraTags(prev => {
      const lower = new Set(prev.map(t => t.toLowerCase()))
      return lower.has(trimmed.toLowerCase()) ? prev : [...prev, trimmed]
    })
    setTagQuery(''); setTagSuggestions([])
  }
  const removeExtraTag = (name) => setExtraTags(prev => prev.filter(t => t.toLowerCase() !== name.toLowerCase()))
  const handleExtraTagKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addExtraTag(tagQuery) }
    if (e.key === 'Backspace' && !tagQuery && extraTags.length) removeExtraTag(extraTags[extraTags.length - 1])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const missingSingles = Object.entries(selectedGroups).filter(([, v]) => !v)
      if (missingSingles.length > 0) throw new Error('Please select one option for Course, Diet, Style, and Healthiness.')
      if (selectedSensitivities.length === 0) throw new Error('Please select at least one Sensitivity.')

      const { imageUrl, blobName } =
        form.imageUrl && form.imageBlobName ? { imageUrl: form.imageUrl, blobName: form.imageBlobName } : await uploadImage()

      const ingredients = (form.ingredients || []).filter(i => (i.name || '').trim().length > 0)

      const mandatorySingles = Object.values(selectedGroups)
      const mandatoryMultis  = selectedSensitivities
      const tagMap = new Map()
      ;[...mandatorySingles, ...mandatoryMultis, ...extraTags].forEach(t => {
        const k = t.toLowerCase(); if (!tagMap.has(k)) tagMap.set(k, t)
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
        tags,
        prepTimeMinutes: Number(form.prepTime) || 0,
        cookTimeMinutes: Number(form.cookTime) || 0,
        difficulty: form.difficulty,
        type: form.type
      }

      const res = await fetch(`${API_BASE_URL}/api/Recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        const parsed = parseApiError(txt)
        setError(parsed)
        return
      }
      const created = await res.json()
      navigate(`/recipe/${created.id}`)
    } catch (err) {
      logger.error(err)
      setError({ message: err.message || 'Something went wrong', violations: null })
    } finally { setLoading(false) }
  }

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  return (
    <div className="min-h-screen bg-platerly-dark text-platerly-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-platerly-green/5 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-platerly-card/80 backdrop-blur-sm border border-platerly-border rounded-2xl shadow-2xl p-5 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-platerly-green/20 flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-7 h-7 text-platerly-green" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Create a New Recipe</h1>
            <p className="text-platerly-subtle mt-2">Share your culinary creation with the community</p>
          </div>

          {/* Required tags progress */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ${
              singlesComplete
                ? 'bg-platerly-green/10 text-platerly-green ring-platerly-green/30'
                : 'bg-platerly-light text-platerly-subtle ring-platerly-border'
            }`}>
              {singlesComplete && <Check className="w-3.5 h-3.5" />}
              Required tags: <strong className="ml-1">{singlesChosen}/{singlesNeeded}</strong>
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ${
              hasSensitivity
                ? 'bg-platerly-green/10 text-platerly-green ring-platerly-green/30'
                : 'bg-platerly-light text-platerly-subtle ring-platerly-border'
            }`}>
              {hasSensitivity && <Check className="w-3.5 h-3.5" />}
              {hasSensitivity ? 'Sensitivity' : 'Sensitivity required'}
            </span>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* If your Input/Textarea components accept className, pass pl-field; otherwise swap to native inputs */}
          <div>
            <label className="pl-label mb-1 block">Recipe Title*</label>
            <input name="title" value={form.title} onChange={handleChange} className="pl-field" required />
          </div>

          <div>
            <label className="pl-label mb-1 block">Region or Cuisine</label>
            <input name="region" value={form.region} onChange={handleChange} className="pl-field" />
          </div>

          <div>
            <label className="pl-label mb-1 block">Description*</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="pl-field" required />
          </div>

          <div>
            <label className="pl-label mb-1 block">Instructions*</label>
            <textarea name="instructions" value={form.instructions} onChange={handleChange} rows={6} className="pl-field" required />
          </div>

          {/* Ingredients */}
          <div>
            <label className="pl-label mb-2 block">Ingredients</label>
            {form.ingredients?.map((ingredient, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2 items-start">
                <input
                  type="text"
                  placeholder="Ingredient name"
                  value={ingredient.name}
                  onChange={(e) => {
                    const newIngredients = [...form.ingredients]
                    newIngredients[index].name = e.target.value
                    setForm((prev) => ({ ...prev, ingredients: newIngredients }))
                  }}
                  className="pl-field sm:col-span-7"
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
                  className="pl-field sm:col-span-4"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...form.ingredients]
                    if (updated.length > 1) {
                      updated.splice(index, 1)
                      setForm((prev) => ({ ...prev, ingredients: updated }))
                    }
                  }}
                  disabled={form.ingredients.length === 1}
                  className={`sm:col-span-1 h-[42px] rounded-xl border border-platerly-border text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30 transition ${form.ingredients.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Remove ingredient">
                  <X className="w-4 h-4 mx-auto" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, ingredients: [...(prev.ingredients || []), { name: '', quantity: '' }] }))
              }
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-platerly-green/10 text-platerly-green border border-platerly-green/30 hover:bg-platerly-green/20 transition">
              <Plus className="w-4 h-4" />
              Add Ingredient
            </button>
          </div>

          {/* Four mandatory single-select groups */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TAG_GROUPS.map(group => (
              <div key={group.key}>
                <label className="pl-label mb-1 block">
                  {group.label} <span className="text-platerly-yellow/90">*</span>
                </label>
                <select
                  value={selectedGroups[group.key]}
                  onChange={(e) => handleGroupChange(group.key, e.target.value)}
                  className={`pl-select ${selectedGroups[group.key] ? '' : 'ring-1 ring-red-500/30'}`}>
                  <option value="">{group.placeholder}</option>
                  {group.options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>
            ))}
          </div>

          {/* Multi-select Sensitivity */}
          <div>
            <label className="pl-label mb-1 block">
              Sensitivity <span className="text-platerly-yellow/90">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SENSITIVITY_OPTIONS.map(opt => {
                const active = selectedSensitivities.includes(opt)
                return (
                  <label key={opt}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer select-none ring-1 ${
                      active
                        ? 'bg-platerly-green/15 text-platerly-text ring-platerly-green/40'
                        : 'bg-white/5 text-platerly-text ring-platerly-border'
                    }`}>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleSensitivity(opt)}
                      className="accent-platerly-green"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                )
              })}
            </div>
            <p className="mt-1 pl-help">Pick one or more.</p>
          </div>

          {/* Extra tags with autocomplete + chips */}
          <div>
            <label className="pl-label mb-1 block">Extra Tags (optional)</label>

            {extraTags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {extraTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-platerly-green/10 text-platerly-green ring-1 ring-platerly-green/30 text-sm font-medium">
                    {tag}
                    <button type="button" onClick={() => removeExtraTag(tag)} className="text-platerly-green/60 hover:text-platerly-green transition" aria-label={`Remove ${tag}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              onKeyDown={handleExtraTagKeyDown}
              placeholder="Type to search tags… press Enter to add"
              className="pl-field"
            />

            {tagLoading && <div className="text-xs text-platerly-muted mt-1">Searching…</div>}
            {!tagLoading && !!tagSuggestions.length && (
              <ul className="mt-2 max-h-56 overflow-auto rounded-lg border border-platerly-border bg-platerly-card/95 backdrop-blur">
                {tagSuggestions.map(s => {
                  const disabled = extraTags.some(t => t.toLowerCase() === s.name.toLowerCase())
                  return (
                    <li key={s.id} className="border-b border-platerly-border last:border-none">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => addExtraTag(s.name)}
                        title={`${s.usageCount ?? 0} uses`}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        {s.name} <span className="text-platerly-muted">({s.usageCount ?? 0})</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="pl-label mb-1 block">Prep Time (mins)</label>
              <input name="prepTime" value={form.prepTime} onChange={handleChange} type="number" min="0" className="pl-field" />
            </div>
            <div>
              <label className="pl-label mb-1 block">Cook Time (mins)</label>
              <input name="cookTime" value={form.cookTime} onChange={handleChange} type="number" min="0" className="pl-field" />
            </div>
          </div>

          {/* Difficulty & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="pl-label mb-1 block">Difficulty</label>
              <select name="difficulty" value={form.difficulty} onChange={handleChange} className="pl-select">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="pl-label mb-1 block">Recipe Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="pl-select">
                {RECIPE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="pl-label mb-1 block">Recipe Image</label>
            <input
              type="file" name="imageFile" accept="image/*" onChange={handleChange}
              className="block w-full text-sm text-platerly-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-platerly-green file:text-black hover:file:brightness-110"
              required
            />
            <p className="mt-1 text-xs text-platerly-subtle">Max size: {MAX_IMAGE_SIZE_MB}MB. Formats: JPEG, PNG, WebP, GIF</p>
            {imageError && (
              <p className="mt-2 text-sm text-red-400">{imageError}</p>
            )}
            {previewUrl && !imageError && (
              <img src={previewUrl} alt="Preview" className="mt-4 w-full h-56 object-cover rounded-lg border border-platerly-border shadow-sm" />
            )}
          </div>

          {error && error.violations ? (
            <ProhibitedIngredientsError message={error.message} violations={error.violations} />
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error.message}
            </div>
          ) : null}

          <Button type="submit" size="lg" fullWidth disabled={!canSubmit} loading={loading}>
            <ChefHat className="w-5 h-5" />
            {loading ? 'Publishing…' : 'Post Recipe'}
          </Button>

          {!canSubmit && (
            <p className="mt-3 text-xs text-platerly-subtle text-center">
              Select one option for <strong>Course</strong>, <strong>Diet</strong>, <strong>Style</strong>, <strong>Healthiness</strong>, and at least one <strong>Sensitivity</strong>.
            </p>
          )}
        </form>
        </div>
      </div>
    </div>
  )
}

export default CreateRecipe
