import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

// ---- shared helper so we never alert [object Object]
const getErrorText = (err, fallback = "Something went wrong.") => {
  const d = err?.response?.data;
  if (typeof d === "string") return d;
  if (d?.title) return d.title;
  if (d?.error) return d.error;
  return err?.message || fallback;
};

const SaveToCookbookSection = ({ recipeId }) => {
  const { token } = useAuth();
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // lists
  const [mine, setMine] = useState([]);         // cookbooks I own
  const [writable, setWritable] = useState([]); // cookbooks I can write to (owner + collab only shown here)

  // save state
  const [savingId, setSavingId] = useState(null);
  const [savedTo, setSavedTo] = useState(new Set());

  // feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ------- load lists (paged) -------
  useEffect(() => {
    const fetchLists = async () => {
      setError("");
      try {
        const [mineRes, writeRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/Cookbook/mine?page=1&pageSize=100`, { headers }),
          axios
            .get(`${API_BASE_URL}/api/Cookbook/can-write?page=1&pageSize=100`, { headers })
            .catch(() => ({ data: { items: [] } })), // falls back if route doesn't exist yet
        ]);

        const mineItems = Array.isArray(mineRes.data?.items)
          ? mineRes.data.items
          : Array.isArray(mineRes.data)
          ? mineRes.data
          : [];

        const writeItems = Array.isArray(writeRes.data?.items)
          ? writeRes.data.items
          : Array.isArray(writeRes.data)
          ? writeRes.data
          : [];

        // show only collabs in "writable" section (exclude my own)
        const myIds = new Set(mineItems.map((x) => x.id));
        const collabOnly = writeItems.filter((x) => !myIds.has(x.id));

        setMine(mineItems);
        setWritable(collabOnly);
      } catch (e) {
        console.error(e);
        setError("Unable to fetch cookbooks.");
        setMine([]);
        setWritable([]);
      }
    };

    if (token) fetchLists();
  }, [token, headers]);

  // ------- save recipe to cookbook -------
  const handleSave = async (cookbookId) => {
    if (!recipeId) return;
    setSavingId(cookbookId);
    setError("");
    setSuccess("");
    try {
      await axios.post(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/recipes`,
        { recipeId }, // AddRecipeToCookbookDto
        { headers }
      );
      setSavedTo((prev) => {
        const next = new Set(prev);
        next.add(cookbookId);
        return next;
      });
      setSuccess("Recipe saved to cookbook.");
    } catch (e) {
      console.error(e);
      setError(getErrorText(e, "Failed to save."));
    } finally {
      setSavingId(null);
    }
  };

  // ------- actual contributor add (by userId, not typed text) -------
  const addContributorByUserId = async (cookbookId, userId) => {
    setError("");
    setSuccess("");
    try {
      await axios.post(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/contributors`,
        { userId, role: "Write" },
        { headers }
      );
      setSuccess("Contributor added.");
    } catch (e) {
      console.error(e);
      setError(getErrorText(e, "Failed to add contributor."));
    }
  };

  // ------- fallback: if user typed a name and hit Add (no suggestion picked) -------
  const addContributorFromText = async (cookbookId, text) => {
    const q = text?.trim();
    if (!q) return;
    try {
      // prefer exact username match; else first result
      const res = await axios.get(
        `${API_BASE_URL}/api/User/search?q=${encodeURIComponent(q)}`
      );
      const list = Array.isArray(res.data) ? res.data : [];
      const exact = list.find((u) => u.username?.toLowerCase() === q.toLowerCase());
      const chosen = exact || list[0];
      if (!chosen?.id) throw new Error("No user found.");
      await addContributorByUserId(cookbookId, chosen.id);
    } catch (e) {
      console.error(e);
      setError(getErrorText(e, "Failed to add contributor."));
    }
  };

  // ------- inline contributor picker (isolated local state to avoid focus issues) -------
  const ContributorPicker = ({ cookbookId }) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const boxRef = useRef(null);
    const timerRef = useRef(null);

    // Debounced search
    useEffect(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/User/search?q=${encodeURIComponent(query.trim())}`
          );
          setResults(Array.isArray(res.data) ? res.data.slice(0, 8) : []);
        } catch (e) {
          console.error(e);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 250);
      return () => timerRef.current && clearTimeout(timerRef.current);
    }, [query]);

    // Keep dropdown open while focused/typing
    const onFocus = () => setOpen(true);
    const onBlur = () => {
      // slight delay so clicks on dropdown can register
      setTimeout(() => setOpen(false), 120);
    };

    // Prevent parent clicks from stealing focus
    const stop = (e) => e.stopPropagation();

    const choose = async (user) => {
      setQuery("");
      setResults([]);
      setOpen(false);
      await addContributorByUserId(cookbookId, user.id);
    };

    const onKeyDown = async (e) => {
      // Enter -> add best match
      if (e.key === "Enter") {
        e.preventDefault();
        if (results[0]) {
          await choose(results[0]);
        } else if (query.trim()) {
          await addContributorFromText(cookbookId, query);
        }
      }
    };

    return (
      <div className="relative w-full" ref={boxRef} onMouseDown={stop}>
        <input
          type="text"
          autoComplete="off"
          placeholder="Add contributor by @username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm"
        />
        {open && (loading || results.length > 0) && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 shadow-lg max-h-56 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-xs text-neutral-400">Searching…</div>
            ) : (
              <ul>
                {results.map((u) => (
                  <li
                    key={u.id}
                    className="px-3 py-2 text-sm text-white hover:bg-neutral-800 cursor-pointer"
                    onMouseDown={(e) => e.preventDefault()} // do not blur input
                    onClick={() => choose(u)}
                  >
                    @{u.username} {u.displayName ? <span className="opacity-70">— {u.displayName}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, list, showContributorTools }) => (
    <>
      <h4 className="text-sm font-semibold text-neutral-300 mt-4 mb-2">{title}</h4>
      {list.length === 0 ? (
        <p className="text-sm text-gray-400">None yet.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((cb) => {
            const isSaved = savedTo.has(cb.id);
            const isBusy = savingId === cb.id;

            return (
              <li key={cb.id} className="px-3 py-2 rounded-md border border-neutral-800 bg-neutral-900">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white text-sm truncate">{cb.title}</span>
                  <button
                    onClick={() => handleSave(cb.id)}
                    disabled={isSaved || isBusy}
                    className={`text-sm px-3 py-1 rounded-md ${
                      isSaved || isBusy
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isSaved ? "Saved" : isBusy ? "Saving..." : "Save"}
                  </button>
                </div>

                {showContributorTools && (
                  <div className="mt-2">
                    <ContributorPicker cookbookId={cb.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mt-6">
      <h3 className="text-lg font-semibold text-white mb-3">Save to Cookbook</h3>

      <Section title="My cookbooks" list={mine} showContributorTools />

      <Section title="Cookbooks I collaborate on" list={writable} showContributorTools={false} />

      {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      {success && <p className="text-green-500 text-xs mt-3">{success}</p>}
    </div>
  );
};

export default SaveToCookbookSection;
