import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { API_BASE_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const placeholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300'>
       <defs>
         <linearGradient id='g' x1='0' x2='1'>
           <stop offset='0%' stop-color='#0b1220'/>
           <stop offset='100%' stop-color='#0f172a'/>
         </linearGradient>
       </defs>
       <rect width='100%' height='100%' fill='url(#g)'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#7a889a' font-size='18' font-family='system-ui, -apple-system, Segoe UI, Roboto, sans-serif'>
         No image
       </text>
     </svg>`
  );

const CookbookRecipeCard = ({
  recipe = {},
  cookbookId,
  onRemove,
  confirmRemove = true,
}) => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Accept either shape: { id } or { recipeId }
  const recipeId = recipe.id ?? recipe.recipeId ?? null;
  const title = recipe?.title || "Untitled";
  const img = recipe?.imageUrl || placeholder;
  const desc = recipe?.description || "";

  const handleCardClick = () => {
    if (!recipeId) return;
    navigate(`/recipe/${recipeId}`);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleRemoveClick = async (e) => {
    e.stopPropagation();
    if (!recipeId) {
      console.error("Missing recipe id on card:", recipe);
      alert("Item is missing its recipe id.");
      return;
    }

    if (confirmRemove) {
      const ok = window.confirm("Remove this recipe from the cookbook?");
      if (!ok) return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/recipes/${recipeId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (typeof onRemove === "function") onRemove(recipeId);
    } catch (err) {
      console.error("Remove failed:", err);
      alert("Failed to remove recipe from cookbook.");
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open recipe ${title}`}
      onClick={handleCardClick}
      onKeyDown={handleKey}
      className={[
        "group relative cursor-pointer rounded-2xl",
        "border border-platerly-border bg-platerly-card shadow-md",
        "hover:bg-platerly-elev hover:shadow-lg transition",
        "overflow-hidden min-h-[44px]",
      ].join(" ")}
    >
      {/* Media (stable aspect) */}
      <div className="relative w-full aspect-[4/3] bg-neutral-900">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {/* subtle gradient for future overlays/legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent" />
        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemoveClick}
          title="Remove from cookbook"
          aria-label="Remove from cookbook"
          className={[
            "absolute top-2 right-2 z-10",
            "inline-flex items-center justify-center rounded-full",
            "h-10 w-10 min-h-[44px] min-w-[44px]",
            "bg-red-600/90 text-white hover:bg-red-600",
            "backdrop-blur border border-white/10 shadow-lg",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
          ].join(" ")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-1 line-clamp-2">
          {title}
        </h2>
        {desc ? (
          <p className="text-sm text-platerly-subtle line-clamp-3">{desc}</p>
        ) : (
          <p className="text-sm text-platerly-subtle italic">No description</p>
        )}
      </div>
    </article>
  );
};

export default CookbookRecipeCard;
