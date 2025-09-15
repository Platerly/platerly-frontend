import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const SaveToCookbookDropdown = ({ recipeId, onClose, anchorRef }) => {
  const { token } = useAuth();
  const [mine, setMine] = useState([]);
  const [writable, setWritable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);
  const dropdownRef = useRef(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // fetch lists
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
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

        const myIds = new Set(mineItems.map((x) => x.id));
        const collabOnly = writeItems.filter((x) => !myIds.has(x.id));

        setMine(mineItems);
        setWritable(collabOnly);
      } catch (e) {
        console.error(e);
        setError("Unable to fetch cookbooks.");
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // position dropdown near the anchor
  useEffect(() => {
    const el = anchorRef?.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const dropdownHeight = 260; // rough guess
    const spaceBelow = window.innerHeight - rect.bottom;

    setPosition({
      top: (spaceBelow < dropdownHeight ? rect.top - dropdownHeight : rect.bottom) + window.scrollY,
      left: rect.left,
    });
    setReady(true);
  }, [anchorRef]);

  const handleSave = async (cookbookId) => {
    if (!recipeId) return;
    setSavingId(cookbookId);
    setError("");
    try {
      await axios.post(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/recipes`,
        { recipeId }, // AddRecipeToCookbookDto
        { headers }
      );
      onClose?.(); // close after success
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data ||
        (e?.response?.status === 400 ? "Already saved to this cookbook." : "Failed to save.");
      setError(typeof msg === "string" ? msg : "Failed to save.");
    } finally {
      setSavingId(null);
    }
  };

  if (typeof window === "undefined" || !ready) return null;

  const renderList = (title, list) => (
    <>
      <div className="px-3 py-2 text-xs text-neutral-400 border-t border-neutral-800">{title}</div>
      {list.length === 0 ? (
        <div className="px-4 py-2 text-sm text-neutral-400">None.</div>
      ) : (
        <ul className="max-h-64 overflow-y-auto">
          {list.map((cb) => (
            <li
              key={cb.id}
              onClick={() => handleSave(cb.id)}
              className={`px-4 py-2 text-sm text-white hover:bg-neutral-800 cursor-pointer ${
                savingId === cb.id ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {cb.title}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-50 w-64 rounded-md shadow-lg bg-neutral-900 border border-neutral-700"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2 border-b border-neutral-800 text-sm text-neutral-300">
        Save to Cookbook
      </div>

      {loading ? (
        <div className="p-4 text-sm text-neutral-400">Loading…</div>
      ) : (
        <>
          {renderList("My cookbooks", mine)}
          {renderList("I can collaborate on", writable)}
        </>
      )}

      {error && <div className="px-4 py-2 text-xs text-red-400 border-t border-neutral-800">{error}</div>}
    </div>,
    document.body
  );
};

export default SaveToCookbookDropdown;
