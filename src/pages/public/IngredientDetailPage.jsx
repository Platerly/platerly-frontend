import React, { useEffect, useState, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  FlaskConical, ShieldAlert, Info, ChevronLeft, Check, Lock,
  AlertTriangle, TrendingUp, ExternalLink, ArrowRight
} from 'lucide-react'
import Footer from '../../components/Footer'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { usePremium } from '../../hooks/usePremium'

// ── Constants ─────────────────────────────────────────────────────────────────

const XR_SEEN_KEY = 'rz_xr_seen'     // sessionStorage — tracks first free cross-reactivity view

// ── Helpers ────────────────────────────────────────────────────────────────────

function nickelColors(classification) {
  switch (classification?.toLowerCase()) {
    case 'low':      return { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.12)]' }
    case 'moderate': return { bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/30',   dot: 'bg-amber-400',   glow: 'shadow-[0_0_30px_rgba(251,191,36,0.12)]'  }
    case 'high':     return { bg: 'bg-red-500/15',     text: 'text-red-300',     border: 'border-red-500/30',     dot: 'bg-red-400',     glow: 'shadow-[0_0_30px_rgba(248,113,113,0.12)]' }
    default:         return { bg: 'bg-white/5',        text: 'text-recipzee-muted', border: 'border-recipzee-border', dot: 'bg-white/30', glow: '' }
  }
}

function significanceColors(sig) {
  switch (sig?.toUpperCase()) {
    case 'HIGH':     return 'text-red-300 bg-red-500/15 border-red-500/30'
    case 'MODERATE': return 'text-amber-300 bg-amber-500/15 border-amber-500/30'
    default:         return 'text-sky-300 bg-sky-500/15 border-sky-500/30'
  }
}

