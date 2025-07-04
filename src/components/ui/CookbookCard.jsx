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

const CookbookCard = ({ id, title, isPublic, createdAt }) => {
  const navigate = useNavigate();

  // Pick color class based on ID hash
  const colorClass = colors[id.charCodeAt(0) % colors.length];

  const handleClick = () => {
    navigate(`/cookbook/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer rounded-xl border-2 ${colorClass} bg-neutral-900 hover:bg-neutral-800 hover:scale-[1.02] transition-transform duration-200 p-4 shadow-md`}
    >
      <h3 className="text-lg font-semibold text-white mb-2 truncate">{title}</h3>
      <div className="flex justify-between items-center text-sm text-gray-400">
        <span>{isPublic ? "Public" : "Private"}</span>
        <span>{createdAt ? new Date(createdAt).toLocaleDateString() : ""}</span>
      </div>
    </div>
  );
};

export default CookbookCard;
