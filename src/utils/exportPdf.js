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
