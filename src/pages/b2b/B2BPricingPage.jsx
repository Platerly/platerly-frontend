/**
 * B2BPricingPage.jsx — Layer: Public / B2B marketing
 *
 * Displays available B2B API subscription plans with feature breakdowns.
 * Authenticated users get a "Subscribe" button that starts the Stripe Checkout
 * flow; guests are directed to log in first.
 *
 * Plan definitions are maintained in the PLANS constant below.
 * Price IDs must match the StripeB2B config keys in appsettings.json.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Zap, Building2, Rocket, ArrowRight, ShieldCheck, BarChart3, Webhook, Globe2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useB2BSubscription } from '../../hooks/useB2BSubscription'
import { API_BASE_URL } from '../../utils/api'
import Footer from '../../components/Footer'

// ── Plan data ─────────────────────────────────────────────────────────────────
// PriceId values must match StripeB2B config in appsettings.json.
// Replace placeholder values once real Stripe price IDs are configured.

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-400/10',
    monthlyPriceLabel: '$499',
    annualPriceLabel: '$4,990',
    annualSavings: 'Save $998',
    description: 'For indie developers and small food-tech teams getting started with allergen data.',
    priceIdMonthly: 'price_b2b_starter_monthly_placeholder',
    priceIdAnnual: 'price_b2b_starter_annual_placeholder',
    features: [
      '10,000 API calls / month',
      'Allergen Intelligence (FDA Big 9 + EU 14)',
      'Nickel content data',
      'Substitution Engine',
      'Recipe Safety Audit',
      'Standard support (email)',
      '99.5% SLA',
    ],
    notIncluded: [
      'Regional demand data',
      'Dietary trend analytics',
      'White-label widget',
      'Webhooks',
      'Dedicated account manager',
    ],
    highlighted: false,
    contactUs: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Building2,
    iconColor: 'text-recipzee-green',
    iconBg: 'bg-recipzee-green/10',
    monthlyPriceLabel: '$1,299',
    annualPriceLabel: '$12,990',
    annualSavings: 'Save $2,598',
    description: 'For growing food-tech companies that need richer analytics and higher throughput.',
    priceIdMonthly: 'price_b2b_professional_monthly_placeholder',
    priceIdAnnual: 'price_b2b_professional_annual_placeholder',
    features: [
      '100,000 API calls / month',
      'Everything in Starter',
      'Regional demand & shopping analytics',
      'Dietary trend analytics',
      'White-label allergen widget',
      'Webhooks (real-time ingredient alerts)',
      'Priority support (email + Slack)',
      '99.9% SLA',
    ],
    notIncluded: [
      'Dedicated account manager',
      'Custom data pipelines',
    ],
    highlighted: true,
    contactUs: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Rocket,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-400/10',
    monthlyPriceLabel: '$3,499',
    annualPriceLabel: '$34,990',
    annualSavings: 'Save $6,998',
    description: 'For enterprises, clinical platforms, and teams needing unlimited scale and custom SLAs.',
    priceIdMonthly: null,
    priceIdAnnual: null,
    features: [
      'Unlimited API calls',
      'Everything in Professional',
      'Dedicated account manager',
      'Custom data pipelines',
      'HIPAA / PIPEDA compliance review',
      'Custom SLA (up to 99.99%)',
      'Onboarding & integration support',
      'Clinical Research data add-on available',
    ],
    notIncluded: [],
    highlighted: false,
    contactUs: true,
  },
]

// ── Feature comparison table rows ────────────────────────────────────────────

const COMPARISON_ROWS = [
  { label: 'Monthly API calls', starter: '10,000', professional: '100,000', enterprise: 'Unlimited (custom)' },
  { label: 'Allergen Intelligence', starter: true, professional: true, enterprise: true },
  { label: 'Nickel content data', starter: true, professional: true, enterprise: true },
  { label: 'Substitution Engine', starter: true, professional: true, enterprise: true },
  { label: 'Recipe Safety Audit', starter: true, professional: true, enterprise: true },
  { label: 'Regional demand data', starter: false, professional: true, enterprise: true },
  { label: 'Dietary trend analytics', starter: false, professional: true, enterprise: true },
  { label: 'White-label widget', starter: false, professional: true, enterprise: true },
  { label: 'Webhooks', starter: false, professional: true, enterprise: true },
  { label: 'Dedicated account manager', starter: false, professional: false, enterprise: true },
  { label: 'Custom SLA', starter: '99.5%', professional: '99.9%', enterprise: '99.99%' },
  { label: 'Support', starter: 'Email', professional: 'Email + Slack', enterprise: 'Dedicated' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function B2BPricingPage() {
  const navigate = useNavigate()
  const { authed, user, token } = useAuth()
  const { isActive, planTier } = useB2BSubscription()
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'annual'
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubscribe(plan) {
    if (!authed) {
      navigate('/login?redirect=/b2b/pricing')
      return
    }

    const priceId = billing === 'annual' ? plan.priceIdAnnual : plan.priceIdMonthly

    setLoadingPlan(plan.id)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/b2b-billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, priceId }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status}`)
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      setError(err.message || 'Could not start checkout. Please try again.')
      setLoadingPlan(null)
    }
  }

  function cellValue(val) {
    if (val === true) return <Check size={16} className="text-recipzee-green mx-auto" />
    if (val === false) return <span className="text-recipzee-muted text-xs">—</span>
    return <span className="text-recipzee-subtle text-xs">{val}</span>
  }

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text">

      {/* ── Hero ── */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-recipzee-green/10 text-recipzee-green text-xs font-medium px-3 py-1 rounded-full mb-4">
          <ShieldCheck size={13} />
          Recipzee Allergen Intelligence API
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Simple, transparent B2B pricing</h1>
        <p className="text-recipzee-muted max-w-xl mx-auto mb-8 text-sm">
          Choose the plan that fits your scale. Upgrade, downgrade, or cancel at any time from your billing dashboard.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center bg-recipzee-card border border-white/10 rounded-lg p-1 gap-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              billing === 'monthly'
                ? 'bg-recipzee-green text-black font-medium'
                : 'text-recipzee-muted hover:text-recipzee-text'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
              billing === 'annual'
                ? 'bg-recipzee-green text-black font-medium'
                : 'text-recipzee-muted hover:text-recipzee-text'
            }`}
          >
            Annual
            <span className="text-[10px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded font-normal">
              Save ~17%
            </span>
          </button>
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map(plan => {
            const Icon = plan.icon
            const price = billing === 'annual' ? plan.annualPriceLabel : plan.monthlyPriceLabel
            const isCurrentPlan = isActive && planTier === plan.id

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlighted
                    ? 'border-recipzee-green/50 bg-recipzee-green/5'
                    : 'border-white/10 bg-recipzee-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-recipzee-green text-black text-[11px] font-semibold px-3 py-0.5 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.iconBg}`}>
                  <Icon size={18} className={plan.iconColor} />
                </div>

                <h2 className="text-lg font-semibold mb-1">{plan.name}</h2>
                <p className="text-recipzee-muted text-xs mb-4 leading-relaxed">{plan.description}</p>

                <div className="mb-1">
                  <span className="text-3xl font-bold">{price}</span>
                  <span className="text-recipzee-muted text-sm ml-1">
                    {billing === 'annual' ? '/ year' : '/ month'}
                  </span>
                </div>
                {billing === 'annual' && (
                  <p className="text-recipzee-green text-xs mb-4">{plan.annualSavings} vs monthly</p>
                )}
                {billing === 'monthly' && <div className="mb-4" />}

                {isCurrentPlan ? (
                  <Link
                    to="/b2b/billing"
                    className="w-full text-center py-2.5 rounded-lg border border-recipzee-green text-recipzee-green text-sm font-medium mb-5 block hover:bg-recipzee-green/10 transition-colors"
                  >
                    Manage Plan
                  </Link>
                ) : plan.contactUs ? (
                  <a
                    href="mailto:api@recipzee.com?subject=Enterprise%20API%20Inquiry"
                    className="w-full py-2.5 rounded-lg text-sm font-medium mb-5 transition-colors border border-white/20 text-recipzee-text hover:border-white/40 flex items-center justify-center"
                  >
                    Contact us
                  </a>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium mb-5 transition-colors ${
                      plan.highlighted
                        ? 'bg-recipzee-green text-black hover:bg-recipzee-green/90 disabled:opacity-50'
                        : 'border border-white/20 text-recipzee-text hover:border-white/40 disabled:opacity-50'
                    }`}
                  >
                    {loadingPlan === plan.id ? 'Redirecting…' : authed ? 'Subscribe' : 'Get Started'}
                  </button>
                )}

                <ul className="space-y-2 text-sm flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-recipzee-subtle">
                      <Check size={14} className="text-recipzee-green mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map(f => (
                    <li key={f} className="flex items-start gap-2 text-recipzee-muted/50 line-through">
                      <span className="w-3.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* ── Feature comparison table ── */}
        <div className="mt-14">
          <h2 className="text-xl font-semibold text-center mb-6">Full feature comparison</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-recipzee-card/50">
                  <th className="text-left px-4 py-3 text-recipzee-muted font-medium w-1/2">Feature</th>
                  <th className="text-center px-4 py-3 text-sky-400 font-medium">Starter</th>
                  <th className="text-center px-4 py-3 text-recipzee-green font-medium">Professional</th>
                  <th className="text-center px-4 py-3 text-purple-400 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                  >
                    <td className="px-4 py-2.5 text-recipzee-subtle flex items-center gap-2">
                      {row.label}
                    </td>
                    <td className="px-4 py-2.5 text-center">{cellValue(row.starter)}</td>
                    <td className="px-4 py-2.5 text-center">{cellValue(row.professional)}</td>
                    <td className="px-4 py-2.5 text-center">{cellValue(row.enterprise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Additional selling points ── */}
        <div className="mt-14 grid sm:grid-cols-3 gap-5 text-center">
          {[
            { icon: BarChart3, color: 'text-sky-400', bg: 'bg-sky-400/10', title: 'Real-time data', desc: 'Allergen and substitution data updated continuously from clinical studies and community validation.' },
            { icon: Globe2, color: 'text-recipzee-green', bg: 'bg-recipzee-green/10', title: 'Global coverage', desc: 'FDA Big 9 + EU 14 + nickel — the only commercial API with per-ingredient nickel measurements.' },
            { icon: Webhook, color: 'text-purple-400', bg: 'bg-purple-400/10', title: 'Webhooks included', desc: 'Real-time ingredient change alerts pushed to your endpoint — no polling required.' },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="bg-recipzee-card border border-white/10 rounded-xl p-5">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <h3 className="font-medium mb-1 text-sm">{title}</h3>
              <p className="text-recipzee-muted text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="mt-14 text-center">
          <p className="text-recipzee-muted text-sm mb-4">
            Need a custom plan or have questions?{' '}
            <a href="mailto:api@recipzee.com" className="text-recipzee-green hover:underline">
              Contact us
            </a>
          </p>
          {authed && isActive && (
            <Link
              to="/b2b/billing"
              className="inline-flex items-center gap-2 text-sm text-recipzee-green hover:underline"
            >
              Manage your B2B billing <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
