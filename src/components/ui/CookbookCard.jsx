import React from "react";
import { useNavigate } from "react-router-dom";

const ringPalette = [
  "border-emerald-500 hover:shadow-emerald-500/25",
  "border-sky-500 hover:shadow-sky-500/25",
  "border-violet-500 hover:shadow-violet-500/25",
  "border-amber-500 hover:shadow-amber-500/25",
  "border-rose-500 hover:shadow-rose-500/25",
  "border-fuchsia-500 hover:shadow-fuchsia-500/25",
  "border-lime-500 hover:shadow-lime-500/25",
  "border-orange-500 hover:shadow-orange-500/25",
];

const placeholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260' width='400' height='260'>
       <rect width='100%' height='100%' fill='#0b1220'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#7a889a' font-size='18' font-family='system-ui, -apple-system, Segoe UI, Roboto, sans-serif'>
         No cover
       </text>
     </svg>`
  );

const CookbookCard = ({
  id = "",
  title = "Untitled",
  isPublic,
  createdAt,
  coverImageUrl,
  recipeCount = 0,           // <-- NEW: show count on the card
}) => {
  const navigate = useNavigate();
  const colorIdx = Number.isFinite(id?.charCodeAt?.(0)) ? id.charCodeAt(0) % ringPalette.length : 0;
  const colorClass = ringPalette[colorIdx];

  const dateLabel = createdAt ? new Date(createdAt).toLocaleDateString() : "";

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open cookbook ${title}`}
      onClick={() => navigate(`/cookbook/${id}`)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/cookbook/${id}`)}
      className={[
        "group cursor-pointer rounded-2xl border-2",
        colorClass,
        "bg-platerly-card hover:bg-platerly-elev hover:shadow-xl hover:scale-[1.01]",
        "transition-transform duration-200 motion-reduce:transition-none shadow-md overflow-hidden",
        "min-h-[44px]"
      ].join(" ")}
    >
      {/* Media */}
      <div className="relative w-full aspect-[4/3] bg-neutral-900">
        <img
          src={coverImageUrl || placeholder}
          alt={`${title} cover`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {/* gradient for possible future text overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent opacity-90" />

        {/* recipe count badge (gold) */}
        <div className="absolute left-2 top-2">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-300 text-black shadow">
            {recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}
          </span>
        </div>

        {/* visibility badge */}
        <div className="absolute right-2 top-2">
          <span
            className={[
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
              isPublic
                ? "bg-emerald-900/70 text-emerald-200 border border-emerald-500/30"
                : "bg-slate-900/70 text-slate-200 border border-slate-500/30",
              "backdrop-blur"
            ].join(" ")}
          >
            {isPublic ? "Public" : "Private"}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 line-clamp-2">
          {title}
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-platerly-subtle">
          <span className="truncate">{dateLabel}</span>
          <span className="opacity-70 group-hover:opacity-100 transition-opacity">View →</span>
        </div>
      </div>
    </article>
  );
};

export default CookbookCard;
