import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Upload, X } from 'lucide-react'

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard']

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
    tagsText: '',
  })

  // Image handling
  const [currentImageUrl, setCurrentImageUrl] = useState('') // from server
  const [file, setFile] = useState(null)                     // selected file
  const [previewUrl, setPreviewUrl] = useState('')           // object URL for preview
  const inputRef = useRef(null)

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Load recipe
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setLoading(true)
      setError('')
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
          tagsText: Array.isArray(recipe.tags) ? recipe.tags.join(', ') : (recipe.tags || ''),
        })
        setCurrentImageUrl(recipe.imageUrl || '')
      } catch (e) {
        console.error(e)
        if (isMounted) setError('Could not load this recipe.')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [id, token])

  const onPickFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (previewUrl) URL.revokeObjectURL(previewUrl) // cleanup previous
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const clearPickedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const fd = new FormData()
      if (form.title) fd.append('Title', form.title)
      if (form.description) fd.append('Description', form.description)
      if (form.instructions) fd.append('Instructions', form.instructions)
      if (form.region) fd.append('Region', form.region)
      if (form.tagsText) fd.append('Tags', form.tagsText)
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

      {/* Single clickable image box with inline preview */}
      <div className="mb-6">
        <label className="block text-sm mb-1">Image</label>

        <div
          className="relative group w-full h-48 sm:h-56 rounded-lg border border-neutral-700 overflow-hidden bg-neutral-900 cursor-pointer"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          title="Click to choose an image"
        >
          {(previewUrl || currentImageUrl) ? (
            <>
              <img
                src={previewUrl || currentImageUrl}
                alt="Selected preview"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />

              {/* Footer bar: filename + Change hint */}
              <div className="absolute inset-x-0 bottom-0 bg-black/50 text-[12px] text-white flex items-center justify-between px-3 py-1.5">
                <span className="truncate pr-2">
                  {file?.name ?? 'Current image'}
                </span>
                <span className="underline opacity-80">Change</span>
              </div>

              {/* Clear button shows only when new file is chosen */}
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
            // Empty state
            <div className="flex h-full items-center justify-center text-neutral-400">
              <Upload className="w-5 h-5 mr-2" />
              Click to choose an image
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onPickFile}
          className="hidden"
        />
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            rows={3}
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Instructions</label>
          <textarea
            rows={6}
            name="instructions"
            value={form.instructions}
            onChange={onChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Region</label>
            <input
              name="region"
              value={form.region}
              onChange={onChange}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Prep (min)</label>
            <input
              type="number"
              min="0"
              name="prepTimeMinutes"
              value={form.prepTimeMinutes}
              onChange={onChange}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Cook (min)</label>
            <input
              type="number"
              min="0"
              name="cookTimeMinutes"
              value={form.cookTimeMinutes}
              onChange={onChange}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Difficulty</label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={onChange}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
            >
              {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Tags (comma-separated)</label>
            <input
              name="tagsText"
              value={form.tagsText}
              onChange={onChange}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
