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
    ingredients:[{ name: '', quantity: '' }],
    imageFile: null,
    imageUrl: '',
    imageBlobName: '',           // <-- NEW
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
      const file = files?.[0]
      if (file) {
        setForm((prev) => ({ ...prev, imageFile: file }))
        setPreviewUrl(URL.createObjectURL(file))
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Upload and capture BOTH imageUrl and blobName/imageBlobName
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

    const blobName = data.imageBlobName ?? data.blobName // support either key
    if (!data.imageUrl || !blobName) {
      throw new Error('Upload did not return imageUrl/blobName')
    }

    // store in state for payload + UI
    setForm((prev) => ({ ...prev, imageUrl: data.imageUrl, imageBlobName: blobName }))
    return { imageUrl: data.imageUrl, blobName }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1) Upload image (gets both values)
      const { imageUrl, blobName } =
        form.imageUrl && form.imageBlobName
          ? { imageUrl: form.imageUrl, blobName: form.imageBlobName }
          : await uploadImage()

      // 2) Parse ingredients lines: "Name - Qty"
      const ingredients = form.ingredients?.filter(i => i.name.trim().length > 0)


      // 3) Tags array
      const tags = form.tagsText
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      // 4) Build payload (INCLUDES imageBlobName)
      const payload = {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        region: form.region,
        imageUrl,
        imageBlobName: blobName,                 // <-- CRITICAL
        ingredients,
        tags,
        prepTimeMinutes: Number(form.prepTime) || 0,
        cookTimeMinutes: Number(form.cookTime) || 0,
        difficulty: form.difficulty
      }

      // Debug (optional): see exactly what we send
      // console.log('Create payload', payload)

      // 5) Create recipe
      const res = await fetch(`${API_BASE_URL}/api/Recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Recipe creation failed')
      }

      const created = await res.json()
      navigate(`/recipe/${created.id}`) // go to details
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Recipe Title" name="title" value={form.title} onChange={handleChange} required />
        <Input label="Region or Cuisine" name="region" value={form.region} onChange={handleChange} />
        <Textarea label="Description" name="description" value={form.description} onChange={handleChange} required />
        <Textarea label="Instructions" name="instructions" value={form.instructions} onChange={handleChange} required />
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
          setForm((prev) => ({ ...prev, ingredients: updated }))
        }
      }}
      disabled={form.ingredients.length === 1}
      className={`text-red-400 hover:text-red-500 text-sm transition ${
        form.ingredients.length === 1 ? 'opacity-50 cursor-not-allowed' : ''
      }`}
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

        <Input
          label="Tags (comma-separated)"
          name="tagsText"
          value={form.tagsText}
          onChange={handleChange}
          placeholder="e.g. spicy, low nickel, paleo"
        />

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
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-green-600 file:text-white
              hover:file:bg-green-700"
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

        <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
          {loading ? 'Publishing...' : 'Post Recipe'}
        </Button>
      </form>
    </div>
  )
}

export default CreateRecipe
