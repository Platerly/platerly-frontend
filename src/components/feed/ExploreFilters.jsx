/**
 * ExploreFilters.jsx — Filter bar for the Explore Recipes page.
 *
 * Layer: Feature / feed filtering UI.
 *
 * Renders a horizontal filter row with:
 *   - Difficulty selector (Any / Easy / Medium / Hard)
 *   - Tag chips input (comma or Enter to add; debounced 250 ms)
 *   - "Require all tags" checkbox
 *   - "Hide remixes" checkbox
 *   - "Hide my allergens" checkbox — LOCKED for free users (no premium/trial)
 *
 * Hide-my-allergens gate:
 *   The checkbox is disabled and has a "Premium" badge when the user is neither
 *   premium nor on trial.  Clicking it while locked opens an inline upgrade
 *   prompt (`allergenUpgradeOpen`) rather than activating the filter.  The
 *   backend also enforces this: `effectiveHideMyAllergens` is ignored for free
 *   users in `FeedController.GetExploreFeed`.
 *
 * All filter state changes reset `page` to 1 and are pushed to the parent via
 * the `onChange` callback.
 *
 * Props:
 *   @prop {object}  value    — Current filter values (difficulty, tags[], requireAllTags,
 *                              hideMyAllergens, hideRemixes).
 *   @prop {(v: object) => void} onChange — Called whenever any filter changes.
 *   @prop {boolean} loading  — Disables all controls while the feed is fetching.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePremium } from "../../hooks/usePremium";

const DIFFICULTY = ["", "Easy", "Medium", "Hard"]; // "" => Any

const normalizeTag = (t) =>
  t.toLowerCase().replace(/\s+/g, " ").trim();

const parseTags = (raw) =>
  raw
    .split(",")
    .map(normalizeTag)
    .filter(Boolean);

/* tiny debounce */
const useDebounced = (value, ms = 250) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

