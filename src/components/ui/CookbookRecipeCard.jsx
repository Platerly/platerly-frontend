// src/components/ui/CookbookRecipeCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../utils/api";
import { apiFetch } from "../../utils/fetchWithAuth";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../common/ConfirmDialog";

const placeholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300'>
       <rect width='100%' height='100%' fill='#1a2332'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#7a889a' font-size='18' font-family='system-ui, -apple-system, Segoe UI, Roboto, sans-serif'>
         No image
       </text>
     </svg>`
  );

// Remember which DELETE route works to avoid future 404s
const CB_DELETE_ROUTE_KEY = "platerly_cb_delete_route"; // 'recipes' | 'items'

/**
 * Props:
 * - recipe: { id?, recipeId?, title, imageUrl, description }
 * - cookbookId: string (required)
 * - onRemove: (recipeId) => void
 */
const CookbookRecipeCard = ({ recipe = {}, cookbookId, onRemove }) => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const recipeId = recipe.id ?? recipe.recipeId ?? null;
  const title = recipe?.title || "Untitled";
  const img = recipe?.imageUrl || placeholder;
  const desc = recipe?.description || "";

  const goToRecipe = () => {
    if (!recipeId) return;
    navigate(`/recipe/${recipeId}`);
  };

  const handleKeyOpen = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToRecipe();
    }
  };

  const removeRecipeFromCookbook = async () => {
    if (!recipeId) throw new Error("Missing recipe id");
    if (!cookbookId) throw new Error("Missing cookbook id");

    const base = `${API_BASE_URL}/api/Cookbook/${cookbookId}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const tryDelete = async (url) => {
      const res = await apiFetch(url, { method: "DELETE", headers });
      const text = await res.text().catch(() => "");
      return { ok: res.ok, status: res.status, text };
    };

    const preferred = localStorage.getItem(CB_DELETE_ROUTE_KEY) || "recipes";
    const pathsByPref =
      preferred === "items"
        ? [`${base}/items/${recipeId}`, `${base}/recipes/${recipeId}`]
        : [`${base}/recipes/${recipeId}`, `${base}/items/${recipeId}`];

    let attempt = await tryDelete(pathsByPref[0]);

    if (!attempt.ok && attempt.status === 404) {
      const fallback = await tryDelete(pathsByPref[1]);
      if (!fallback.ok) {
        throw new Error(fallback.text || `Failed to remove (HTTP ${fallback.status}).`);
      }
      const worked = pathsByPref[1].includes("/items/") ? "items" : "recipes";
      localStorage.setItem(CB_DELETE_ROUTE_KEY, worked);
    } else if (!attempt.ok) {
      throw new Error(attempt.text || `Failed to remove (HTTP ${attempt.status}).`);
    } else {
      const worked = pathsByPref[0].includes("/items/") ? "items" : "recipes";
      localStorage.setItem(CB_DELETE_ROUTE_KEY, worked);
    }

    if (typeof onRemove === "function") onRemove(recipeId);
  };

  return (
    <article
      className={[
        "group relative rounded-2xl overflow-hidden",
        "border border-platerly-border bg-platerly-card",
        "hover:border-platerly-green/30 hover:shadow-lg hover:shadow-platerly-green/5",
        "transition-all duration-200",
        "min-h-[44px]",
      ].join(" ")}
    >
      {/* Media (clickable) */}
      <div
        className="relative w-full aspect-[4/3] bg-platerly-light cursor-pointer"
        onClick={goToRecipe}
        tabIndex={0}
        onKeyDown={handleKeyOpen}
        role="button"
        aria-label={`Open recipe ${title}`}
      >
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />

        {/* Remove button (ConfirmDialog trigger) */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <ConfirmDialog
            title="Remove this recipe?"
            description="It will be removed from this cookbook. The original recipe stays intact."
            confirmLabel="Remove"
            cancelLabel="Cancel"
            tone="danger"
            onConfirm={async () => {
              try {
                await removeRecipeFromCookbook();
              } catch (err) {
                console.error("Remove failed:", err);
                toast.error(err?.message || "Failed to remove recipe from cookbook.");
              }
            }}
            trigger={
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                title="Remove from cookbook"
                aria-label="Remove from cookbook"
                className="inline-flex items-center justify-center rounded-xl h-9 w-9 min-h-[44px] min-w-[44px]
                           bg-red-600/90 text-white hover:bg-red-600 backdrop-blur border border-white/10 shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            }
          />
        </div>
      </div>

      {/* Content (title is clickable, body text is not) */}
      <div className="p-4">
        <h2
          className="text-base font-semibold text-platerly-text mb-1 line-clamp-2 cursor-pointer group-hover:text-platerly-green transition-colors"
          onClick={goToRecipe}
          tabIndex={0}
          onKeyDown={handleKeyOpen}
          role="button"
          aria-label={`Open recipe ${title}`}
        >
          {title}
        </h2>
        {desc ? (
          <p className="text-sm text-platerly-subtle line-clamp-2">{desc}</p>
        ) : (
          <p className="text-sm text-platerly-subtle/60 italic">No description</p>
        )}
      </div>
    </article>
  );
};

export default CookbookRecipeCard;
