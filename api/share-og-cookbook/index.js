/* eslint-disable no-undef, no-unused-vars */
module.exports = async function (context, _req) {
  try {
    const id = context.bindingData.id;
    const PUBLIC_BASE = (process.env.PublicBaseUrl || "https://www.platerly.com").replace(/\/+$/, "");
    const BACKEND_BASE = (process.env.BackendBaseUrl || "").replace(/\/+$/, "");
    const fallback = `${PUBLIC_BASE}/og-preview.png`;

    // pull cookbook from your .NET API
    const apiUrl = `https://${BACKEND_BASE}/api/Cookbook/${id}`;
    const r = await fetch(apiUrl);
    if (!r.ok) {
      context.log.warn(`Cookbook fetch failed ${r.status} ${apiUrl}`);
      return redirect(fallback);
    }
    const data = await r.json();
    const imageUrl = data?.coverImageUrl;

    return redirect(imageUrl || fallback);
  } catch (e) {
    context.log.error(e);
    const PUBLIC_BASE = (process.env.PublicBaseUrl || "https://www.platerly.com").replace(/\/+$/, "");
    return redirect(`${PUBLIC_BASE}/og-preview.png`);
  }
};

function redirect(url) {
  return {
    status: 302,
    headers: {
      "location": url,
      "cache-control": "public, max-age=21600"
    },
    body: ""
  };
}
