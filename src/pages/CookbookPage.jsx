import React, { useEffect, useState } from "react";
import axios from "axios";
import CookbookCard from "../components/ui/CookbookCard"; // New import
import { API_BASE_URL } from "../utils/api";

const CookbookPage = () => {
  const [cookbooks, setCookbooks] = useState([]);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const token = localStorage.getItem("platerly_token");

  const fetchCookbooks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/Cookbook/my-cookbooks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCookbooks(response.data);
    } catch (err) {
      console.error("Error fetching cookbooks", err);
    }
  };

  useEffect(() => {
    fetchCookbooks();
  }, [token]);

  const handleCreateCookbook = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await axios.post(
        `${API_BASE_URL}/api/Cookbook`,
        { title, isPublic },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchCookbooks(); // Re-fetch cookbooks with full, fresh data
      setTitle("");
      setIsPublic(false);
    } catch (err) {
      console.error("Error creating cookbook", err);
    }
  };

  return (
  <div className="max-w-6xl mx-auto p-6 text-white space-y-10">
    {/* Create Cookbook Form */}
    <div className="bg-platerly-card border border-platerly-border rounded-xl p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-4">📘 Create a New Cookbook</h2>
      <form onSubmit={handleCreateCookbook} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-platerly-subtle mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white focus:ring focus:ring-green-500"
            placeholder="e.g. High Protein Meals"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="publicToggle"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="accent-green-500 w-5 h-5"
          />
          <label htmlFor="publicToggle" className="text-sm text-platerly-subtle">
            Make public
          </label>
        </div>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition"
        >
          Create Cookbook
        </button>
      </form>
    </div>

    {/* Cookbooks Display */}
    <div>
      <h1 className="text-3xl font-bold mb-6">📚 My Cookbooks</h1>

      {cookbooks.length === 0 ? (
        <p className="text-platerly-subtle text-sm italic">
          You haven’t created any cookbooks yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cookbooks.map((cookbook) => (
            <CookbookCard
              key={cookbook.id}
              id={cookbook.id}
              title={cookbook.title}
              isPublic={cookbook.isPublic}
              createdAt={cookbook.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  </div>
)

};

export default CookbookPage;