export default function ExploreFilters({ value, onChange, loading }) {
  const [difficulty, setDifficulty] = useState(value?.difficulty ?? "");
  const [tagsInput, setTagsInput] = useState((value?.tags || []).join(", "));
  const [tags, setTags] = useState((value?.tags || []).map(normalizeTag));
  const [requireAllTags, setRequireAllTags] = useState(value?.requireAllTags ?? false);
  const [hideMyAllergens, setHideMyAllergens] = useState(value?.hideMyAllergens ?? false);
  const [hideRemixes, setHideRemixes] = useState(value?.hideRemixes ?? false);
  const [allergenUpgradeOpen, setAllergenUpgradeOpen] = useState(false);

  const { isPremium, isOnTrial } = usePremium();
  // Only premium subscribers and active trial users can filter by their allergen profile
  const hasAllergenFilter = isPremium || isOnTrial;

  const disabled = !!loading;
  const inputRef = useRef(null);

  // keep tags in sync if user types comma-separated
  const debouncedInput = useDebounced(tagsInput, 250);
  useEffect(() => {
    const parsed = parseTags(debouncedInput);
    // only update if different length or membership
    if (parsed.join("|") !== tags.join("|")) setTags(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  // push to parent
  useEffect(() => {
    onChange?.({
      difficulty,
      tags,
      requireAllTags,
      hideMyAllergens,
      hideRemixes,
      page: 1, // reset page on filter change
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, tags.join("|"), requireAllTags, hideMyAllergens, hideRemixes]);

  const addTag = (raw) => {
    const t = normalizeTag(raw);
    if (!t) return;
    if (tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagsInput((s) => (s ? `${s}, ${raw}` : raw));
  };

  const removeTag = (t) => {
    setTags((prev) => prev.filter((x) => x !== t));
    // rebuild input from current tags minus removed one
    const next = tags.filter((x) => x !== t).join(", ");
    setTagsInput(next);
  };

  const onTagsKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = e.currentTarget.value;
      // pick last token user is typing
      const last = v.split(",").pop();
      addTag(last || v);
      // keep previous tokens; clear the trailing segment user just committed
      const tokens = v.split(",").slice(0, -1).map((s) => s.trim()).filter(Boolean);
      setTagsInput(tokens.join(", "));
    }
  };

  const resetFilters = () => {
    setDifficulty("");
    setTags([]);
    setTagsInput("");
    setRequireAllTags(false);
    setHideMyAllergens(false);
    setHideRemixes(false);
  };

  const chipClasses = "inline-flex items-center gap-1 rounded-full border border-recipzee-border bg-recipzee-card/60 px-2 py-0.5 text-xs";

  const hint = useMemo(() => {
    if (tags.length === 0) return "Tip: press Enter to add a tag";
    return requireAllTags ? "Showing recipes with all selected tags" : "Showing recipes with any of the selected tags";
  }, [tags.length, requireAllTags]);

  return (
    <section
      className="w-full border-b border-recipzee-border pb-3 mb-4"
      aria-label="Explore filters"
    >
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {/* Difficulty */}
        <div className="flex flex-col min-w-[160px]">
          <label className="text-xs font-medium text-recipzee-text/70 mb-1">
            Difficulty
          </label>
          <select
            className="border border-recipzee-border bg-recipzee-card text-recipzee-text rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-recipzee-green/60 disabled:opacity-50"
            value={difficulty}
            disabled={disabled}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DIFFICULTY.map((d) => (
              <option key={d || "any"} value={d}>{d || "Any"}</option>
            ))}
          </select>
        </div>

        {/* Tags input */}
        <div className="flex-1 min-w-[220px] flex flex-col">
          <label className="text-xs font-medium text-recipzee-text/70 mb-1">
            Tags
            <span className="ml-2 text-[11px] text-recipzee-text/50">(comma or Enter to add)</span>
          </label>
          <input
            ref={inputRef}
            className="border border-recipzee-border bg-recipzee-card text-recipzee-text rounded-md px-3 py-2 text-sm placeholder:text-recipzee-text/40 focus:outline-none focus:ring-2 focus:ring-recipzee-green/60 disabled:opacity-50"
            placeholder="vegan, breakfast, low nickel"
            value={tagsInput}
            disabled={disabled}
            onChange={(e) => setTagsInput(e.target.value)}
            onKeyDown={onTagsKeyDown}
            aria-describedby="tags-hint"
          />
          {/* Chips row */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className={chipClasses}>
                  <span className="truncate max-w-[160px]">{t}</span>
                  <button
                    type="button"
                    className="ml-1 rounded-full px-1 text-recipzee-text/70 hover:text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/60"
                    onClick={() => removeTag(t)}
                    aria-label={`Remove tag ${t}`}
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => { setTags([]); setTagsInput(""); }}
                className="text-xs text-recipzee-text/60 hover:text-recipzee-text underline-offset-2 hover:underline"
                disabled={disabled}
              >
                Clear
              </button>
            </div>
          )}
          <p id="tags-hint" className="mt-1 text-[11px] text-recipzee-text/50">
            {hint}
          </p>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-recipzee-text">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-recipzee-border bg-recipzee-card text-recipzee-green focus:ring-recipzee-green/60"
              checked={requireAllTags}
              disabled={disabled}
              onChange={(e) => setRequireAllTags(e.target.checked)}
            />
            Require all tags
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-recipzee-text">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-recipzee-border bg-recipzee-card text-recipzee-green focus:ring-recipzee-green/60"
              checked={hideRemixes}
              disabled={disabled}
              onChange={(e) => setHideRemixes(e.target.checked)}
            />
            Hide remixes
          </label>

          <div className="flex flex-col gap-1">
            <label className="inline-flex items-center gap-2 text-sm text-recipzee-text">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-recipzee-border bg-recipzee-card text-recipzee-green focus:ring-recipzee-green/60"
                checked={hideMyAllergens}
                // Checkbox is visually and functionally disabled for free users
                disabled={disabled || !hasAllergenFilter}
                onChange={(e) => {
                  // Free users see the upgrade prompt instead of toggling the filter
                  if (!hasAllergenFilter) {
                    setAllergenUpgradeOpen(true);
                    return;
                  }
                  setHideMyAllergens(e.target.checked);
                }}
              />
              Hide my allergens
              {/* Premium badge shown next to the label for free users */}
              {!hasAllergenFilter && (
                <span className="text-[10px] font-semibold text-yellow-400 border border-yellow-500/50 rounded-full px-1.5 py-0.5">
                  Premium
                </span>
              )}
            </label>
            {/* Inline upgrade prompt — appears when a free user clicks the locked checkbox */}
            {allergenUpgradeOpen && !hasAllergenFilter && (
              <div className="flex items-center gap-2 text-xs text-yellow-200">
                <Link
                  to="/settings?tab=subscription"
                  className="text-yellow-400 font-medium underline underline-offset-2 hover:text-yellow-300"
                >
                  Upgrade to Premium
                </Link>
                <button
                  type="button"
                  onClick={() => setAllergenUpgradeOpen(false)}
                  className="text-recipzee-subtle hover:text-recipzee-text text-lg leading-none"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reset */}
        <div className="sm:ml-auto">
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm text-recipzee-green hover:underline underline-offset-2 disabled:opacity-50"
            disabled={disabled}
          >
            Reset filters
          </button>
        </div>
      </div>
    </section>
  );
}
