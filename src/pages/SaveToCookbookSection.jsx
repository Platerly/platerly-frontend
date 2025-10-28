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

// Small UI helpers (swap these to your shared Button/Banner components later)
const Badge = ({ children }) => (
  <span className="ml-2 inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
    {children}
  </span>
);

const SkeletonRow = () => (
  <div className="px-3 py-2 rounded-md border border-neutral-800 bg-neutral-900 animate-pulse">
    <div className="h-4 w-48 bg-neutral-800 rounded" />
  </div>
);

const SaveToCookbookSection = ({ recipeId, onCreatedNewCookbook }) => {
  const { token } = useAuth();
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // lists
  const [mine, setMine] = useState([]); // cookbooks I own
  const [writable, setWritable] = useState([]); // collab-only here

  // load state
  const [loading, setLoading] = useState(true);

  // save state
  const [savingId, setSavingId] = useState(null);
  const [savedTo, setSavedTo] = useState(new Set());

  // feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ------- load lists (paged) -------
  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    setError("");

    const run = async () => {
      try {
        const [mineRes, writeRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/Cookbook/mine?page=1&pageSize=100`, { headers }),
          axios
            .get(`${API_BASE_URL}/api/Cookbook/can-write?page=1&pageSize=100`, { headers })
            .catch(() => ({ data: { items: [] } })),
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

        if (!alive) return;
        const myIds = new Set(mineItems.map((x) => x.id));
        const collabOnly = writeItems.filter((x) => !myIds.has(x.id));

        setMine(mineItems);
        setWritable(collabOnly);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError("Unable to fetch cookbooks.");
        setMine([]);
        setWritable([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [token, headers]);

  // ------- save recipe to cookbook -------
  const handleSave = async (cookbookId) => {
    if (!recipeId || !cookbookId) return;
    setSavingId(cookbookId);
    setError("");
    setSuccess("");
    try {
      await axios.post(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/recipes`,
        { recipeId },
        { headers }
      );
      setSavedTo((prev) => new Set([...prev, cookbookId]));
      setSuccess("Recipe saved to cookbook.");
    } catch (e) {
      console.error(e);
      setError(getErrorText(e, "Failed to save."));
    } finally {
      setSavingId(null);
    }
  };

  // ------- actual contributor add (by userId) -------
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

  // ------- fallback: typed name -> best match -------
  const addContributorFromText = async (cookbookId, text) => {
    const q = text?.trim();
    if (!q) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/User/search?q=${encodeURIComponent(q)}`);
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

  // ------- inline contributor picker (isolated local state) -------
  const ContributorPicker = ({ cookbookId }) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [results, setResults] = useState([]);
    const timerRef = useRef(null);

    useEffect(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoadingUsers(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/User/search?q=${encodeURIComponent(query.trim())}`);
          setResults(Array.isArray(res.data) ? res.data.slice(0, 8) : []);
        } catch (e) {
          console.error(e);
          setResults([]);
        } finally {
          setLoadingUsers(false);
        }
      }, 220);
      return () => timerRef.current && clearTimeout(timerRef.current);
    }, [query]);

    const choose = async (user) => {
      setQuery("");
      setResults([]);
      setOpen(false);
      await addContributorByUserId(cookbookId, user.id);
    };

    const onKeyDown = async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (results[0]) await choose(results[0]);
        else if (query.trim()) await addContributorFromText(cookbookId, query);
      }
    };

    return (
      <div className="relative w-full" onMouseDown={(e) => e.stopPropagation()}>
        <label className="sr-only" htmlFor={`contrib-${cookbookId}`}>Add contributor</label>
        <input
          id={`contrib-${cookbookId}`}
          type="text"
          autoComplete="off"
          placeholder="Add contributor by @username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="w-full px-3 py-2 rounded-lg bg-neutral-950/60 border border-neutral-800 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        />
        {open && (loadingUsers || results.length > 0) && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900/95 backdrop-blur shadow-xl max-h-56 overflow-y-auto">
            {loadingUsers ? (
              <div className="px-3 py-2 text-xs text-neutral-400">Searching…</div>
            ) : (
              <ul>
                {results.map((u) => (
                  <li
                    key={u.id}
                    className="px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-800 cursor-pointer"
                    onMouseDown={(e) => e.preventDefault()}
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
    <section aria-label={title} className="mt-5 first:mt-0">
      <div className="flex items-center mb-2">
        <h4 className="text-sm font-semibold text-neutral-300">{title}</h4>
        <Badge>{list.length}</Badge>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-neutral-400">None yet.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((cb) => {
            const isSaved = savedTo.has(cb.id);
            const isBusy = savingId === cb.id;
            return (
              <li key={cb.id} className="px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-neutral-100 text-sm truncate" title={cb.title}>{cb.title}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSave(cb.id)}
                      disabled={isSaved || isBusy}
                      className={`text-sm px-3 py-1.5 rounded-lg transition shadow disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                        isSaved || isBusy
                          ? "bg-neutral-800 text-neutral-400"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-900 hover:opacity-95"
                      }`}
                      aria-label={isSaved ? "Saved" : isBusy ? "Saving" : `Save to ${cb.title}`}
                    >
                      {isSaved ? "Saved" : isBusy ? "Saving…" : "Save"}
                    </button>
                  </div>
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
    </section>
  );

  return (
    <div className="bg-neutral-950/60 border border-neutral-900 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-100">Save to Cookbook</h3>
        {onCreatedNewCookbook && (
          <button
            onClick={onCreatedNewCookbook}
            className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-900 font-medium shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            New cookbook
          </button>
        )}
      </div>

      <Section title="My cookbooks" list={mine} showContributorTools />
      <Section title="Cookbooks I collaborate on" list={writable} showContributorTools={false} />

      {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      {success && <p className="text-emerald-400 text-xs mt-3">{success}</p>}
    </div>
  );
};

export default SaveToCookbookSection;
