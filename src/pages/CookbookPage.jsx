import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, BookOpen, Crown, AlertCircle, Check, Lock, Globe, Sparkles, Search } from "lucide-react";
import CookbookCard from "../components/ui/CookbookCard";
import Button from "../components/ui/Button";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { usePremium } from "../hooks/usePremium";
import { logger } from "../utils/logger";

const ENDPOINT = `${API_BASE_URL}/api/Cookbook`;

// Premium color palette for cookbook accents
const COLOR_PRESETS = [
  { hex: "#22C55E", name: "Emerald" },
  { hex: "#3B82F6", name: "Blue" },
  { hex: "#8B5CF6", name: "Purple" },
  { hex: "#F43F5E", name: "Rose" },
  { hex: "#F97316", name: "Orange" },
  { hex: "#EAB308", name: "Gold" },
  { hex: "#06B6D4", name: "Cyan" },
  { hex: "#EC4899", name: "Pink" },
];

const SkeletonCard = () => (
  <div className="rounded-2xl bg-platerly-card border border-platerly-border overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-platerly-light" />
    <div className="p-4 space-y-3">
      <div className="h-5 w-3/4 bg-platerly-light rounded-lg" />
      <div className="h-4 w-1/2 bg-platerly-light rounded-lg" />
    </div>
  </div>
);

const PremiumUpgradePrompt = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
    <div className="max-w-lg w-full">
      <div className="bg-gradient-to-br from-platerly-card via-platerly-card to-platerly-light border border-platerly-border rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Decorative gradient orb */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-platerly-green/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-platerly-text">
            Unlock Cookbooks
          </h2>
          <p className="text-platerly-subtle mb-8 max-w-sm mx-auto leading-relaxed">
            Organize your favorite recipes into beautiful, shareable cookbooks. A premium feature designed for serious home chefs.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/settings?tab=subscription"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
            >
              <Sparkles className="w-5 h-5" />
              Upgrade to Premium
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-platerly-border text-platerly-text font-medium hover:bg-white/5 transition"
            >
              Browse Recipes
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-16 px-4">
    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-platerly-light flex items-center justify-center">
      <BookOpen className="w-10 h-10 text-platerly-subtle" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-platerly-text">No cookbooks yet</h3>
    <p className="text-platerly-subtle max-w-sm mx-auto">
      Create your first cookbook to start organizing your favorite recipes into collections.
    </p>
  </div>
);

