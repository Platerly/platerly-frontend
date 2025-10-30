// src/pages/CookbookDetailsPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/fetchWithAuth";
import { API_BASE_URL } from "../utils/api";
import CookbookRecipeCard from "../components/ui/CookbookRecipeCard";

/* ---------------- Helpers ---------------- */
const getErrorText = (err, fallback = "Something went wrong.") => {
  try {
    if (typeof err === "string") return err;
    if (err?.message) return err.message;
    const d = err?.response?.data || err?.data;
    if (typeof d === "string") return d;
    if (d?.title) return d.title;
    if (d?.error) return d.error;
  } catch {}
  return fallback;
};

const isGuid = (q) => /^[0-9a-fA-F-]{36}$/.test(q || "");

/* ---------------- Small UI bits ---------------- */
const Chip = ({ children, tone = "neutral" }) => {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : tone === "danger"
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : "bg-neutral-700/30 text-neutral-300 border-neutral-600/50";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${toneClass}`}>
      {children}
    </span>
  );
};

const Section = ({ title, right, children }) => (
  <section className="mb-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
      <h2 className="text-lg sm:text-xl font-semibold text-white">{title}</h2>
      {right}
    </div>
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 sm:p-6">
      {children}
    </div>
  </section>
);

/* ---------------- Page ---------------- */
const CookbookDetailsPage = () => {
  const { id } = useParams();
  const { token, loading: authLoading } = useAuth();

  const [cookbook, setCookbook] = useState(null);
  const [contributors, setContributors] = useState([]); // null => hide panel (non-owner)
  const [lookup, setLookup] = useState(""); // username or userId

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // --------- API calls (refresh-aware via apiFetch) ----------
  // --------- API calls (refresh-aware via apiFetch) ----------
const fetchCookbook = async (signal) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}`, {
      headers: authHeaders,
      signal,
    });

    // ✅ Explicitly check result to catch 401/404 cleanly
    if (res.status === 401) throw new Error("Unauthorized — please log in again.");
    if (res.status === 404) throw new Error("Cookbook not found.");
    if (!res.ok) throw new Error(`Unexpected error (${res.status}).`);

    const data = await res.json();
    setCookbook(data);
    return data;
  } catch (err) {
    // ✅ Handle user-triggered aborts quietly
    if (err.name === "AbortError") return;
    console.error("fetchCookbook failed:", err);
    setError(err.message || "Failed to load cookbook.");
    throw err;
  }
};

