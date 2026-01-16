module.exports = async function (context, req) {
  context.log("Share cookbook function triggered");

  try {
    const id = context.bindingData.id || req.params?.id;
    context.log("Cookbook ID:", id);

    if (!id) {
      context.res = {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: "Missing cookbook ID"
      };
      return;
    }

    const PUBLIC_BASE = (process.env.PublicBaseUrl || "https://www.platerly.com").replace(/\/+$/, "");
    const BACKEND_BASE = (process.env.BackendBaseUrl || "").replace(/\/+$/, "");
    const site = "Platerly";

    if (!BACKEND_BASE) {
      context.res = {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: "Server configuration error: BackendBaseUrl not set"
      };
      return;
    }

    const apiUrl = `https://${BACKEND_BASE}/api/Cookbook/${id}`;
    context.log("Fetching from:", apiUrl);

    const r = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Platerly-ShareBot/1.0'
      }
    });
    if (!r.ok) {
      let errorBody = "";
      try { errorBody = await r.text(); } catch (e) {}
      context.log.warn(`Cookbook fetch failed ${r.status} ${apiUrl}`, errorBody);
      context.res = {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: `Cookbook not found (API returned ${r.status}). Details: ${errorBody.slice(0, 200)}`
      };
      return;
    }

    const data = await r.json();
    const title = String(data?.title || "Cookbook");
    const recipeCount = data?.recipeCount || data?.items?.length || 0;
    const ownerUsername = data?.ownerUsername;
    const coverImage = data?.coverImageUrl;

    const parts = [];
    if (data?.description) {
      const desc = data.description.length > 150 ? data.description.slice(0, 150) + "..." : data.description;
      parts.push(desc);
    }
    parts.push(`${recipeCount} recipe${recipeCount === 1 ? "" : "s"}`);
    if (ownerUsername) {
      parts.push(`by @${ownerUsername}`);
    }

    let desc = parts.join(" - ");
    if (desc.length > 240) desc = desc.slice(0, 240) + "...";

    const canonicalUrl = `${PUBLIC_BASE}/cookbook/${id}`;
    const shareImage = coverImage || `${PUBLIC_BASE}/og-preview.png`;

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
<meta property="og:image" content="${shareImage}">
<meta property="og:image:alt" content="${E(title)} on ${site}">

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
      <p>Opening cookbook... If you are not redirected, <a href="${canonicalUrl}">tap here</a>.</p>
    </div>
  </div>
</body>
</html>`;

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=21600"
      },
      body: page
    };
  } catch (e) {
    context.log.error("Function error:", e.message);
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
