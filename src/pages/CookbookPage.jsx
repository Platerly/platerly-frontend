import React, { useEffect, useState } from "react";
import axios from "axios";
import CookbookCard from "../components/ui/CookbookCard";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const ENDPOINT = `${API_BASE_URL}/api/Cookbook`; // canonical casing

/**
 * CookbookPage (Mobile-first + Brand-consistent)
 *
 * Upgrades:
 * - Mobile-first layout, comfortable spacing, and responsive typography.
 * - Consistent brand styles (emerald accents, dark neutrals, rounded-2xl, focus-visible rings).
 * - Stronger UX: loading skeletons, quiet error handling, accessible form controls (44px min-hit targets).
 * - Pagination controls with disabled states and aria-live updates.
 */

const SkeletonCard = () => (
  <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
    <div className="aspect-[4/3] bg-neutral-800 animate-pulse" />
    <div className="p-4 space-y-2">
      <div className="h-5 w-2/3 bg-neutral-800 rounded animate-pulse" />
      <div className="h-4 w-1/3 bg-neutral-800 rounded animate-pulse" />
    </div>
  </div>
);

const CookbookPage = () => {
  const { token } = useAuth();

  const [cookbooks, setCookbooks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [total, setTotal] = useState(0);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchCookbooks = async () => {
    if (!token) return;
    setLoading(true);
    setErrorText("");
    try {
      const res = await axios.get(`${ENDPOINT}/mine`, {
        headers,
        params: { page, pageSize },
      });

      // API shape: { page, pageSize, total, items }
      const data = res.data ?? {};
      const items = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data) // super-defensive if older shape
        ? data
        : [];

      setCookbooks(items);
      setTotal(Number.isFinite(data.total) ? data.total : items.length);
    } catch (err) {
      console.error("Error fetching cookbooks", err);
      const msg = err?.response?.data;
      const text =
        typeof msg === "string"
          ? msg
          : msg?.title || msg?.error || "Failed to load cookbooks.";
      setErrorText(text);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCookbooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const handleCreateCookbook = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setCreating(true);
    try {
      await axios.post(
        ENDPOINT,
        {
          title: cleanTitle,
          description: description.trim() || null,
          isPublic,
        },
        { headers }
      );

      // reset form & refresh first page
      setTitle("");
      setDescription("");
      setIsPublic(false);
      setPage(1);
      await fetchCookbooks();
    } catch (err) {
      console.error("Error creating cookbook", err);
      const msg = err?.response?.data;
      const text =
        typeof msg === "string"
          ? msg
          : msg?.title || msg?.error || "Create failed.";
      alert(text);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-white space-y-8 sm:space-y-10">
      {/* Create Cookbook */}
      <div className="bg-platerly-card bg-neutral-900 border border-platerly-border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">📘 Create a New Cookbook</h2>
        <form onSubmit={handleCreateCookbook} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-platerly-subtle text-neutral-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
              placeholder="e.g. High Protein Meals"
              required
              aria-label="Cookbook title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-platerly-subtle text-neutral-300 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
              placeholder="A short description"
              aria-label="Cookbook description"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="publicToggle"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-emerald-500 w-5 h-5"
              aria-checked={isPublic}
            />
            <label htmlFor="publicToggle" className="text-sm text-platerly-subtle text-neutral-300">
              Make public
            </label>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-medium transition disabled:opacity-60 border border-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
          >
            {creating ? "Creating…" : "Create Cookbook"}
          </button>
        </form>
      </div>

      {/* My Cookbooks */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">📚 My Cookbooks</h1>

        {errorText && (
          <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {errorText}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : cookbooks.length === 0 ? (
          <p className="text-platerly-subtle text-neutral-400 text-sm italic">
            You haven’t created any cookbooks yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {cookbooks.map((cb) => (
                <CookbookCard
                  key={cb.id}
                  id={cb.id}
                  title={cb.title}
                  isPublic={cb.isPublic}
                  createdAt={cb.createdAt}
                  coverImageUrl={cb.coverImageUrl}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6" aria-live="polite">
              <div className="inline-flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  disabled={page >= pages}
                  className="px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px]"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
              <div className="text-sm opacity-80">Page {page} / {pages}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CookbookPage;
