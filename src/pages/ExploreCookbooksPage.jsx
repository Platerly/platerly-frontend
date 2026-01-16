// src/pages/ExploreCookbooksPage.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Book, Search, ArrowLeft, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/fetchWithAuth";
import { logger } from "../utils/logger";

/* ---------------- Helpers ---------------- */
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

/* ---------------- Components ---------------- */
const CookbookCard = ({ cookbook }) => {
  const recipeCount = cookbook.recipeCount ?? cookbook.itemCount ?? 0;

  return (
    <Link
      to={`/cookbook/${cookbook.id}`}
      className="group block rounded-2xl border border-platerly-border bg-platerly-card overflow-hidden hover:border-platerly-green/30 hover:shadow-lg hover:shadow-platerly-green/5 transition-all duration-200"
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-[16/9] bg-platerly-light overflow-hidden">
        {cookbook.coverImageUrl ? (
          <img
            src={cookbook.coverImageUrl}
            alt={cookbook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-platerly-subtle">
            <Book className="w-12 h-12 opacity-30" />
          </div>
        )}

        {/* Recipe count badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-white text-xs font-medium">
          {recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-platerly-text group-hover:text-platerly-green transition-colors line-clamp-1">
          {cookbook.title}
        </h3>

        {cookbook.description && (
          <p className="mt-1 text-sm text-platerly-subtle line-clamp-2">
            {cookbook.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-platerly-muted">
          {cookbook.ownerUsername && (
            <span className="flex items-center gap-1">
              by <span className="text-platerly-green">@{cookbook.ownerUsername}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Public
          </span>
        </div>
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div className="rounded-2xl border border-platerly-border bg-platerly-card overflow-hidden animate-pulse">
    <div className="w-full aspect-[16/9] bg-platerly-light" />
    <div className="p-4 space-y-2">
      <div className="h-5 w-3/4 bg-platerly-light rounded" />
      <div className="h-4 w-full bg-platerly-light/70 rounded" />
      <div className="h-3 w-1/2 bg-platerly-light/50 rounded mt-3" />
    </div>
  </div>
);

/* ---------------- Page ---------------- */
const ExploreCookbooksPage = () => {
  const { token } = useAuth();
  const [cookbooks, setCookbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  const fetchCookbooks = useCallback(async (pageNum, searchQuery) => {
    setLoading(true);
    setError("");
    try {
      let url = `${API_BASE_URL}/api/Cookbook/public?page=${pageNum}&pageSize=${pageSize}`;
      if (searchQuery?.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiFetch(url, { headers });

      if (!res.ok) {
        throw new Error("Failed to load cookbooks");
      }

      const data = await res.json();

      // Handle paginated response
      const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      setCookbooks(items);
      setTotalPages(data.totalPages || Math.ceil((data.totalCount || items.length) / pageSize) || 1);
    } catch (err) {
      logger.error("Fetch public cookbooks failed:", err);
      setError("Failed to load cookbooks. Please try again.");
      setCookbooks([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const isInitialMount = useRef(true);
  const searchRef = useRef(search);
  searchRef.current = search;

  // Initial load and page changes
  useEffect(() => {
    fetchCookbooks(page, searchRef.current);
  }, [page, fetchCookbooks]);

  // Debounced search - only triggers when search changes (not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1); // This will trigger the page useEffect
      } else {
        fetchCookbooks(1, search);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  return (
    <div className="min-h-screen bg-platerly-dark text-platerly-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-platerly-green/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          to="/cookbooks"
          className="inline-flex items-center gap-2 text-sm text-platerly-subtle hover:text-platerly-text transition-colors mb-8 focus:outline-none focus:ring-2 focus:ring-platerly-green/40 rounded-lg px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          My Cookbooks
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-platerly-green/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-platerly-green" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Explore Cookbooks</h1>
              <p className="text-platerly-subtle text-sm mt-0.5">
                Discover public cookbooks from the community
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-platerly-subtle" />
            <input
              type="search"
              value={search}
              onChange={handleSearch}
              placeholder="Search cookbooks..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-platerly-card border border-platerly-border text-platerly-text placeholder:text-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/50 focus:border-platerly-green transition"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Cookbooks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : cookbooks.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cookbooks.map((cookbook) => (
                <CookbookCard key={cookbook.id} cookbook={cookbook} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-platerly-border bg-platerly-card hover:bg-platerly-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-platerly-subtle">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-platerly-border bg-platerly-card hover:bg-platerly-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-platerly-border bg-platerly-card/30 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-platerly-light flex items-center justify-center mx-auto mb-4">
              <Book className="w-8 h-8 text-platerly-muted" />
            </div>
            <h3 className="text-lg font-semibold text-platerly-text">No public cookbooks found</h3>
            <p className="text-sm text-platerly-subtle mt-1 max-w-sm mx-auto">
              {search
                ? "Try a different search term."
                : "Be the first to share a cookbook with the community!"}
            </p>
            <Link
              to="/cookbooks"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-platerly-green text-platerly-dark rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-platerly-green/20"
            >
              Create a Cookbook
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreCookbooksPage;
