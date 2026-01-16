import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Upload, X } from 'lucide-react'
import { parseApiError } from '../utils/parseApiError'
import ProhibitedIngredientsError from '../components/ui/ProhibitedIngredientsError'

/* ───────────────── Difficulty helpers ───────────────── */
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard']
const toDifficultyLabel = (v) => {
  if (typeof v === 'number') return DIFFICULTY_OPTIONS[v] ?? 'Medium'
  const idx = DIFFICULTY_OPTIONS.findIndex(d => d.toLowerCase() === String(v || '').toLowerCase())
  return idx >= 0 ? DIFFICULTY_OPTIONS[idx] : 'Medium'
}
const toDifficultyIndex = (label) => {
  const idx = DIFFICULTY_OPTIONS.findIndex(d => d.toLowerCase() === String(label || '').toLowerCase())
  return idx >= 0 ? idx : 1 // Medium
}

/* ───────────────── Tags taxonomy ───────────────── */
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

export default function EditRecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null) // { message, violations } or null

  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    region: '',
    prepTimeMinutes: '',
    cookTimeMinutes: '',
    difficulty: 'Medium', // keep label in state
  })

  // Tag groups + sensitivities
  const [selectedGroups, setSelectedGroups] = useState({ course: '', diet: '', style: '', health: '' })
  const [selectedSensitivities, setSelectedSensitivities] = useState([])

  // Extra tags (chips + autocomplete)
  const [tagQuery, setTagQuery] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([]) // [{id,name,usageCount}]
  const [tagLoading, setTagLoading] = useState(false)
  const [extraTags, setExtraTags] = useState([])
  const lowerExtraSet = useMemo(() => new Set(extraTags.map(t => t.toLowerCase())), [extraTags])

  // Ingredients
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }])

  // Image handling
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const inputRef = useRef(null)

  // Image constraints
  const MAX_IMAGE_SIZE_MB = 5
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const setGroupIfMatch = (groupKey, valueLower, original) => {
    const group = TAG_GROUPS.find(g => g.key === groupKey)
    if (!group) return false
    const hit = group.options.find(opt => opt.toLowerCase() === valueLower)
    if (!hit) return false
    setSelectedGroups(prev => ({ ...prev, [groupKey]: original }))
    return true
  }

  /* ───────────────── Load recipe ───────────────── */
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to load recipe')
        const payload = await res.json()
        const recipe = payload?.recipe ?? payload
        if (!isMounted) return

        setForm({
          title: recipe.title ?? '',
          description: recipe.description ?? '',
          instructions: recipe.instructions ?? '',
          region: recipe.region ?? '',
          prepTimeMinutes: recipe.prepTimeMinutes ?? '',
          cookTimeMinutes: recipe.cookTimeMinutes ?? '',
          difficulty: toDifficultyLabel(recipe.difficulty ?? recipe.difficultyLevel),
        })
        setCurrentImageUrl(recipe.imageUrl || '')

        const ing = (recipe.ingredients || []).map(i => ({ name: i.name || '', quantity: i.quantity || '' }))
        setIngredients(ing.length ? ing : [{ name: '', quantity: '' }])

        // Hydrate tags (array or CSV)
        const rawList = Array.isArray(recipe.tags)
          ? recipe.tags.map(String)
          : String(recipe.tags || '').split(',').map(t => t.trim())
        const raw = rawList.filter(Boolean)

        const sensitivitiesLower = new Set(SENSITIVITY_OPTIONS.map(s => s.toLowerCase()))
        const leftovers = []
        const seen = new Set()

        for (const t of raw) {
          const lower = t.toLowerCase()
          if (seen.has(lower)) continue
          seen.add(lower)

          if (setGroupIfMatch('course', lower, t)) continue
          if (setGroupIfMatch('diet', lower, t)) continue
          if (setGroupIfMatch('style', lower, t)) continue
          if (setGroupIfMatch('health', lower, t)) continue

          if (sensitivitiesLower.has(lower)) { setSelectedSensitivities(prev => (prev.includes(t) ? prev : [...prev, t])); continue }
          leftovers.push(t)
        }
        setExtraTags(leftovers)
      } catch (e) {
        console.error(e)
        if (isMounted) setError('Could not load this recipe.')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [id, token])

  /* ───────────────── Tag autocomplete (debounced) ───────────────── */
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

  /* ───────────────── Handlers ───────────────── */
  const addExtraTag = (name) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return
    if (lowerExtraSet.has(trimmed.toLowerCase())) return
    setExtraTags(prev => [...prev, trimmed])
    setTagQuery(''); setTagSuggestions([])
  }
  const removeExtraTag = (name) => setExtraTags(prev => prev.filter(t => t.toLowerCase() !== name.toLowerCase()))
  const handleExtraTagKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addExtraTag(tagQuery) }
    if (e.key === 'Backspace' && !tagQuery && extraTags.length) removeExtraTag(extraTags[extraTags.length - 1])
  }

  const onPickFile = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return

    setImageError('') // Clear previous errors

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
      setImageError('Please select a valid image (JPEG, PNG, WebP, or GIF)')
      e.target.value = '' // Reset input
      return
    }

    // Validate file size
    if (f.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB. Your image is ${(f.size / 1024 / 1024).toFixed(1)}MB.`)
      e.target.value = '' // Reset input
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f); setPreviewUrl(URL.createObjectURL(f))
  }
  const clearPickedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(''); setFile(null); setImageError(''); if (inputRef.current) inputRef.current.value = ''
  }

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handleGroupChange = (key, value) => setSelectedGroups(prev => ({ ...prev, [key]: value }))
  const toggleSensitivity = (value) => {
    setSelectedSensitivities(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  // Ingredient helpers
  const changeIngredient = (index, field, value) => { const updated = [...ingredients]; updated[index][field] = value; setIngredients(updated) }
  const addIngredient = () => setIngredients(prev => [...prev, { name: '', quantity: '' }])
  const removeIngredient = (index) => { if (ingredients.length === 1) return; const updated = [...ingredients]; updated.splice(index, 1); setIngredients(updated) }

  /* ───────────────── Submit ───────────────── */
  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      // Merge tags into array (case-insensitive de-dup)
      const tagMap = new Map()
      ;[...Object.values(selectedGroups).filter(Boolean), ...selectedSensitivities, ...extraTags]
        .forEach(t => { const k = t.toLowerCase(); if (!tagMap.has(k)) tagMap.set(k, t) })
      const tags = Array.from(tagMap.values())

      // 1) multipart for scalars/tags/optional image
      const fd = new FormData()
      if (form.title) fd.append('Title', form.title)
      if (form.description) fd.append('Description', form.description)
      if (form.instructions) fd.append('Instructions', form.instructions)
      if (form.region) fd.append('Region', form.region)
      tags.forEach(t => fd.append('Tags', t))
      if (form.prepTimeMinutes !== '') fd.append('PrepTimeMinutes', String(form.prepTimeMinutes))
      if (form.cookTimeMinutes !== '') fd.append('CookTimeMinutes', String(form.cookTimeMinutes))
      // send numeric level expected by backend
      fd.append('DifficultyLevel', String(toDifficultyIndex(form.difficulty)))
      if (file) fd.append('Image', file, file.name)

      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setError(parseApiError(text || 'Failed to save changes'))
        return
      }

      // 2) ingredients replacement
      const ingPayload = {
        ingredients: ingredients
          .filter(i => (i.name || '').trim().length > 0)
          .map(i => ({ name: i.name.trim(), quantity: i.quantity || '' })),
      }
      const res2 = await fetch(`${API_BASE_URL}/api/Recipe/${id}/json`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(ingPayload)
      })
      if (!res2.ok) {
        const text = await res2.text().catch(() => '')
        setError(parseApiError(text || 'Saved main details, but updating ingredients failed'))
        return
      }

      navigate(`/recipe/${id}`)
    } catch (e) {
      console.error(e)
      setError({ message: e.message || 'Save failed', violations: null })
    } finally { setSaving(false) }
  }

  /* ───────────────── UI ───────────────── */
  if (loading) return <div className="p-6 text-platerly-subtle">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-platerly-text">
      <h1 className="text-2xl font-semibold mb-6">Edit Recipe</h1>

      {/* Image picker */}
      <div className="mb-6">
        <label className="block text-sm mb-1 text-platerly-subtle">Image</label>
        <div
          className="relative group w-full h-48 sm:h-56 rounded-lg border border-platerly-light overflow-hidden bg-platerly-card cursor-pointer"
          onClick={() => inputRef.current && inputRef.current.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current && inputRef.current.click()}
          title="Tap to choose an image"
        >
          {(previewUrl || currentImageUrl) ? (
            <>
              <img src={previewUrl || currentImageUrl} alt="Selected preview" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/55 text-[12px] text-white flex items-center justify-between px-3 py-2">
                <span className="truncate pr-2">{file?.name ?? 'Current image'}</span>
                <span className="underline opacity-90">Change</span>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearPickedFile() }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white"
                  title="Clear selected image"
                  aria-label="Clear selected image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-platerly-subtle">
              <Upload className="w-5 h-5 mr-2" />
              Tap to choose an image
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
        <p className="mt-1 text-xs text-platerly-subtle">Max size: {MAX_IMAGE_SIZE_MB}MB. Formats: JPEG, PNG, WebP, GIF</p>
        {imageError && (
          <p className="mt-2 text-sm text-red-400">{imageError}</p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm mb-1 text-platerly-subtle">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="w-full h-11 bg-platerly-card border border-platerly-light rounded-md px-3 text-platerly-text placeholder-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm mb-1 text-platerly-subtle">Description</label>
          <textarea
            rows={3}
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full min-h-[88px] bg-platerly-card border border-platerly-light rounded-md px-3 py-2 text-platerly-text placeholder-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm mb-1 text-platerly-subtle">Instructions</label>
          <textarea
            rows={6}
            name="instructions"
            value={form.instructions}
            onChange={onChange}
            className="w-full min-h-[140px] bg-platerly-card border border-platerly-light rounded-md px-3 py-2 text-platerly-text placeholder-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
          />
        </div>

        {/* Ingredients editor — responsive grid */}
        <div>
          <label className="block text-sm mb-2 text-platerly-subtle">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                {/* Name */}
                <input
                  type="text"
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => changeIngredient(idx, 'name', e.target.value)}
                  className="col-span-12 sm:col-span-7 h-11 bg-platerly-card border border-platerly-light rounded-md px-3 text-platerly-text placeholder-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
                />
                {/* Quantity */}
                <input
                  type="text"
                  placeholder="Quantity"
                  value={ing.quantity}
                  onChange={(e) => changeIngredient(idx, 'quantity', e.target.value)}
                  className="col-span-9 sm:col-span-3 h-11 bg-platerly-card border border-platerly-light rounded-md px-3 text-platerly-text placeholder-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
                />
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  disabled={ingredients.length === 1}
                  className={`col-span-3 sm:col-span-2 h-11 rounded-md border text-sm transition-colors ${
                    ingredients.length === 1
                      ? 'opacity-50 cursor-not-allowed border-platerly-light text-platerly-subtle'
                      : 'border-platerly-light text-platerly-text hover:bg-platerly-light/40'
                  }`}
                  title="Remove ingredient"
                  aria-label="Remove ingredient"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addIngredient}
            className="mt-3 h-11 px-3 rounded-full text-sm bg-platerly-green text-platerly-dark hover:opacity-90 active:opacity-80"
          >
            + Add Ingredient
          </button>
        </div>

        {/* Region / times */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1 text-platerly-subtle">Region</label>
            <input
              name="region"
              value={form.region}
              onChange={onChange}
              className="w-full h-11 bg-platerly-card border border-platerly-light rounded-md px-3 text-platerly-text placeholder-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-platerly-subtle">Prep (min)</label>
            <input
              type="number"
              min="0"
              name="prepTimeMinutes"
              value={form.prepTimeMinutes}
              onChange={onChange}
              className="w-full h-11 bg-platerly-card border border-platerly-light rounded-md px-3 text-platerly-text focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-platerly-subtle">Cook (min)</label>
            <input
              type="number"
              min="0"
              name="cookTimeMinutes"
              value={form.cookTimeMinutes}
              onChange={onChange}
              className="w-full h-11 bg-platerly-card border border-platerly-light rounded-md px-3 text-platerly-text focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
            />
          </div>
        </div>

        {/* Tag groups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TAG_GROUPS.map(group => (
            <div key={group.key}>
              <label className="block text-sm mb-1 text-platerly-subtle">{group.label}</label>
              <select
                value={selectedGroups[group.key]}
                onChange={(e) => handleGroupChange(group.key, e.target.value)}
                className="w-full h-11 bg-platerly-card border border-platerly-light rounded-md px-3 text-platerly-text focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
                aria-label={group.label}
              >
                <option value="">{group.placeholder}</option>
                {group.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Sensitivities */}
        <div>
          <label className="block text-sm mb-1 text-platerly-subtle">Sensitivity</label>
          <div className="flex flex-wrap gap-2">
            {SENSITIVITY_OPTIONS.map(opt => {
              const checked = selectedSensitivities.includes(opt)
              return (
                <label
                  key={opt}
                  className={`inline-flex items-center gap-2 px-3 h-11 rounded-full border transition-colors ${
                    checked ? 'border-platerly-green bg-platerly-green/10' : 'border-platerly-light bg-platerly-card'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSensitivity(opt)}
                    className="w-5 h-5 rounded accent-current"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Extra tags + autocomplete */}
        <div className="relative">
          <label className="block text-sm mb-1 text-platerly-subtle">Extra Tags (optional)</label>

          {extraTags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {extraTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-platerly-light bg-platerly-card text-platerly-text text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeExtraTag(tag)}
                    className="text-platerly-subtle hover:text-platerly-text"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
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
            className="w-full h-11 rounded-lg bg-platerly-card border border-platerly-light px-3 text-sm text-platerly-text placeholder-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
          />

          {tagLoading && <div className="text-xs text-platerly-subtle mt-1">Searching…</div>}
          {!tagLoading && !!tagSuggestions.length && (
            <ul className="absolute z-20 mt-2 w-full max-h-72 overflow-auto rounded-lg border border-platerly-light bg-platerly-card/95 backdrop-blur">
              {tagSuggestions.map(s => {
                const disabled = lowerExtraSet.has(s.name.toLowerCase())
                return (
                  <li key={s.id} className="border-b border-platerly-light last:border-none">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => addExtraTag(s.name)}
                      title={`${s.usageCount ?? 0} uses`}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-platerly-light/30 ${
                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      {s.name} <span className="text-platerly-subtle">({s.usageCount ?? 0})</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-platerly-subtle">Difficulty</label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={onChange}
              className="w-full h-11 bg-platerly-card border border-platerly-light rounded-md px-3 text-platerly-text focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
            >
              {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Error display */}
        {error && error.violations ? (
          <ProhibitedIngredientsError message={error.message} violations={error.violations} />
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error.message}
          </div>
        ) : null}

        {/* Desktop actions */}
        <div className="hidden md:flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-11 px-4 rounded-md border border-platerly-light text-platerly-text hover:bg-platerly-light/40 focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-4 rounded-md bg-platerly-green text-platerly-dark hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-platerly-green/30"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Mobile sticky action bar */}
        <div className="md:hidden h-[72px]" />
        <div
          className="md:hidden fixed bottom-0 inset-x-0 border-t border-platerly-light bg-platerly-dark/95 backdrop-blur px-4 py-3 flex items-center justify-end gap-2"
          style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-11 px-4 rounded-md border border-platerly-light text-platerly-text"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-4 rounded-md bg-platerly-green text-platerly-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
