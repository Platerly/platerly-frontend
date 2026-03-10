import React, { useEffect, useRef, useState } from 'react'
import { X, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { API_BASE_URL } from '../../utils/api'

const REASON_COLORS = {
  Allergy: 'bg-red-500/15 text-red-400 border-red-500/20',
  DietaryPreference: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Cost: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Taste: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Health: 'bg-green-500/15 text-green-400 border-green-500/20',
  Religious: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Availability: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  Other: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
}

const REASONS = Object.keys(REASON_COLORS)

function ConfidenceBar({ score }) {
  const pct = Math.max(0, Math.min(100, score ?? 0))
  const color = pct < 40 ? 'bg-red-500' : pct < 70 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 rounded-full bg-recipzee-light overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-recipzee-subtle w-7 text-right">{pct}%</span>
    </div>
  )
}

export default function SubstitutionPanel({ ingredient, onClose, token }) {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [votedIds, setVotedIds] = useState(new Set())
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [form, setForm] = useState({ name: '', reason: 'Taste', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const panelRef = useRef(null)

  // fetch substitutions when ingredient changes
  useEffect(() => {
    if (!ingredient?.name) return
    let mounted = true
    setLoading(true)
    setError(null)
    setSubs([])
    setVotedIds(new Set())
    fetch(`${API_BASE_URL}/api/substitution/ingredient/name/${encodeURIComponent(ingredient.name)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (mounted) setSubs(Array.isArray(data) ? data : []) })
      .catch(() => { if (mounted) setError('Failed to load substitutions') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [ingredient?.name])

  // ESC to close
  useEffect(() => {
    if (!ingredient) return
    const onKey = e => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ingredient, onClose])

  // scroll lock
  useEffect(() => {
    if (!ingredient) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [ingredient])

  if (!ingredient) return null

  const handleVote = async (sub, isPositive) => {
    if (votedIds.has(sub.id) || !token) return
    setVotedIds(prev => new Set(prev).add(sub.id))
    setSubs(prev => prev.map(s => s.id === sub.id
      ? {
          ...s,
          positiveVotes: s.positiveVotes + (isPositive ? 1 : 0),
          negativeVotes: s.negativeVotes + (isPositive ? 0 : 1)
        }
      : s
    ))
    try {
      const res = await fetch(`${API_BASE_URL}/api/substitution/${sub.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ IsPositive: isPositive })
      })
      if (!res.ok) throw new Error()
    } catch {
      // revert optimistic update
      setVotedIds(prev => { const n = new Set(prev); n.delete(sub.id); return n })
      setSubs(prev => prev.map(s => s.id === sub.id
        ? {
            ...s,
            positiveVotes: s.positiveVotes - (isPositive ? 1 : 0),
            negativeVotes: s.negativeVotes - (isPositive ? 0 : 1)
          }
        : s
      ))
    }
  }

  const handleUsed = subId => {
    if (!token) return
    fetch(`${API_BASE_URL}/api/substitution/${subId}/used`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {})
  }

  const handleSuggest = async e => {
    e.preventDefault()
    if (!form.name.trim() || !token) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/substitution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          originalIngredientName: ingredient.name,
          substituteIngredientName: form.name.trim(),
          reason: form.reason,
          notes: form.notes.trim() || null
        })
      })
      if (!res.ok) throw new Error()
      setForm({ name: '', reason: 'Taste', notes: '' })
      setSuggestOpen(false)
      // re-fetch to show new suggestion
      const data = await fetch(
        `${API_BASE_URL}/api/substitution/ingredient/name/${encodeURIComponent(ingredient.name)}`
      ).then(r => r.json())
      setSubs(Array.isArray(data) ? data : [])
    } catch {
      // silent — user can retry
    } finally {
      setSubmitting(false)
    }
  }

  const reasonColor = reason => REASON_COLORS[reason] ?? REASON_COLORS.Other

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Alternatives for ${ingredient.name}`}
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-recipzee-border bg-recipzee-card p-5 shadow-2xl animate-[slide-up_180ms_ease-out]"
      >
        {/* handle bar */}
        <div className="w-10 h-1 rounded-full bg-recipzee-border mx-auto mb-4" />

        {/* header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-recipzee-text">
              Alternatives for{' '}
              <span className="text-recipzee-green">{ingredient.name}</span>
            </h3>
            <p className="text-xs text-recipzee-subtle mt-0.5">Community-suggested substitutions</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-recipzee-subtle hover:bg-recipzee-light hover:text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-recipzee-border p-4 space-y-2">
                <div className="h-4 w-1/2 rounded bg-recipzee-light" />
                <div className="h-3 w-3/4 rounded bg-recipzee-light/70" />
                <div className="h-2 w-full rounded bg-recipzee-light/50" />
              </div>
            ))}
          </div>
        )}

        {/* error */}
        {!loading && error && (
          <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
            {error}
          </div>
        )}

        {/* empty state */}
        {!loading && !error && subs.length === 0 && (
          <div className="text-center py-8 text-recipzee-subtle">
            <p className="text-sm">No alternatives suggested yet.</p>
            <p className="text-xs mt-1">Be the first to suggest one below!</p>
          </div>
        )}

        {/* substitution list */}
        {!loading && !error && subs.length > 0 && (
          <ul className="space-y-3">
            {subs.map(sub => (
              <li key={sub.id} className="rounded-xl border border-recipzee-border bg-recipzee-light/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleUsed(sub.id)}
                        className="text-sm font-semibold text-recipzee-text hover:text-recipzee-green transition-colors text-left"
                        title="Mark as used"
                      >
                        {sub.substituteIngredientName}
                      </button>
                      {sub.isVerified && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-recipzee-green/15 text-recipzee-green text-[10px] font-bold border border-recipzee-green/20">
                          <Check className="w-2.5 h-2.5" />
                          Verified
                        </span>
                      )}
                      {sub.reason && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${reasonColor(sub.reason)}`}>
                          {sub.reason}
                        </span>
                      )}
                    </div>
                    {sub.conversionRatio != null && sub.conversionRatio !== 1 && (
                      <p className="text-xs text-recipzee-subtle mt-0.5">
                        Use {sub.conversionRatio}× the amount
                      </p>
                    )}
                    {sub.notes && (
                      <p className="text-xs text-recipzee-subtle mt-1 leading-relaxed">{sub.notes}</p>
                    )}
                    {sub.suggestedByUsername && (
                      <p className="text-[10px] text-recipzee-subtle/50 mt-1">by @{sub.suggestedByUsername}</p>
                    )}
                  </div>

                  {/* vote buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleVote(sub, true)}
                      disabled={votedIds.has(sub.id) || !token}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                        votedIds.has(sub.id)
                          ? 'text-recipzee-green bg-recipzee-green/10'
                          : token
                            ? 'text-recipzee-subtle hover:text-recipzee-green hover:bg-recipzee-green/10'
                            : 'text-recipzee-subtle/40 cursor-not-allowed'
                      }`}
                      title={token ? 'Helpful' : 'Sign in to vote'}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {sub.positiveVotes}
                    </button>
                    <button
                      onClick={() => handleVote(sub, false)}
                      disabled={votedIds.has(sub.id) || !token}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                        !token
                          ? 'text-recipzee-subtle/40 cursor-not-allowed'
                          : 'text-recipzee-subtle hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title={token ? 'Not helpful' : 'Sign in to vote'}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      {sub.negativeVotes}
                    </button>
                  </div>
                </div>

                <ConfidenceBar score={sub.confidenceScore} />
              </li>
            ))}
          </ul>
        )}

        {/* suggest alternative */}
        <div className="mt-5 border-t border-recipzee-border pt-4">
          <button
            onClick={() => setSuggestOpen(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-recipzee-subtle hover:text-recipzee-text transition-colors w-full"
          >
            {suggestOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Suggest an alternative
          </button>

          {suggestOpen && (
            <form onSubmit={handleSuggest} className="mt-3 space-y-3">
              {!token && (
                <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
                  Sign in to suggest alternatives
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-recipzee-subtle mb-1">
                  Substitute ingredient *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Greek yogurt"
                  required
                  disabled={!token}
                  className="w-full rounded-xl border border-recipzee-border bg-recipzee-light px-3 py-2 text-sm text-recipzee-text placeholder:text-recipzee-subtle focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-recipzee-subtle mb-1">Reason</label>
                <select
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  disabled={!token}
                  className="w-full rounded-xl border border-recipzee-border bg-recipzee-light px-3 py-2 text-sm text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 disabled:opacity-50"
                >
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-recipzee-subtle mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any usage tips..."
                  disabled={!token}
                  className="w-full rounded-xl border border-recipzee-border bg-recipzee-light px-3 py-2 text-sm text-recipzee-text placeholder:text-recipzee-subtle focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={!token || submitting || !form.name.trim()}
                className="w-full py-2.5 rounded-xl bg-recipzee-green text-recipzee-dark text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit suggestion'}
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`@keyframes slide-up{from{transform:translateY(16px);opacity:.8}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}
