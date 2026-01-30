/* eslint-disable no-undef */
module.exports = async function (context, req) {
  context.log("Share recipe function triggered");
  context.log("Request URL:", req.url);
  context.log("Binding data:", JSON.stringify(context.bindingData));

  try {
    const id = context.bindingData.id || req.params?.id;
    context.log("Recipe ID:", id);

    if (!id) {
      context.log.error("No recipe ID provided");
      context.res = {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: "Missing recipe ID"
      };
      return;
    }

    const PUBLIC_BASE = (process.env.PublicBaseUrl || "https://www.recipzee.com").replace(/\/+$/, "");
    const BACKEND_BASE = (process.env.BackendBaseUrl || "").replace(/\/+$/, "");
    const site = "Recipzee";

    context.log("PUBLIC_BASE:", PUBLIC_BASE);
    context.log("BACKEND_BASE:", BACKEND_BASE);

    if (!BACKEND_BASE) {
      context.log.error("BackendBaseUrl not configured");
      context.res = {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: "Server configuration error: BackendBaseUrl not set"
      };
      return;
    }

    // pull recipe from your .NET API
    const apiUrl = `https://${BACKEND_BASE}/api/Recipe/${id}`;
    context.log("Fetching from:", apiUrl);

    const r = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Recipzee-ShareBot/1.0'
      }
    });
    context.log("API response status:", r.status);

    if (!r.ok) {
      let errorBody = "";
      try { errorBody = await r.text(); } catch { /* ignore */ }
      context.log.warn(`Recipe fetch failed ${r.status} ${apiUrl}`, errorBody);
      context.res = {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: `Recipe not found (API returned ${r.status}). Details: ${errorBody.slice(0, 200)}`
      };
      return;
    }

    const data = await r.json();
    // API returns { recipe: {...}, tagNames: [...], ... }
    const recipe = data?.recipe || data;
    const tagNamesArr = data?.tagNames || recipe?.tags || [];

    context.log("Recipe data received:", recipe?.title);

    const title = String(recipe?.title || "Recipe");
    const difficulty = recipe?.difficulty;
    const prep = recipe?.prepTimeMinutes > 0 ? `${recipe.prepTimeMinutes} min prep` : null;
    const cook = recipe?.cookTimeMinutes > 0 ? `${recipe.cookTimeMinutes} min cook` : null;
    const timePart = prep && cook ? `${prep}, ${cook}` : (prep || cook || null);

    const tagNamesFormatted = tagNamesArr
      .filter(Boolean)
      .map(s => `#${String(s).trim()}`)
      .slice(0, 3);

    const allergens = (recipe?.allergenList || []).filter(Boolean).slice(0, 3);

    const parts = [];
    if (difficulty !== undefined && difficulty !== null) parts.push(`Difficulty: ${difficulty}`);
    if (timePart) parts.push(timePart);
    if (tagNamesFormatted.length) parts.push(tagNamesFormatted.join(" "));
    if (allergens.length) parts.push(`Allergens: ${allergens.join(", ")}`);

    let desc = recipe?.description || parts.join(" - ");
    if (desc.length > 240) desc = desc.slice(0, 240) + "...";

    // Use SEO-friendly URL if slug and username are available, otherwise fall back to ID
    const authorUsername = recipe?.authorUsername;
    const recipeSlug = recipe?.slug;
    const canonicalUrl = (authorUsername && recipeSlug)
      ? `${PUBLIC_BASE}/@${authorUsername}/${recipeSlug}`
      : `${PUBLIC_BASE}/recipe/${id}`;
    const shareImage = recipe?.imageUrl || `${PUBLIC_BASE}/og-preview.png`;

    // Parse instructions - could be string (with newlines) or array
    const instructionsRaw = recipe?.instructions || "";
    const instructionSteps = typeof instructionsRaw === 'string'
      ? instructionsRaw.split(/\n+/).map(s => s.trim()).filter(Boolean)
      : (Array.isArray(instructionsRaw) ? instructionsRaw : []);

    // Build Recipe structured data (JSON-LD) for Google rich results
    const recipeSchema = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": title,
      "image": shareImage,
      "description": desc,
      "url": canonicalUrl,
      "author": {
        "@type": "Person",
        "name": recipe?.authorDisplayName || recipe?.authorUsername || "Recipzee Chef"
      },
      "datePublished": recipe?.createdAt ? new Date(recipe.createdAt).toISOString().split('T')[0] : undefined,
      "prepTime": recipe?.prepTimeMinutes > 0 ? `PT${recipe.prepTimeMinutes}M` : undefined,
      "cookTime": recipe?.cookTimeMinutes > 0 ? `PT${recipe.cookTimeMinutes}M` : undefined,
      "totalTime": (recipe?.prepTimeMinutes > 0 || recipe?.cookTimeMinutes > 0)
        ? `PT${(recipe?.prepTimeMinutes || 0) + (recipe?.cookTimeMinutes || 0)}M`
        : undefined,
      "recipeCategory": tagNamesArr.filter(Boolean).slice(0, 3),
      "recipeIngredient": (recipe?.ingredients || []).map(i =>
        typeof i === 'string' ? i : (i?.quantity ? `${i.quantity} ${i.name}`.trim() : i?.name)
      ).filter(Boolean),
      "recipeInstructions": instructionSteps.map((step, idx) => ({
        "@type": "HowToStep",
        "position": idx + 1,
        "text": typeof step === 'string' ? step : step?.text || step?.instruction || String(step)
      })).filter(s => s.text),
      "recipeYield": recipe?.servings ? `${recipe.servings} servings` : undefined,
      "keywords": tagNamesArr.filter(Boolean).join(", ") || undefined
    };

    // Remove undefined fields
    Object.keys(recipeSchema).forEach(key => {
      if (recipeSchema[key] === undefined ||
          (Array.isArray(recipeSchema[key]) && recipeSchema[key].length === 0)) {
        delete recipeSchema[key];
      }
    });

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${E(title)} - ${site}</title>
<link rel="canonical" href="${canonicalUrl}" />

<meta property="og:type" content="article">
<meta property="og:site_name" content="${site}">
<meta property="og:title" content="${E(title)}">
<meta property="og:description" content="${E(desc)}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${E(shareImage)}">
<meta property="og:image:secure_url" content="${E(shareImage)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${E(title)} on ${site}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${E(title)}">
<meta name="twitter:description" content="${E(desc)}">
<meta name="twitter:image" content="${E(shareImage)}">
<meta name="twitter:url" content="${canonicalUrl}">
<meta name="twitter:domain" content="recipzee.com">
<meta name="twitter:site" content="@recipzee">

<script type="application/ld+json">${JSON.stringify(recipeSchema)}</script>

<meta http-equiv="refresh" content="0; url=${canonicalUrl}">
<style>
  html,body{background:#081615;color:#cbe3df;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Arial,sans-serif}
  .wrap{display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px}
  a{color:#5EEAD4}
</style>
</head>
<body>
  <div class="wrap">
    <div>
      <h1>${E(title)}</h1>
      <p>Opening recipe... If you are not redirected, <a href="${canonicalUrl}">tap here</a>.</p>
    </div>
  </div>
</body>
</html>`;

    context.log("Returning HTML page");
    context.res = {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=21600"
      },
      body: page
    };
  } catch (e) {
    context.log.error("Function error:", e.message, e.stack);
    context.res = {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `Error: ${e.message}`
    };
  }
};

function E(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
