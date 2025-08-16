import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react' // ⬅️ Add this at the top

const RemixPage = () => {
  const { originalId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [region, setRegion] = useState('Unspecified')
  const [difficulty, setDifficulty] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [tags, setTags] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageBlobName, setImageBlobName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }])
  

useEffect(() => {
  const fetchOriginalRecipe = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Recipe/${originalId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch original recipe')

      const data = await response.json()

      setTitle(`Remix: ${data.title}`)
      setDescription(data.description || '')
      setInstructions(data.instructions || '')
      setRegion(data.region || 'Unspecified')
      setDifficulty(data.difficulty || '')
      setTags(data.tags?.join(', ') || '')
      setPrepTime(data.prepTimeMinutes?.toString() || '')
      setCookTime(data.cookTimeMinutes?.toString() || '')

      const normalizedIngredients = (data.ingredients || []).map(i => ({
        name: i.globalIngredientName || i.name || '',
        quantity: i.quantity || ''
      }))

      setIngredients(normalizedIngredients.length > 0 ? normalizedIngredients : [{ name: '', quantity: '' }])

    } catch (err) {
      console.error(err)
      alert('Failed to load original recipe for remixing.')
    }
  }

  fetchOriginalRecipe()
}, [originalId, token])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/upload-recipe-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) throw new Error('Image upload failed')
      const data = await res.json()
      setImageUrl(data.imageUrl)
      setImageBlobName(data.imageBlobName)
    } catch (err) {
      console.error(err)
      alert('Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }])
  }

  const handleRemoveIngredient = (index) => {
    if (ingredients.length === 1) return
    const updated = [...ingredients]
    updated.splice(index, 1)
    setIngredients(updated)
  }

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients]
    updated[index][field] = value
    setIngredients(updated)
  }

  const handleSubmit = async () => {
    const payload = {
      title,
      description,
      instructions,
      region,
      difficulty,
      prepTime: Number(prepTime) || 0,
      cookTime: Number(cookTime) || 0,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrl,
      imageBlobName,
      ingredients
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/Recipe/${originalId}/remix`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Remix creation failed')
      navigate('/feed')
    } catch (err) {
      console.error(err)
      alert('Failed to post remix.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-green-400">Remix Recipe</h1>

      <div className="space-y-6 bg-platerly-card border border-platerly-border rounded-xl p-6 shadow">

        {/* Title */}
        <input
          type="text"
          placeholder="Remix title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
        />

        {/* Description */}
        <textarea
          placeholder="Describe your remix..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white resize-none"
        />

        {/* Instructions */}
        <textarea
          placeholder="Instructions..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white resize-none"
        />

        {/* Region */}
        <input
          type="text"
          placeholder="Region (optional)"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
        />

        {/* Prep + Cook Time */}
        <div className="flex gap-4">
          <input
            type="number"
            placeholder="Prep time (min)"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            className="w-1/2 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
          />
          <input
            type="number"
            placeholder="Cook time (min)"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            className="w-1/2 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
          />
        </div>

        {/* Difficulty */}
        <input
          type="text"
          placeholder="Difficulty (Easy, Medium, Hard)"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
        />

        {/* Tags */}
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
        />

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-platerly-subtle">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="block text-sm text-gray-300 file:bg-green-600 file:text-white file:px-4 file:py-2 file:rounded-lg file:border-0 file:cursor-pointer"
          />
          {uploading && <p className="text-sm text-gray-400 mt-1">Uploading...</p>}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-4 w-full max-h-64 object-cover rounded-lg border border-neutral-700"
            />
          )}
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-semibold text-platerly-subtle mb-2">Ingredients</label>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Name"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded"
              />
              <input
                type="text"
                placeholder="Qty"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                className="w-24 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded"
              />
              <button
                type="button"
                onClick={() => handleRemoveIngredient(index)}
                disabled={ingredients.length === 1}
                className={`text-red-400 hover:text-red-600 ${
                  ingredients.length === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddIngredient}
            className="text-sm text-blue-400 hover:underline mt-2"
          >
            + Add another
          </button>
        </div>

        {/* Submit */}
        <div className="text-center pt-4">
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Post Remix
          </button>
        </div>
      </div>
    </div>
  )
}

export default RemixPage
