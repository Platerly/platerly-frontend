import { useState } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from "../utils/api";
import { useAuth } from '../context/AuthContext'

const CreateRecipe = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    region: '',
    ingredientsText: '',
    imageFile: null,
    imageUrl: '',
    tagsText: '',
    prepTime: '',
    cookTime: '',
    difficulty: 'Easy',
  })

  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { token } = useAuth()

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'imageFile') {
      const file = files[0]
      if (file) {
        setForm({ ...form, imageFile: file })
        setPreviewUrl(URL.createObjectURL(file))
      }
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const uploadImage = async () => {
    const formData = new FormData()
    formData.append('file', form.imageFile)

    const response = await fetch(`${API_BASE_URL}/api/recipe/upload-recipe-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })

    if (!response.ok) throw new Error('Image upload failed')
    const data = await response.json()
    return data.imageUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const imageUrl = await uploadImage()

      const ingredients = form.ingredientsText.split('\n').map(line => {
        const [name, quantity] = line.split('-').map(str => str.trim())
        return { name, quantity }
      })

      const tags = form.tagsText
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const payload = {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        region: form.region,
        imageUrl,
        ingredients,
        tags,
        prepTimeMinutes: parseInt(form.prepTime),
        cookTimeMinutes: parseInt(form.cookTime),
        difficulty: form.difficulty
      }

      const response = await fetch(`${API_BASE_URL}/api/Recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Recipe creation failed')
      navigate('/feed')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 bg-platerly-card border border-platerly-border rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold text-center text-white mb-8">
        🍽️ Create a New Recipe
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Recipe Title" name="title" value={form.title} onChange={handleChange} required />
        <Input label="Region or Cuisine" name="region" value={form.region} onChange={handleChange} />
        <Textarea label="Description" name="description" value={form.description} onChange={handleChange} required />
        <Textarea label="Instructions" name="instructions" value={form.instructions} onChange={handleChange} required />
        <Textarea label="Ingredients (one per line, use dash for quantity)" name="ingredientsText" value={form.ingredientsText} onChange={handleChange} placeholder={`e.g.\nBasmati Rice - 2 cups\nChicken Thighs - 500g`} required />

        <Input label="Tags (comma-separated)" name="tagsText" value={form.tagsText} onChange={handleChange} placeholder="e.g. spicy, low nickel, paleo" />

        <div className="flex space-x-4">
          <Input label="Prep Time (mins)" name="prepTime" value={form.prepTime} onChange={handleChange} type="number" min="0" />
          <Input label="Cook Time (mins)" name="cookTime" value={form.cookTime} onChange={handleChange} type="number" min="0" />
        </div>

        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-1">
            Difficulty
          </label>
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
          <label className="block text-sm font-medium text-platerly-subtle mb-1">
            Recipe Image
          </label>
          <input
            type="file"
            name="imageFile"
            accept="image/*"
            onChange={handleChange}
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-green-600 file:text-white
            hover:file:bg-green-700"
            required
          />

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="mt-4 w-full h-56 object-cover rounded-lg border border-neutral-700 shadow-sm"
            />
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
          {loading ? 'Publishing...' : 'Post Recipe'}
        </Button>
      </form>
    </div>
  )
}

export default CreateRecipe