const CookbookPage = () => {
  const { token } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremium();

  const [cookbooks, setCookbooks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [accentColor, setAccentColor] = useState(COLOR_PRESETS[0].hex);

  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [createStatus, setCreateStatus] = useState("");
  const [createStatusIsError, setCreateStatusIsError] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [total, setTotal] = useState(0);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchCookbooks = async () => {
    if (!token) {
      setCookbooks([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText("");

    try {
      const res = await axios.get(`${ENDPOINT}/mine`, {
        headers,
        params: { page, pageSize },
      });

      const data = res.data ?? {};
      const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];

      setCookbooks(items);
      setTotal(Number.isFinite(data.total) ? data.total : items.length);
    } catch (err) {
      logger.error("Error fetching cookbooks", err);
      const status = err?.response?.status;
      const msg = err?.response?.data;

      if (status === 403) {
        setErrorText("Cookbooks are a premium feature. Please upgrade to access.");
      } else if (typeof msg === "string") {
        setErrorText(msg);
      } else {
        setErrorText(msg?.message || msg?.title || "Failed to load cookbooks.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCookbooks();
  }, [token, page]);

  const handleCreateCookbook = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setCreating(true);
    setCreateStatus("");

    try {
      const res = await axios.post(
        ENDPOINT,
        {
          title: cleanTitle,
          description: description.trim() || null,
          isPublic,
          accentColor,
        },
        { headers }
      );

      if (res.status < 200 || res.status >= 300) {
        throw new Error("Create failed.");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setIsPublic(false);
      setAccentColor(COLOR_PRESETS[0].hex);
      setShowForm(false);

      setPage(1);
      await fetchCookbooks();

      setCreateStatusIsError(false);
      setCreateStatus("Cookbook created successfully!");
    } catch (err) {
      logger.error("Error creating cookbook", err);
      const status = err?.response?.status;
      const msg = err?.response?.data;

      if (status === 403) {
        setCreateStatus("Premium feature. Please upgrade to create cookbooks.");
      } else if (typeof msg === "string") {
        setCreateStatus(msg);
      } else {
        setCreateStatus(msg?.message || "Failed to create cookbook.");
      }
      setCreateStatusIsError(true);
    } finally {
      setCreating(false);
      setTimeout(() => setCreateStatus(""), 4000);
    }
  };

  // Loading skeleton
  if (premiumLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="h-8 w-48 bg-platerly-card rounded-lg mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  // Premium gate
  if (!isPremium) {
    return <PremiumUpgradePrompt />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-platerly-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Cookbooks</h1>
          <p className="text-platerly-subtle mt-1">Organize recipes into beautiful collections</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/explore-cookbooks"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-platerly-border bg-platerly-card hover:bg-platerly-light text-platerly-text font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Explore Public
          </Link>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "secondary" : "primary"}
            className="sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            {showForm ? "Cancel" : "New Cookbook"}
          </Button>
        </div>
      </div>

      {/* Create Form - Collapsible */}
      {showForm && (
        <div className="mb-8 bg-platerly-card border border-platerly-border rounded-2xl p-5 sm:p-6 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-platerly-green" />
            Create New Cookbook
          </h2>

          <form onSubmit={handleCreateCookbook} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-platerly-text/80 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-platerly-light border border-platerly-border text-platerly-text placeholder:text-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/50 focus:border-platerly-green transition"
                  placeholder="e.g. Weeknight Dinners"
                  required
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-platerly-text/80 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-platerly-light border border-platerly-border text-platerly-text placeholder:text-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/50 focus:border-platerly-green transition"
                  placeholder="A short description (optional)"
                  maxLength={200}
                />
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-platerly-text/80 mb-3">
                Accent Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => {
                  const selected = color.hex === accentColor;
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setAccentColor(color.hex)}
                      className={`group relative w-10 h-10 rounded-xl transition-all duration-200 ${
                        selected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-platerly-card scale-110"
                          : "hover:scale-105 hover:ring-1 hover:ring-white/30"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selected && (
                        <Check className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  isPublic ? "bg-platerly-green" : "bg-platerly-light"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <div className="flex items-center gap-2 text-sm">
                {isPublic ? (
                  <>
                    <Globe className="w-4 h-4 text-platerly-green" />
                    <span className="text-platerly-text">Public cookbook</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-platerly-subtle" />
                    <span className="text-platerly-subtle">Private cookbook</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" loading={creating} disabled={!title.trim()}>
                Create Cookbook
              </Button>

              {createStatus && (
                <div
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    createStatusIsError
                      ? "bg-red-500/10 border border-red-500/30 text-red-300"
                      : "bg-platerly-green/10 border border-platerly-green/30 text-platerly-green"
                  }`}
                >
                  {createStatusIsError ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {createStatus}
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {errorText && (
        <div className="mb-6 flex items-center gap-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorText}
        </div>
      )}

      {/* Cookbooks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : cookbooks.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cookbooks.map((cb) => (
              <CookbookCard
                key={cb.id}
                id={cb.id}
                title={cb.title}
                isPublic={cb.isPublic}
                createdAt={cb.createdAt}
                coverImageUrl={cb.coverImageUrl}
                recipeCount={cb.recipeCount}
                description={cb.description ?? ""}
                accentColor={cb.accentColor ?? null}
              />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              <span className="text-sm text-platerly-subtle px-3">
                Page {page} of {pages}
              </span>

              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CookbookPage;
