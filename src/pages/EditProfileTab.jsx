import React, { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '../utils/api'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

const MAX_IMG_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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
  const [errorText, setErrorText] = useState('')
  const { token } = useAuth()

  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])
  const fileInputRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/User/me`, { headers: { ...authHeader } })
        if (!res.ok) throw new Error('Failed to load profile')
        const data = await res.json()
        if (!isMounted) return
        setForm({
          displayName: data.displayName || '',
          bio: data.bio || '',
          profileImageUrl: data.profileImageUrl || ''
        })
        setPreview(data.profileImageUrl || '')
      } catch (err) {
        console.error(err)
        if (isMounted) setErrorText('Could not load your profile. Please try again.')
      }
    }

    if (token) fetchProfile()
    return () => {
      isMounted = false
    }
  }, [token, authHeader])

  // Revoke blob URLs on unmount or when preview changes
  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
  }, [preview])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImageChange = (e) => {
    setErrorText('')
    const uploaded = e.target.files?.[0]
    if (!uploaded) return

    if (!ACCEPTED_TYPES.includes(uploaded.type)) {
      setErrorText('Please select a JPG, PNG, or WebP image.')
      e.target.value = ''
      return
    }
    const sizeMb = uploaded.size / (1024 * 1024)
    if (sizeMb > MAX_IMG_MB) {
      setErrorText(`Image is too large (${sizeMb.toFixed(1)} MB). Max ${MAX_IMG_MB} MB.`)
      e.target.value = ''
      return
    }

    setFile(uploaded)
    const url = URL.createObjectURL(uploaded)
    setPreview((old) => {
      if (old?.startsWith('blob:')) URL.revokeObjectURL(old)
      return url
    })
  }

  const handleUploadImage = async () => {
    if (!file) return form.profileImageUrl
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${API_BASE_URL}/api/User/upload-profile-image`, {
      method: 'POST',
      headers: { ...authHeader },
      body: formData
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(txt || 'Image upload failed')
    }
    const data = await res.json()
    return data.imageUrl
  }

  const handleSave = async () => {
    setLoading(true)
    setErrorText('')
    setSuccessMessage('')
    try {
      let imageUrl = form.profileImageUrl
      if (file) imageUrl = await handleUploadImage()

      const res = await fetch(`${API_BASE_URL}/api/User/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          displayName: form.displayName,
          bio: form.bio,
          profileImageUrl: imageUrl
        })
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Failed to update profile')
      }

      setForm((prev) => ({ ...prev, profileImageUrl: imageUrl }))
      setSuccessMessage('Profile updated!')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      // auto-dismiss success after 3s
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setErrorText(err.message || 'Something went wrong while saving.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-white">
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold">Edit Profile</h2>

        {errorText && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {errorText}
          </div>
        )}
        {successMessage && (
          <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            {successMessage}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="shrink-0">
            {preview ? (
              <img
                src={preview}
                alt="Profile preview"
                className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-full border border-neutral-800"
                loading="lazy"
              />
            ) : (
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-neutral-800 border border-neutral-800 grid place-items-center text-neutral-400">
                No photo
              </div>
            )}
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-300 mb-1">Profile Picture</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
            />
            <p className="mt-1 text-xs text-neutral-500">JPG/PNG/WebP, up to {MAX_IMG_MB} MB.</p>
          </div>
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
          rows={4}
        />

        <div className="flex items-center gap-3">
          <Button size="lg" onClick={handleSave} disabled={loading} className="min-h-[44px]">
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
          {loading && <span className="text-sm text-neutral-400" aria-live="polite">Updating…</span>}
        </div>
      </div>
    </div>
  )
}

export default EditProfileTab
