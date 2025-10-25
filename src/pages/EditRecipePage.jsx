import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Upload, X } from 'lucide-react'

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard']

// --- Same taxonomy as Create/Remix ---
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
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    region: '',
    prepTimeMinutes: '',
    cookTimeMinutes: '',
    difficulty: 'Medium',
  })

  // Tag groups + sensitivities
  const [selectedGroups, setSelectedGroups] = useState({ course: '', diet: '', style: '', health: '' })
  const [selectedSensitivities, setSelectedSensitivities] = useState([])

  // NEW: extra tags (chips + autocomplete)
  const [tagQuery, setTagQuery] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([]) // [{id,name,usageCount}]
  const [tagLoading, setTagLoading] = useState(false)
  const [extraTags, setExtraTags] = useState([])

  const lowerExtraSet = useMemo(
    () => new Set(extraTags.map(t => t.toLowerCase())),
    [extraTags]
  )

  // Ingredients
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }])

  // Image handling
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const inputRef = useRef(null)

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const setGroupIfMatch = (groupKey, valueLower, original) => {
    const group = TAG_GROUPS.find(g => g.key === groupKey)
    if (!group) return false
    const hit = group.options.find(opt => opt.toLowerCase() === valueLower)
    if (!hit) return false
    setSelectedGroups(prev => ({ ...prev, [groupKey]: original }))
    return true
  }

  // Load recipe
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to load recipe')
        const { recipe } = await res.json()
        if (!isMounted) return

        setForm({
          title: recipe.title ?? '',
          description: recipe.description ?? '',
          instructions: recipe.instructions ?? '',
          region: recipe.region ?? '',
          prepTimeMinutes: recipe.prepTimeMinutes ?? '',
          cookTimeMinutes: recipe.cookTimeMinutes ?? '',
          difficulty: recipe.difficulty ?? recipe.difficultyLevel ?? 'Medium',
        })
        setCurrentImageUrl(recipe.imageUrl || '')

        const ing = (recipe.ingredients || []).map(i => ({ name: i.name || '', quantity: i.quantity || '' }))
        setIngredients(ing.length ? ing : [{ name: '', quantity: '' }])

        // hydrate tags
        const raw = String(recipe.tags || '').split(',').map(t => t.trim()).filter(Boolean)
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

          if (sensitivitiesLower.has(lower)) {
            setSelectedSensitivities(prev => (prev.includes(t) ? prev : [...prev, t]))
            continue
          }
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

  // Tag autocomplete (debounced)
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
    if (lowerExtraSet.has(trimmed.toLowerCase())) return
    setExtraTags(prev => [...prev, trimmed])
    setTagQuery('')
    setTagSuggestions([])
  }
  const removeExtraTag = (name) => setExtraTags(prev => prev.filter(t => t.toLowerCase() !== name.toLowerCase()))
  const handleExtraTagKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addExtraTag(tagQuery) }
    if (e.key === 'Backspace' && !tagQuery && extraTags.length) removeExtraTag(extraTags[extraTags.length - 1])
  }

  const onPickFile = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }
  const clearPickedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(''); setFile(null); if (inputRef.current) inputRef.current.value = ''
  }

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handleGroupChange = (key, value) => setSelectedGroups(prev => ({ ...prev, [key]: value }))
  const toggleSensitivity = (value) => {
    setSelectedSensitivities(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  // Ingredient helpers
  const changeIngredient = (index, field, value) => {
    const updated = [...ingredients]; updated[index][field] = value; setIngredients(updated)
  }
  const addIngredient = () => setIngredients(prev => [...prev, { name: '', quantity: '' }])
  const removeIngredient = (index) => {
    if (ingredients.length === 1) return
    const updated = [...ingredients]; updated.splice(index, 1); setIngredients(updated)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Merge tags into array (case-insensitive de-dup)
      const tagMap = new Map()
      ;[
        ...Object.values(selectedGroups).filter(Boolean),
        ...selectedSensitivities,
        ...extraTags
      ].forEach(t => {
        const k = t.toLowerCase()
        if (!tagMap.has(k)) tagMap.set(k, t)
      })
      const tags = Array.from(tagMap.values())

      // 1) Multipart PUT for scalars/tags/optional image
      const fd = new FormData()
      if (form.title) fd.append('Title', form.title)
      if (form.description) fd.append('Description', form.description)
      if (form.instructions) fd.append('Instructions', form.instructions)
      if (form.region) fd.append('Region', form.region)
      // IMPORTANT: send tags as repeated keys for List<string> binding
      tags.forEach(t => fd.append('Tags', t))
      if (form.prepTimeMinutes !== '') fd.append('PrepTimeMinutes', String(form.prepTimeMinutes))
      if (form.cookTimeMinutes !== '') fd.append('CookTimeMinutes', String(form.cookTimeMinutes))
      if (form.difficulty) fd.append('Difficulty', form.difficulty)
      if (file) fd.append('Image', file, file.name)

      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Failed to save changes')
      }

      // 2) JSON PUT for full ingredient replacement
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
        throw new Error(text || 'Saved main details, but updating ingredients failed')
      }

      navigate(`/recipe/${id}`)
    } catch (e) {
      console.error(e)
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-300">Loading…</div>
  if (error) return <div className="p-6 text-red-400">{error}</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-platerly-text">
      <h1 className="text-2xl font-semibold mb-6">Edit Recipe</h1>

      {/* Image box with inline preview */}
      <div className="mb-6">
        <label className="block text-sm mb-1">Image</label>

        <div
          className="relative group w-full h-48 sm:h-56 rounded-lg border border-neutral-700 overflow-hidden bg-neutral-900 cursor-pointer"
          onClick={() => inputRef.current && inputRef.current.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current && inputRef.current.click()}
          title="Click to choose an image"
        >
          {(previewUrl || currentImageUrl) ? (
            <>
              <img
                src={previewUrl || currentImageUrl}
                alt="Selected preview"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/50 text-[12px] text-white flex items-center justify-between px-3 py-1.5">
                <span className="truncate pr-2">{file?.name ?? 'Current image'}</span>
                <span className="underline opacity-80">Change</span>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearPickedFile() }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white"
                  title="Clear selected image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              <Upload className="w-5 h-5 mr-2" />
              Click to choose an image
            </div>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input name="title" value={form.title} onChange={onChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white" />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea rows={3} name="description" value={form.description} onChange={onChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white" />
        </div>

        <div>
          <label className="block text-sm mb-1">Instructions</label>
          <textarea rows={6} name="instructions" value={form.instructions} onChange={onChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white" />
        </div>

        {/* Ingredients editor */}
        <div>
          <label className="block text-sm mb-2">Ingredients</label>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ing.name}
                onChange={(e) => changeIngredient(idx, 'name', e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Quantity"
                value={ing.quantity}
                onChange={(e) => changeIngredient(idx, 'quantity', e.target.value)}
                className="w-40 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
              />
              <button
                type="button"
                onClick={() => removeIngredient(idx)}
                disabled={ingredients.length === 1}
                className={`text-red-400 hover:text-red-500 ${ingredients.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Remove ingredient"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addIngredient} className="mt-1 px-3 py-1 rounded-full text-sm bg-green-700 text-white hover:bg-green-800">
            + Add Ingredient
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Region</label>
            <input name="region" value={form.region} onChange={onChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm mb-1">Prep (min)</label>
            <input type="number" min="0" name="prepTimeMinutes" value={form.prepTimeMinutes} onChange={onChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm mb-1">Cook (min)</label>
            <input type="number" min="0" name="cookTimeMinutes" value={form.cookTimeMinutes} onChange={onChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white" />
          </div>
        </div>

        {/* Tag groups (single-select) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TAG_GROUPS.map(group => (
            <div key={group.key}>
              <label className="block text-sm mb-1">{group.label}</label>
              <select
                value={selectedGroups[group.key]}
                onChange={(e) => handleGroupChange(group.key, e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
              >
                <option value="">{group.placeholder}</option>
                {group.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Sensitivity (multi) */}
        <div>
          <label className="block text-sm mb-1">Sensitivity</label>
          <div className="flex flex-wrap gap-2">
            {SENSITIVITY_OPTIONS.map(opt => (
              <label key={opt} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                selectedSensitivities.includes(opt) ? 'border-emerald-500 bg-emerald-900/30' : 'border-neutral-700 bg-neutral-900'
              }`}>
                <input type="checkbox" checked={selectedSensitivities.includes(opt)} onChange={() => toggleSensitivity(opt)} className="accent-emerald-600" />
                <span className="text-sm text-white">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* NEW: Extra tags with autocomplete + chips */}
        <div>
          <label className="block text-sm mb-1">Extra Tags (optional)</label>

          {/* chips */}
          {extraTags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {extraTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-white text-sm">
                  {tag}
                  <button type="button" onClick={() => removeExtraTag(tag)} className="text-neutral-400 hover:text-red-400" aria-label={`Remove ${tag}`}>×</button>
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
                const disabled = lowerExtraSet.has(s.name.toLowerCase())
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

        {/* Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={onChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white">
              {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border border-neutral-600 text-neutral-200 hover:bg-neutral-800">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
