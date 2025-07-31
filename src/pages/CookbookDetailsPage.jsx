import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import CookbookRecipeCard from "../components/ui/CookbookRecipeCard"; // ✅ new component
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const CookbookDetailsPage = () => {
  const { id } = useParams();
  const [cookbook, setCookbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchCookbook = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/Cookbook/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCookbook(response.data);
      } catch (error) {
        console.error("Error fetching cookbook:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCookbook();
  }, [id, token]);

  const handleRecipeRemove = (recipeId) => {
    setCookbook((prev) => ({
      ...prev,
      recipes: prev.recipes.filter((r) => r.id !== recipeId),
    }));
  };

  if (loading) return <div className="text-center text-white">Loading...</div>;
  if (!cookbook) return <div className="text-center text-red-500">Cookbook not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">{cookbook.title}</h1>
        <p className="text-sm text-muted-foreground">
          {cookbook.isPublic ? "Public" : "Private"} •{" "}
          {new Date(cookbook.createdAt).toLocaleDateString()}
        </p>
      </div>

      {cookbook.recipes.length === 0 ? (
        <p className="text-muted-foreground">No recipes saved in this cookbook yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cookbook.recipes.map((recipe) => (
            <CookbookRecipeCard
              key={recipe.id}
              recipe={recipe}
              cookbookId={cookbook.id}
              onRemove={handleRecipeRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CookbookDetailsPage;
