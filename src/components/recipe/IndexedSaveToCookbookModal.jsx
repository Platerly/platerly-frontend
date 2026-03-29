import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, Loader2, BookmarkPlus, Check } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { usePremium } from '../../hooks/usePremium'

const FREE_SAVE_LIMIT = 3

export default function IndexedSaveToCookbookModal({ recipe, onClose, onSaved }) {
  const { token } = useAuth()
  const { isPremium, isOnTrial } = usePremium()
  const [cookbooks,  setCookbooks]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [savingId,   setSavingId]   = useState(null)
  const [error,      setError]      = useState('')
  const [savedCount, setSavedCount] = useState(0)
  const overlayRef = useRef(null)

  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  // Check current save count + fetch cookbooks
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const [cbRes, countRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/Cookbook/mine?page=1&pageSize=100`, { headers }),
          axios.get(`${API_BASE_URL}/api/indexed-recipes/saved/count`, { headers }).catch(() => ({ data: { count: 0 } })),
        ])
        if (!alive) return
        const items = Array.isArray(cbRes.data?.items) ? cbRes.data.items : (Array.isArray(cbRes.data) ? cbRes.data : [])
        setCookbooks(items)
        setSavedCount(countRes.data?.count ?? 0)
      } catch {
        setError('Could not load cookbooks.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(cookbookId) {
    if (!isPremium && !isOnTrial && savedCount >= FREE_SAVE_LIMIT) return // gate enforced by API too
    setSavingId(cookbookId)
    setError('')
    try {
      await axios.post(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/indexed-recipes`,
        { recipeIndexId: recipe.id },
        { headers }
      )
      onSaved?.(recipe.id)
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.response?.data ?? 'Failed to save.')
      setSavingId(null)
    }
  }

  const atFreeLimit = !isPremium && !isOnTrial && savedCount >= FREE_SAVE_LIMIT

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-recipzee-border bg-recipzee-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-recipzee-border">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-recipzee-green" />
            <h2 className="font-semibold text-recipzee-text text-sm">Save to Cookbook</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-recipzee-muted hover:text-recipzee-text hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipe name */}
        <div className="px-5 py-3 bg-recipzee-light/50 border-b border-recipzee-border">
          <p className="text-xs text-recipzee-muted">Saving:</p>
          <p className="text-sm font-medium text-recipzee-text line-clamp-1">{recipe.title}</p>
        </div>

        {/* Free tier limit gate */}
        {atFreeLimit ? (
          <div className="px-5 py-6 text-center space-y-3">
            <p className="text-sm text-recipzee-text font-medium">Cookbook saves limit reached</p>
            <p className="text-xs text-recipzee-muted">
              Free accounts can save up to {FREE_SAVE_LIMIT} indexed recipes. Upgrade to Premium for unlimited cookbook saves.
            </p>
            <a
              href="/account"
              className="inline-block rounded-xl bg-recipzee-yellow px-5 py-2.5 text-sm font-semibold text-recipzee-dark hover:opacity-90 transition-opacity"
            >
              Upgrade to Premium
            </a>
          </div>
        ) : loading ? (
          <div className="px-5 py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-recipzee-muted" />
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {cookbooks.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-recipzee-muted">You don't have any cookbooks yet.</p>
                <a href="/cookbooks" className="text-xs text-recipzee-green hover:underline mt-1 inline-block">Create a cookbook →</a>
              </div>
            ) : (
              cookbooks.map(cb => (
                <button
                  key={cb.id}
                  onClick={() => handleSave(cb.id)}
                  disabled={!!savingId}
                  className="flex w-full items-center gap-3 px-5 py-3 hover:bg-recipzee-light text-left transition-colors disabled:opacity-60"
                >
                  {savingId === cb.id
                    ? <Loader2 className="w-4 h-4 animate-spin text-recipzee-muted flex-shrink-0" />
                    : <Check className="w-4 h-4 text-transparent group-hover:text-recipzee-green flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-recipzee-text truncate">{cb.name ?? cb.title}</p>
                    {cb.recipeCount != null && (
                      <p className="text-xs text-recipzee-muted">{cb.recipeCount} recipes</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {error && (
          <div className="px-5 py-3 border-t border-recipzee-border">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
