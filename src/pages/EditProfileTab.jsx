/**
 * EditProfileTab
 *
 * Layer: Settings sub-component (rendered inside SettingsPage under the "Profile" tab).
 *        Also used standalone in some contexts.
 * Route: /settings?tab=profile
 *
 * What this page does:
 *  - Loads the current user's profile from GET /api/User/me
 *  - Lets the user update displayName, bio, and profile image
 *  - Profile image upload: file → FormData POST /api/User/upload-profile-image
 *    Returns a URL that is immediately previewed and stored in form state
 *  - On save: PATCH /api/User/me with the updated fields, then calls AuthContext.updateUser()
 *    to reflect the changes in the auth context without a full page reload
 *  - Image validation: max 5 MB, JPEG/PNG/WebP only (client-side guard before upload)
 *
 * State managed:
 *  - form: {displayName, bio, profileImageUrl}
 *  - preview — object URL for local image preview before upload completes
 *  - file — the selected File object awaiting upload
 *  - loading, successMessage, errorText
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '../utils/api'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { Camera, User } from 'lucide-react'

const MAX_IMG_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** @returns {JSX.Element} */
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
  const { token, updateUser } = useAuth()

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
        logger.error(err)
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
      // Sync changes to AuthContext so navbar/other components reflect updates immediately
      updateUser({
        displayName: form.displayName,
        bio: form.bio,
        profileImageUrl: imageUrl
      })
      setSuccessMessage('Profile updated!')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      // auto-dismiss success after 3s
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      logger.error(err)
      setErrorText(err.message || 'Something went wrong while saving.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-recipzee-text">
      <div className="bg-recipzee-card/80 backdrop-blur-sm border border-recipzee-border rounded-2xl p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-recipzee-green/20 flex items-center justify-center">
            <User className="w-5 h-5 text-recipzee-green" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-recipzee-text">Edit Profile</h2>
        </div>

        {errorText && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {errorText}
          </div>
        )}
        {successMessage && (
          <div className="text-sm text-recipzee-green bg-recipzee-green/10 border border-recipzee-green/20 rounded-xl p-3">
            {successMessage}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="shrink-0 relative group">
            {preview ? (
              <img
                src={preview}
                alt="Profile preview"
                className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-2xl border-2 border-recipzee-border group-hover:border-recipzee-green/30 transition-colors"
                loading="lazy"
              />
            ) : (
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-recipzee-light border-2 border-recipzee-border group-hover:border-recipzee-green/30 transition-colors grid place-items-center text-recipzee-subtle">
                <User className="w-10 h-10" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-recipzee-green text-recipzee-dark flex items-center justify-center shadow-lg shadow-recipzee-green/20 hover:opacity-90 transition-opacity"
              aria-label="Change profile picture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-recipzee-text mb-1">Profile Picture</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-recipzee-subtle file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-recipzee-green file:text-recipzee-dark hover:file:opacity-90 file:transition-opacity file:cursor-pointer"
            />
            <p className="mt-1 text-xs text-recipzee-muted">JPG/PNG/WebP, up to {MAX_IMG_MB} MB.</p>
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
          {loading && <span className="text-sm text-recipzee-subtle" aria-live="polite">Updating…</span>}
        </div>
      </div>
    </div>
  )
}

export default EditProfileTab
