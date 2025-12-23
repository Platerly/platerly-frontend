import React, { useEffect, useState } from "react";
import axios from "axios";
import { Info, AlertCircle } from "lucide-react";
import CookbookCard from "../components/ui/CookbookCard";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const ENDPOINT = `${API_BASE_URL}/api/Cookbook`;

// Preset colors
const COLOR_PRESETS = ["#E63946", "#457B9D", "#1D3557", "#2A9D8F", "#F4A261", "#E9C46A"];

// Auto text color (white/black) for contrast
const textOn = (hex) => {
  try {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return L > 0.5 ? "#101010" : "#FFFFFF";
  } catch {
    return "#FFFFFF";
  }
};

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
  const [accentColor, setAccentColor] = useState(COLOR_PRESETS[2]); // default

  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const items = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      setCookbooks(items);
      setTotal(Number.isFinite(data.total) ? data.total : items.length);
    } catch (err) {
      console.error("Error fetching cookbooks", err);

      const status = err?.response?.status;
      const msg = err?.response?.data;

      let text;

      if (status === 403) {
        text =
          "Cookbooks are a premium feature. You need a Platerly subscription to use them.";
      } else if (typeof msg === "string") {
        text = msg;
      } else {
        text =
          msg?.message ||
          msg?.title ||
          msg?.error ||
          "Failed to load cookbooks.";
      }

      setErrorText(text);
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
          accentColor, // NEW FIELD
        },
        { headers }
      );

      if (res.status < 200 || res.status >= 300) {
        throw new Error("Create failed.");
      }

      setTitle("");
      setDescription("");
      setIsPublic(false);

      // Reset color to whatever default you prefer
      setAccentColor(COLOR_PRESETS[2]);

      setPage(1);
      await fetchCookbooks();

      setCreateStatusIsError(false);
      setCreateStatus("Cookbook created.");
    } catch (err) {
      console.error("Error creating cookbook", err);
      const status = err?.response?.status;
      const msg = err?.response?.data;

      let text;

      if (status === 403) {
        text =
          "Cookbooks are a premium feature. You need a Platerly subscription to create cookbooks.";
      } else if (typeof msg === "string") {
        text = msg;
      } else {
        text =
          msg?.message ||
          msg?.title ||
          msg?.error ||
          "Create failed.";
      }

      setCreateStatusIsError(true);
      setCreateStatus(text);
    } finally {
      setCreating(false);

      setTimeout(() => {
        setCreateStatus("");
      }, 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-white space-y-8 sm:space-y-10">
      {/* Create Cookbook */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">
          📘 Create a New Cookbook
        </h2>

        <form onSubmit={handleCreateCookbook} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm text-neutral-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              placeholder="e.g. High Protein Meals"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-neutral-300 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              placeholder="A short description"
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="publicToggle"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-emerald-500 w-5 h-5"
            />
            <label htmlFor="publicToggle" className="text-sm text-neutral-300">
              Make public
            </label>
          </div>

          {/* NEW — Color Presets */}
          <div>
            <label className="block text-sm text-neutral-300 mb-2">
              Accent color
            </label>

            <div className="flex flex-wrap gap-2 items-center">
              {COLOR_PRESETS.map((c) => {
                const selected = c === accentColor;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccentColor(c)}
                    className={`w-8 h-8 rounded-xl border transition ${
                      selected
                        ? "ring-2 ring-emerald-400 border-white/50"
                        : "border-white/20 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                );
              })}

              {/* Preview */}
              <span
                className="ml-3 px-3 py-1 rounded-xl text-xs font-medium border"
                style={{
                  backgroundColor: accentColor,
                  color: textOn(accentColor),
                  borderColor: "rgba(255,255,255,0.25)",
                }}
              >
                Preview
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl transition disabled:opacity-60 border border-emerald-500/30 min-h-[44px]"
          >
            {creating ? "Creating…" : "Create Cookbook"}
          </button>

          {createStatus && (
            <div
              className={[
                "mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border",
                createStatusIsError
                  ? "bg-red-500/10 border-red-500/30 text-red-200"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
              ].join(" ")}
            >
              {createStatusIsError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
              <span>{createStatus}</span>
            </div>
          )}
        </form>
      </div>

      {/* My Cookbooks */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          📚 My Cookbooks
        </h1>

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
          <p className="text-neutral-400 text-sm italic">
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
                  recipeCount={cb.recipeCount}
                  description={cb.description ?? ""}
                  accentColor={cb.accentColor ?? null}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6">
              <div className="inline-flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  disabled={page >= pages}
                  className="px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
              <div className="text-sm opacity-80">
                Page {page} / {pages}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CookbookPage;
