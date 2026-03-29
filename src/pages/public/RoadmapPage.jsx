import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CheckCircle2, Clock, Sparkles, ArrowRight, Bell } from 'lucide-react'

// ── Status badge configs ──────────────────────────────────────────────────────
const STATUS = {
  inProgress: {
    label: 'In Progress',
    icon: Clock,
    badge: 'bg-recipzee-green/15 text-recipzee-green border border-recipzee-green/30',
    bar: 'bg-recipzee-green',
    glow: 'shadow-[0_0_24px_rgba(34,197,94,0.08)]',
    border: 'border-recipzee-green/20',
  },
  comingSoon: {
    label: 'Coming Soon',
    icon: Sparkles,
    badge: 'bg-recipzee-yellow/15 text-recipzee-yellow border border-recipzee-yellow/30',
    bar: 'bg-recipzee-yellow',
    glow: 'shadow-[0_0_24px_rgba(246,200,105,0.06)]',
    border: 'border-recipzee-yellow/15',
  },
  planned: {
    label: 'Planned',
    icon: ArrowRight,
    badge: 'bg-white/5 text-recipzee-muted border border-white/10',
    bar: 'bg-recipzee-border',
    glow: '',
    border: 'border-recipzee-border/60',
  },
}

const ROADMAP = [
  {
    status: 'inProgress',
    items: [
      {
        title: 'Individual ingredient nickel lookup',
        desc: 'Query any ingredient by name and get its exact nickel content in micrograms per serving — with confidence scoring and clinical source citations.',
      },
      {
        title: 'Recipe PDF export',
        desc: 'Download any recipe as a branded PDF: ingredients, instructions, allergen summary, and substitution suggestions for premium users.',
      },
      {
        title: 'Data download & account deletion',
        desc: 'Download all your personal data as a JSON file, or permanently delete your account — both required under PIPEDA.',
      },
    ],
  },
  {
    status: 'comingSoon',
    items: [
      {
        title: 'iOS mobile app',
        eta: 'Late 2026 – Early 2027',
        desc: 'Native app with offline recipe access, camera-based barcode scanning, and push notifications for allergen alerts.',
      },
      {
        title: 'Appliance-based recipe filtering',
        desc: 'Filter recipes by the equipment you actually own — air fryer, instant pot, stovetop only, and more.',
      },
      {
        title: 'Expanded dietary restriction support',
        desc: 'Beyond the FDA Big 9 — structured support for low-FODMAP, low-histamine, AIP, and elimination diets.',
      },
      {
        title: 'B2B API portal',
        desc: 'Self-serve API key management, usage dashboards, and full documentation at recipzee.com/api.',
        link: '/api',
        linkLabel: 'Learn more →',
      },
    ],
  },
  {
    status: 'planned',
    items: [
      {
        title: 'Android app',
        desc: 'Full-featured Android companion to the iOS app, with the same allergen intelligence built in.',
      },
      {
        title: 'Meal plan sharing',
        desc: 'Share your weekly meal plan with family members or export it directly to your dietitian.',
      },
      {
        title: 'Clinic & practitioner bulk licensing',
        desc: 'Bulk API and app licensing for dietitian clinics, allergy practices, and healthcare providers.',
      },
      {
        title: 'Community recipe challenges',
        desc: 'Weekly themed cooking challenges with allergen-safe criteria — built for the community, by the community.',
      },
    ],
  },
]

