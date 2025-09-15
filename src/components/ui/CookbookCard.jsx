import React from "react";
import { useNavigate } from "react-router-dom";

const colors = [
  "border-green-500 hover:shadow-green-500/30",
  "border-yellow-500 hover:shadow-yellow-500/30",
  "border-blue-500 hover:shadow-blue-500/30",
  "border-purple-500 hover:shadow-purple-500/30",
  "border-pink-500 hover:shadow-pink-500/30",
  "border-red-500 hover:shadow-red-500/30",
  "border-emerald-500 hover:shadow-emerald-500/30",
  "border-orange-500 hover:shadow-orange-500/30",
];

const placeholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260' width='400' height='260'>
       <rect width='100%' height='100%' fill='#0f172a'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#64748b' font-size='18' font-family='sans-serif'>
         No cover
       </text>
     </svg>`
  );

const CookbookCard = ({ id, title, isPublic, createdAt, coverImageUrl }) => {
  const navigate = useNavigate();
  const colorClass = colors[id.charCodeAt(0) % colors.length];

  return (
    <div
      onClick={() => navigate(`/cookbook/${id}`)}
      className={`cursor-pointer rounded-xl border-2 ${colorClass} bg-neutral-900 hover:bg-neutral-800 hover:scale-[1.02] transition-transform duration-200 shadow-md overflow-hidden`}
    >
      <div className="w-full aspect-[4/3] bg-neutral-800">
        <img
          src={coverImageUrl || placeholder}
          alt={`${title} cover`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2 truncate">{title}</h3>
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>{isPublic ? "Public" : "Private"}</span>
          <span>{createdAt ? new Date(createdAt).toLocaleDateString() : ""}</span>
        </div>
      </div>
    </div>
  );
};

export default CookbookCard;
