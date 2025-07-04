import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

const CookbookRecipeCard = ({ recipe, cookbookId, onRemove }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const handleRemoveClick = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('platerly_token');

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/remove-recipe/${recipe.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to remove recipe');
      onRemove?.(recipe.id); // trigger state update
    } catch (err) {
      console.error(err);
      alert('Failed to remove recipe from cookbook.');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="rounded-xl border border-neutral-800 bg-neutral-900 shadow-md overflow-hidden hover:border-neutral-700 transition cursor-pointer relative"
    >
      <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h2 className="text-lg font-bold text-white mb-1">{recipe.title}</h2>
        <p className="text-sm text-gray-400 mb-3">{recipe.author || 'by Unknown'}</p>
        <p className="text-sm text-gray-300 line-clamp-3">{recipe.description}</p>
      </div>

      <button
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
