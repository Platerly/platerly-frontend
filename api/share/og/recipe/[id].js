export default async function (context, req) {
  try {
    const id = context.bindingData.id;
    const PUBLIC_BASE = (process.env.PublicBaseUrl || "https://www.platerly.com").replace(/\/+$/, "");
    const BACKEND_BASE = (process.env.BackendBaseUrl || "").replace(/\/+$/, "");

    // Ask backend for the recipe to get its imageUrl
    const apiUrl = `https://${BACKEND_BASE}/api/Recipe/${id}`;
    const r = await fetch(apiUrl);
    const fallback = `${PUBLIC_BASE}/og-preview.png`;

    if (!r.ok) return redirect(fallback);

    const data = await r.json();
    const imageUrl = (data?.imageUrl || "").trim();

    return redirect(imageUrl || fallback);
  } catch {
    const PUBLIC_BASE = (process.env.PublicBaseUrl || "https://www.platerly.com").replace(/\/+$/, "");
    return redirect(`${PUBLIC_BASE}/og-preview.png`);
  }
}

function redirect(url) {
  return {
    status: 302,
    headers: {
      "Location": url,
      "cache-control": "public, max-age=21600"
    }
  };
}
