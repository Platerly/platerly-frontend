/**
 * exportRecipePdf — opens a styled print window for a recipe.
 *
 * @param {Object} options
 * @param {Object}   options.recipe          - core recipe object
 * @param {string[]} options.allergenTerms   - ingredient names that matched user allergies
 * @param {string}   options.difficulty      - formatted difficulty string ("Easy" / "Medium" / "Hard")
 * @param {string|null} options.prep         - formatted prep time ("30 min")
 * @param {string|null} options.cook         - formatted cook time ("1 hr")
 * @param {string|null} options.total        - formatted total time
 * @param {number}   options.scale           - ingredient scale factor (default 1)
 * @param {boolean}  options.isPremium       - include substitution section if true
 * @param {string|null} options.token        - bearer token for substitution fetch
 * @param {string}   options.apiBase         - API base URL
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
  let substitutions = {}

  if (isPremium && token && allergenTerms.length > 0) {
    await Promise.allSettled(
      allergenTerms.map(async (name) => {
        try {
          const res = await fetch(
            `${apiBase}/api/substitution/ingredient/name/${encodeURIComponent(name)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (!res.ok) return
          const json = await res.json()
          const subs = Array.isArray(json) ? json : (json?.data ?? [])
          if (subs.length > 0) substitutions[name] = subs.slice(0, 3)
        } catch { /* ignore */ }
      })
    )
  }

  // ── Build ingredient rows ────────────────────────────────────────────────
  const ingredientRows = (recipe.ingredients || []).map((ing) => {
    const qty = scaleQty(ing.quantity, scale)
    const unit = ing.unit || ''
    const display = [qty, unit, ing.name].filter(Boolean).join(' ')
    const isAllergen = allergenTerms.some(
      (a) => ing.name && ing.name.toLowerCase().includes(a.toLowerCase())
    )
    return { display, isAllergen, name: ing.name }
  })

  // ── Build instructions ────────────────────────────────────────────────────
  const instructionLines = (recipe.instructions || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // ── Build tags ────────────────────────────────────────────────────────────
  const tags = Array.isArray(recipe.tags) ? recipe.tags : []

  // ── Build HTML ────────────────────────────────────────────────────────────
  const hasSubstitutions = Object.keys(substitutions).length > 0
  const dateStr = recipe.createdAt
    ? new Date(recipe.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  const metaPills = [
    difficulty ? `<span class="pill">${escHtml(difficulty)}</span>` : '',
    prep ? `<span class="pill">Prep: ${escHtml(prep)}</span>` : '',
    cook ? `<span class="pill">Cook: ${escHtml(cook)}</span>` : '',
    total ? `<span class="pill">Total: ${escHtml(total)}</span>` : '',
    recipe.servings ? `<span class="pill">${escHtml(String(recipe.servings))} servings</span>` : '',
    scale !== 1 ? `<span class="pill pill-green">Scale: ${scale}x</span>` : '',
  ].filter(Boolean).join('')

  const allergenHtml = allergenTerms.length > 0
    ? `<div class="allergen-box">
        <strong>⚠ Allergen Alert:</strong> This recipe contains ingredients that may match your allergen profile:
        <strong>${allergenTerms.map(escHtml).join(', ')}</strong>.
        Please verify all ingredients before consuming.
       </div>`
    : ''

  const ingredientHtml = `<ul class="ingredient-list">${
    ingredientRows.map(({ display, isAllergen }) =>
      `<li class="${isAllergen ? 'allergen-item' : ''}">${escHtml(display)}</li>`
    ).join('')
  }</ul>`

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

  const imageHtml = recipe.imageUrl
    ? `<div class="recipe-image-wrap">
        <img class="recipe-image" src="${escHtml(recipe.imageUrl)}" alt="${escHtml(recipe.title || 'Recipe image')}" crossorigin="anonymous" />
       </div>`
    : ''

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

  const popup = window.open('', '_blank', 'width=900,height=700,scrollbars=yes')
  if (!popup) {
    alert('Pop-up blocked — please allow pop-ups for this site to export PDFs.')
    return
  }
  popup.document.write(html)
  popup.document.close()
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function scaleQty(quantity, scale) {
  if (!quantity || scale === 1) return quantity ?? ''
  const match = String(quantity).match(/^([\d./]+)\s*(.*)$/)
  if (!match) return quantity
  const [, numPart, unitPart] = match
  let num = numPart.includes('/')
    ? parseFloat(numPart.split('/')[0]) / parseFloat(numPart.split('/')[1])
    : parseFloat(numPart)
  if (isNaN(num)) return quantity
  const scaled = num * scale
  const fracs = [[0.25, '1/4'], [0.333, '1/3'], [0.5, '1/2'], [0.666, '2/3'], [0.75, '3/4']]
  for (const [val, frac] of fracs) {
    if (Math.abs(scaled - val) < 0.01) return `${frac} ${unitPart}`.trim()
  }
  if (scaled === Math.floor(scaled)) return `${scaled} ${unitPart}`.trim()
  return `${scaled.toFixed(2).replace(/\.?0+$/, '')} ${unitPart}`.trim()
}
