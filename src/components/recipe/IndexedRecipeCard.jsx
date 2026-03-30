import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Clock, ExternalLink, BookmarkPlus, ChevronDown, ChevronUp, AlertTriangle, Leaf } from 'lucide-react'

// ── Nickel risk badge config ───────────────────────────────────────────────
const NICKEL_BADGE = {
  SAFE:     { label: 'Low Nickel',    cls: 'bg-emerald-900/50 border-emerald-500/50 text-emerald-200' },
  MODERATE: { label: 'Mod. Nickel',   cls: 'bg-amber-900/50  border-amber-500/50  text-amber-200'   },
  EXCEEDED: { label: 'High Nickel',   cls: 'bg-red-900/50    border-red-500/50    text-red-200'     },
  Unknown:  { label: 'Nickel N/A',    cls: 'bg-white/5       border-white/10      text-recipzee-muted' },
}

const ALLERGEN_RISK = {
  None:    'bg-emerald-900/40 border-emerald-500/40 text-emerald-200',
  Low:     'bg-amber-900/40  border-amber-500/40  text-amber-200',
  Medium:  'bg-orange-900/40 border-orange-500/40 text-orange-200',
  High:    'bg-red-900/40    border-red-500/40    text-red-200',
  Unknown: 'bg-white/5       border-white/10      text-recipzee-muted',
}

// ── Thumbnail placeholder ──────────────────────────────────────────────────
function RecipePlaceholder({ cuisineType, title }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-recipzee-card to-recipzee-light text-center px-2">
      <Leaf className="w-6 h-6 text-recipzee-green/60" />
      {cuisineType && (
        <span className="text-xs font-medium text-recipzee-muted uppercase tracking-wider">
          {cuisineType}
        </span>
      )}
      <span className="text-xs text-recipzee-muted/60 line-clamp-2">{title}</span>
    </div>
  )
}

