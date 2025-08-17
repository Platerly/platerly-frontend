import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const RemixPage = () => {
  const { originalId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [region, setRegion] = useState('')
  const [difficulty, setDifficulty] = useState('Easy')
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
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) throw new Error('Failed to fetch original recipe')
        const res = await response.json()
        const data = res.recipe

        setTitle(`${data.title || ''}`)
        setDescription(data.description || '')
        setInstructions(data.instructions || '')
        setRegion(data.region || '')
        setDifficulty(data.difficulty || 'Easy')
        setTags(data.tags || '')
        setPrepTime(data.prepTimeMinutes?.toString() || '')
        setCookTime(data.cookTimeMinutes?.toString() || '')
        setImageUrl(data.imageUrl || '')

        const normalizedIngredients = (data.ingredients || []).map(i => ({
          name: i.name || '',
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

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients]
    updated[index][field] = value
    setIngredients(updated)
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
    <div className="max-w-3xl mx-auto px-6 py-12 bg-platerly-card border border-platerly-border rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold text-center text-white mb-8">🎧 Remix Recipe</h1>

      <div className="space-y-6">
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

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">Ingredients</label>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded"
              />
              <input
                type="text"
                placeholder="Quantity"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                className="w-1/3 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded"
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
            className="mt-2 px-3 py-1 rounded-full text-sm bg-green-700 text-white hover:bg-green-800"
          >
            + Add Ingredient
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. spicy, low nickel"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
          />
        </div>

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

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-2">Recipe Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-green-600 file:text-white
              hover:file:bg-green-700"
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-4 w-full h-56 object-cover rounded-lg border border-neutral-700 shadow-sm"
            />
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Post Remix
          </button>
        </div>
      </div>
    </div>
  )
}

export default RemixPage
