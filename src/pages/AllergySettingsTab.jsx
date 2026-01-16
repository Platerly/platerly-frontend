import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { norm } from "../utils/allergenHelpers";
import { logger } from "../utils/logger";

export default function AllergySettingsTab() {
  const { token } = useAuth();

  const [allAllergies, setAllAllergies] = useState([]); // [{id, name}]
  const [selectedNames, setSelectedNames] = useState([]); // lowercase names
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  // fetch on mount / token change
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr("");
      try {
        const [allRes, userRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/Allergy/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/api/Allergy/my-allergies`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (cancelled) return;
        setAllAllergies(Array.isArray(allRes.data) ? allRes.data : []);
        setSelectedNames(
          Array.isArray(userRes.data)
            ? userRes.data.map(norm) // server returns lowercase strings
            : []
        );
      } catch (e) {
        logger.error("Failed to load allergy data", e);
        if (!cancelled) {
          setErr("Failed to load allergies. Please try again.");
          toast.error("Could not load allergies.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return allAllergies;
    return allAllergies.filter((a) => norm(a.name).includes(q));
  }, [allAllergies, query]);

  const isSelected = (name) => selectedNames.includes(norm(name));

  const toggle = (name) => {
    const key = norm(name);
    setSelectedNames((prev) =>
      prev.includes(key) ? prev.filter((n) => n !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedNames(allAllergies.map((a) => norm(a.name)));
  };
  const clearAll = () => setSelectedNames([]);
  const invert = () => {
    const allSet = new Set(allAllergies.map((a) => norm(a.name)));
    const sel = new Set(selectedNames);
    const next = [...allSet].filter((n) => !sel.has(n));
    setSelectedNames(next);
  };

  const handleSave = async () => {
    if (!token) return;
    try {
      setSaving(true);
      // names -> ids (robust to name casing)
      const selectedIds = allAllergies
        .filter((a) => selectedNames.includes(norm(a.name)))
        .map((a) => a.id);

      await axios.put(`${API_BASE_URL}/api/Allergy/update`, selectedIds, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Allergy preferences saved!");
    } catch (e) {
      logger.error("Failed to update allergies", e);
      toast.error("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-6 text-platerly-text space-y-6 md:space-y-10">
      <div className="bg-platerly-card border border-platerly-border rounded-2xl shadow p-5 md:p-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Allergy Preferences</h2>
            <p className="text-sm text-platerly-subtle mt-1">
              Tap to toggle allergens you’d like to be warned about in recipes.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={loading || saving || allAllergies.length === 0}
              className="text-sm px-3 py-1.5 rounded-md border border-platerly-border bg-platerly-card hover:bg-platerly-card/80 disabled:opacity-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={loading || saving}
              className="text-sm px-3 py-1.5 rounded-md border border-platerly-border bg-platerly-card hover:bg-platerly-card/80 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={invert}
              disabled={loading || saving || allAllergies.length === 0}
              className="text-sm px-3 py-1.5 rounded-md border border-platerly-border bg-platerly-card hover:bg-platerly-card/80 disabled:opacity-50"
            >
              Invert
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="mt-4">
          <input
            type="search"
            placeholder="Search allergens (e.g., peanuts, soy, nickel)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="w-full md:max-w-md border border-platerly-border bg-platerly-card rounded-md px-3 py-2 text-sm placeholder:text-platerly-text/40 focus:outline-none focus:ring-2 focus:ring-platerly-green/60 disabled:opacity-50"
            aria-label="Search allergens"
          />
        </div>

        {/* Content */}
        <div className="mt-6">
          {err && (
            <div className="text-sm text-red-300 bg-red-900/20 border border-red-700/40 rounded-md px-3 py-2">
              {err}
            </div>
          )}

          {loading ? (
            <div className="flex flex-wrap gap-2 animate-pulse">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="h-8 w-24 rounded-full bg-platerly-border/40"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Pills */}
              <div className="flex flex-wrap gap-2">
                {filtered.length === 0 ? (
                  <p className="text-sm text-platerly-subtle">
                    No allergens match “{query}”.
                  </p>
                ) : (
                  filtered.map((a) => {
                    const active = isSelected(a.name);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggle(a.name)}
                        aria-pressed={active}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-platerly-green/60
                          ${
                            active
                              ? "bg-platerly-green text-white border-platerly-green shadow"
                              : "bg-platerly-card border-platerly-border text-platerly-text hover:bg-platerly-card/80"
                          }`}
                        disabled={saving}
                      >
                        {a.name}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer: count + save */}
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-sm text-platerly-subtle">
                  Selected: <span className="text-platerly-text">{selectedNames.length}</span> /{" "}
                  {allAllergies.length}
                </div>

                <div className="sm:ml-auto">
                  <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="px-5 py-2 rounded-md bg-platerly-green hover:bg-platerly-green/90 text-white font-semibold transition disabled:opacity-50"
                    aria-busy={saving || undefined}
                  >
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-platerly-subtle text-center">
        Tip: Your selections power “Hide my allergens” in feeds and highlight warnings in recipes.
      </p>
    </div>
  );
}
