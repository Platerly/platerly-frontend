import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Lock, Globe } from "lucide-react";
import { formatDate } from "../../utils/formatDate";

const placeholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260' width='400' height='260'>
       <rect width='100%' height='100%' fill='#1a2332'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#7a889a' font-size='18' font-family='system-ui, -apple-system, Segoe UI, Roboto, sans-serif'>
         No cover
       </text>
     </svg>`
  );

const CookbookCard = ({
  id = "",
  title = "Untitled",
  description = "",
  isPublic,
  createdAt,
  coverImageUrl,
  recipeCount = 0,
  accentColor = null,
}) => {
  const navigate = useNavigate();
  const dateLabel = createdAt ? formatDate(createdAt) : "";

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open cookbook ${title}`}
      onClick={() => navigate(`/cookbook/${id}`)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/cookbook/${id}`)}
      className={[
        "group cursor-pointer rounded-2xl overflow-hidden",
        "bg-recipzee-card border border-recipzee-border",
        "hover:border-recipzee-green/30 hover:shadow-xl hover:shadow-recipzee-green/5",
        "hover:scale-[1.02] active:scale-[0.99]",
        "transition-all duration-200 motion-reduce:transition-none",
        "min-h-[44px]"
      ].join(" ")}
    >
      {/* Media */}
      <div className="relative w-full aspect-[4/3] bg-recipzee-light">
        <img
          src={coverImageUrl || placeholder}
          alt={`${title} cover`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {/* gradient for text overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />

        {/* Accent color stripe */}
        {accentColor && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: accentColor }}
          />
        )}

        {/* recipe count badge */}
        <div className="absolute left-2 top-2">
          <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold bg-recipzee-dark/80 text-recipzee-text backdrop-blur border border-white/10 shadow">
            <BookOpen className="w-3 h-3" />
            {recipeCount}
          </span>
        </div>

        {/* visibility badge */}
        <div className="absolute right-2 top-2">
          <span
            className={[
              "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium backdrop-blur shadow",
              isPublic
                ? "bg-recipzee-green/20 text-recipzee-green border border-recipzee-green/30"
                : "bg-recipzee-dark/80 text-recipzee-subtle border border-white/10",
            ].join(" ")}
          >
            {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isPublic ? "Public" : "Private"}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-4">
        <h3 className="text-base sm:text-lg font-semibold text-recipzee-text mb-1 line-clamp-2 group-hover:text-recipzee-green transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-recipzee-subtle line-clamp-1 mb-2">{description}</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-recipzee-subtle">
          <span className="truncate">{dateLabel}</span>
          <span className="opacity-60 group-hover:opacity-100 group-hover:text-recipzee-green transition-all">
            View →
          </span>
        </div>
      </div>
    </article>
  );
};

export default CookbookCard;
