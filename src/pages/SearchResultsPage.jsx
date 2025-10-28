import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import RecipeCard from "../components/ui/RecipeCard";

// Small helpers (swap to your shared tokens/components later)
const TabBtn = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`relative px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
      active
        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-900 shadow"
        : "bg-neutral-900/60 border border-neutral-800 text-neutral-300 hover:bg-neutral-900"
    }`}
  >
    <span>{children}</span>
    {typeof count === "number" && (
      <span className={`ml-2 inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded ${
        active ? "bg-neutral-900/20 text-neutral-900/80" : "bg-neutral-800 text-neutral-300 border border-neutral-700"
      }`}>{count}</span>
    )}
  </button>
);

const SkeletonRecipe = () => (
  <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-4 animate-pulse">
    <div className="h-44 w-full bg-neutral-900 rounded-xl mb-3" />
    <div className="h-4 w-3/5 bg-neutral-900 rounded mb-2" />
    <div className="h-3 w-4/5 bg-neutral-900 rounded" />
  </div>
);

const SkeletonUser = () => (
  <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-4 animate-pulse">
    <div className="h-4 w-32 bg-neutral-900 rounded mb-2" />
    <div className="h-3 w-48 bg-neutral-900 rounded" />
  </div>
);

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = (searchParams.get("q") || "").trim();
  const tab = (searchParams.get("tab") || "all").toLowerCase(); // all | recipes | chefs

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]); // mixed: { type: 'recipe'|'user', ... }

  // Split results into buckets for quick tab switches
  const { recipes, users } = useMemo(() => {
    const r = [], u = [];
    for (const item of results) {
      if (item?.type === "recipe") r.push(item);
      else if (item?.type === "user") u.push(item);
    }
    return { recipes: r, users: u };
  }, [results]);

  // Debounced fetch to avoid spamming API when user edits URL/search box elsewhere
  useEffect(() => {
    let alive = true;
    if (!q) {
      setResults([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");

    const id = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Unexpected response format");
        if (!alive) return;
        setResults(data);
      } catch (err) {
        console.error(err);
        if (!alive) return;
        setError("Something went wrong while searching.");
        setResults([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 200);

    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [q]);

  const setTab = (name) => setSearchParams(prev => {
    const sp = new URLSearchParams(prev);
    sp.set('q', q);
    sp.set('tab', name);
    return sp;
  }, { replace: true });

  const onUserClick = (username) => navigate(`/profile/${username}`);

  const nothing = !loading && !error && results.length === 0;

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 text-neutral-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <h1 className="text-xl sm:text-2xl font-semibold">
          Results for <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{q || '—'}</span>
        </h1>
        {/* Optional mini search (keeps user on page) */}
        <form
          onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get('q')?.toString().trim() || ''; setSearchParams({ q: v, tab }); }}
          className="w-full sm:w-auto"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Refine your search…"
            className="w-full sm:w-80 px-3 py-2 rounded-xl bg-neutral-950/60 border border-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </form>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <TabBtn active={tab === 'all'} onClick={() => setTab('all')} count={results.length}>All</TabBtn>
        <TabBtn active={tab === 'recipes'} onClick={() => setTab('recipes')} count={recipes.length}>Recipes</TabBtn>
        <TabBtn active={tab === 'chefs'} onClick={() => setTab('chefs')} count={users.length}>Chefs</TabBtn>
      </div>

      {/* States */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <React.Fragment key={i}>
              <SkeletonRecipe />
            </React.Fragment>
          ))}
        </div>
      )}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {nothing && <p className="text-neutral-400 text-sm">No matching users or recipes found.</p>}

      {/* Results */}
      {!loading && !error && results.length > 0 && (
        <div className="space-y-8">
          {(tab === 'all' || tab === 'recipes') && recipes.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="text-sm font-medium text-neutral-300 mb-3">Recipes <span className="text-neutral-500">({recipes.length})</span></h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map((item) => (
                  <RecipeCard
                    key={item.recipeId}
                    id={item.recipeId}
                    author={item.authorUsername}
                    title={item.title}
                    description={item.description}
                    imageUrl={item.imageUrl}
                    likes={item.likes}
                    ingredients={item.ingredients}
                    userAllergies={[]}
                  />
                ))}
              </div>
            </section>
          )}

          {(tab === 'all' || tab === 'chefs') && users.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="text-sm font-medium text-neutral-300 mb-3">Chefs <span className="text-neutral-500">({users.length})</span></h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u) => (
                  <button
                    key={u.username}
                    onClick={() => onUserClick(u.username)}
                    className="text-left border border-neutral-900 bg-neutral-950/60 hover:bg-neutral-900 transition rounded-2xl p-4 group focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <h3 className="text-base font-semibold group-hover:text-neutral-50">@{u.username}</h3>
                    {u.displayName && <p className="text-sm text-neutral-400">{u.displayName}</p>}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
