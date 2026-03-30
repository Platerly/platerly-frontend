import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ShieldCheck, ExternalLink, BookmarkPlus, ArrowLeft,
  AlertTriangle, Clock, ChefHat, Flame, TrendingUp,
  CheckCircle2, XCircle, Info
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePremium } from '../hooks/usePremium'
import { useScanStatus } from '../hooks/useScanStatus'
import { API_BASE_URL } from '../utils/api'
import { logger } from '../utils/logger'
import IndexedSaveToCookbookModal from '../components/recipe/IndexedSaveToCookbookModal'

// ── Helpers ────────────────────────────────────────────────────────────────
function extractId(idSlug) {
  // UUID is always 36 characters: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return idSlug?.length >= 36 ? idSlug.substring(0, 36) : idSlug
}

function slugify(str) {
  return (str ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Risk level config ──────────────────────────────────────────────────────
const NICKEL_RISK = {
  SAFE:     { label: 'Low Risk',  color: 'text-emerald-400', bar: 'bg-emerald-500', border: 'border-emerald-500/40', bg: 'bg-emerald-900/20' },
  MODERATE: { label: 'Moderate',  color: 'text-amber-400',   bar: 'bg-amber-500',   border: 'border-amber-500/40',   bg: 'bg-amber-900/20'   },
  EXCEEDED: { label: 'High Risk', color: 'text-red-400',     bar: 'bg-red-500',     border: 'border-red-500/40',     bg: 'bg-red-900/20'     },
  Unknown:  { label: 'No Data',   color: 'text-recipzee-muted', bar: 'bg-white/20', border: 'border-white/10',       bg: 'bg-white/5'        },
}

const ALLERGEN_SEVERITY = {
  High:   'bg-red-900/50 border-red-500/50 text-red-200',
  Medium: 'bg-orange-900/50 border-orange-500/50 text-orange-200',
  Low:    'bg-amber-900/50 border-amber-500/50 text-amber-200',
}

const NICKEL_CLASS_COLOR = {
  High:     'text-red-400',
  Moderate: 'text-amber-400',
  Low:      'text-emerald-400',
  Unknown:  'text-recipzee-muted',
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-recipzee-border bg-recipzee-card p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-recipzee-green flex-shrink-0" />}
      <h2 className="font-semibold text-recipzee-text text-sm uppercase tracking-wider">{children}</h2>
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-20 rounded-2xl bg-recipzee-card" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="h-44 rounded-2xl bg-recipzee-card" />
          <div className="h-32 rounded-2xl bg-recipzee-card" />
        </div>
        <div className="space-y-5">
          <div className="h-32 rounded-2xl bg-recipzee-card" />
          <div className="h-32 rounded-2xl bg-recipzee-card" />
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function IndexedRecipeDetailPage() {
  const { idSlug } = useParams()
  const navigate   = useNavigate()
  const recipeId   = extractId(idSlug)

  const { token, authed } = useAuth()
  const { isPremium, isOnTrial } = usePremium()
  const { atLimit } = useScanStatus()

  const [recipe,        setRecipe]        = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [userAllergens, setUserAllergens] = useState([])
  const [saveOpen,      setSaveOpen]      = useState(false)
  const [isSaved,       setIsSaved]       = useState(false)

  // Parsed analysis data
  const [nickelData,   setNickelData]   = useState(null)
  const [allergenData, setAllergenData] = useState(null)

  // ── Fetch recipe detail ────────────────────────────────────────────────
  useEffect(() => {
    if (!recipeId) { setNotFound(true); setLoading(false); return }
    setLoading(true)

    fetch(`${API_BASE_URL}/api/public/recipes/${recipeId}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (!data) return
        setRecipe(data)
        if (data.nickelLoad)      setNickelData(data.nickelLoad)
        if (data.allergenAnalysis) setAllergenData(data.allergenAnalysis)
        setLoading(false)
      })
      .catch(err => {
        logger.error('Failed to load indexed recipe', err)
        setLoading(false)
      })
  }, [recipeId])

  // ── Fetch user allergens (for personalised summary) ────────────────────
  useEffect(() => {
    if (!authed || !token) return
    fetch(`${API_BASE_URL}/api/Allergy/my-allergies`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setUserAllergens(Array.isArray(data) ? data : (data?.items ?? [])))
      .catch(() => {})
  }, [authed, token])

  const canSeeDetail = isPremium || isOnTrial || !atLimit

  // ── 404 ───────────────────────────────────────────────────────────────
  if (notFound) return (
    <div className="min-h-screen bg-recipzee-dark flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-xl font-semibold text-recipzee-text">Recipe not found</p>
      <p className="text-sm text-recipzee-muted">This recipe may have been removed or the link is incorrect.</p>
      <button onClick={() => navigate('/explore-recipes')} className="flex items-center gap-2 text-sm text-recipzee-green hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Explore Recipes
      </button>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-recipzee-dark pb-16">
      <div className="mx-auto max-w-4xl px-4 pt-8"><DetailSkeleton /></div>
    </div>
  )

  if (!recipe) return null

  // ── Derived data ───────────────────────────────────────────────────────
  const nickelKey  = recipe.nickelRiskLevel in NICKEL_RISK ? recipe.nickelRiskLevel : 'Unknown'
  const nickelConf = NICKEL_RISK[nickelKey]

  const totalNickelMcg    = nickelData?.totalNickelMcg ?? 0
  const thresholdPercent  = nickelData?.thresholdPercent ?? 0
  const nickelIngredients = nickelData?.meals?.[0]?.ingredients ?? []

  const allergenFlags       = allergenData?.allergenFlags ?? []
  const overallAllergenRisk = allergenData?.overallRiskLevel ?? recipe.allergenSummary?.overallRiskLevel ?? 'Unknown'

  // Personalised check: does this recipe contain any of the user's flagged allergens?
  // API returns plain strings e.g. ["nickel", "dairy_lactose"]
  const userAllergenNames  = userAllergens.map(a => (typeof a === 'string' ? a : a.name ?? '').toLowerCase())
  // Each name may be underscore-separated — split into individual terms for matching
  const userAllergenTerms  = userAllergenNames.flatMap(n => n.split('_')).filter(Boolean)
  const userHasNickel      = userAllergenTerms.includes('nickel')
  const hasPersonalProfile = userAllergens.length > 0

  // Flags relevant to this user's profile — used for both allergen check display and safety summary
  const personalFlags = hasPersonalProfile && userAllergenTerms.length > 0
    ? allergenFlags.filter(flag => {
        const detail = (flag.detail || flag.ingredientName || '').toLowerCase()
        return userAllergenTerms.some(term => detail.includes(term))
      })
    : allergenFlags

  const isPersonallySafe = recipe.isAnalysed && personalFlags.length === 0
  // Collect the user's allergen names that actually matched something in this recipe
  const personalHits = userAllergenNames.filter(name =>
    name.split('_').some(term =>
      allergenFlags.some(f => (f.detail || f.ingredientName || '').toLowerCase().includes(term))
    )
  )

  // ── Ingredient pill color map ──────────────────────────────────────────
  // Build name → 'high' | 'medium' map from allergen flags + nickel data,
  // filtered to the user's allergen profile so only relevant warnings show.
  const ingFlagMap = {}

  if (recipe.isAnalysed && userAllergenTerms.length > 0) {
    allergenFlags.forEach(flag => {
      const name = (flag.ingredientName || '').toLowerCase()
      if (!name) return
      const detail = (flag.detail || '').toLowerCase()
      const relevant = userAllergenTerms.some(term => detail.includes(term))
      if (!relevant) return
      const level = ['high', 'critical'].includes((flag.severity || '').toLowerCase()) ? 'high' : 'medium'
      if (!ingFlagMap[name] || level === 'high') ingFlagMap[name] = level
    })

    if (userHasNickel) {
      nickelIngredients.forEach(ing => {
        const name = (ing.name || '').toLowerCase()
        if (!name) return
        if (ing.nickelClassification === 'High') ingFlagMap[name] = 'high'
        else if (ing.nickelClassification === 'Moderate' && ingFlagMap[name] !== 'high') ingFlagMap[name] = 'medium'
      })
    }
  }

  function getIngColor(ingString) {
    const lower = ingString.toLowerCase()
    let best = null
    for (const [name, level] of Object.entries(ingFlagMap)) {
      if (lower.includes(name)) {
        if (level === 'high') return 'high'
        best = 'medium'
      }
    }
    return best
  }

  const canonicalUrl = `https://recipzee.com/recipes/${recipeId}-${slugify(recipe.title)}`

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: `Halal-verified recipe from ${recipe.sourceDomain}, with full allergen and nickel analysis by Recipzee.`,
    image: recipe.thumbnailUrl ?? undefined,
    url: canonicalUrl,
    author: { '@type': 'Organization', name: recipe.sourceDomain },
    recipeIngredient: recipe.ingredients ?? [],
    keywords: ['halal', recipe.cuisineType, ...(recipe.tags ?? [])].filter(Boolean).join(', '),
    ...(recipe.prepTimeMinutes ? { prepTime: `PT${recipe.prepTimeMinutes}M` } : {}),
    ...(recipe.cookTimeMinutes ? { cookTime: `PT${recipe.cookTimeMinutes}M` } : {}),
  }

  return (
    <>
      <Helmet>
        <title>{recipe.title} — Halal Recipe — Recipzee</title>
        <meta name="description" content={`${recipe.title} from ${recipe.sourceDomain} — halal verified, allergen analysed, nickel load calculated by Recipzee.`} />
        <meta property="og:title" content={`${recipe.title} — Halal Recipe`} />
        <meta property="og:description" content={`Nickel risk: ${nickelConf.label}. Allergen risk: ${overallAllergenRisk}. Sourced from ${recipe.sourceDomain}.`} />
        {recipe.thumbnailUrl && <meta property="og:image" content={recipe.thumbnailUrl} />}
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-recipzee-dark pb-20">
        <div className="mx-auto max-w-4xl px-4 pt-6 space-y-5">

          {/* ── Back link ──────────────────────────────────────────────── */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-recipzee-muted hover:text-recipzee-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* ── Title + thumbnail ─────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {recipe.thumbnailUrl && (
              <img
                src={recipe.thumbnailUrl}
                alt={recipe.title}
                className="w-full sm:w-56 h-44 sm:h-40 object-cover rounded-2xl flex-shrink-0 border border-recipzee-border"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-recipzee-green/30 bg-recipzee-green/10 px-2.5 py-1 text-xs text-recipzee-green">
                  <ShieldCheck className="w-3.5 h-3.5" /> Halal Verified
                </span>
                {recipe.cuisineType && (
                  <span className="rounded-full border border-recipzee-border bg-white/5 px-2.5 py-1 text-xs text-recipzee-muted">{recipe.cuisineType}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-recipzee-text leading-snug">{recipe.title}</h1>
              {(recipe.prepTimeMinutes > 0 || recipe.cookTimeMinutes > 0) && (
                <div className="flex items-center gap-3 text-sm text-recipzee-muted">
                  <Clock className="w-4 h-4" />
                  {recipe.prepTimeMinutes > 0 && <span>{recipe.prepTimeMinutes}m prep</span>}
                  {recipe.cookTimeMinutes > 0 && <span>{recipe.cookTimeMinutes}m cook</span>}
                </div>
              )}
            </div>
          </div>

          {/* ── TOP: Attribution banner (unmissable) ─────────────────── */}
          <div className="rounded-2xl border border-recipzee-yellow/30 bg-recipzee-yellow/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-recipzee-yellow">
                📖 This recipe was sourced from <span className="font-semibold">{recipe.sourceDomain}</span>.
                We show allergen intelligence — for the full recipe including instructions, visit the original source.
              </p>
            </div>
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-recipzee-yellow px-4 py-2.5 text-sm font-semibold text-recipzee-dark hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              View full recipe at {recipe.sourceDomain} →
            </a>
          </div>

          {/* ── Halal verified note ───────────────────────────────────── */}
          <Section>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-recipzee-green mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-recipzee-green text-sm">All ingredients passed halal verification</p>
                <p className="text-xs text-recipzee-muted mt-1">{recipe.halalNote}</p>
              </div>
            </div>
          </Section>

          {/* ── MIDDLE: Recipzee value-add grid ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Nickel risk card — only shown when user has nickel in their profile */}
            {userHasNickel && (
            <Section className={nickelConf.bg}>
              <SectionTitle icon={Flame}>Nickel Load</SectionTitle>
              {!recipe.isAnalysed ? (
                <p className="text-sm text-recipzee-muted">Analysis is still being processed for this recipe.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <span className={`text-4xl font-bold ${nickelConf.color}`}>
                      {totalNickelMcg > 0 ? `${Math.round(totalNickelMcg)}` : '—'}
                    </span>
                    {totalNickelMcg > 0 && <span className="text-sm text-recipzee-muted pb-1">μg</span>}
                    <span className={`ml-auto text-lg font-bold ${nickelConf.color}`}>{nickelConf.label}</span>
                  </div>

                  {totalNickelMcg > 0 && (
                    <>
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-recipzee-muted mb-1">
                          <span>{Math.round(thresholdPercent)}% of 150μg daily threshold</span>
                          <span className={thresholdPercent >= 100 ? 'text-red-400' : thresholdPercent >= 50 ? 'text-amber-400' : 'text-emerald-400'}>
                            {thresholdPercent >= 100 ? 'Exceeds limit' : `${Math.round(150 - totalNickelMcg)}μg remaining`}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${nickelConf.bar}`}
                            style={{ width: `${Math.min(100, thresholdPercent)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-recipzee-muted">
                        Clinical threshold: 150μg/day (Mislankar &amp; Zirwas 2013)
                      </p>
                    </>
                  )}
                </div>
              )}
            </Section>
            )}

            {/* Allergen summary card */}
            <Section>
              <SectionTitle icon={AlertTriangle}>Allergen Check</SectionTitle>
              {!recipe.isAnalysed ? (
                <p className="text-sm text-recipzee-muted">Analysis pending.</p>
              ) : (() => {
                // personalFlags already computed above: profile-filtered when user has a profile
                const displayFlags = personalFlags

                if (displayFlags.length === 0) {
                  return (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-medium">
                        {hasPersonalProfile
                          ? 'No allergens matching your profile detected'
                          : 'No allergens detected in this recipe'}
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-2">
                    {hasPersonalProfile && (
                      <p className="text-xs text-recipzee-muted mb-2">Showing allergens relevant to your profile</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {displayFlags.slice(0, 8).map((flag, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${ALLERGEN_SEVERITY[flag.severity] ?? 'bg-white/5 border-white/10 text-recipzee-muted'}`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {flag.detail || flag.ingredientName}
                        </span>
                      ))}
                      {displayFlags.length > 8 && (
                        <span className="text-xs text-recipzee-muted self-center">+{displayFlags.length - 8} more</span>
                      )}
                    </div>
                    <p className="text-xs text-recipzee-muted">
                      Overall risk: <span className={
                        overallAllergenRisk === 'High' ? 'text-red-400' :
                        overallAllergenRisk === 'Medium' ? 'text-orange-400' :
                        overallAllergenRisk === 'Low' ? 'text-amber-400' : 'text-emerald-400'
                      }>{overallAllergenRisk}</span>
                    </p>
                  </div>
                )
              })()}
            </Section>

          </div>

          {/* ── Personalised safety summary ───────────────────────────── */}
          {authed && hasPersonalProfile && recipe.isAnalysed && (
            <Section className={isPersonallySafe ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-red-500/30 bg-red-900/10'}>
              <div className="flex items-center gap-3">
                {isPersonallySafe
                  ? <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  : <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                }
                <div>
                  <p className={`font-semibold text-sm ${isPersonallySafe ? 'text-emerald-300' : 'text-red-300'}`}>
                    Based on your allergy profile — this recipe is{' '}
                    {isPersonallySafe ? 'safe for you' : 'not safe for you'}
                  </p>
                  {!isPersonallySafe && (
                    <p className="text-xs text-recipzee-muted mt-0.5">
                      Contains your flagged allergens: {personalHits.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* ── Ingredient nickel breakdown table — only for nickel-allergic users ── */}
          {userHasNickel && recipe.isAnalysed && nickelIngredients.length > 0 && (
            <Section>
              <SectionTitle icon={TrendingUp}>Nickel Breakdown by Ingredient</SectionTitle>

              <div className="relative">
                <div className={canSeeDetail ? '' : 'blur-sm select-none pointer-events-none'} aria-hidden={!canSeeDetail}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-recipzee-border text-recipzee-muted uppercase tracking-wider">
                          <th className="text-left py-2 pr-4 font-medium">Ingredient</th>
                          <th className="text-right py-2 pr-4 font-medium">μg</th>
                          <th className="text-right py-2 pr-4 font-medium hidden sm:table-cell">Classification</th>
                          <th className="text-right py-2 font-medium hidden sm:table-cell">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-recipzee-border/50">
                        {nickelIngredients.map((ing, i) => (
                          <tr key={i} className="text-recipzee-text/90">
                            <td className="py-2.5 pr-4 font-medium">{ing.name}</td>
                            <td className="py-2.5 pr-4 text-right tabular-nums">
                              {ing.matched && ing.nickelContributionMcg > 0
                                ? `${ing.nickelContributionMcg.toFixed(1)}`
                                : <span className="text-recipzee-muted">—</span>
                              }
                            </td>
                            <td className="py-2.5 pr-4 text-right hidden sm:table-cell">
                              <span className={NICKEL_CLASS_COLOR[ing.nickelClassification] ?? 'text-recipzee-muted'}>
                                {ing.nickelClassification ?? '—'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right hidden sm:table-cell text-recipzee-muted">
                              {ing.dataConfidence ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {!canSeeDetail && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-recipzee-card/80 backdrop-blur-[2px] px-4 text-center">
                    <Info className="w-5 h-5 text-recipzee-yellow" />
                    <p className="text-sm text-recipzee-text font-medium">Weekly scan limit reached</p>
                    <p className="text-xs text-recipzee-muted">Upgrade to Premium for unlimited allergen and nickel detail.</p>
                    <Link
                      to="/account"
                      className="rounded-xl bg-recipzee-yellow px-4 py-2 text-sm font-semibold text-recipzee-dark hover:opacity-90 transition-opacity"
                    >
                      Upgrade to Premium
                    </Link>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── BOTTOM: Full ingredients list ─────────────────────────── */}
          <Section>
            <SectionTitle icon={ChefHat}>Ingredients</SectionTitle>
            {recipe.ingredients?.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {recipe.ingredients.map((ing, i) => {
                  const color = getIngColor(ing)
                  const cls = color === 'high'
                    ? 'border-red-500/40 bg-red-900/20 text-red-200'
                    : color === 'medium'
                    ? 'border-amber-500/40 bg-amber-900/20 text-amber-200'
                    : 'border-recipzee-border/60 bg-white/5 text-recipzee-text/80'
                  return (
                    <li key={i} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${cls}`}>
                      {color && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                      {ing}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-recipzee-muted">No ingredients data available.</p>
            )}

            {/* Instructions note */}
            <div className="mt-5 rounded-xl border border-recipzee-border/50 bg-recipzee-light/40 px-4 py-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-recipzee-muted mt-0.5 flex-shrink-0" />
              <p className="text-xs text-recipzee-muted">
                Cooking instructions are only available at the original source.
                We link directly to give full credit to the recipe creator.
              </p>
            </div>
          </Section>

          {/* ── Save + View buttons ───────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                if (!authed) { window.location.href = '/login'; return }
                setSaveOpen(true)
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-5 py-3 font-medium text-sm transition-all ${
                isSaved
                  ? 'border-recipzee-green/40 bg-recipzee-green/10 text-recipzee-green'
                  : 'border-recipzee-border bg-white/5 text-recipzee-subtle hover:border-recipzee-green/40 hover:text-recipzee-text'
              }`}
            >
              <BookmarkPlus className="w-4 h-4" />
              {isSaved ? 'Saved to Cookbook' : 'Save to Cookbook'}
            </button>

            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-recipzee-green px-5 py-3 font-semibold text-sm text-recipzee-dark hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              View full recipe at {recipe.sourceDomain} →
            </a>
          </div>

          {/* ── BOTTOM: Source attribution ────────────────────────────── */}
          <div className="text-center space-y-1 pb-4">
            <p className="text-xs text-recipzee-muted">
              Recipe originally from{' '}
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-recipzee-subtle hover:text-recipzee-text underline underline-offset-2"
              >
                {recipe.sourceDomain}
              </a>
            </p>
            <p className="text-xs text-recipzee-muted">
              Allergen analysis and nickel load data by Recipzee. Clinical threshold: 150μg/day (Mislankar &amp; Zirwas 2013).
            </p>
          </div>

        </div>
      </div>

      {/* ── Save to Cookbook modal ────────────────────────────────────────── */}
      {saveOpen && (
        <IndexedSaveToCookbookModal
          recipe={recipe}
          onClose={() => setSaveOpen(false)}
          onSaved={() => { setIsSaved(true); setSaveOpen(false) }}
        />
      )}
    </>
  )
}