const fetchContributors = async (signal) => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}/contributors`, {
      headers: authHeaders,
      signal,
    });

    if (res.status === 403) {
      // ✅ Non-owner → hide contributor panel
      setContributors(null);
      return;
    }
    if (!res.ok) throw new Error(`Failed to load contributors (${res.status})`);

    const data = await res.json();
    setContributors(data || []);
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error("fetchContributors failed:", err);
    setContributors(null);
  }
};


  const findUserId = async (q) => {
    const text = q?.trim();
    if (!text) throw new Error("Enter a username or user ID.");
    if (isGuid(text)) return text;

    const res = await apiFetch(`${API_BASE_URL}/api/User/search?q=${encodeURIComponent(text)}`, {
      headers: authHeaders,
    });
    if (!res.ok) throw new Error("Search failed.");
    const list = await res.json();
    const match = Array.isArray(list) ? list[0] : null;
    if (!match?.id) throw new Error("No user found with that name.");
    return match.id;
  };

  // --------- Effects ----------
 useEffect(() => {
  if (authLoading) return; // wait for valid token
  const ac = new AbortController();
  const { signal } = ac;

  setLoading(true);
  setError("");

  (async () => {
    try {
      //  Run sequentially (safer for state + avoids undefined Promise result)
      await fetchCookbook(signal);
      await fetchContributors(signal);
    } catch (e) {
      if (e.name === "CanceledError" || e.name === "AbortError") return;
      console.error("Cookbook load error:", e);
      setError(getErrorText(e, "Failed to load cookbook."));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  })();

  // ✅ Cleanup on route change / unmount
  return () => ac.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id, token, authLoading]);


  // --------- Cover upload ----------
  const onPickCover = () => fileInputRef.current?.click();

  const onCoverSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}/cover`, {
        method: "PUT",
        headers: authHeaders, // fetchWithAuth will not clobber multipart boundary
        body: form,
      });
      if (!res.ok) throw new Error(res.status === 403 ? "Only the owner can change the cover." : "Failed to upload cover.");
      const data = await res.json();
      setCookbook((prev) => ({ ...prev, coverImageUrl: data.coverUrl }));
    } catch (err) {
      alert(getErrorText(err));
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // --------- Contributors CRUD ----------
  const addContributor = async (e) => {
    e.preventDefault();
    if (!lookup.trim()) return;
    setAdding(true);
    try {
      const userId = await findUserId(lookup);
      const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}/contributors`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "Write" }),
      });
      if (!res.ok) throw new Error("Failed to add contributor.");
      setLookup("");
      await fetchContributors(); // refresh list
    } catch (err) {
      alert(getErrorText(err, "Failed to add contributor."));
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const removeContributor = async (userId) => {
    if (!confirm("Remove this contributor?")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}/contributors/${userId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to remove contributor.");
      await fetchContributors();
    } catch (err) {
      alert(getErrorText(err));
      console.error(err);
    }
  };

  const handleRecipeRemove = (recipeId) => {
    setCookbook((prev) => ({
      ...prev,
      items: (prev?.items || []).filter((r) => r.recipeId !== recipeId),
    }));
  };

  // --------- Render ----------
  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 text-white">
        <div className="animate-pulse space-y-4">
          <div className="h-40 sm:h-56 w-full rounded-2xl bg-neutral-800" />
          <div className="h-6 w-1/2 rounded bg-neutral-800" />
          <div className="h-4 w-1/3 rounded bg-neutral-800" />
          <div className="h-24 w-full rounded-2xl bg-neutral-900" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="max-w-3xl mx-auto p-6 text-center text-red-400">{error}</div>;
  }

  if (!cookbook) {
    return <div className="max-w-3xl mx-auto p-6 text-center text-red-400">Cookbook not found.</div>;
  }

  const items = cookbook.items || [];
  const isOwner = Array.isArray(contributors); // owner-only UI when contributors fetch succeeded

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-white">
      {/* Header with cover */}
      <div className="mb-6">
        <div className="w-full max-w-4xl aspect-[16/9] sm:aspect-[7/3] bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 mx-auto">
          {cookbook.coverImageUrl ? (
            <img
              src={cookbook.coverImageUrl}
              alt={`${cookbook.title} cover`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              No cover image yet
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{cookbook.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
              <Chip tone={cookbook.isPublic ? "success" : "neutral"}>
                {cookbook.isPublic ? "Public" : "Private"}
              </Chip>
              <span aria-hidden>•</span>
              <span>Created {new Date(cookbook.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2 sm:ml-auto">
              <button
                onClick={onPickCover}
                disabled={uploading}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 border border-emerald-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
                aria-label="Change cover image"
              >
                {uploading ? "Uploading…" : "Change cover"}
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={onCoverSelected}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Contributors panel (only if owner) */}
      {isOwner && (
        <Section title="Contributors">
          {contributors.length === 0 ? (
            <p className="text-neutral-400 mb-4">No contributors yet.</p>
          ) : (
            <ul className="mb-4 divide-y divide-neutral-800">
              {contributors.map((c) => (
                <li key={c.userId} className="py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.displayName || c.userId}</div>
                    <div className="text-xs text-neutral-400">
                      Role: {c.role} • Added {new Date(c.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => removeContributor(c.userId)}
                    className="ml-3 inline-flex items-center justify-center px-3 py-2 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 min-h-[40px]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addContributor} className="flex flex-col sm:flex-row gap-2" aria-label="Add contributor">
            <input
              type="text"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="Type a username or paste userId"
              className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
              aria-label="Contributor username or user ID"
            />
            <button
              type="submit"
              disabled={adding || !lookup.trim()}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 border border-emerald-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
            >
              {adding ? "Adding…" : "Add"}
            </button>
          </form>
          <p className="text-xs text-neutral-500 mt-2">Tip: if search fails, paste the user’s ID (GUID).</p>
        </Section>
      )}

      {/* Recipes grid */}
      <Section
        title={`Recipes (${(cookbook.items || []).length})`}
        right={
          (cookbook.items || []).length > 0 ? (
            <div className="text-xs text-neutral-400">Tap a card to view • Long-press to open in new tab</div>
          ) : null
        }
      >
        {(cookbook.items || []).length === 0 ? (
          <p className="text-neutral-400">No recipes saved in this cookbook yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(cookbook.items || []).map((r) => (
              <CookbookRecipeCard
                key={r.recipeId}
                recipe={{ id: r.recipeId, title: r.title, description: r.description, imageUrl: r.imageUrl }}
                cookbookId={cookbook.id}
                onRemove={handleRecipeRemove}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default CookbookDetailsPage;