function confidenceLabel(level) {
  switch (level?.toLowerCase()) {
    case 'high':    return { label: 'High confidence', color: 'text-emerald-400' }
    case 'medium':  return { label: 'Medium confidence', color: 'text-amber-400' }
    case 'low':     return { label: 'Low confidence', color: 'text-red-400' }
    default:        return { label: 'Confidence unknown', color: 'text-recipzee-muted' }
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/8 rounded-xl ${className}`} />
)

const LoadingSkeleton = () => (
  <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-20 space-y-6">
    <Skeleton className="h-6 w-28" />
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-36 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
)

// ── Page ───────────────────────────────────────────────────────────────────────

export default function IngredientDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { authed } = useAuth()
  const { isPremium, isOnTrial } = usePremium()
  const hasPremiumAccess = isPremium || isOnTrial

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Cross-reactivity gate: premium always sees it;
  // free/anon users get it free on their first lookup per session, then gated
  const [xrGated, setXrGated] = useState(false)
  const xrInitialised = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setData(null)

    fetch(`${API_BASE_URL}/api/public/ingredients/${encodeURIComponent(slug)}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null }
        return res.json()
      })
      .then(json => {
        if (!cancelled && json) setData(json)
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [slug])

  // Determine cross-reactivity gate once data loads and auth state is known
  useEffect(() => {
    if (!data || xrInitialised.current) return
    xrInitialised.current = true

    if (hasPremiumAccess) {
      setXrGated(false)
      return
    }

    try {
      const alreadySeen = sessionStorage.getItem(XR_SEEN_KEY)
      if (alreadySeen) {
        setXrGated(true)
      } else {
        // First lookup this session — show free, mark as seen
        sessionStorage.setItem(XR_SEEN_KEY, '1')
        setXrGated(false)
      }
    } catch {
      setXrGated(false)
    }
  }, [data, hasPremiumAccess])

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-recipzee-dark text-recipzee-text flex flex-col">
        <LoadingSkeleton />
        <Footer variant="contained" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-recipzee-dark text-recipzee-text flex flex-col items-center justify-center gap-4 px-4">
        <Helmet>
          <title>Ingredient Not Found — Recipzee</title>
        </Helmet>
        <AlertTriangle className="w-10 h-10 text-recipzee-muted" />
        <h1 className="text-xl font-bold">Ingredient not found</h1>
        <p className="text-recipzee-muted text-sm text-center">
          We couldn't find an ingredient matching "<span className="text-recipzee-text">{slug}</span>".
        </p>
        <Link
          to="/ingredients"
          className="inline-flex items-center gap-2 mt-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Search ingredients
        </Link>
      </div>
    )
  }

  const colors   = nickelColors(data.nickelClassification)
  const confInfo = confidenceLabel(data.nickelConfidenceLevel)
  const hasXR    = data.crossReactivity?.length > 0

  // SEO description
  const metaDesc = `${data.name} nickel classification: ${data.nickelClassification?.toUpperCase() ?? 'UNKNOWN'}` +
    (data.nickelMicrogramsPerServing ? ` — ${parseFloat(data.nickelMicrogramsPerServing).toFixed(1)} μg per serving` : '') +
    `. ${data.nickelSummary?.slice(0, 120) ?? ''}`

  // ── Full page ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text flex flex-col">
      <Helmet>
        <title>{data.name} — Nickel Content &amp; Allergy Info — Recipzee</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://www.recipzee.com/ingredients/${slug}`} />

        {/* Structured data for Google */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `${data.name} — Nickel Content for Allergy Management`,
          "description": metaDesc,
          "url": `https://www.recipzee.com/ingredients/${slug}`,
          "publisher": { "@type": "Organization", "name": "Recipzee" }
        })}</script>
      </Helmet>

      {/* Background glow matching classification */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={`absolute top-0 right-1/4 w-[500px] h-[400px] rounded-full blur-[160px] opacity-30
          ${data.nickelClassification?.toLowerCase() === 'low'      ? 'bg-emerald-500/8' :
            data.nickelClassification?.toLowerCase() === 'moderate' ? 'bg-amber-500/8'   :
            data.nickelClassification?.toLowerCase() === 'high'     ? 'bg-red-500/8'     : 'bg-white/3'}`} />
      </div>

      <div className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6">

        {/* ── Back link ──────────────────────────────────────────────────── */}
        <div className="pt-8 pb-2">
          <Link
            to="/ingredients"
            className="inline-flex items-center gap-1.5 text-sm text-recipzee-muted hover:text-recipzee-text transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Ingredient lookup
          </Link>
        </div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="pt-4 pb-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {data.name}
            </h1>
            {data.isVerified && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium">
                <Check className="w-3 h-3" /> Verified
              </span>
            )}
          </div>

          {(data.nutritionalCategory || data.dietaryFlags?.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {data.nutritionalCategory && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-recipzee-border text-recipzee-muted capitalize">
                  {data.nutritionalCategory}
                </span>
              )}
              {data.dietaryFlags?.map(flag => (
                <span key={flag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-recipzee-border text-recipzee-muted capitalize">
                  {flag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ── Nickel classification card ──────────────────────────────────── */}
        <section className="pb-6">
          <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} ${colors.glow} p-6`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                  <FlaskConical className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <p className="text-xs text-recipzee-muted font-medium uppercase tracking-wider">Nickel classification</p>
                  <p className={`text-2xl font-extrabold ${colors.text}`}>
                    {data.nickelClassification?.toUpperCase() ?? 'UNKNOWN'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {data.nickelMicrogramsPerServing ? (
                  <>
                    <p className={`text-2xl font-extrabold ${colors.text}`}>
                      {parseFloat(data.nickelMicrogramsPerServing).toFixed(1)} μg
                    </p>
                    <p className="text-xs text-recipzee-muted">
                      per {data.nickelServingSizeGrams ?? 100} g serving
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-recipzee-muted">No μg data</p>
                )}
              </div>
            </div>

            {/* Confidence + variability */}
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-white/8">
              <span className={`text-xs font-medium ${confInfo.color}`}>{confInfo.label}</span>
              {data.nickelDataPointCount && (
                <span className="text-xs text-recipzee-muted">
                  {data.nickelDataPointCount} measurement{data.nickelDataPointCount !== 1 ? 's' : ''}
                </span>
              )}
              {data.nickelHighVariability && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> High variability
                </span>
              )}
            </div>

            {/* Summary text */}
            <p className="text-sm text-recipzee-muted leading-relaxed">{data.nickelSummary}</p>

            {/* Preparation note */}
            {data.nickelPreparationNote && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-black/20">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="text-xs text-recipzee-muted leading-relaxed">
                  <span className="font-medium text-sky-300">Preparation note: </span>
                  {data.nickelPreparationNote}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Allergens ──────────────────────────────────────────────────── */}
        {data.allergenTypes?.length > 0 && (
          <section className="pb-6">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Allergens
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.allergenTypes.map(a => (
                <span
                  key={a}
                  className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-sm text-red-300 font-medium"
                >
                  {a}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Cross-reactivity ─────────────────────────────────────────── */}
        <section className="pb-8">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            Cross-reactivity
          </h2>

          {!hasXR ? (
            <div className="rounded-2xl bg-recipzee-card border border-recipzee-border p-5 text-center">
              <p className="text-sm text-recipzee-muted">
                No known cross-reactivity relationships for this ingredient's allergen profile.
              </p>
            </div>
          ) : xrGated ? (
            /* ── Gated state — blur + upgrade prompt ── */
            <div className="relative rounded-2xl overflow-hidden">
              {/* Blurred preview */}
              <div className="blur-sm select-none pointer-events-none" aria-hidden="true">
                <div className="space-y-3">
                  {data.crossReactivity.slice(0, 2).map((xr, i) => (
                    <div key={i} className="rounded-2xl bg-recipzee-card border border-recipzee-border p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-semibold text-sm text-recipzee-text">{xr.relatedAllergen}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${significanceColors(xr.clinicalSignificance)}`}>
                          {xr.clinicalSignificance}
                        </span>
                      </div>
                      <p className="text-xs text-recipzee-muted">{xr.clinicalNote}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-recipzee-dark/80 backdrop-blur-[2px] rounded-2xl px-6 py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-violet-300" />
                </div>
                <p className="font-semibold text-recipzee-text">Cross-reactivity details are Premium</p>
                <p className="text-sm text-recipzee-muted max-w-xs">
                  Your first ingredient lookup included this free. Upgrade to see cross-reactivity
                  data, co-sensitisation rates, and clinical notes for every ingredient.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-recipzee-green text-recipzee-dark font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Start free trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {authed && (
                    <Link
                      to="/settings?tab=subscription"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-recipzee-border text-recipzee-text text-sm hover:bg-white/10 transition-colors"
                    >
                      Upgrade — $6.99/mo
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Full cross-reactivity data ── */
            <div className="space-y-3">
              {data.crossReactivity.map((xr, i) => (
                <div key={i} className="rounded-2xl bg-recipzee-card border border-recipzee-border p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-sm text-recipzee-text">{xr.relatedAllergen}</p>
                      <p className="text-xs text-recipzee-muted mt-0.5">via {xr.sourceAllergen}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${significanceColors(xr.clinicalSignificance)}`}>
                        {xr.clinicalSignificance}
                      </span>
                      <span className="text-xs text-recipzee-muted font-medium whitespace-nowrap">
                        ~{xr.coSensitisationLikelihoodPercent}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-recipzee-muted leading-relaxed mb-2">{xr.clinicalNote}</p>
                  <p className="text-xs text-recipzee-muted/60 italic">{xr.mechanism}</p>
                </div>
              ))}

              {/* "Shown free" notice for non-premium */}
              {!hasPremiumAccess && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-violet-500/8 border border-violet-500/15 px-4 py-2.5">
                  <p className="text-xs text-recipzee-muted">
                    Cross-reactivity data is free for your first lookup.{' '}
                    <Link to="/register" className="text-violet-300 hover:text-violet-200 underline-offset-2 underline font-medium">
                      Start a free trial
                    </Link>{' '}
                    for unlimited access.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Data source citation ─────────────────────────────────────────── */}
        <section className="pb-14">
          <div className="flex items-start gap-3 rounded-xl bg-recipzee-card border border-recipzee-border/50 px-4 py-3">
            <Info className="w-4 h-4 text-recipzee-muted shrink-0 mt-0.5" />
            <p className="text-xs text-recipzee-muted/80 leading-relaxed">
              <span className="font-semibold text-recipzee-muted">Data source:</span>{' '}
              {data.dataSourceCitation}{' '}
              Clinical thresholds: LOW &lt;10 μg/serving, MODERATE 10–20 μg/serving, HIGH &gt;20 μg/serving
              (Mislankar &amp; Zirwas 2013, daily threshold 150 μg/day).
              Not a substitute for professional dietary advice.
              <a
                href="https://www.recipzee.com/disclaimer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 ml-1 text-recipzee-muted hover:text-recipzee-text transition-colors underline-offset-2 underline"
              >
                Full disclaimer <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </section>

      </div>

      <Footer variant="contained" />
    </div>
  )
}
