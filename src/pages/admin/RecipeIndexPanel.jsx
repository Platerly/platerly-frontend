import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL } from '../../utils/api'

const STATUS_COLOR = {
  Allowed:   'bg-green-100 text-green-700',
  Disallowed:'bg-red-100 text-red-700',
  Unchecked: 'bg-gray-100 text-gray-600',
}

export default function RecipeIndexPanel({ token }) {
  const [stats, setStats]           = useState(null)
  const [blocked, setBlocked]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [optOutDomain, setOptOutDomain] = useState('')
  const [optOutEmail, setOptOutEmail]   = useState('')
  const [optOutReason, setOptOutReason] = useState('')
  const [optOutMsg, setOptOutMsg]       = useState(null)
  const [submitting, setSubmitting]     = useState(false)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, blockedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/recipe-index/stats`,          { headers }),
        fetch(`${API_BASE_URL}/api/admin/recipe-index/blocked-domains`, { headers }),
      ])
      if (!statsRes.ok || !blockedRes.ok) throw new Error('Failed to load index data')
      setStats(await statsRes.json())
      setBlocked(await blockedRes.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => { load() }, [load])

  const handleOptOut = async (e) => {
    e.preventDefault()
    if (!optOutDomain.trim()) return
    setSubmitting(true)
    setOptOutMsg(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/recipe-index/opt-out`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          domain:       optOutDomain.trim().toLowerCase(),
          contactEmail: optOutEmail.trim() || null,
          reason:       optOutReason.trim() || 'Opt-out request',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed')
      setOptOutMsg({ ok: true, text: data.message })
      setOptOutDomain('')
      setOptOutEmail('')
      setOptOutReason('')
      load()
    } catch (ex) {
      setOptOutMsg({ ok: false, text: ex.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnblock = async (domain) => {
    if (!window.confirm(`Unblock ${domain}?`)) return
    await fetch(`${API_BASE_URL}/api/admin/recipe-index/blocked-domains/${encodeURIComponent(domain)}`, {
      method: 'DELETE', headers,
    })
    load()
  }

  if (loading) return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <p className="text-gray-500 text-sm">Loading recipe index data…</p>
    </div>
  )

  if (error) return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <p className="text-red-600 text-sm">{error}</p>
    </div>
  )

  return (
    <div className="mt-8 space-y-6">

      {/* ── Overview stats ─────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipe Index Engine</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Indexed',    value: stats.totalRecipes,    color: 'text-blue-600' },
            { label: 'Analysed',         value: stats.totalAnalysed,   color: 'text-green-600' },
            { label: 'Pending Analysis', value: stats.totalPending,    color: 'text-amber-600' },
            { label: 'Halal Discarded',  value: stats.totalDiscarded,  color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Per-domain breakdown ────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Domain Sources</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-4">Domain</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Robots</th>
                <th className="pb-2 pr-4">Indexed</th>
                <th className="pb-2 pr-4">Discarded</th>
                <th className="pb-2">Last Run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.domains.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-gray-800">{d.sourceDomain}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[d.robotsStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {d.robotsStatus}
                    </span>
                    {d.robotsDisallowNote && (
                      <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate" title={d.robotsDisallowNote}>
                        {d.robotsDisallowNote}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-700">{d.totalRecipesIndexed.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-gray-700">{d.totalRecipesDiscarded.toLocaleString()}</td>
                  <td className="py-2.5 text-gray-500 text-xs">
                    {d.lastIndexedAt ? new Date(d.lastIndexedAt).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Blocked domains ─────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Blocked Domains
          <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
            {blocked.length}
          </span>
        </h2>

        {blocked.length === 0 ? (
          <p className="text-sm text-gray-500">No domains blocked.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Domain</th>
                  <th className="pb-2 pr-4">Blocked At</th>
                  <th className="pb-2 pr-4">Reason</th>
                  <th className="pb-2 pr-4">Contact</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {blocked.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{b.domain}</td>
                    <td className="py-2.5 pr-4 text-gray-500 text-xs">
                      {new Date(b.blockedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 max-w-xs truncate" title={b.reason}>
                      {b.reason ?? '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 text-xs">{b.contactEmail ?? '—'}</td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleUnblock(b.domain)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Opt-out / manual block form ─────────────────────────── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Process Opt-Out Request</h2>
        <p className="text-sm text-gray-500 mb-4">
          Removes all recipes for the domain and permanently blocks future indexing.
        </p>

        <form onSubmit={handleOptOut} className="space-y-3 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Domain *</label>
            <input
              type="text"
              value={optOutDomain}
              onChange={e => setOptOutDomain(e.target.value)}
              placeholder="e.g. minimalistbaker.com"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact email (optional)</label>
            <input
              type="email"
              value={optOutEmail}
              onChange={e => setOptOutEmail(e.target.value)}
              placeholder="blogger@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={optOutReason}
              onChange={e => setOptOutReason(e.target.value)}
              placeholder="Opt-out request via email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {optOutMsg && (
            <div className={`rounded-lg px-4 py-2.5 text-sm ${optOutMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {optOutMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !optOutDomain.trim()}
            className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Processing…' : 'Process Opt-Out'}
          </button>
        </form>
      </div>

    </div>
  )
}
