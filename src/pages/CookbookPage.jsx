import React, { useEffect, useState } from "react";
import axios from "axios";
import CookbookCard from "../components/ui/CookbookCard";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const ENDPOINT = `${API_BASE_URL}/api/Cookbook`; // use canonical casing

const CookbookPage = () => {
  const { token } = useAuth();

  const [cookbooks, setCookbooks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [total, setTotal] = useState(0);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchCookbooks = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${ENDPOINT}/mine`, {
        headers,
        params: { page, pageSize },
      });

      // API shape: { page, pageSize, total, items }
      const data = res.data ?? {};
      const items = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data) // super-defensive if older shape
        ? data
        : [];

      setCookbooks(items);
      setTotal(Number.isFinite(data.total) ? data.total : items.length);
    } catch (err) {
      console.error("Error fetching cookbooks", err);
      // don’t alert raw objects
      const msg = err?.response?.data;
      const text =
        typeof msg === "string"
          ? msg
          : msg?.title || msg?.error || "Failed to load cookbooks.";
      // Optional: toast/alert — keeping it quiet here to avoid noisy popups
      // alert(text);
    }
  };

  useEffect(() => {
    fetchCookbooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const handleCreateCookbook = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setCreating(true);
    try {
      await axios.post(
        ENDPOINT,
        {
          title: cleanTitle,
          description: description.trim() || null,
          isPublic,
        },
        { headers }
      );

      // reset form & refresh first page
      setTitle("");
      setDescription("");
      setIsPublic(false);
      setPage(1);
      await fetchCookbooks();
    } catch (err) {
      console.error("Error creating cookbook", err);
      const msg = err?.response?.data;
      const text =
        typeof msg === "string"
          ? msg
          : msg?.title || msg?.error || "Create failed.";
      alert(text);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 text-white space-y-10">
      {/* Create Cookbook */}
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

          <div>
            <label className="block text-sm font-medium text-platerly-subtle mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white focus:ring focus:ring-green-500"
              placeholder="A short description"
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
            disabled={creating}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create Cookbook"}
          </button>
        </form>
      </div>

      {/* My Cookbooks */}
      <div>
        <h1 className="text-3xl font-bold mb-6">📚 My Cookbooks</h1>

        {cookbooks.length === 0 ? (
          <p className="text-platerly-subtle text-sm italic">
            You haven’t created any cookbooks yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {cookbooks.map((cb) => (
                <CookbookCard
                  key={cb.id}
                  id={cb.id}
                  title={cb.title}
                  isPublic={cb.isPublic}
                  createdAt={cb.createdAt}
                  coverImageUrl={cb.coverImageUrl}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg border disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <div className="text-sm opacity-80">
                Page {page} / {pages}
              </div>
              <button
                disabled={page >= pages}
                className="px-3 py-1 rounded-lg border disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CookbookPage;
