import { useEffect, useMemo, useState } from "react";

const DIFFICULTY = ["", "Easy", "Medium", "Hard"]; // "" means “any”

export default function ExploreFilters({ value, onChange, loading }) {
  const [difficulty, setDifficulty] = useState(value?.difficulty ?? "");
  const [tagsInput, setTagsInput] = useState((value?.tags || []).join(", "));
  const [requireAllTags, setRequireAllTags] = useState(value?.requireAllTags ?? false);
  const [hideMyAllergens, setHideMyAllergens] = useState(value?.hideMyAllergens ?? false);
  const [hideRemixes, setHideRemixes] = useState(value?.hideRemixes ?? false);

  // Keep parent in sync
  useEffect(() => {
    const tags = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    onChange?.({
      difficulty,
      tags,
      requireAllTags,
      hideMyAllergens,
      hideRemixes,
      page: 1, // reset page on filter change
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, tagsInput, requireAllTags, hideMyAllergens, hideRemixes]);

  const disabled = !!loading;

  return (
    <div className="w-full flex flex-wrap gap-3 items-end border-b pb-3 mb-4">
      <div className="flex flex-col">
        <label className="text-sm text-gray-500 mb-1">Difficulty</label>
        <select
          className="border rounded px-2 py-1"
          value={difficulty}
          disabled={disabled}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {DIFFICULTY.map(d => (
            <option key={d || "any"} value={d}>{d || "Any"}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[220px] flex flex-col">
        <label className="text-sm text-gray-500 mb-1">Tags (comma-separated)</label>
        <input
          className="border rounded px-2 py-1"
          placeholder="vegan, breakfast, low nickel"
          value={tagsInput}
          disabled={disabled}
          onChange={(e) => setTagsInput(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={requireAllTags}
          disabled={disabled}
          onChange={(e) => setRequireAllTags(e.target.checked)}
        />
        <span className="text-sm">Require all tags</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hideRemixes}
          disabled={disabled}
          onChange={(e) => setHideRemixes(e.target.checked)}
        />
        <span className="text-sm">Hide remixes</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hideMyAllergens}
          disabled={disabled}
          onChange={(e) => setHideMyAllergens(e.target.checked)}
        />
        <span className="text-sm">Hide my allergens</span>
      </label>
    </div>
  );
}
