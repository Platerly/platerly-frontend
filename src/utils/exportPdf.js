/**
 * utils/exportPdf.js — Layer: Utility / Print/Export
 *
 * Opens a new browser window pre-populated with a fully self-contained HTML
 * document representing a recipe, then triggers window.print() after a short
 * delay to allow images to load.  The user's browser handles the actual PDF
 * conversion via its native "Save as PDF" print destination.
 *
 * Flow:
 *  1. (Premium only) Fetch substitution suggestions for any allergen ingredients
 *     in parallel via Promise.allSettled — failures are silently ignored so a
 *     single bad endpoint doesn't abort the export.
 *  2. Build ingredient rows, scaling quantities when scale !== 1.
 *  3. Split instruction string into individual lines.
 *  4. Assemble an HTML string with embedded CSS (print-media rules included).
 *  5. Open a popup window and write the HTML into it.
 *  6. An inline <script> in the popup calls window.print() 400ms after onload
 *     to give images time to render before the print dialog appears.
 *
 * No external dependencies — pure DOM APIs only (plus react-hot-toast for warnings).
 */
import toast from 'react-hot-toast'

/**
 * Generates and opens a print-ready recipe PDF in a new browser window.
 *
 * @param {Object} options
 * @param {Object}      options.recipe          - Core recipe object (title, ingredients, instructions, etc.)
 * @param {string[]}    options.allergenTerms   - Ingredient names that matched the user's allergen profile
 * @param {string}      options.difficulty      - Pre-formatted difficulty label ("Easy" / "Medium" / "Hard")
 * @param {string|null} options.prep            - Pre-formatted prep time string (e.g. "30 min")
 * @param {string|null} options.cook            - Pre-formatted cook time string (e.g. "1 hr")
 * @param {string|null} options.total           - Pre-formatted total time string
 * @param {number}      options.scale           - Ingredient quantity scale factor (default 1 = no scaling)
 * @param {boolean}     options.isPremium       - When true, fetches and renders allergen substitutions
 * @param {string|null} options.token           - Bearer token for the substitution API (premium only)
 * @param {string}      options.apiBase         - Base URL of the Recipzee API
 */
