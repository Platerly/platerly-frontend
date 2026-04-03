/**
 * B2BBillingPage.jsx — Layer: Authenticated / B2B billing management
 *
 * Allows a logged-in user to view and manage their B2B API subscription:
 *  - Current plan tier, status, and renewal date
 *  - Upgrade/downgrade via Stripe Customer Portal
 *  - Cancel (sets cancel_at_period_end) / Resume cancellation
 *  - Invoice history (last 24 invoices)
 *  - Company name and billing email update
 *
 * URL: /b2b/billing
 * Protected: requires JWT auth (RequireAuth wrapper in AppRoutes).
 *
 * Query param handling (mirrors BillingPanel.jsx pattern):
 *  ?sub=success  — shown after successful checkout redirect from Stripe
 *  ?sub=cancel   — shown when user cancels Stripe checkout
 *  ?portal=return — shown after returning from Stripe Customer Portal
 */
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  CreditCard, FileText, ExternalLink, Settings, AlertCircle,
  CheckCircle2, ChevronRight, Building2, ArrowUpRight, Loader2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useB2BSubscription } from '../../hooks/useB2BSubscription'
import { API_BASE_URL } from '../../utils/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_LABELS = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

const TIER_COLORS = {
  starter: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  professional: 'text-recipzee-green bg-recipzee-green/10 border-recipzee-green/30',
  enterprise: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function B2BBillingPage() {
  const { user, token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isActive, planTier, planStatus, cancelAtPeriodEnd, currentPeriodEnd, subscribedSince, companyName, billingEmail, loading, refetch } = useB2BSubscription()

  const [invoices, setInvoices] = useState([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // 'portal' | 'cancel' | 'resume' | 'update'
  const [actionError, setActionError] = useState(null)

  // Company name / billing email edit state
  const [editCompany, setEditCompany] = useState('')
  const [editBillingEmail, setEditBillingEmail] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)

  const subParam = searchParams.get('sub')
  const portalParam = searchParams.get('portal')

  // On return from Stripe Checkout or Portal — refetch status
  useEffect(() => {
    if (subParam === 'success' || portalParam === 'return') {
      refetch()
    }
  }, [subParam, portalParam, refetch])

  // Fetch invoices once we know the user is active
  useEffect(() => {
    if (!isActive || !user?.id || !token) return
    setInvoicesLoading(true)
    fetch(`${API_BASE_URL}/api/b2b-billing/invoices?userId=${encodeURIComponent(user.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setInvoices(data.invoices ?? []))
      .catch(() => {})
      .finally(() => setInvoicesLoading(false))
  }, [isActive, user?.id, token])

  // Populate edit form when data loads
  useEffect(() => {
    setEditCompany(companyName ?? '')
    setEditBillingEmail(billingEmail ?? '')
  }, [companyName, billingEmail])

  async function post(path, body) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Error ${res.status}`)
    }
    return res.json()
  }

  async function handlePortal() {
    setActionLoading('portal')
    setActionError(null)
    try {
      const { url } = await post('/api/b2b-billing/create-portal-session', { userId: user.id })
      window.location.href = url
    } catch (err) {
      setActionError(err.message)
      setActionLoading(null)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel your B2B subscription at the end of the current period?')) return
    setActionLoading('cancel')
    setActionError(null)
    try {
      await post('/api/b2b-billing/cancel-subscription', { userId: user.id })
      await refetch()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResume() {
    setActionLoading('resume')
    setActionError(null)
    try {
      await post('/api/b2b-billing/resume-subscription', { userId: user.id })
      await refetch()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleUpdateAccount(e) {
    e.preventDefault()
    setActionLoading('update')
    setActionError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/b2b-billing/account`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, companyName: editCompany, billingEmail: editBillingEmail }),
      })
      if (!res.ok) throw new Error(await res.text())
      await refetch()
      setShowEditForm(false)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  function dismissParam(param) {
    const next = new URLSearchParams(searchParams)
    next.delete(param)
    setSearchParams(next, { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-recipzee-dark flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-recipzee-muted" />
      </div>
    )
  }

  const tierLabel = planTier ? (TIER_LABELS[planTier] ?? planTier) : null
  const tierColorClass = planTier ? (TIER_COLORS[planTier] ?? 'text-recipzee-muted bg-white/5 border-white/10') : ''

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Stripe redirect banners ── */}
      {subParam === 'success' && (
        <div className="mb-5 flex items-start gap-3 bg-recipzee-green/10 border border-recipzee-green/30 rounded-xl px-4 py-3 text-sm text-recipzee-green">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Subscription activated!</p>
            <p className="text-recipzee-green/70 mt-0.5">Your B2B plan is now active. Your API keys will work at the new quota.</p>
            <button onClick={() => dismissParam('sub')} className="text-xs underline mt-1 opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        </div>
      )}
      {subParam === 'cancel' && (
        <div className="mb-5 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            Checkout cancelled — no charge was made.
            <button onClick={() => dismissParam('sub')} className="text-xs underline ml-2 opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        </div>
      )}
      {portalParam === 'return' && (
        <div className="mb-5 flex items-start gap-3 bg-recipzee-card border border-white/10 rounded-xl px-4 py-3 text-sm text-recipzee-subtle">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-recipzee-green" />
          <div>
            Changes saved.
            <button onClick={() => dismissParam('portal')} className="text-xs underline ml-2 opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {actionError && (
        <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-auto text-xs underline opacity-70">Dismiss</button>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-1">B2B Billing</h1>
      <p className="text-recipzee-muted text-sm mb-8">Manage your Recipzee API subscription and invoices.</p>

      {/* ── Current plan ── */}
      <section className="bg-recipzee-card border border-white/10 rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CreditCard size={16} className="text-recipzee-muted" />
            Current Plan
          </h2>
          {isActive && (
            <button
              onClick={handlePortal}
              disabled={actionLoading !== null}
              className="text-xs text-recipzee-muted hover:text-recipzee-text flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'portal' ? <Loader2 size={12} className="animate-spin" /> : <Settings size={12} />}
              Manage in Stripe
            </button>
          )}
        </div>

        {isActive ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {tierLabel && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${tierColorClass}`}>
                  {tierLabel}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                planStatus === 'active' ? 'bg-recipzee-green/10 text-recipzee-green'
                : planStatus === 'past_due' ? 'bg-amber-400/10 text-amber-400'
                : 'bg-white/5 text-recipzee-muted'
              }`}>
                {planStatus ?? 'active'}
              </span>
            </div>

            {cancelAtPeriodEnd ? (
              <div className="flex items-start gap-2 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300">
                  Subscription ends on {formatDate(currentPeriodEnd)}.{' '}
                  <button
                    onClick={handleResume}
                    disabled={actionLoading !== null}
                    className="underline hover:no-underline disabled:opacity-50"
                  >
                    {actionLoading === 'resume' ? 'Resuming…' : 'Undo cancellation'}
                  </button>
                </p>
              </div>
            ) : (
              <p className="text-xs text-recipzee-muted">
                Renews on <span className="text-recipzee-subtle">{formatDate(currentPeriodEnd)}</span>
              </p>
            )}

            {subscribedSince && (
              <p className="text-xs text-recipzee-muted">
                Subscribed since <span className="text-recipzee-subtle">{formatDate(subscribedSince)}</span>
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-recipzee-muted text-sm mb-4">You don't have an active B2B subscription.</p>
            <Link
              to="/b2b/pricing"
              className="inline-flex items-center gap-1.5 bg-recipzee-green text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-recipzee-green/90 transition-colors"
            >
              View Plans <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* ── Account details ── */}
      <section className="bg-recipzee-card border border-white/10 rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Building2 size={16} className="text-recipzee-muted" />
            Account Details
          </h2>
          <button
            onClick={() => setShowEditForm(v => !v)}
            className="text-xs text-recipzee-muted hover:text-recipzee-text transition-colors"
          >
            {showEditForm ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {showEditForm ? (
          <form onSubmit={handleUpdateAccount} className="space-y-3">
            <div>
              <label className="block text-xs text-recipzee-muted mb-1">Company name</label>
              <input
                type="text"
                value={editCompany}
                onChange={e => setEditCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full bg-recipzee-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-recipzee-text placeholder:text-recipzee-muted focus:outline-none focus:border-recipzee-green/50"
              />
            </div>
            <div>
              <label className="block text-xs text-recipzee-muted mb-1">Billing email</label>
              <input
                type="email"
                value={editBillingEmail}
                onChange={e => setEditBillingEmail(e.target.value)}
                placeholder="billing@company.com"
                className="w-full bg-recipzee-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-recipzee-text placeholder:text-recipzee-muted focus:outline-none focus:border-recipzee-green/50"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={actionLoading !== null}
                className="bg-recipzee-green text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-recipzee-green/90 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'update' ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="text-sm text-recipzee-muted hover:text-recipzee-text px-4 py-2 rounded-lg border border-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-recipzee-muted">Company</span>
              <span className="text-recipzee-subtle">{companyName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-recipzee-muted">Billing email</span>
              <span className="text-recipzee-subtle">{billingEmail || user?.email || '—'}</span>
            </div>
          </div>
        )}
      </section>

      {/* ── Danger zone (cancel) ── */}
      {isActive && !cancelAtPeriodEnd && (
        <section className="bg-recipzee-card border border-white/10 rounded-2xl p-6 mb-5">
          <h2 className="font-semibold mb-3 text-sm text-recipzee-muted">Danger Zone</h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-recipzee-text">Cancel subscription</p>
              <p className="text-xs text-recipzee-muted mt-0.5">
                Access continues until {formatDate(currentPeriodEnd)}. You can re-subscribe at any time.
              </p>
            </div>
            <button
              onClick={handleCancel}
              disabled={actionLoading !== null}
              className="shrink-0 text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'cancel' ? 'Cancelling…' : 'Cancel plan'}
            </button>
          </div>
        </section>
      )}

      {/* ── Upgrade / change plan ── */}
      {isActive && (
        <section className="bg-recipzee-card border border-white/10 rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Upgrade or change plan</p>
              <p className="text-xs text-recipzee-muted mt-0.5">Switch to a different tier via the Stripe portal.</p>
            </div>
            <Link
              to="/b2b/pricing"
              className="shrink-0 text-xs text-recipzee-green border border-recipzee-green/30 px-3 py-1.5 rounded-lg hover:bg-recipzee-green/10 transition-colors flex items-center gap-1"
            >
              View plans <ArrowUpRight size={12} />
            </Link>
          </div>
        </section>
      )}

      {/* ── Invoice history ── */}
      {isActive && (
        <section className="bg-recipzee-card border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText size={16} className="text-recipzee-muted" />
            Invoice History
          </h2>

          {invoicesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-recipzee-muted" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-recipzee-muted text-sm text-center py-4">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map(inv => (
                <div
                  key={inv.invoiceId}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-sm text-recipzee-subtle">{formatDate(inv.created)}</p>
                    {inv.number && (
                      <p className="text-xs text-recipzee-muted">{inv.number}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatCurrency(inv.amountPaid, inv.currency)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.status === 'paid' ? 'bg-recipzee-green/10 text-recipzee-green'
                      : 'bg-amber-400/10 text-amber-400'
                    }`}>
                      {inv.status}
                    </span>
                    {(inv.pdfUrl || inv.hostedUrl) && (
                      <a
                        href={inv.pdfUrl ?? inv.hostedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-recipzee-muted hover:text-recipzee-text transition-colors"
                        title="View invoice"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
