import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { API_BASE_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const CookbookRecipeCard = ({ recipe = {}, cookbookId, onRemove }) => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Accept either shape: { id } or { recipeId }
  const recipeId = recipe.id ?? recipe.recipeId;

  const handleCardClick = () => {
    if (!recipeId) return;
    navigate(`/recipe/${recipeId}`);
  };

  const handleRemoveClick = async (e) => {
    e.stopPropagation();
    if (!recipeId) {
      console.error("Missing recipe id on card:", recipe);
      alert("Item is missing its recipe id.");
      return;
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
    <div
      onClick={handleCardClick}
      className="rounded-xl border border-neutral-800 bg-neutral-900 shadow-md overflow-hidden hover:border-neutral-700 transition cursor-pointer relative"
    >
      {recipe?.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe?.title || "Recipe"}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-neutral-800" />
      )}

      <div className="p-4">
        <h2 className="text-lg font-bold text-white mb-1">
          {recipe?.title || "Untitled"}
        </h2>
        <p className="text-sm text-gray-300 line-clamp-3">
          {recipe?.description || ""}
        </p>
      </div>

      <button
        type="button"
        onClick={handleRemoveClick}
        title="Remove from cookbook"
        className="absolute top-2 right-2 text-red-500 hover:text-red-600"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CookbookRecipeCard;
