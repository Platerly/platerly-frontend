// src/pages/CookbookDetailsPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/fetchWithAuth";
import { API_BASE_URL } from "../utils/api";
import CookbookRecipeCard from "../components/ui/CookbookRecipeCard";
import ConfirmDialog from "../components/common/ConfirmDialog";

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
  // NEW: pull `user` so we can exclude current user from suggestions
  const { token, loading: authLoading, user } = useAuth(); // was: { token, loading: authLoading }

  const [cookbook, setCookbook] = useState(null);
  const [contributors, setContributors] = useState([]); // null => hide panel (non-owner / forbidden)

  // --- Add contributor input + suggestions ---
  const [lookup, setLookup] = useState(""); // username or userId
  const [suggestions, setSuggestions] = useState([]); // [{id, username, displayName, avatarUrl}, ...]
  const [sOpen, setSOpen] = useState(false);
  const [sLoading, setSLoading] = useState(false);
  const [sError, setSError] = useState("");
  const [sIndex, setSIndex] = useState(-1); // keyboard highlight
  const selectedUserIdRef = useRef(null); // if user picked from list

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [inlineMsg, setInlineMsg] = useState("");

  const fileInputRef = useRef(null);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const formWrapRef = useRef(null); // for click-outside on suggestions
  const debounceRef = useRef(null);

  /* --------- API calls ---------- */
  const fetchCookbook = async (signal) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}`, {
        headers: authHeaders,
        signal,
      });
      if (res.status === 401) throw new Error("Unauthorized — please log in again.");
      if (res.status === 404) throw new Error("Cookbook not found.");
      if (!res.ok) throw new Error(`Unexpected error (${res.status}).`);
      const data = await res.json();
      setCookbook(data);
      return data;
    } catch (err) {
      if (err?.name === "AbortError") return;
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
        setContributors(null); // hide if not owner
        return;
      }
      if (!res.ok) throw new Error(`Failed to load contributors (${res.status})`);
      const data = await res.json();
      setContributors(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.warn("fetchContributors failed, hiding panel:", err);
      setContributors(null);
    }
  };

  const searchUsers = async (q, signal) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setSOpen(false);
      setSError("");
      return;
    }
    setSLoading(true);
    setSError("");
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/User/search?q=${encodeURIComponent(q.trim())}`, {
        headers: authHeaders,
        signal,
      });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const list = await res.json();

      // Normalize fields we may have: id, username, displayName, avatarUrl
      let norm = (Array.isArray(list) ? list : []).map((u) => ({
        id: u.id,
        username: u.username || u.userName || "",
        displayName: u.displayName || u.fullName || u.username || "User",
        avatarUrl: u.avatarUrl || u.profileImageUrl || "",
      }));

      // NEW: compute existingIds once and filter out self + already-contributors
      const existingIds = new Set(
        (Array.isArray(contributors) ? contributors : []).map((c) => c.userId)
      );
      norm = norm.filter(
        (u) => u.id && u.id !== user?.id && !existingIds.has(u.id)
      );

      setSuggestions(norm);
      setSOpen(true);
      setSIndex(norm.length ? 0 : -1);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("User search error:", err);
      setSError(getErrorText(err, "Search failed."));
      setSuggestions([]);
      setSOpen(true);
      setSIndex(-1);
    } finally {
      setSLoading(false);
    }
  };

  const findUserId = async (q) => {
    const text = q?.trim();
    if (!text) throw new Error("Enter a username or user ID.");
    if (isGuid(text)) {
      // NEW: block adding self/given guid if it's the current user or already a contributor
      if (text === user?.id) throw new Error("You can't add yourself.");
      const exists = (Array.isArray(contributors) ? contributors : []).some((c) => c.userId === text);
      if (exists) throw new Error("User is already a contributor.");
      return text;
    }

    const res = await apiFetch(`${API_BASE_URL}/api/User/search?q=${encodeURIComponent(text)}`, {
      headers: authHeaders,
    });
    if (!res.ok) throw new Error("Search failed.");
    const list = await res.json();

    // NEW: choose the first non-self, non-existing contributor
    const existingIds = new Set(
      (Array.isArray(contributors) ? contributors : []).map((c) => c.userId)
    );
    const match = (Array.isArray(list) ? list : []).find(
      (u) => u?.id && u.id !== user?.id && !existingIds.has(u.id)
    );

    if (!match?.id) throw new Error("No other users found with that name.");
    return match.id;
  };

  const addContributorById = async (userId) => {
    const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}/contributors`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: "Write" }),
    });
    if (!res.ok) throw new Error("Failed to add contributor.");
  };

  /* --------- Effects ---------- */
  useEffect(() => {
    if (authLoading) return;
    const ac = new AbortController();
    const { signal } = ac;

    setLoading(true);
    setError("");
    setInlineMsg("");

    (async () => {
      try {
        await fetchCookbook(signal);
        await fetchContributors(signal);
      } catch (e) {
        if (e?.name === "AbortError" || e?.name === "CanceledError") return;
        console.error("Cookbook load error:", e);
        setError(getErrorText(e, "Failed to load cookbook."));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, authLoading]);

  // Debounce user search on lookup changes
  useEffect(() => {
    if (!contributors) return; // non-owner: no panel
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = lookup;
    debounceRef.current = setTimeout(() => {
      const ac = new AbortController();
      searchUsers(q, ac.signal);
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup]);

  // Close suggestions on outside click
  useEffect(() => {
    const onDocDown = (e) => {
      if (!formWrapRef.current) return;
      if (!formWrapRef.current.contains(e.target)) {
        setSOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  /* --------- Cover upload ---------- */
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
        headers: authHeaders,
        body: form,
      });
      if (!res.ok) {
        throw new Error(res.status === 403 ? "Only the owner can change the cover." : "Failed to upload cover.");
      }
      const data = await res.json();
      setCookbook((prev) => ({ ...prev, coverImageUrl: data.coverUrl }));
      setInlineMsg("Cover updated.");
    } catch (err) {
      setInlineMsg(getErrorText(err));
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
      setTimeout(() => setInlineMsg(""), 2500);
    }
  };

  /* --------- Contributors CRUD ---------- */
  const onPickSuggestion = (userRow) => {
    selectedUserIdRef.current = userRow.id;
    setLookup(userRow.username || userRow.displayName || userRow.id);
    setSOpen(false);
  };

  const addContributor = async (e) => {
    e.preventDefault();
    if (!lookup.trim()) return;
    setAdding(true);
    try {
      const userId = selectedUserIdRef.current
        ? selectedUserIdRef.current
        : await findUserId(lookup);

      await addContributorById(userId);

      // cleanup and refresh
      selectedUserIdRef.current = null;
      setLookup("");
      setSuggestions([]);
      setSOpen(false);

      await fetchContributors(); // refresh
      setInlineMsg("Contributor added.");
    } catch (err) {
      setInlineMsg(getErrorText(err, "Failed to add contributor."));
      console.error(err);
    } finally {
      setAdding(false);
      setTimeout(() => setInlineMsg(""), 2500);
    }
  };

  const removeContributor = async (userId) => {
    const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}/contributors/${userId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!res.ok) throw new Error("Failed to remove contributor.");
    await fetchContributors();
  };

  /* --------- Item removal (local state reaction) ---------- */
  const handleRecipeRemove = (recipeId) => {
    setCookbook((prev) => {
      const next = { ...(prev || {}) };
      next.items = (prev?.items || []).filter((r) => (r.recipeId ?? r.id) !== recipeId);
      return next;
    });
  };

  /* --------- Render ---------- */
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

  if (error) return <div className="max-w-3xl mx-auto p-6 text-center text-red-400">{error}</div>;
  if (!cookbook) return <div className="max-w-3xl mx-auto p-6 text-center text-red-400">Cookbook not found.</div>;

  const items = cookbook.items || [];
  const isOwner = Array.isArray(contributors);

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
              {inlineMsg && (
                <>
                  <span aria-hidden>•</span>
                  <span className="text-emerald-300">{inlineMsg}</span>
                </>
              )}
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
                <li key={c.userId} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs text-neutral-300">
                      {(c.displayName || "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.displayName || c.userId}</div>
                      <div className="text-xs text-neutral-400">
                        Role: {c.role} • Added {new Date(c.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <ConfirmDialog
                    title="Remove contributor?"
                    description={`This will revoke ${c.displayName || "this user"}'s access to this cookbook.`}
                    confirmLabel="Remove"
                    cancelLabel="Cancel"
                    tone="danger"
                    onConfirm={async () => {
                      try {
                        await removeContributor(c.userId);
                      } catch (err) {
                        alert(getErrorText(err, "Failed to remove contributor."));
                      }
                    }}
                    trigger={
                      <button
                        type="button"
                        className="ml-3 inline-flex items-center justify-center px-3 py-2 rounded-lg text-red-100 bg-red-600/80 hover:bg-red-600 border border-red-500/40 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 min-h-[40px]"
                        title="Remove contributor"
                        aria-label="Remove contributor"
                      >
                        Remove
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Add contributor with autocomplete */}
          <form
            onSubmit={addContributor}
            className="relative"
            aria-label="Add contributor"
            ref={formWrapRef}
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="search"
                name="contrib-search"
                id={`contrib-search-${id}`}
                value={lookup}
                onChange={(e) => {
                  selectedUserIdRef.current = null;
                  setLookup(e.target.value);
                  setSOpen(true);
                }}
                onKeyDown={(e) => {
                  if (!sOpen || !suggestions.length) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSIndex((i) => (i + 1) % suggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
                  } else if (e.key === "Enter") {
                    if (sIndex >= 0) {
                      e.preventDefault();
                      onPickSuggestion(suggestions[sIndex]);
                    }
                  } else if (e.key === "Escape") {
                    setSOpen(false);
                  }
                }}
                placeholder="Type a username or paste userId"
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
                aria-label="Contributor username or user ID"
                aria-autocomplete="list"
                aria-expanded={sOpen}
                aria-controls="contrib-suggestions"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                inputMode="text"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore="true"
                data-form-type="other"
              />
              <button
                type="submit"
                disabled={adding || !lookup.trim()}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 border border-emerald-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
              >
                {adding ? "Adding…" : "Add"}
              </button>
            </div>

            {/* Suggestions popover */}
            {sOpen && (
              <div
                id="contrib-suggestions"
                role="listbox"
                className="absolute z-20 mt-2 w-full sm:w-[60%] max-h-72 overflow-auto rounded-xl border border-neutral-800 bg-neutral-900/95 backdrop-blur shadow-xl"
              >
                {sLoading ? (
                  <div className="px-3 py-3 text-sm text-neutral-400">Searching…</div>
                ) : sError ? (
                  <div className="px-3 py-3 text-sm text-red-400">{sError}</div>
                ) : suggestions.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-neutral-400">No matches.</div>
                ) : (
                  suggestions.map((u, i) => (
                    <div
                      key={u.id}
                      role="option"
                      aria-selected={i === sIndex}
                      onMouseDown={(e) => e.preventDefault()} // keep focus in input
                      onClick={() => onPickSuggestion(u)}
                      className={[
                        "flex items-center justify-between gap-3 px-3 py-2 cursor-pointer",
                        i === sIndex ? "bg-neutral-800" : "hover:bg-neutral-800/70",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatarUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="}
                          alt=""
                          className="h-8 w-8 rounded-full border border-neutral-700 object-cover"
                          onError={(e) => { e.currentTarget.src = ""; }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate text-white">{u.displayName}</div>
                          <div className="text-xs text-neutral-400 truncate">@{u.username || "user"}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await addContributorById(u.id);
                            selectedUserIdRef.current = null;
                            setLookup("");
                            setSuggestions([]);
                            setSOpen(false);
                            await fetchContributors();
                            setInlineMsg("Contributor added.");
                            setTimeout(() => setInlineMsg(""), 2000);
                          } catch (err) {
                            setInlineMsg(getErrorText(err, "Failed to add contributor."));
                            setTimeout(() => setInlineMsg(""), 2500);
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </form>
        </Section>
      )}

      {/* Recipes grid */}
      <Section
        title={`Recipes (${items.length})`}
        right={items.length > 0 ? <div className="text-xs text-neutral-400" /> : null}
      >
        {items.length === 0 ? (
          <p className="text-neutral-400">No recipes saved in this cookbook yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((r) => (
              <CookbookRecipeCard
                key={r.recipeId ?? r.id}
                recipe={{
                  id: r.recipeId ?? r.id,
                  title: r.title,
                  description: r.description,
                  imageUrl: r.imageUrl,
                }}
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
