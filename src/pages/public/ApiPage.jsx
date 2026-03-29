import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ShieldCheck, FlaskConical, Shuffle, ClipboardCheck, BarChart3,
  Globe2, TrendingUp, Webhook, LayoutTemplate, Leaf,
  Check, ArrowRight, Mail, Zap, Building2, Rocket, Microscope, FileText
} from 'lucide-react'
import Footer from '../../components/Footer'

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: FlaskConical,
    title: 'Nickel Content Data',
    desc: 'Per-ingredient nickel in micrograms per serving, sourced from 257 clinical studies and 20,575 measurements. The only commercial API with this coverage.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: ShieldCheck,
    title: 'Allergen Intelligence',
    desc: 'FDA Big 9, EU 14 allergens + nickel — all with severity levels, cross-reactivity flags, and per-ingredient confidence scores.',
    color: 'text-recipzee-green',
    bg: 'bg-recipzee-green/10',
  },
  {
    icon: Shuffle,
    title: 'Substitution Engine',
    desc: 'Allergen-safe ingredient swaps with confidence scores, conversion ratios, and community validation. Filterable by allergen profile.',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
  },
  {
    icon: ClipboardCheck,
    title: 'Recipe Safety Audit',
    desc: 'Pass a recipe and an allergen profile — get back a full safety report with flagged ingredients, severity levels, and suggested alternatives.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    icon: BarChart3,
    title: 'Nutrition Estimation',
    desc: 'USDA-backed macro and micronutrient data for any ingredient or recipe. Includes calorie density, protein, fat, carbs, fibre, and key micronutrients.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: Globe2,
    title: 'Regional Demand Forecasting',
    desc: 'Ingredient usage trends segmented by geography, season, and cuisine type. Useful for menu planning and procurement.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: TrendingUp,
    title: 'Dietary Trend Analytics',
    desc: 'Growth and decline rates for dietary tags — vegan, keto, gluten-free, halal, low-nickel, and more — over 30-day windows.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
  {
    icon: LayoutTemplate,
    title: 'White-Label Widget',
    desc: 'Embeddable allergen scanner you can drop into your product. Customisable with your branding. No backend required on your end.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    desc: 'Real-time push notifications when allergen data updates, new substitutions are validated, or safety thresholds are crossed.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
  {
    icon: Leaf,
    title: 'Sustainability Scoring',
    desc: 'Carbon footprint estimates and sustainability scores per ingredient and recipe, sourced from agricultural lifecycle data.',
    color: 'text-lime-400',
    bg: 'bg-lime-400/10',
  },
]

const TIERS = [
  {
    name: 'Starter',
    price: '$299',
    period: '/month',
    icon: Rocket,
    accent: 'border-recipzee-border',
    badge: null,
    cta: 'Get started',
    features: [
      '5,000 API calls / month',
      'Allergen intelligence (FDA Big 9 + EU 14 + Nickel)',
      'Per-ingredient nickel content data',
      'Ingredient substitution engine',
      'Confidence scoring on every response',
      'Safety disclaimer headers',
      'OpenAPI / Swagger documentation',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: '$699',
    period: '/month',
    icon: Zap,
    accent: 'border-recipzee-green',
    badge: 'Most popular',
    badgeColor: 'bg-recipzee-green/15 text-recipzee-green border border-recipzee-green/30',
    cta: 'Get started',
    features: [
      'Everything in Starter',
      '25,000 API calls / month',
      'Recipe safety audit',
      'Nutrition estimation (USDA-backed)',
      'Regional demand forecasting',
      'Dietary trend analytics',
      'Menu optimisation suggestions',
      'Webhook delivery',
      'Priority email support',
    ],
  },
  {
    name: 'Enterprise',
    price: '$1,499',
    period: '/month',
    icon: Building2,
    accent: 'border-recipzee-yellow/40',
    badge: null,
    cta: 'Contact us',
    features: [
      'Everything in Professional',
      'Unlimited API calls',
      'White-label embeddable widget',
      'Sustainability scoring',
      'Bulk data enrichment endpoint',
      'Custom SLA and uptime guarantee',
      'Dedicated account manager',
      'Private Slack channel',
    ],
  },
  {
    name: 'Clinical Research',
    price: '$2,999',
    period: '/month',
    icon: Microscope,
    accent: 'border-violet-500/40',
    badge: 'Institutional',
    badgeColor: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
    cta: 'Contact us',
    features: [
      'Everything in Enterprise',
      'Unlimited API calls',
      'Patient allergen PDF report generation',
      'Nutritional gap analysis endpoint',
      'Allergen interaction engine',
      'Cross-reactivity co-sensitisation data',
      'Allergen change monitoring + webhooks',
      'CFIA food label copy generator',
      'Dedicated research support contact',
    ],
  },
]

const PAY_PER_REPORT = {
  price: '$49',
  unit: 'per recipe audit',
  desc: 'No subscription needed. Submit a single recipe for a full allergen safety audit — flagged ingredients, severity levels, suggested alternatives, and a PDF-ready report.',
  features: [
    'Full allergen safety audit (FDA Big 9 + EU 14 + Nickel)',
    'Per-ingredient severity levels and alternatives',
    'Confidence scoring and safety disclaimer',
    'One-time payment, no commitment',
  ],
}

const PROBLEMS = [
  'Standard allergen APIs only cover 9–14 allergens. Nickel allergy affects 10–15% of the population and no mainstream API covers it.',
  'Substitution engines built on community data are unsafe for allergy management. Ours is built on clinical literature.',
  'Recipe apps need accurate data fast. A single unsafe suggestion can cause a severe reaction.',
]

// ── Components ────────────────────────────────────────────────────────────────

const FeatureCard = ({ icon: Icon, title, desc, color, bg }) => (
  <div className="rounded-2xl bg-recipzee-card border border-recipzee-border p-5 flex flex-col gap-3">
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <h3 className="font-semibold text-recipzee-text">{title}</h3>
    <p className="text-sm text-recipzee-muted leading-relaxed">{desc}</p>
  </div>
)

const PricingCard = ({ tier }) => {
  const Icon = tier.icon
  const hasBadge = !!tier.badge
  const isGreen = hasBadge && tier.name === 'Professional'
  const isViolet = hasBadge && tier.name === 'Clinical Research'
  return (
    <div className={`relative rounded-2xl bg-recipzee-card border-2 ${tier.accent} p-6 flex flex-col gap-6 ${
      isGreen ? 'shadow-[0_0_40px_rgba(34,197,94,0.12)]' : isViolet ? 'shadow-[0_0_40px_rgba(139,92,246,0.12)]' : ''
    }`}>
      {tier.badge && (
        <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${tier.badgeColor}`}>
          {tier.badge}
        </span>
      )}

      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isGreen ? 'bg-recipzee-green/20' : isViolet ? 'bg-violet-500/20' : 'bg-white/5'
        }`}>
          <Icon className={`w-5 h-5 ${isGreen ? 'text-recipzee-green' : isViolet ? 'text-violet-300' : 'text-recipzee-muted'}`} />
        </div>
        <div>
          <p className="font-bold text-recipzee-text">{tier.name}</p>
        </div>
      </div>

      <div className="flex items-end gap-1">
        <span className="text-4xl font-extrabold text-recipzee-text">{tier.price}</span>
        <span className="text-recipzee-muted mb-1">{tier.period}</span>
      </div>

      <ul className="space-y-2.5 flex-1">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-recipzee-muted">
            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
              isGreen ? 'text-recipzee-green' : isViolet ? 'text-violet-400' : 'text-recipzee-muted'
            }`} />
            <span className={i === 0 && tier.name !== 'Starter' ? 'text-recipzee-text font-medium' : ''}>{f}</span>
          </li>
        ))}
      </ul>

      <a
        href="mailto:api@recipzee.com"
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 ${
          isGreen
            ? 'bg-recipzee-green text-recipzee-dark'
            : isViolet
              ? 'bg-violet-500/20 border border-violet-500/30 text-violet-200 hover:bg-violet-500/30'
              : 'bg-white/5 border border-recipzee-border text-recipzee-text hover:bg-white/10'
        }`}
      >
        {tier.cta}
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ApiPage() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('api@recipzee.com')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden flex flex-col">
      <Helmet>
        <title>Allergen Intelligence API — Recipzee</title>
        <meta name="description" content="The only commercial API with clinical nickel content data, allergen intelligence, and recipe safety auditing for food companies, dietitian platforms, and developers." />
        <link rel="canonical" href="https://www.recipzee.com/api" />
      </Helmet>

      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-recipzee-green/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-recipzee-yellow/4 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-recipzee-green/10 border border-recipzee-green/20 text-recipzee-green text-sm font-medium mb-6">
            <FlaskConical className="w-4 h-4" />
            B2B Allergen Intelligence API
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6 max-w-4xl mx-auto">
            Allergen Intelligence API for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-recipzee-green to-emerald-400">
              Food Companies, Dietitians, and Developers
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-recipzee-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            The only commercial API with clinical nickel content data, FDA + EU allergen intelligence,
            a validated substitution engine, and recipe safety auditing — in a single API.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:api@recipzee.com"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-recipzee-green text-recipzee-dark font-bold text-base hover:opacity-90 transition-opacity shadow-lg shadow-recipzee-green/20"
            >
              <Mail className="w-5 h-5" />
              Request API access
            </a>
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-2 text-sm text-recipzee-muted hover:text-recipzee-text transition-colors"
            >
              See what's coming next <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── Problem ────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          <div className="rounded-2xl bg-recipzee-card border border-recipzee-border p-8 sm:p-10">
            <h2 className="text-2xl font-bold mb-6 text-center">The problem with existing allergen APIs</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {PROBLEMS.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs font-bold">✕</span>
                  </div>
                  <p className="text-sm text-recipzee-muted leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-recipzee-border text-center">
              <p className="text-recipzee-text font-medium">
                Recipzee solves all three — with data sourced from{' '}
                <span className="text-recipzee-green">257 peer-reviewed studies</span> and{' '}
                <span className="text-recipzee-green">20,575 clinical measurements</span>.
              </p>
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Everything in one API</h2>
            <p className="text-recipzee-muted max-w-xl mx-auto">
              Ten endpoints covering the full allergen intelligence stack — from raw ingredient data to recipe-level safety auditing.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-2xl bg-recipzee-card border border-recipzee-border p-8 sm:p-10">
            <h2 className="text-2xl font-bold mb-8 text-center">How it works</h2>
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                {
                  step: '1',
                  title: 'Request access',
                  desc: 'Email api@recipzee.com and we\'ll provision your API key within one business day.',
                },
                {
                  step: '2',
                  title: 'Authenticate',
                  desc: 'Pass your key via X-API-Key header or Bearer token on every request. Per-key rate limiting with clear usage headers.',
                },
                {
                  step: '3',
                  title: 'Query and build',
                  desc: 'RESTful JSON endpoints with OpenAPI/Swagger documentation. Every response includes confidence scoring and a safety disclaimer.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-recipzee-green/20 border border-recipzee-green/30 flex items-center justify-center text-recipzee-green font-bold text-lg">
                    {step}
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-recipzee-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
            <p className="text-recipzee-muted">
              All plans include confidence scoring, safety disclaimers, and OpenAPI docs.
              Annual billing available — contact us for a quote.
            </p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {TIERS.map((tier) => (
              <PricingCard key={tier.name} tier={tier} />
            ))}
          </div>

          {/* Pay Per Report */}
          <div className="mt-8 rounded-2xl bg-recipzee-card border border-recipzee-border p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-recipzee-muted font-medium uppercase tracking-wider mb-0.5">Pay Per Report</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-3xl font-extrabold text-recipzee-text">{PAY_PER_REPORT.price}</span>
                    <span className="text-recipzee-muted mb-0.5 text-sm">{PAY_PER_REPORT.unit}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-recipzee-muted leading-relaxed mb-3">{PAY_PER_REPORT.desc}</p>
                <ul className="flex flex-wrap gap-x-6 gap-y-1.5">
                  {PAY_PER_REPORT.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-recipzee-muted">
                      <Check className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="mailto:api@recipzee.com?subject=Pay%20Per%20Report%20%E2%80%94%20Single%20Recipe%20Audit"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-recipzee-border text-recipzee-text font-semibold text-sm hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Request a report
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <p className="text-center text-sm text-recipzee-muted mt-6">
            Need a custom volume deal or academic/non-profit pricing?{' '}
            <a href="mailto:api@recipzee.com" className="text-recipzee-green hover:underline underline-offset-2">
              Get in touch
            </a>
            .
          </p>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-2xl bg-gradient-to-br from-recipzee-green/10 to-emerald-400/5 border border-recipzee-green/20 p-10 text-center">
            <h2 className="text-3xl font-bold mb-3">Ready to integrate?</h2>
            <p className="text-recipzee-muted max-w-lg mx-auto mb-8 leading-relaxed">
              Email us and we'll provision your API key, share documentation, and walk you through the endpoints that are most relevant for your use case.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={copyEmail}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-recipzee-card border border-recipzee-border text-recipzee-text font-medium text-sm hover:border-recipzee-green/40 transition-colors"
              >
                <Mail className="w-4 h-4 text-recipzee-green" />
                {copied ? 'Copied!' : 'api@recipzee.com'}
              </button>
              <a
                href="mailto:api@recipzee.com?subject=Recipzee%20B2B%20API%20Access&body=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20the%20Recipzee%20B2B%20API.%0A%0AUse%20case%3A%20%5Bdescribe%20your%20use%20case%5D%0A%0AExpected%20call%20volume%3A%20%5Bapprox%20monthly%20calls%5D"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-recipzee-green text-recipzee-dark font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Send inquiry
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── Legal disclaimer ───────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
          <p className="text-xs text-recipzee-muted/70 text-center leading-relaxed border border-recipzee-border/40 rounded-xl px-6 py-4">
            Data provided for informational and compliance reference purposes only.
            Not a substitute for laboratory testing or professional dietary advice.
            Recipzee / Platerly Inc. accepts no liability for decisions made based on API output.
            Source: Rebelytics R&D Inc. v9.1.1 (2025), 257 peer-reviewed studies, 20,575 measurements.
          </p>
        </section>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="pb-[env(safe-area-inset-bottom)]">
        <Footer variant="full" />
      </div>
    </div>
  )
}
