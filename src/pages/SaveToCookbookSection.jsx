import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

const SaveToCookbookSection = ({ recipeId }) => {
  const [cookbooks, setCookbooks] = useState([]);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const token = localStorage.getItem("platerly_token");

  useEffect(() => {
    const fetchCookbooks = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/Cookbook/my-cookbooks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCookbooks(res.data);
      } catch {
        setError("Unable to fetch cookbooks.");
      }
    };

    fetchCookbooks();
  }, [token]);

  const handleSave = async (cookbookId) => {
    setSaving(cookbookId);
    setError(null);
    setSuccessMessage(null);
    try {
      await axios.post(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/add-recipe`,
        { recipeId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMessage("Recipe saved successfully.");

      // Refresh cookbooks to reflect changes
      const res = await axios.get(`${API_BASE_URL}/api/Cookbook/my-cookbooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCookbooks(res.data);
    } catch {
      setError("Already saved or failed to save.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mt-6">
      <h3 className="text-lg font-semibold text-white mb-3">Save to Cookbook</h3>

      {cookbooks.length === 0 ? (
        <p className="text-sm text-gray-400">You don’t have any cookbooks yet.</p>
      ) : (
        <ul className="space-y-2">
          {cookbooks.map((cookbook) => {
            const alreadySaved = cookbook.recipes?.some((r) => r.id === recipeId);
            return (
              <li
                key={cookbook.id}
                className={`flex justify-between items-center px-3 py-2 rounded-md ${
                  alreadySaved ? "bg-neutral-800 opacity-60" : "hover:bg-neutral-800"
                }`}
              >
                <span className="text-white text-sm">{cookbook.title}</span>
                <button
                  onClick={() => handleSave(cookbook.id)}
                  disabled={alreadySaved || saving === cookbook.id}
                  className={`text-sm px-3 py-1 rounded-md ${
                    alreadySaved
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {alreadySaved ? "Saved" : saving === cookbook.id ? "Saving..." : "Save"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      {successMessage && <p className="text-green-500 text-xs mt-2">{successMessage}</p>}
    </div>
  );
};

export default SaveToCookbookSection;
