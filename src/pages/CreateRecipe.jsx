import { useEffect, useMemo, useRef, useState } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from "../utils/api";
import { useAuth } from '../context/AuthContext'

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
    prepTime: '', cookTime: '', difficulty: 'Easy',
  })

  const [selectedGroups, setSelectedGroups] = useState({ course:'', diet:'', style:'', health:'' })
  const [selectedSensitivities, setSelectedSensitivities] = useState([])

  const [tagQuery, setTagQuery] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [tagLoading, setTagLoading] = useState(false)
  const [extraTags, setExtraTags] = useState([])

  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { token } = useAuth()

  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  useEffect(() => { if (!token) navigate(`/login?next=/create`) }, [token, navigate])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'imageFile') {
      const file = files?.[0]
      if (file) {
        setForm((prev) => ({ ...prev, imageFile: file }))
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
    setError(''); setLoading(true)
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
        difficulty: form.difficulty
      }

      const res = await fetch(`${API_BASE_URL}/api/Recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Recipe creation failed')
      }
      const created = await res.json()
      navigate(`/recipe/${created.id}`)
    } catch (err) {
      console.error(err); setError(err.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="pl-card p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-platerly-text">
          Create a New Recipe
        </h1>

        {/* Required tags progress */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-900/20 text-emerald-200 ring-1 ring-emerald-700/40 px-2 py-0.5">
            Required tags: <strong className="ml-1">{singlesChosen}/{singlesNeeded} single-select</strong>
          </span>
          <span className={`rounded-full px-2 py-0.5 ring-1 ${hasSensitivity
              ? 'bg-emerald-900/20 text-emerald-200 ring-emerald-700/40'
              : 'bg-white/5 text-platerly-text ring-platerly-border'}`}>
            {hasSensitivity ? 'Sensitivity ✓' : 'Sensitivity required'}
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
                  className={`sm:col-span-1 h-[42px] rounded-lg border border-transparent text-red-300 hover:text-red-200 hover:bg-red-500/10 text-sm transition ${form.ingredients.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Remove ingredient">
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, ingredients: [...(prev.ingredients || []), { name: '', quantity: '' }] }))
              }
              className="mt-2 px-3 py-1.5 rounded-full text-sm bg-platerly-green text-black hover:brightness-110 ring-1 ring-platerly-green/40">
              + Add Ingredient
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
              <div className="mb-2 flex flex-wrap gap-2">
                {extraTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/20 text-emerald-200 ring-1 ring-emerald-700/40 text-sm">
                    {tag}
                    <button type="button" onClick={() => removeExtraTag(tag)} className="text-platerly-muted hover:text-platerly-text" aria-label={`Remove ${tag}`}>×</button>
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

          {/* Difficulty */}
          <div>
            <label className="pl-label mb-1 block">Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange} className="pl-select">
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Image */}
          <div>
            <label className="pl-label mb-1 block">Recipe Image</label>
            <input
              type="file" name="imageFile" accept="image/*" onChange={handleChange}
              className="block w-full text-sm text-platerly-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-platerly-green file:text-black hover:file:brightness-110"
              required
            />
            {previewUrl && (
              <>
                <img src={previewUrl} alt="Preview" className="mt-4 w-full h-56 object-cover rounded-lg border border-platerly-border shadow-sm" />
                {form.imageBlobName && (
                  <p className="mt-2 text-xs text-platerly-muted">
                    uploaded ✓ <code>{form.imageBlobName}</code>
                  </p>
                )}
              </>
            )}
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <Button type="submit" size="lg" className="pl-btn-primary w-full mt-2 !bg-platerly-green !text-black !border-0" disabled={!canSubmit}>
            {loading ? 'Publishing…' : 'Post Recipe'}
          </Button>

          {!canSubmit && (
            <p className="mt-2 text-xs text-platerly-muted text-center">
              Select one option for <strong>Course</strong>, <strong>Diet</strong>, <strong>Style</strong>, <strong>Healthiness</strong>, and at least one <strong>Sensitivity</strong>.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default CreateRecipe
