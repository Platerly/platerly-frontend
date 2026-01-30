/* eslint-disable no-undef, no-unused-vars */
module.exports = async function (context, _req) {
  const PUBLIC_BASE = (process.env.PublicBaseUrl || "https://www.recipzee.com").replace(/\/+$/, "");
  const BACKEND_BASE = (process.env.BackendBaseUrl || "").replace(/\/+$/, "");
  const id = context.bindingData.id;

  try {
    const apiUrl = `https://${BACKEND_BASE}/api/Recipe/${id}`;
    const r = await fetch(apiUrl);
    const fallback = `${PUBLIC_BASE}/og-preview.png`;
    if (!r.ok) return redirect(fallback);

    const data = await r.json();
    const imageUrl = String(data?.imageUrl || "").trim();
    return redirect(imageUrl || fallback);
  } catch {
    return redirect(`${PUBLIC_BASE}/og-preview.png`);
  }
};

function redirect(url) {
  return { status: 302, headers: { "Location": url, "cache-control": "public, max-age=21600" } };
}
