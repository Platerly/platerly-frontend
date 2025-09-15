import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import CookbookRecipeCard from "../components/ui/CookbookRecipeCard";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const CookbookDetailsPage = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [cookbook, setCookbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // contributors
  const [contributors, setContributors] = useState([]);
  const [lookup, setLookup] = useState("");         // username or userId
  const [adding, setAdding] = useState(false);

  const fileInputRef = useRef(null);

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchCookbook = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/Cookbook/${id}`, { headers: authHeader });
    setCookbook(res.data);
  };

  const fetchContributors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/Cookbook/${id}/contributors`, {
        headers: authHeader,
      });
      setContributors(res.data || []);
    } catch (err) {
      // Non-owners get 403 here; just hide the panel silently
      setContributors(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchCookbook();
        await fetchContributors();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  // ---- Cover upload
  const onPickCover = () => fileInputRef.current?.click();

  const onCoverSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/Cookbook/${id}/cover`,
        form,
        { headers: { ...authHeader, "Content-Type": "multipart/form-data" } }
      );
      // update local cover
      setCookbook((prev) => ({ ...prev, coverImageUrl: res.data.coverUrl }));
    } catch (err) {
      if (err?.response?.status === 403) {
        alert("Only the owner can change the cover.");
      } else {
        alert("Failed to upload cover.");
      }
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = ""; // reset
    }
  };

  // ---- Contributors
  // Optional user lookup by username; falls back to interpreting lookup as a GUID
  // put this helper near the top of the file
const getErrorText = (err, fallback = "Something went wrong.") => {
  const d = err?.response?.data;
  if (typeof d === "string") return d;
  if (d?.title) return d.title;
  if (d?.error) return d.error;
  return err?.message || fallback;
};

// ---- Contributors
const findUserId = async (text) => {
  const q = text?.trim();
  if (!q) throw new Error("Enter a username or user ID.");

  // GUID? let it pass straight through
  if (/^[0-9a-fA-F-]{36}$/.test(q)) return q;

  // NOTE: the controller expects "q", not "query"
  const res = await axios.get(
    `${API_BASE_URL}/api/User/search?q=${encodeURIComponent(q)}`,
    { headers: authHeader }
  );
  const match = Array.isArray(res.data) ? res.data[0] : null;
  if (!match?.id) throw new Error("No user found with that name.");
  return match.id;
};

const addContributor = async (e) => {
  e.preventDefault();
  if (!lookup.trim()) return;
  setAdding(true);
  try {
    const userId = await findUserId(lookup);
    await axios.post(
      `${API_BASE_URL}/api/Cookbook/${id}/contributors`,
      { userId, role: "Write" },
      { headers: authHeader }
    );
    setLookup("");
    await fetchContributors();
  } catch (err) {
    alert(getErrorText(err, "Failed to add contributor.")); // <- human message, not [object Object]
    console.error(err);
  } finally {
    setAdding(false);
  }
};


  const removeContributor = async (userId) => {
    if (!confirm("Remove this contributor?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/api/Cookbook/${id}/contributors/${userId}`,
        { headers: authHeader }
      );
      await fetchContributors();
    } catch (err) {
      alert("Failed to remove contributor.");
      console.error(err);
    }
  };

  const handleRecipeRemove = (recipeId) => {
    setCookbook((prev) => ({
      ...prev,
      items: (prev.items || []).filter((r) => r.recipeId !== recipeId),
    }));
  };

  if (loading) return <div className="text-center text-white">Loading...</div>;
  if (!cookbook) return <div className="text-center text-red-500">Cookbook not found.</div>;

  const items = cookbook.items || [];

  return (
    <div className="max-w-6xl mx-auto p-4 text-white">
      {/* Header with cover */}
      <div className="mb-6">
        <div className="w-full max-w-3xl aspect-[7/3] bg-neutral-800 rounded-xl overflow-hidden">
          {cookbook.coverImageUrl ? (
            <img
              src={cookbook.coverImageUrl}
              alt={`${cookbook.title} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              No cover image yet
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-3xl font-bold">{cookbook.title}</h1>
          <span className="text-sm text-neutral-400">
            {cookbook.isPublic ? "Public" : "Private"} •{" "}
            {new Date(cookbook.createdAt).toLocaleDateString()}
          </span>

          {/* Cover upload (owner-only; we rely on API to enforce; we just show the button) */}
          <button
            onClick={onPickCover}
            disabled={uploading}
            className="ml-auto bg-neutral-800 border border-neutral-700 px-3 py-1 rounded-lg hover:bg-neutral-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Change cover"}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={onCoverSelected}
            className="hidden"
          />
        </div>
      </div>

      {/* Contributors panel (only shows if GET succeeded; null means hide for non-owners) */}
      {Array.isArray(contributors) && (
        <div className="mb-8 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Contributors</h2>
          </div>

          {contributors.length === 0 ? (
            <p className="text-neutral-400 mb-3">No contributors yet.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {contributors.map((c) => (
                <li key={c.userId} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.displayName || c.userId}</div>
                    <div className="text-xs text-neutral-400">
                      Role: {c.role} • Added {new Date(c.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => removeContributor(c.userId)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addContributor} className="flex items-center gap-2">
            <input
              type="text"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="Type a username or paste userId"
              className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700"
            />
            <button
              type="submit"
              disabled={adding || !lookup.trim()}
              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </form>
          <p className="text-xs text-neutral-400 mt-2">
            Tip: if search fails, paste the user’s ID (GUID).
          </p>
        </div>
      )}

      {/* Recipes grid */}
      {items.length === 0 ? (
        <p className="text-neutral-400">No recipes saved in this cookbook yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((r) => (
            <CookbookRecipeCard
              key={r.recipeId}
              recipe={{
                id: r.recipeId,
                title: r.title,
                description: r.description,
                imageUrl: r.imageUrl,
              }}
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