const StatusBadge = ({ status }) => {
  const cfg = STATUS[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

const RoadmapCard = ({ item, status }) => {
  const cfg = STATUS[status]
  return (
    <div className={`rounded-2xl bg-recipzee-card border ${cfg.border} p-5 ${cfg.glow} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-recipzee-text leading-snug">{item.title}</h3>
        {item.eta && (
          <span className="shrink-0 text-xs text-recipzee-yellow bg-recipzee-yellow/10 border border-recipzee-yellow/20 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">
            {item.eta}
          </span>
        )}
      </div>
      <p className="text-sm text-recipzee-muted leading-relaxed">{item.desc}</p>
      {item.link && (
        <Link to={item.link} className="text-xs text-recipzee-green hover:underline underline-offset-2 font-medium">
          {item.linkLabel}
        </Link>
      )}
    </div>
  )
}

const SectionHeader = ({ status, count }) => {
  const cfg = STATUS[status]
  const Icon = cfg.icon
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        status === 'inProgress' ? 'bg-recipzee-green/20' :
        status === 'comingSoon' ? 'bg-recipzee-yellow/20' :
        'bg-white/5'
      }`}>
        <Icon className={`w-4 h-4 ${
          status === 'inProgress' ? 'text-recipzee-green' :
          status === 'comingSoon' ? 'text-recipzee-yellow' :
          'text-recipzee-muted'
        }`} />
      </div>
      <div>
        <h2 className="font-bold text-recipzee-text text-lg">{STATUS[status].label}</h2>
        <p className="text-xs text-recipzee-muted">{count} {count === 1 ? 'item' : 'items'}</p>
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [emailError, setEmailError] = useState('')

  const handleSignup = (e) => {
    e.preventDefault()
    if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailError('')
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden">
      <Helmet>
        <title>Roadmap — Recipzee</title>
        <meta name="description" content="See what Recipzee is building — allergen intelligence features in progress, coming soon, and planned for the future." />
        <link rel="canonical" href="https://www.recipzee.com/roadmap" />
      </Helmet>

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-recipzee-green/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-recipzee-yellow/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">

        {/* ── Hero ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-recipzee-green/10 border border-recipzee-green/20 text-recipzee-green text-sm font-medium mb-6">
            <CheckCircle2 className="w-4 h-4" />
            Public Roadmap
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            What we're building
          </h1>

          <p className="text-recipzee-muted text-lg max-w-xl mx-auto leading-relaxed">
            Here's what we're building — and what's coming next.{' '}
            <span className="text-recipzee-text">Built by someone who actually has a nickel allergy.</span>
          </p>

          <p className="mt-3 text-xs text-recipzee-muted/60">
            Last updated March 2026
          </p>
        </div>

        {/* ── Roadmap grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {ROADMAP.map(({ status, items }) => (
            <div key={status}>
              <SectionHeader status={status} count={items.length} />
              <div className="space-y-4">
                {items.map((item) => (
                  <RoadmapCard key={item.title} item={item} status={status} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Email signup ── */}
        <div className="rounded-2xl bg-recipzee-card border border-recipzee-border p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-recipzee-green/20 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-6 h-6 text-recipzee-green" />
          </div>

          <h2 className="text-xl font-bold mb-2">Get notified when new features launch</h2>
          <p className="text-sm text-recipzee-muted mb-6">
            No spam. One email when something ships.
          </p>

          {submitted ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-recipzee-green font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                You're on the list!
              </div>
              <p className="text-sm text-recipzee-muted">
                We'll notify you at <span className="text-recipzee-text">{email}</span> when new features launch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-2.5 rounded-xl bg-recipzee-dark border border-recipzee-border text-recipzee-text placeholder:text-recipzee-muted focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 text-sm"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-recipzee-green text-recipzee-dark font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Notify me
              </button>
            </form>
          )}

          {emailError && (
            <p className="mt-2 text-xs text-red-400">{emailError}</p>
          )}
        </div>

        {/* ── Footer nav ── */}
        <div className="mt-16 pt-8 border-t border-recipzee-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-recipzee-muted">
          <Link to="/" className="text-recipzee-green font-semibold hover:underline underline-offset-2">
            ← Back to Recipzee
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/api" className="hover:text-recipzee-text transition-colors">B2B API</Link>
            <Link to="/contact" className="hover:text-recipzee-text transition-colors">Contact</Link>
            <Link to="/disclaimer" className="hover:text-recipzee-text transition-colors">Allergy Disclaimer</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
