import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../utils/api'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'



const EditProfileTab = () => {
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    profileImageUrl: ''
  })

  const [preview, setPreview] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const {token} = useAuth()
  

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/User/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to load profile')
        const data = await res.json()
        setForm({
          displayName: data.displayName || '',
          bio: data.bio || '',
          profileImageUrl: data.profileImageUrl || ''
        })
        setPreview(data.profileImageUrl || '')
      } catch (err) {
        console.error(err)
      }
    }

    fetchProfile()
  }, [token])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const uploaded = e.target.files[0]
    if (uploaded) {
      setFile(uploaded)
      setPreview(URL.createObjectURL(uploaded))
    }
  }

  const handleUploadImage = async () => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${API_BASE_URL}/api/User/upload-profile-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })

    if (!res.ok) throw new Error('Image upload failed')
    const data = await res.json()
    return data.imageUrl
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      let imageUrl = form.profileImageUrl

      if (file) {
        imageUrl = await handleUploadImage()
      }

      const res = await fetch(`${API_BASE_URL}/api/User/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: form.displayName,
          bio: form.bio,
          profileImageUrl: imageUrl
        })
      })

      if (!res.ok) throw new Error('Failed to update profile')
      setSuccessMessage('Profile updated!')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-white space-y-6">
     

      {preview && (
        <img
          src={preview}
          alt="Profile Preview"
          className="h-32 w-32 object-cover rounded-full border border-platerly-border mb-4"
        />
      )}

      <div>
        <label className="block text-sm font-medium text-platerly-subtle mb-1">Upload Profile Picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="text-sm text-platerly-subtle"
        />
      </div>

      <Input
        label="Display Name"
        name="displayName"
        value={form.displayName}
        onChange={handleChange}
        required
      />

      <Textarea
        label="Bio"
        name="bio"
        value={form.bio}
        onChange={handleChange}
        placeholder="Share a bit about yourself..."
      />

      <Button size="lg" onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>

      {successMessage && <p className="text-green-400 mt-3">{successMessage}</p>}
    </div>
  )
}

export default EditProfileTab