export async function exportRecipePdf({
  recipe,
  allergenTerms = [],
  difficulty,
  prep,
  cook,
  total,
  scale = 1,
  isPremium = false,
  token = null,
  apiBase = '',
}) {
  // ── Fetch substitutions for allergen ingredients (premium only) ──────────
  // Only runs when the user is on premium, a token is available, and at least
  // one allergen ingredient was detected in this recipe.
  // Promise.allSettled ensures all fetches are attempted — one failure will not
  // prevent substitutions for other ingredients from being shown.
  let substitutions = {}

  if (isPremium && token && allergenTerms.length > 0) {
    let authFailedDuringFetch = false
    await Promise.allSettled(
      allergenTerms.map(async (name) => {
        try {
          const res = await fetch(
            `${apiBase}/api/substitution/ingredient/name/${encodeURIComponent(name)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          // Issue 11: detect auth failures and surface a warning instead of silently
          // omitting substitutions with no indication to the user.
          if (res.status === 401 || res.status === 403) {
            authFailedDuringFetch = true
            return
          }
          if (!res.ok) return
          const json = await res.json()
          // API may return a bare array or a { data: [] } envelope — normalise both
          const subs = Array.isArray(json) ? json : (json?.data ?? [])
          // Cap at 3 substitutions per ingredient to keep the PDF readable
          if (subs.length > 0) substitutions[name] = subs.slice(0, 3)
        } catch { /* ignore */ }
      })
    )
    if (authFailedDuringFetch) {
      toast.error('Your session expired — substitution suggestions could not be loaded. Please log in and try again.')
    }
  }

  // ── Build ingredient rows ────────────────────────────────────────────────
  // Each row carries: the display string (qty + unit + name), an allergen flag,
  // and the raw name (used for allergen matching later).
  const ingredientRows = (recipe.ingredients || []).map((ing) => {
    const qty = scaleQty(ing.quantity, scale)
    const unit = ing.unit || ''
    const display = [qty, unit, ing.name].filter(Boolean).join(' ')
    // Case-insensitive substring match between ingredient name and allergen terms
    const isAllergen = allergenTerms.some(
      (a) => ing.name && ing.name.toLowerCase().includes(a.toLowerCase())
    )
    return { display, isAllergen, name: ing.name }
  })

  // ── Build instructions ────────────────────────────────────────────────────
  // Instructions are stored as a newline-delimited string; split into individual
  // lines and strip blank lines so the <ol> renders cleanly.
  const instructionLines = (recipe.instructions || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // ── Build tags ────────────────────────────────────────────────────────────
  const tags = Array.isArray(recipe.tags) ? recipe.tags : []

  // ── Build HTML ────────────────────────────────────────────────────────────
  const hasSubstitutions = Object.keys(substitutions).length > 0
  // Format the recipe creation date for display in the header and author line
  const dateStr = recipe.createdAt
    ? new Date(recipe.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  // Meta pills: small badge-style chips showing difficulty, cook times, servings, and scale
  const metaPills = [
    difficulty ? `<span class="pill">${escHtml(difficulty)}</span>` : '',
    prep ? `<span class="pill">Prep: ${escHtml(prep)}</span>` : '',
    cook ? `<span class="pill">Cook: ${escHtml(cook)}</span>` : '',
    total ? `<span class="pill">Total: ${escHtml(total)}</span>` : '',
    recipe.servings ? `<span class="pill">${escHtml(String(recipe.servings))} servings</span>` : '',
    // Only render the scale pill when the user has changed the default multiplier
    scale !== 1 ? `<span class="pill pill-green">Scale: ${scale}x</span>` : '',
  ].filter(Boolean).join('')

  // Allergen alert box shown at the top of the PDF when allergens were detected
  const allergenHtml = allergenTerms.length > 0
    ? `<div class="allergen-box">
        <strong>⚠ Allergen Alert:</strong> This recipe contains ingredients that may match your allergen profile:
        <strong>${allergenTerms.map(escHtml).join(', ')}</strong>.
        Please verify all ingredients before consuming.
       </div>`
    : ''

  // Ingredient list — allergen items receive a special class for red colouring in print
  const ingredientHtml = `<ul class="ingredient-list">${
    ingredientRows.map(({ display, isAllergen }) =>
      `<li class="${isAllergen ? 'allergen-item' : ''}">${escHtml(display)}</li>`
    ).join('')
  }</ul>`

  // Numbered instruction list, or a placeholder when none were provided
  const instructionHtml = instructionLines.length > 0
    ? `<ol class="instruction-list">${
        instructionLines.map((l) => `<li>${escHtml(l)}</li>`).join('')
      }</ol>`
    : `<p class="muted">No instructions provided.</p>`

  const tagsHtml = tags.length > 0
    ? `<div class="tag-row">${tags.map((t) => `<span class="tag">#${escHtml(t)}</span>`).join('')}</div>`
    : ''

  const descHtml = recipe.description
    ? `<section class="section">
        <h2 class="section-title">Description</h2>
        <p class="body-text">${escHtml(recipe.description)}</p>
       </section>`
    : ''

  // Substitutions section is only rendered for premium users who have allergen hits
  const subHtml = hasSubstitutions
    ? `<section class="section sub-section">
        <h2 class="section-title">Allergen Substitutions <span class="premium-badge">Premium</span></h2>
        <p class="sub-note">The following allergen-flagged ingredients have community-suggested alternatives:</p>
        ${Object.entries(substitutions).map(([name, subs]) => `
          <div class="sub-group">
            <h3 class="sub-ingredient">Instead of: <em>${escHtml(name)}</em></h3>
            <ul class="sub-list">
              ${subs.map((s) => `
                <li>
                  <strong>${escHtml(s.substituteIngredientName || s.SubstituteIngredientName || '')}</strong>
                  ${s.reason || s.Reason ? `<span class="sub-reason">(${escHtml(s.reason || s.Reason)})</span>` : ''}
                  ${s.conversionRatio || s.ConversionRatio ? `<span class="sub-ratio">Ratio: ${escHtml(String(s.conversionRatio || s.ConversionRatio))}x</span>` : ''}
                  ${s.notes || s.Notes ? `<span class="sub-notes"> — ${escHtml(s.notes || s.Notes)}</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
       </section>`
    : ''

  // Recipe hero image — crossorigin="anonymous" is required so the print
  // renderer can access the image even if it is hosted on a different origin.
  const imageHtml = recipe.imageUrl
    ? `<div class="recipe-image-wrap">
        <img class="recipe-image" src="${escHtml(recipe.imageUrl)}" alt="${escHtml(recipe.title || 'Recipe image')}" crossorigin="anonymous" />
       </div>`
    : ''

  // ── Full HTML document string ─────────────────────────────────────────────
  // All CSS is inlined so the document is self-contained and prints correctly
  // without needing access to the app's stylesheet bundle.
  // @page and @media print rules override body padding and force colour for
  // background-colour-dependent elements (allergen box, brand colours, tags).
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escHtml(recipe.title || 'Recipe')} — Recipzee</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #111827;
    max-width: 780px;
    margin: 0 auto;
    padding: 36px 40px 60px;
    font-size: 13pt;
    line-height: 1.6;
  }

  /* ── Branding ── */
  .brand-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #22c55e;
    padding-bottom: 10px;
    margin-bottom: 28px;
  }
  .brand-name { font-family: Arial, sans-serif; font-size: 18pt; font-weight: 800; color: #22c55e; letter-spacing: -0.5px; }
  .brand-tagline { font-family: Arial, sans-serif; font-size: 9pt; color: #6b7280; }
  .brand-date { font-family: Arial, sans-serif; font-size: 9pt; color: #6b7280; }

  /* ── Recipe header ── */
  .recipe-title { font-size: 24pt; font-weight: 700; color: #111827; line-height: 1.2; margin-bottom: 6px; }
  .recipe-author { font-family: Arial, sans-serif; font-size: 10pt; color: #6b7280; margin-bottom: 14px; }

  /* ── Meta pills ── */
  .meta-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
  .pill {
    font-family: Arial, sans-serif;
    font-size: 9pt;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    padding: 3px 10px;
    color: #374151;
  }
  .pill-green { background: #dcfce7; border-color: #86efac; color: #166534; }

  /* ── Image ── */
  .recipe-image-wrap { margin-bottom: 24px; }
  .recipe-image { width: 100%; max-height: 340px; object-fit: cover; border-radius: 10px; }

  /* ── Allergen box ── */
  .allergen-box {
    background: #fef2f2;
    border: 1.5px solid #fca5a5;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 22px;
    font-family: Arial, sans-serif;
    font-size: 10pt;
    color: #7f1d1d;
  }

  /* ── Sections ── */
  .section { margin-bottom: 28px; }
  .section-title {
    font-family: Arial, sans-serif;
    font-size: 13pt;
    font-weight: 700;
    color: #111827;
    border-bottom: 1.5px solid #e5e7eb;
    padding-bottom: 5px;
    margin-bottom: 12px;
  }
  .body-text { color: #374151; white-space: pre-line; }
  .muted { color: #9ca3af; font-style: italic; }

  /* ── Ingredients ── */
  .ingredient-list {
    list-style: none;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 24px;
  }
  .ingredient-list li {
    padding: 4px 0;
    border-bottom: 1px solid #f3f4f6;
    font-size: 11pt;
  }
  .ingredient-list li::before { content: "• "; color: #22c55e; font-weight: 700; }
  .allergen-item { color: #b91c1c !important; font-weight: 600; }
  .allergen-item::before { color: #ef4444 !important; content: "⚠ "; }

  /* ── Instructions ── */
  .instruction-list { padding-left: 20px; }
  .instruction-list li {
    margin-bottom: 10px;
    font-size: 11pt;
    padding-left: 6px;
  }

  /* ── Tags ── */
  .tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .tag {
    font-family: Arial, sans-serif;
    font-size: 9pt;
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 999px;
    padding: 2px 8px;
    color: #166534;
  }

  /* ── Substitutions ── */
  .sub-section { border-top: 2px solid #22c55e; padding-top: 20px; }
  .premium-badge {
    font-size: 8pt;
    background: #fef9c3;
    border: 1px solid #fde047;
    border-radius: 4px;
    padding: 1px 6px;
    color: #713f12;
    vertical-align: middle;
    margin-left: 6px;
  }
  .sub-note { font-family: Arial, sans-serif; font-size: 9pt; color: #6b7280; margin-bottom: 16px; }
  .sub-group { margin-bottom: 18px; }
  .sub-ingredient { font-size: 11pt; margin-bottom: 6px; color: #374151; }
  .sub-list { list-style: none; padding-left: 0; }
  .sub-list li { font-size: 10pt; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
  .sub-reason { color: #6b7280; font-size: 9pt; }
  .sub-ratio { color: #059669; font-size: 9pt; margin-left: 8px; }
  .sub-notes { color: #6b7280; font-size: 9pt; }

  /* ── Footer ── */
  .pdf-footer {
    border-top: 2px solid #e5e7eb;
    margin-top: 40px;
    padding-top: 14px;
    font-family: Arial, sans-serif;
    font-size: 8pt;
    color: #9ca3af;
    line-height: 1.5;
  }
  .footer-brand { font-weight: 700; color: #22c55e; }

  /* ── Print page setup ── */
  @page { margin: 1.5cm 1.8cm; }
  @media print {
    body { padding: 0; }
    .recipe-image { max-height: 280px; }
    /* Force background colours in print (browsers suppress them by default) */
    .allergen-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .allergen-item { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sub-section { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .brand-name { -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #22c55e !important; }
    .pill-green { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .tag { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- Branding header -->
<header class="brand-header">
  <div>
    <div class="brand-name">Recipzee</div>
    <div class="brand-tagline">Allergy-aware cooking for everyone</div>
  </div>
  ${dateStr ? `<div class="brand-date">Exported ${escHtml(dateStr)}</div>` : ''}
</header>

<!-- Recipe title -->
<h1 class="recipe-title">${escHtml(recipe.title || 'Untitled Recipe')}</h1>
<div class="recipe-author">
  By @${escHtml(recipe.authorUsername || recipe.user?.username || 'Recipzee Chef')}
  ${dateStr ? ` &middot; ${escHtml(dateStr)}` : ''}
</div>

<!-- Meta pills -->
${metaPills ? `<div class="meta-row">${metaPills}</div>` : ''}

<!-- Image -->
${imageHtml}

<!-- Allergen alert -->
${allergenHtml}

<!-- Tags -->
${tagsHtml}

<!-- Description -->
${descHtml}

<!-- Ingredients -->
<section class="section">
  <h2 class="section-title">Ingredients${scale !== 1 ? ` (scaled ${scale}x)` : ''}</h2>
  ${ingredientHtml}
</section>

<!-- Instructions -->
<section class="section">
  <h2 class="section-title">Instructions</h2>
  ${instructionHtml}
</section>

<!-- Substitutions (premium) -->
${subHtml}

<!-- Footer -->
<footer class="pdf-footer">
  <p>
    <span class="footer-brand">Recipzee</span> &mdash; recipzee.com &nbsp;&middot;&nbsp;
    Allergen and substitution data is for informational purposes only and does not constitute medical advice.
    Source: Rebelytics R&amp;D Inc. v9.1.1 (2025), 257 studies, 20,575 measurements.
    Consult a healthcare professional for allergy management decisions.
    Recipzee accepts no liability for adverse reactions from reliance on this data.
  </p>
</footer>

<script>
  // Delay print until images load
  window.onload = function () {
    setTimeout(function () { window.print(); }, 400);
  };
</script>
</body>
</html>`

  // Open a blank popup and write the HTML into it.
  // Issue 10: if the popup is blocked, fall back to a Blob download so the user
  // still gets the recipe file (they can open it in a browser and print to PDF).
  const popup = window.open('', '_blank', 'width=900,height=700,scrollbars=yes')
  if (!popup) {
    try {
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(recipe.title || 'recipe').replace(/[^a-z0-9]/gi, '_')}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('Pop-ups are blocked. Your recipe was downloaded as an HTML file — open it in your browser and print to PDF.', { duration: 6000 })
    } catch {
      toast.error('Could not export PDF. Please allow pop-ups for this site and try again.')
    }
    return
  }
  popup.document.write(html)
  popup.document.close()
}

/**
 * Generates and opens a print-ready allergen intelligence PDF for an indexed
 * (externally-sourced) recipe in a new browser window.
 *
 * Indexed recipes do not include cooking instructions — those live at the original
 * source.  The PDF focuses on Recipzee's value-add: allergen analysis, nickel load,
 * ingredient safety summary, and (premium/trial only) substitution suggestions for
 * allergen-flagged ingredients.
 *
 * @param {Object}    options
 * @param {Object}    options.recipe             - Indexed recipe object (title, thumbnailUrl, ingredients[], sourceDomain, sourceUrl, etc.)
 * @param {Object[]}  options.personalFlags      - Profile-filtered allergen flags ({severity, detail, ingredientName})
 * @param {string[]}  options.personalHits       - User's allergen names that triggered flags (e.g. ["dairy", "nickel"])
 * @param {Object}    options.ingFlagMap         - Map of lowercase ingredient name → 'high' | 'medium'
 * @param {Object|null} options.nickelData       - Raw nickel load API response (meals[0].ingredients, etc.)
 * @param {boolean}   options.userHasNickel      - Whether user has nickel in their allergen profile
 * @param {string}    options.nickelRiskLabel    - Human-readable nickel risk label ("Low Risk", "Moderate", "High Risk")
 * @param {number}    options.totalNickelMcg     - Total nickel contribution in micrograms
 * @param {number}    options.thresholdPercent   - Percentage of 150μg daily threshold
 * @param {string}    options.overallAllergenRisk - Overall allergen risk level string
 * @param {boolean}   options.isPersonallySafe   - Whether recipe is safe for the user's profile
 * @param {boolean}   options.hasPersonalProfile - Whether user has a configured allergen profile
 * @param {boolean}   options.isPremium          - Premium subscription flag
 * @param {boolean}   options.isOnTrial          - Trial subscription flag
 * @param {string|null} options.token            - Bearer token for the substitution API
 * @param {string}    options.apiBase            - Base URL of the Recipzee API
 */
export async function exportIndexedRecipePdf({
  recipe,
  personalFlags = [],
  personalHits = [],
  ingFlagMap = {},
  nickelData = null,
  userHasNickel = false,
  nickelRiskLabel = '',
  totalNickelMcg = 0,
  thresholdPercent = 0,
  overallAllergenRisk = 'Unknown',
  isPersonallySafe = true,
  hasPersonalProfile = false,
  isPremium = false,
  isOnTrial = false,
  token = null,
  apiBase = '',
}) {
  // ── Fetch substitutions for allergen-flagged ingredients (premium/trial only) ──
  // Uses the ingredient names from personalFlags so the sub API can find matches
  // even when the user's profile allergen terms are compound (e.g. "dairy_lactose").
  let substitutions = {}
  const canSeeSubstitutions = isPremium || isOnTrial

  if (canSeeSubstitutions && token && personalFlags.length > 0) {
    const flaggedIngNames = [...new Set(
      personalFlags.map((f) => f.ingredientName).filter(Boolean)
    )]
    let authFailedDuringFetch = false
    await Promise.allSettled(
      flaggedIngNames.map(async (name) => {
        try {
          const res = await fetch(
            `${apiBase}/api/substitution/ingredient/name/${encodeURIComponent(name)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (res.status === 401 || res.status === 403) {
            authFailedDuringFetch = true
            return
          }
          if (!res.ok) return
          const json = await res.json()
          const subs = Array.isArray(json) ? json : (json?.data ?? [])
          if (subs.length > 0) substitutions[name] = subs.slice(0, 3)
        } catch { /* ignore */ }
      })
    )
    if (authFailedDuringFetch) {
      toast.error('Your session expired — substitution suggestions could not be loaded. Please log in and try again.')
    }
  }

  // ── Build ingredient rows with allergen severity coloring ─────────────────
  // Ingredients are strings (e.g. "2 cups all-purpose flour") — use substring
  // matching against ingFlagMap keys (lowercase ingredient names) to find severity.
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const ingredientRows = ingredients.map((ing) => {
    const lower = (ing || '').toLowerCase()
    let severity = null
    for (const [name, level] of Object.entries(ingFlagMap)) {
      if (lower.includes(name)) {
        if (level === 'high') { severity = 'high'; break }
        severity = 'medium'
      }
    }
    return { display: ing, severity }
  })

  // ── Date ─────────────────────────────────────────────────────────────────
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // ── Meta pills ────────────────────────────────────────────────────────────
  const metaPills = [
    recipe.cuisineType ? `<span class="pill">${escHtml(recipe.cuisineType)}</span>` : '',
    recipe.prepTimeMinutes > 0 ? `<span class="pill">Prep: ${escHtml(String(recipe.prepTimeMinutes))} min</span>` : '',
    recipe.cookTimeMinutes > 0 ? `<span class="pill">Cook: ${escHtml(String(recipe.cookTimeMinutes))} min</span>` : '',
  ].filter(Boolean).join('')

  // ── Image ─────────────────────────────────────────────────────────────────
  const imageHtml = recipe.thumbnailUrl
    ? `<div class="recipe-image-wrap">
        <img class="recipe-image" src="${escHtml(recipe.thumbnailUrl)}" alt="${escHtml(recipe.title || 'Recipe image')}" crossorigin="anonymous" />
       </div>`
    : ''

  // ── Personal safety banner ────────────────────────────────────────────────
  let safetyHtml = ''
  if (hasPersonalProfile) {
    safetyHtml = isPersonallySafe
      ? `<div class="safety-banner safety-safe">
          <strong>✓ Safe for your allergen profile</strong> — No allergens matching your profile were detected in this recipe.
         </div>`
      : `<div class="safety-banner safety-unsafe">
          <strong>⚠ Not safe for your allergen profile</strong> — This recipe contains allergens you have flagged:
          <strong>${personalHits.map(escHtml).join(', ')}</strong>.
          Please verify all ingredients before consuming.
         </div>`
  }

  // ── Allergen analysis section ─────────────────────────────────────────────
  const profileNote = hasPersonalProfile ? ' <span class="profile-note">(Your Profile)</span>' : ''
  let allergenSectionHtml = ''
  if (personalFlags.length > 0) {
    const flagChips = personalFlags.map((flag) => {
      const sev = (flag.severity || '').toLowerCase()
      const cls = sev === 'high' ? 'flag-high' : sev === 'medium' ? 'flag-medium' : 'flag-low'
      return `<span class="flag-chip ${cls}">${escHtml(flag.detail || flag.ingredientName || '')}</span>`
    }).join('')
    const riskCls = `risk-${escHtml(overallAllergenRisk.toLowerCase())}`
    allergenSectionHtml = `
      <section class="section">
        <h2 class="section-title">Allergen Analysis${profileNote}</h2>
        <div class="flag-row">${flagChips}</div>
        <p class="risk-summary">Overall risk: <span class="${riskCls}">${escHtml(overallAllergenRisk)}</span></p>
      </section>`
  } else if (recipe.isAnalysed !== false) {
    allergenSectionHtml = `
      <section class="section">
        <h2 class="section-title">Allergen Analysis${profileNote}</h2>
        <p class="safe-text">✓ ${hasPersonalProfile ? 'No allergens matching your profile detected' : 'No allergens detected in this recipe'}</p>
      </section>`
  }

  // ── Nickel load section (only when user has nickel in their profile) ───────
  let nickelHtml = ''
  if (userHasNickel && totalNickelMcg > 0) {
    const pct = Math.min(100, Math.round(thresholdPercent))
    const nickelIngredients = nickelData?.meals?.[0]?.ingredients ?? []
    // Nickel bar color matches risk level: green → amber → red
    const barColor = pct >= 100 ? '#ef4444' : pct >= 67 ? '#f59e0b' : '#22c55e'
    const rowsHtml = nickelIngredients.length > 0
      ? `<table class="nickel-table">
          <thead><tr>
            <th>Ingredient</th><th class="num-cell">μg</th><th class="num-cell">Classification</th>
          </tr></thead>
          <tbody>${nickelIngredients.map((ing) => `
            <tr>
              <td>${escHtml(ing.name || '')}</td>
              <td class="num-cell">${ing.nickelContributionMcg > 0 ? escHtml(ing.nickelContributionMcg.toFixed(1)) : '—'}</td>
              <td class="num-cell nickel-class-${escHtml((ing.nickelClassification || 'unknown').toLowerCase())}">${escHtml(ing.nickelClassification || '—')}</td>
            </tr>`).join('')}
          </tbody>
         </table>`
      : ''
    nickelHtml = `
      <section class="section">
        <h2 class="section-title">Nickel Load</h2>
        <div class="nickel-summary">
          <span class="nickel-mcg">${Math.round(totalNickelMcg)}μg</span>
          <span class="nickel-label">${escHtml(nickelRiskLabel)}</span>
        </div>
        <div class="nickel-bar-wrap">
          <div class="nickel-bar" style="width:${pct}%;background:${barColor}"></div>
        </div>
        <p class="nickel-threshold">${pct}% of 150μg daily threshold (Mislankar &amp; Zirwas 2013)</p>
        ${rowsHtml}
      </section>`
  }

  // ── Ingredient list HTML ──────────────────────────────────────────────────
  const ingredientHtml = ingredientRows.length > 0
    ? `<ul class="ingredient-list">${
        ingredientRows.map(({ display, severity }) => {
          const cls = severity === 'high' ? 'allergen-high' : severity === 'medium' ? 'allergen-medium' : ''
          return `<li class="${cls}">${escHtml(display)}</li>`
        }).join('')
      }</ul>`
    : `<p class="muted">No ingredients data available.</p>`

  // ── Substitutions (premium/trial only) ───────────────────────────────────
  const hasSubstitutions = Object.keys(substitutions).length > 0
  const subHtml = hasSubstitutions
    ? `<section class="section sub-section">
        <h2 class="section-title">Allergen Substitutions <span class="premium-badge">Premium</span></h2>
        <p class="sub-note">Allergen-safe alternatives for flagged ingredients:</p>
        ${Object.entries(substitutions).map(([name, subs]) => `
          <div class="sub-group">
            <h3 class="sub-ingredient">Instead of: <em>${escHtml(name)}</em></h3>
            <ul class="sub-list">
              ${subs.map((s) => `
                <li>
                  <strong>${escHtml(s.substituteIngredientName || s.SubstituteIngredientName || '')}</strong>
                  ${s.reason || s.Reason ? `<span class="sub-reason">(${escHtml(s.reason || s.Reason)})</span>` : ''}
                  ${s.conversionRatio || s.ConversionRatio ? `<span class="sub-ratio">Ratio: ${escHtml(String(s.conversionRatio || s.ConversionRatio))}x</span>` : ''}
                  ${s.notes || s.Notes ? `<span class="sub-notes"> — ${escHtml(s.notes || s.Notes)}</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
       </section>`
    : ''

  // ── Full HTML document ────────────────────────────────────────────────────
  const sourceLink = recipe.sourceUrl
    ? `<a href="${escHtml(recipe.sourceUrl)}">${escHtml(recipe.sourceDomain || recipe.sourceUrl)}</a>`
    : `<strong>${escHtml(recipe.sourceDomain || 'the original source')}</strong>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escHtml(recipe.title || 'Recipe')} — Allergen Report — Recipzee</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #111827;
    max-width: 780px;
    margin: 0 auto;
    padding: 36px 40px 60px;
    font-size: 13pt;
    line-height: 1.6;
  }

  /* ── Branding ── */
  .brand-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #22c55e;
    padding-bottom: 10px;
    margin-bottom: 28px;
  }
  .brand-name { font-family: Arial, sans-serif; font-size: 18pt; font-weight: 800; color: #22c55e; letter-spacing: -0.5px; }
  .brand-tagline { font-family: Arial, sans-serif; font-size: 9pt; color: #6b7280; }
  .brand-date { font-family: Arial, sans-serif; font-size: 9pt; color: #6b7280; }

  /* ── Recipe header ── */
  .recipe-title { font-size: 24pt; font-weight: 700; color: #111827; line-height: 1.2; margin-bottom: 6px; }
  .recipe-source { font-family: Arial, sans-serif; font-size: 10pt; color: #6b7280; margin-bottom: 14px; }

  /* ── Meta pills ── */
  .meta-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
  .pill {
    font-family: Arial, sans-serif; font-size: 9pt;
    background: #f3f4f6; border: 1px solid #e5e7eb;
    border-radius: 999px; padding: 3px 10px; color: #374151;
  }

  /* ── Image ── */
  .recipe-image-wrap { margin-bottom: 24px; }
  .recipe-image { width: 100%; max-height: 300px; object-fit: cover; border-radius: 10px; }

  /* ── Safety banner ── */
  .safety-banner {
    border-radius: 8px; padding: 12px 16px; margin-bottom: 22px;
    font-family: Arial, sans-serif; font-size: 10pt;
  }
  .safety-safe  { background: #f0fdf4; border: 1.5px solid #86efac; color: #166534; }
  .safety-unsafe { background: #fef2f2; border: 1.5px solid #fca5a5; color: #7f1d1d; }

  /* ── Sections ── */
  .section { margin-bottom: 28px; }
  .section-title {
    font-family: Arial, sans-serif; font-size: 13pt; font-weight: 700;
    color: #111827; border-bottom: 1.5px solid #e5e7eb;
    padding-bottom: 5px; margin-bottom: 12px;
  }
  .profile-note { font-size: 9pt; font-weight: 400; color: #6b7280; }
  .muted { color: #9ca3af; font-style: italic; }

  /* ── Allergen flag chips ── */
  .flag-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .flag-chip {
    font-family: Arial, sans-serif; font-size: 9pt;
    border-radius: 999px; padding: 3px 10px; border: 1px solid;
  }
  .flag-high   { background: #fef2f2; border-color: #fca5a5; color: #7f1d1d; }
  .flag-medium { background: #fff7ed; border-color: #fdba74; color: #7c2d12; }
  .flag-low    { background: #fefce8; border-color: #fde047; color: #713f12; }
  .risk-summary { font-family: Arial, sans-serif; font-size: 9pt; color: #6b7280; }
  .risk-high    { color: #b91c1c; font-weight: 700; }
  .risk-medium  { color: #c2410c; font-weight: 700; }
  .risk-low     { color: #b45309; font-weight: 700; }
  .risk-unknown { color: #6b7280; }
  .safe-text { color: #15803d; font-family: Arial, sans-serif; font-size: 10pt; }

  /* ── Nickel load ── */
  .nickel-summary { display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; }
  .nickel-mcg   { font-size: 20pt; font-weight: 700; color: #111827; }
  .nickel-label { font-family: Arial, sans-serif; font-size: 11pt; font-weight: 600; color: #374151; }
  .nickel-bar-wrap { height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; margin-bottom: 6px; }
  .nickel-bar  { height: 100%; border-radius: 999px; }
  .nickel-threshold { font-family: Arial, sans-serif; font-size: 9pt; color: #6b7280; margin-bottom: 12px; }
  .nickel-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 10px; }
  .nickel-table th {
    font-family: Arial, sans-serif; font-weight: 600; color: #6b7280;
    text-align: left; padding: 4px 8px 4px 0; border-bottom: 1px solid #e5e7eb;
    text-transform: uppercase; font-size: 8pt;
  }
  .nickel-table td { padding: 5px 8px 5px 0; border-bottom: 1px solid #f3f4f6; color: #374151; }
  .num-cell { text-align: right; }
  .nickel-class-high     { color: #b91c1c; }
  .nickel-class-moderate { color: #b45309; }
  .nickel-class-low      { color: #15803d; }
  .nickel-class-unknown  { color: #9ca3af; }

  /* ── Ingredients ── */
  .ingredient-list {
    list-style: none;
    display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px;
  }
  .ingredient-list li {
    padding: 4px 0; border-bottom: 1px solid #f3f4f6; font-size: 11pt;
  }
  .ingredient-list li::before { content: "• "; color: #22c55e; font-weight: 700; }
  .allergen-high   { color: #b91c1c !important; font-weight: 600; }
  .allergen-high::before   { color: #ef4444 !important; content: "⚠ " !important; }
  .allergen-medium { color: #c2410c !important; font-weight: 600; }
  .allergen-medium::before { color: #f97316 !important; content: "⚠ " !important; }

  /* ── Substitutions ── */
  .sub-section { border-top: 2px solid #22c55e; padding-top: 20px; }
  .premium-badge {
    font-size: 8pt; background: #fef9c3; border: 1px solid #fde047;
    border-radius: 4px; padding: 1px 6px; color: #713f12;
    vertical-align: middle; margin-left: 6px;
  }
  .sub-note { font-family: Arial, sans-serif; font-size: 9pt; color: #6b7280; margin-bottom: 16px; }
  .sub-group { margin-bottom: 18px; }
  .sub-ingredient { font-size: 11pt; margin-bottom: 6px; color: #374151; }
  .sub-list { list-style: none; padding-left: 0; }
  .sub-list li { font-size: 10pt; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
  .sub-reason { color: #6b7280; font-size: 9pt; }
  .sub-ratio  { color: #059669; font-size: 9pt; margin-left: 8px; }
  .sub-notes  { color: #6b7280; font-size: 9pt; }

  /* ── Source note ── */
  .source-note {
    background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px;
    padding: 12px 16px; margin-bottom: 22px;
    font-family: Arial, sans-serif; font-size: 10pt; color: #374151;
  }
  .source-note a { color: #15803d; }

  /* ── Footer ── */
  .pdf-footer {
    border-top: 2px solid #e5e7eb; margin-top: 40px; padding-top: 14px;
    font-family: Arial, sans-serif; font-size: 8pt; color: #9ca3af; line-height: 1.5;
  }
  .footer-brand { font-weight: 700; color: #22c55e; }

  /* ── Print setup ── */
  @page { margin: 1.5cm 1.8cm; }
  @media print {
    body { padding: 0; }
    .recipe-image { max-height: 240px; }
    .safety-banner, .flag-chip, .source-note, .sub-section, .nickel-bar {
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .allergen-high, .allergen-medium {
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .brand-name { -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #22c55e !important; }
  }
</style>
</head>
<body>

<!-- Branding header -->
<header class="brand-header">
  <div>
    <div class="brand-name">Recipzee</div>
    <div class="brand-tagline">Allergen Intelligence Report</div>
  </div>
  <div class="brand-date">Exported ${escHtml(dateStr)}</div>
</header>

<!-- Recipe title & source -->
<h1 class="recipe-title">${escHtml(recipe.title || 'Untitled Recipe')}</h1>
<div class="recipe-source">
  Sourced from <strong>${escHtml(recipe.sourceDomain || 'external source')}</strong>
  ${recipe.cuisineType ? ` &middot; ${escHtml(recipe.cuisineType)}` : ''}
</div>

<!-- Meta pills -->
${metaPills ? `<div class="meta-row">${metaPills}</div>` : ''}

<!-- Image -->
${imageHtml}

<!-- Personal safety banner -->
${safetyHtml}

<!-- Allergen analysis -->
${allergenSectionHtml}

<!-- Nickel load -->
${nickelHtml}

<!-- Ingredients -->
<section class="section">
  <h2 class="section-title">Ingredients</h2>
  ${ingredientHtml}
</section>

<!-- Substitutions (premium/trial) -->
${subHtml}

<!-- Source note — instructions at original source -->
<div class="source-note">
  <strong>📖 For full cooking instructions</strong>, visit the original recipe at: ${sourceLink}
</div>

<!-- Footer -->
<footer class="pdf-footer">
  <p>
    <span class="footer-brand">Recipzee</span> &mdash; recipzee.com &nbsp;&middot;&nbsp;
    Allergen and nickel load data is for informational purposes only and does not constitute medical advice.
    Source: Rebelytics R&amp;D Inc. v9.1.1 (2025), 257 studies, 20,575 measurements.
    Consult a healthcare professional for allergy management decisions.
    Recipe content from ${escHtml(recipe.sourceDomain || 'external source')} — Recipzee is not responsible for changes to the original recipe.
  </p>
</footer>

<script>
  window.onload = function () {
    setTimeout(function () { window.print(); }, 400);
  };
</script>
</body>
</html>`

  const popup = window.open('', '_blank', 'width=900,height=700,scrollbars=yes')
  if (!popup) {
    try {
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(recipe.title || 'recipe').replace(/[^a-z0-9]/gi, '_')}_allergen_report.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('Pop-ups are blocked. Your allergen report was downloaded as an HTML file — open it in your browser and print to PDF.', { duration: 6000 })
    } catch {
      toast.error('Could not export PDF. Please allow pop-ups for this site and try again.')
    }
    return
  }
  popup.document.write(html)
  popup.document.close()
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Escapes a value for safe insertion into HTML attribute values and text nodes.
 * Prevents XSS when user-supplied strings (recipe titles, ingredient names, etc.)
 * are interpolated into the HTML template.
 *
 * @param {*} str - Value to escape (coerced to string)
 * @returns {string} HTML-escaped string
 */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Scales an ingredient quantity string by a numeric multiplier.
 * Handles simple fractions (e.g. "1/2"), whole numbers, and decimals.
 * After scaling, snaps the result to a common fraction (1/4, 1/3, 1/2, 2/3, 3/4)
 * within 0.01 tolerance for a cleaner display; otherwise rounds off trailing zeros.
 *
 * @param {string|number|null} quantity - Raw quantity value from the recipe object
 * @param {number} scale - Multiplier (e.g. 2 for double batch)
 * @returns {string} Scaled quantity string, or the original value if parsing fails
 */
function scaleQty(quantity, scale) {
  if (!quantity || scale === 1) return quantity ?? ''
  const match = String(quantity).match(/^([\d./]+)\s*(.*)$/)
  if (!match) return quantity
  const [, numPart, unitPart] = match
  // Parse fractions like "1/2" or plain decimals/integers
  let num = numPart.includes('/')
    ? parseFloat(numPart.split('/')[0]) / parseFloat(numPart.split('/')[1])
    : parseFloat(numPart)
  if (isNaN(num)) return quantity
  const scaled = num * scale
  // Snap to common cooking fractions if the scaled value is very close
  const fracs = [[0.25, '1/4'], [0.333, '1/3'], [0.5, '1/2'], [0.666, '2/3'], [0.75, '3/4']]
  for (const [val, frac] of fracs) {
    if (Math.abs(scaled - val) < 0.01) return `${frac} ${unitPart}`.trim()
  }
  // Whole number — omit decimal point
  if (scaled === Math.floor(scaled)) return `${scaled} ${unitPart}`.trim()
  // Decimal — trim trailing zeros (e.g. "1.50" → "1.5")
  return `${scaled.toFixed(2).replace(/\.?0+$/, '')} ${unitPart}`.trim()
}