// ── Main card ──────────────────────────────────────────────────────────────
export default function IndexedRecipeCard({
  recipe,
  atLimit       = false,
  isAuthenticated = false,
  isPremium     = false,
  isOnTrial     = false,
  isSaved       = false,
  onSave,
}) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const [ingExpanded, setIngExpanded] = useState(false)

  const nickelKey   = recipe.nickelRiskLevel in NICKEL_BADGE ? recipe.nickelRiskLevel : 'Unknown'
  const nickelBadge = NICKEL_BADGE[nickelKey]
  const allergenRiskCls = ALLERGEN_RISK[recipe.allergenSummary?.overallRiskLevel] ?? ALLERGEN_RISK.Unknown

  const showThumbnail = recipe.thumbnailUrl && !imgError
  const ingredients   = recipe.ingredients ?? []
  const MAX_VISIBLE   = 5
  const extraCount    = Math.max(0, ingredients.length - MAX_VISIBLE)
  const visibleIngs   = ingExpanded ? ingredients : ingredients.slice(0, MAX_VISIBLE)

  const canSeeAllergenDetail = isPremium || isOnTrial || !atLimit
  const flaggedAllergens     = recipe.allergenSummary?.flaggedAllergens ?? []
  const hasFlaggedAllergens  = flaggedAllergens.length > 0

  function handleViewRecipe(e) {
    e.stopPropagation()
    window.open(recipe.sourceUrl, '_blank', 'noopener,noreferrer')
  }

  function handleCardClick() {
    navigate(`/recipes/${recipe.id}-${slugify(recipe.title)}`)
  }

  function slugify(str) {
    return (str ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  return (
    <article
      className="flex flex-col rounded-2xl border border-recipzee-border bg-recipzee-card overflow-hidden shadow-md hover:shadow-xl hover:border-recipzee-green/30 transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
      aria-label={`Recipe: ${recipe.title}`}
    >
      {/* ── Thumbnail ─────────────────────────────────────────────────── */}
      <div className="relative w-full h-44 bg-recipzee-light flex-shrink-0 overflow-hidden">
        {showThumbnail ? (
          <img
            src={recipe.thumbnailUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <RecipePlaceholder cuisineType={recipe.cuisineType} title={recipe.title} />
        )}

        {/* Halal badge — always visible, top-right corner */}
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-recipzee-dark/80 border border-recipzee-green/40 px-2 py-0.5 text-xs text-recipzee-green backdrop-blur-sm">
          <ShieldCheck className="w-3 h-3" />
          <span>Halal</span>
        </div>
      </div>

      {/* ── Card body ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Title */}
        <h3 className="font-semibold text-recipzee-text text-base leading-snug line-clamp-2 group-hover:text-recipzee-green transition-colors">
          {recipe.title}
        </h3>

        {/* Source attribution */}
        <p className="text-xs text-recipzee-muted flex items-center gap-1">
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          From: <span className="text-recipzee-subtle">{recipe.sourceDomain}</span>
        </p>

        {/* ── Badges row ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5">
          {/* Nickel risk — always visible */}
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${nickelBadge.cls}`}>
            {nickelBadge.label}
          </span>

          {/* Cuisine */}
          {recipe.cuisineType && (
            <span className="inline-flex items-center rounded-full border border-recipzee-border bg-white/5 px-2 py-0.5 text-xs text-recipzee-muted">
              {recipe.cuisineType}
            </span>
          )}

          {/* Halal verified — always visible */}
          <span className="inline-flex items-center gap-1 rounded-full border border-recipzee-green/30 bg-recipzee-green/10 px-2 py-0.5 text-xs text-recipzee-green">
            <ShieldCheck className="w-3 h-3" /> Halal Verified
          </span>
        </div>

        {/* Prep time */}
        {(recipe.prepTimeMinutes > 0 || recipe.cookTimeMinutes > 0) && (
          <div className="flex items-center gap-1 text-xs text-recipzee-muted">
            <Clock className="w-3 h-3" />
            {recipe.prepTimeMinutes > 0 && <span>{recipe.prepTimeMinutes}m prep</span>}
            {recipe.prepTimeMinutes > 0 && recipe.cookTimeMinutes > 0 && <span>·</span>}
            {recipe.cookTimeMinutes > 0 && <span>{recipe.cookTimeMinutes}m cook</span>}
          </div>
        )}

        {/* ── Ingredients ──────────────────────────────────────────── */}
        {ingredients.length > 0 && (
          <div className="text-xs text-recipzee-muted space-y-1">
            <p className="font-medium text-recipzee-subtle uppercase tracking-wider text-[10px]">Ingredients</p>
            <ul className="space-y-0.5">
              {visibleIngs.map((ing, i) => (
                <li key={i} className="truncate text-recipzee-text/80">{ing}</li>
              ))}
            </ul>
            {extraCount > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setIngExpanded(v => !v) }}
                className="flex items-center gap-1 text-recipzee-green/80 hover:text-recipzee-green mt-1"
              >
                {ingExpanded
                  ? <><ChevronUp className="w-3 h-3" /> Show less</>
                  : <><ChevronDown className="w-3 h-3" /> and {extraCount} more</>
                }
              </button>
            )}
          </div>
        )}

        {/* ── Allergen summary ─────────────────────────────────────── */}
        <div className="relative">
          {/* Always show overall risk label */}
          <p className="text-[10px] font-medium text-recipzee-subtle uppercase tracking-wider mb-1">Allergen Check</p>

          {canSeeAllergenDetail ? (
            hasFlaggedAllergens ? (
              <div className="flex flex-wrap gap-1">
                {flaggedAllergens.slice(0, 6).map((a, i) => (
                  <span key={i} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${allergenRiskCls}`}>
                    <AlertTriangle className="w-3 h-3 mr-1" />{a}
                  </span>
                ))}
                {flaggedAllergens.length > 6 && (
                  <span className="text-xs text-recipzee-muted">+{flaggedAllergens.length - 6} more</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {recipe.isAnalysed ? 'No allergens detected for your profile' : 'Analysis pending'}
              </p>
            )
          ) : (
            /* Blurred state for free users at scan limit */
            <div className="relative">
              <div className="flex flex-wrap gap-1 blur-sm select-none pointer-events-none" aria-hidden="true">
                <span className="inline-flex items-center rounded-full border border-red-500/50 bg-red-900/40 px-2 py-0.5 text-xs text-red-200">Gluten</span>
                <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-900/40 px-2 py-0.5 text-xs text-amber-200">Dairy</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-recipzee-card/70 backdrop-blur-[2px]">
                <button
                  onClick={e => { e.stopPropagation(); window.location.href = '/account' }}
                  className="text-xs text-recipzee-yellow hover:underline"
                >
                  Upgrade for full allergen detail
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Action buttons ────────────────────────────────────────── */}
        <div className="flex gap-2 pt-2 border-t border-recipzee-border">
          <button
            onClick={e => { e.stopPropagation(); onSave?.(recipe) }}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              isSaved
                ? 'border-recipzee-green/40 bg-recipzee-green/10 text-recipzee-green'
                : 'border-recipzee-border bg-white/5 text-recipzee-subtle hover:border-recipzee-green/40 hover:text-recipzee-green'
            }`}
            title="Save to Cookbook"
          >
            <BookmarkPlus className="w-3.5 h-3.5 flex-shrink-0" />
            {isSaved ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={handleViewRecipe}
            className="flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-recipzee-border bg-white/5 px-3 py-2 text-xs font-medium text-recipzee-subtle hover:border-recipzee-green/40 hover:text-recipzee-text transition-all overflow-hidden"
            title={`View full recipe at ${recipe.sourceDomain}`}
          >
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">View at {recipe.sourceDomain}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
