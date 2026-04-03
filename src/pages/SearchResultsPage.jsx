import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Search, ChefHat, User, SlidersHorizontal, X,
  Clock, Flame, Tag, Filter, ChevronDown, ChevronUp
} from "lucide-react";
import { API_BASE_URL } from "../utils/api";
import RecipeCard from "../components/ui/RecipeCard";
import { logger } from "../utils/logger";

/**
 * SearchResultsPage
 *
 * Layer: Public search page for Recipzee's recipe and user catalogue.
 * Route: /search?q=<query>  (additional filter params: difficulty, time, tags, etc.)
 *
 * What this page does:
 *  - Searches recipes and users simultaneously (two tabs: Recipes | Chefs)
 *  - Fetches from GET /api/Recipe/search and GET /api/User/search in parallel
 *  - Advanced recipe filters: difficulty, prep+cook time ceiling, tag chips
 *  - Filter state is reflected in URL search params so searches are shareable/bookmarkable
 *  - TabBtn shows result count badge when results are loaded
 *  - SkeletonRecipe and SkeletonUser render during the loading state
 *
 * State managed:
 *  - q (query), tab, difficulty, maxTime, selectedTags — filter state (URL-driven)
 *  - recipeResults, userResults, loading, error — search output
 */

// Tab button component
const TabBtn = ({ active, onClick, children, count, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-recipzee-green/50 ${
      active
        ? "bg-recipzee-green text-recipzee-dark shadow-lg shadow-recipzee-green/20"
        : "bg-recipzee-card border border-recipzee-border text-recipzee-text/80 hover:bg-recipzee-light hover:border-recipzee-green/30"
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    <span>{children}</span>
    {typeof count === "number" && (
      <span className={`inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-lg ${
        active ? "bg-recipzee-dark/20 text-recipzee-dark" : "bg-recipzee-light text-recipzee-subtle"
      }`}>{count}</span>
    )}
  </button>
);

// Filter chip component
const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
      active
        ? "bg-recipzee-green text-recipzee-dark font-medium"
        : "bg-recipzee-card border border-recipzee-border text-recipzee-subtle hover:border-recipzee-green/30"
    }`}
  >
    {label}
  </button>
);

// Skeleton components
const SkeletonRecipe = () => (
  <div className="rounded-2xl border border-recipzee-border bg-recipzee-card p-4 animate-pulse">
    <div className="h-44 w-full bg-recipzee-light rounded-xl mb-3" />
    <div className="h-4 w-3/5 bg-recipzee-light rounded-lg mb-2" />
    <div className="h-3 w-4/5 bg-recipzee-light/70 rounded-lg" />
  </div>
);

const SkeletonUser = () => (
  <div className="rounded-2xl border border-recipzee-border bg-recipzee-card p-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-recipzee-light" />
      <div className="flex-1">
        <div className="h-4 w-32 bg-recipzee-light rounded-lg mb-2" />
        <div className="h-3 w-24 bg-recipzee-light/70 rounded-lg" />
      </div>
    </div>
  </div>
);

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TIME_FILTERS = [
  { label: 'Under 15 min', max: 15 },
  { label: 'Under 30 min', max: 30 },
  { label: 'Under 1 hour', max: 60 },
  { label: 'Any time', max: null },
];
const POPULAR_TAGS = [
  'vegan', 'vegetarian', 'gluten free', 'dairy free', 'keto',
  'quick', 'healthy', 'comfort', 'breakfast', 'dinner'
];

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = (searchParams.get("q") || "").trim();
  const tab = (searchParams.get("tab") || "all").toLowerCase();
  const difficulty = searchParams.get("difficulty") || "";
  const maxTime = searchParams.get("maxTime") || "";
  const selectedTags = (searchParams.get("tags") || "").split(",").filter(Boolean);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Split results into buckets
  const { recipes, users } = useMemo(() => {
    const r = [], u = [];
    for (const item of results) {
      if (item?.type === "recipe") r.push(item);
      else if (item?.type === "user") u.push(item);
    }
    return { recipes: r, users: u };
  }, [results]);

  // Apply client-side filters to recipes
  const filteredRecipes = useMemo(() => {
    let filtered = [...recipes];

    // Difficulty filter
    if (difficulty) {
      filtered = filtered.filter(r =>
        (r.difficulty || '').toLowerCase() === difficulty.toLowerCase()
      );
    }

    // Time filter (total time = prep + cook)
    if (maxTime) {
      const max = parseInt(maxTime, 10);
      if (!isNaN(max)) {
        filtered = filtered.filter(r => {
          const total = (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0);
          return total <= max;
        });
      }
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(r => {
        const recipeTags = Array.isArray(r.tags)
          ? r.tags.map(t => (t || '').toLowerCase())
          : typeof r.tags === 'string'
          ? r.tags.split(',').map(t => t.trim().toLowerCase())
          : [];
        return selectedTags.some(tag => recipeTags.some(rt => rt.includes(tag.toLowerCase())));
      });
    }

    return filtered;
  }, [recipes, difficulty, maxTime, selectedTags]);

  // Fetch search results
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
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(q)}&pageSize=50`);
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = await res.json();
        const users = Array.isArray(data.users) ? data.users : [];
        const recipes = Array.isArray(data.recipes) ? data.recipes : [];
        const combined = [...users, ...recipes];
        if (!alive) return;
        setResults(combined);
      } catch (err) {
        logger.error(err);
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

  const updateParams = (updates) => {
    const sp = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
        sp.delete(key);
      } else if (Array.isArray(value)) {
        sp.set(key, value.join(','));
      } else {
        sp.set(key, value);
      }
    });
    setSearchParams(sp, { replace: true });
  };

  const setTab = (name) => updateParams({ tab: name });

  const toggleDifficulty = (d) => {
    updateParams({ difficulty: difficulty === d ? '' : d });
  };

  const toggleTime = (max) => {
    updateParams({ maxTime: maxTime === String(max) ? '' : String(max || '') });
  };

  const toggleTag = (tag) => {
    const lower = tag.toLowerCase();
    const newTags = selectedTags.includes(lower)
      ? selectedTags.filter(t => t !== lower)
      : [...selectedTags, lower];
    updateParams({ tags: newTags });
  };

  const clearFilters = () => {
    updateParams({ difficulty: '', maxTime: '', tags: [] });
  };

  const hasActiveFilters = difficulty || maxTime || selectedTags.length > 0;
  const onUserClick = (username) => navigate(`/profile/${username}`);
  const nothing = !loading && !error && results.length === 0;

  const searchTitle = q
    ? `"${q}" recipes — Recipzee`
    : 'Search Recipes — Recipzee'
  const searchDescription = q
    ? `Search results for "${q}" on Recipzee — allergen-aware recipes including low-nickel, gluten-free, dairy-free, halal and more.`
    : 'Search thousands of allergen-aware recipes on Recipzee — including low-nickel, gluten-free, dairy-free, halal and vegan meals.'

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden">
      <Helmet>
        <title>{searchTitle}</title>
        <meta name="description" content={searchDescription} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-recipzee-green/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 px-4 sm:px-6 md:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-recipzee-green/20 flex items-center justify-center">
              <Search className="w-6 h-6 text-recipzee-green" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Results for <span className="text-recipzee-green">"{q || '...'}"</span>
              </h1>
              <p className="text-recipzee-subtle text-sm mt-0.5">
                {filteredRecipes.length + users.length} {filteredRecipes.length + users.length === 1 ? 'result' : 'results'} found
                {hasActiveFilters && ` (filtered from ${results.length})`}
              </p>
            </div>
          </div>

          {/* Search input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = new FormData(e.currentTarget).get('q')?.toString().trim() || '';
              updateParams({ q: v });
            }}
            className="w-full max-w-md"
          >
            <div className="flex items-center gap-3 rounded-xl border border-recipzee-border bg-recipzee-light/50 px-4 py-3 transition-all duration-200 focus-within:border-recipzee-green/40 focus-within:ring-2 focus-within:ring-recipzee-green/20">
              <Search className="h-5 w-5 text-recipzee-subtle shrink-0" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search recipes, chefs..."
                className="w-full bg-transparent text-sm text-recipzee-text placeholder-recipzee-subtle focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* Tabs and Filter Toggle */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <TabBtn active={tab === 'all'} onClick={() => setTab('all')} count={filteredRecipes.length + users.length}>All</TabBtn>
          <TabBtn active={tab === 'recipes'} onClick={() => setTab('recipes')} count={filteredRecipes.length} icon={ChefHat}>Recipes</TabBtn>
          <TabBtn active={tab === 'chefs'} onClick={() => setTab('chefs')} count={users.length} icon={User}>Chefs</TabBtn>

          <div className="ml-auto flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-recipzee-subtle hover:text-recipzee-text transition-colors"
              >
                Clear filters
              </button>
            )}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                showFilters
                  ? 'border-recipzee-green bg-recipzee-green/10 text-recipzee-green'
                  : 'border-recipzee-border bg-recipzee-card text-recipzee-subtle hover:text-recipzee-text'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-recipzee-green text-recipzee-dark text-xs flex items-center justify-center font-bold">
                  {(difficulty ? 1 : 0) + (maxTime ? 1 : 0) + selectedTags.length}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8 p-4 rounded-2xl border border-recipzee-border bg-recipzee-card/50 backdrop-blur-sm space-y-4">
            {/* Difficulty */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-recipzee-text mb-2">
                <Flame className="w-4 h-4 text-recipzee-green" />
                Difficulty
              </div>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map(d => (
                  <FilterChip
                    key={d}
                    label={d}
                    active={difficulty.toLowerCase() === d.toLowerCase()}
                    onClick={() => toggleDifficulty(d)}
                  />
                ))}
              </div>
            </div>

            {/* Time */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-recipzee-text mb-2">
                <Clock className="w-4 h-4 text-recipzee-green" />
                Total Time
              </div>
              <div className="flex flex-wrap gap-2">
                {TIME_FILTERS.map(t => (
                  <FilterChip
                    key={t.label}
                    label={t.label}
                    active={t.max ? maxTime === String(t.max) : !maxTime}
                    onClick={() => toggleTime(t.max)}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-recipzee-text mb-2">
                <Tag className="w-4 h-4 text-recipzee-green" />
                Popular Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map(tag => (
                  <FilterChip
                    key={tag}
                    label={tag}
                    active={selectedTags.includes(tag.toLowerCase())}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Border separator */}
        <div className="border-b border-recipzee-border mb-8" />

        {/* States */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <SkeletonRecipe key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {nothing && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-recipzee-light flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-recipzee-subtle" />
            </div>
            <h3 className="text-lg font-semibold text-recipzee-text">No results found</h3>
            <p className="text-sm text-recipzee-subtle mt-1 max-w-sm mx-auto">
              Try searching with different keywords or check your spelling.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results.length > 0 && (
          <div className="space-y-10">
            {(tab === 'all' || tab === 'recipes') && filteredRecipes.length > 0 && (
              <section>
                {tab === 'all' && (
                  <div className="flex items-center gap-2 mb-4">
                    <ChefHat className="w-5 h-5 text-recipzee-green" />
                    <h2 className="text-sm font-semibold text-recipzee-text">
                      Recipes <span className="text-recipzee-subtle">({filteredRecipes.length})</span>
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredRecipes.map((item) => (
                    <RecipeCard
                      key={item.recipeId}
                      id={item.recipeId}
                      author={item.authorUsername}
                      title={item.title}
                      description={item.description}
                      imageUrl={item.imageUrl}
                      photoCredit={item.photoCredit}
                      photoCreditUrl={item.photoCreditUrl}
                      likes={item.likes}
                      ingredients={item.ingredients}
                      userAllergies={[]}
                      prepTime={item.prepTimeMinutes}
                      cookTime={item.cookTimeMinutes}
                      difficulty={item.difficulty}
                      tags={item.tags}
                    />
                  ))}
                </div>
              </section>
            )}

            {(tab === 'all' || tab === 'chefs') && users.length > 0 && (
              <section>
                {tab === 'all' && (
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-recipzee-green" />
                    <h2 className="text-sm font-semibold text-recipzee-text">
                      Chefs <span className="text-recipzee-subtle">({users.length})</span>
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((u) => (
                    <button
                      key={u.username}
                      onClick={() => onUserClick(u.username)}
                      className="group text-left border border-recipzee-border bg-recipzee-card rounded-2xl p-4 transition-all duration-200 hover:border-recipzee-green/30 hover:bg-recipzee-light/50 hover:shadow-lg hover:shadow-recipzee-green/5 focus:outline-none focus:ring-2 focus:ring-recipzee-green/40"
                    >
                      <div className="flex items-center gap-3">
                        {u.profileImageUrl ? (
                          <img
                            src={u.profileImageUrl}
                            alt={u.username}
                            className="w-12 h-12 rounded-xl object-cover border border-recipzee-border group-hover:border-recipzee-green/30 transition-colors"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-recipzee-green/20 to-recipzee-light flex items-center justify-center font-bold text-recipzee-text border border-recipzee-border group-hover:border-recipzee-green/30 transition-colors">
                            {u.username?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-recipzee-text group-hover:text-recipzee-green transition-colors truncate">
                            @{u.username}
                          </h3>
                          {u.displayName && (
                            <p className="text-sm text-recipzee-subtle truncate">{u.displayName}</p>
                          )}
                        </div>
                      </div>
                      {u.bio && (
                        <p className="text-sm text-recipzee-subtle mt-3 line-clamp-2">{u.bio}</p>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* No recipes match filters */}
            {(tab === 'all' || tab === 'recipes') && filteredRecipes.length === 0 && recipes.length > 0 && (
              <div className="py-12 text-center">
                <Filter className="w-10 h-10 text-recipzee-muted mx-auto mb-3" />
                <p className="text-recipzee-subtle">No recipes match your filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-recipzee-green hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
