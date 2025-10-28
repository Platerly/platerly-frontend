module.exports = async function (context, req) {
  try {
    const id = context.bindingData.id;
    const PUBLIC_BASE = (process.env.PublicBaseUrl || "https://www.platerly.com").replace(/\/+$/, "");
    const BACKEND_BASE = (process.env.BackendBaseUrl || "").replace(/\/+$/, "");
    const site = "Platerly";

    // pull recipe from your .NET API
    const apiUrl = `https://${BACKEND_BASE}/api/Recipe/${id}`;
    const r = await fetch(apiUrl);
    if (!r.ok) {
      context.log.warn(`Recipe fetch failed ${r.status} ${apiUrl}`);
      return html(404, "Recipe not found");
    }
    const data = await r.json();

    const title = String(data?.title || "Recipe");
    const difficulty = data?.difficulty;
    const prep = data?.prepTimeMinutes > 0 ? `${data.prepTimeMinutes} min prep` : null;
    const cook = data?.cookTimeMinutes > 0 ? `${data.cookTimeMinutes} min cook` : null;
    const timePart = prep && cook ? `${prep}, ${cook}` : (prep || cook || null);

    const tagNames = (data?.tagNames || data?.tags || [])
      .filter(Boolean)
      .map(s => `#${String(s).trim()}`)
      .slice(0, 3);

    const allergens = (data?.allergenList || []).filter(Boolean).slice(0, 3);

    const parts = [];
    if (difficulty !== undefined && difficulty !== null) parts.push(`Difficulty: ${difficulty}`);
    if (timePart) parts.push(timePart);
    if (tagNames.length) parts.push(tagNames.join(" "));
    if (allergens.length) parts.push(`⚠️ Allergens: ${allergens.join(", ")}`);

    let desc = parts.join(" · ");
    if (desc.length > 240) desc = desc.slice(0, 240) + "…";

    const canonicalUrl = `${PUBLIC_BASE}/recipe/${id}`;
    const shareImage = `${PUBLIC_BASE}/og/recipe/${id}.png`;

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${E(`${title} — ${site}`)}</title>
<link rel="canonical" href="${canonicalUrl}" />

<meta property="og:type" content="article">
<meta property="og:site_name" content="${site}">
<meta property="og:title" content="${E(title)}">
<meta property="og:description" content="${E(desc)}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${shareImage}">
<meta property="og:image:alt" content="${E(`${title} on ${site}`)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${E(title)}">
<meta name="twitter:description" content="${E(desc)}">
<meta name="twitter:image" content="${shareImage}">
<meta name="twitter:url" content="${canonicalUrl}">
<meta name="twitter:domain" content="platerly.com">
<meta name="twitter:site" content="@platerlyinc">

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
      <p>Opening recipe… If you are not redirected, <a href="${canonicalUrl}">tap here</a>.</p>
    </div>
  </div>
</body>
</html>`;

    return {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=21600"
      },
      body: page
    };
  } catch (e) {
    context.log.error(e);
    return html(404, "An error occurred while processing the share request.");
  }
};

function E(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function html(code, msg) {
  return { status: code, headers: { "content-type":"text/html; charset=utf-8" }, body: E(msg) };
}
