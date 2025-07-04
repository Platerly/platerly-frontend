import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

const SaveToCookbookDropdown = ({ recipeId, onClose, anchorRef }) => {
  const [cookbooks, setCookbooks] = useState([]);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0, flipUp: false });
  const [isPositioned, setIsPositioned] = useState(false); // only render after position is known
  const dropdownRef = useRef(null);
  const token = localStorage.getItem("platerly_token");

  useEffect(() => {
    const fetchCookbooks = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/Cookbook/my-cookbooks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCookbooks(res.data);
      } catch {
        setError("Unable to fetch cookbooks.");
      }
    };

    fetchCookbooks();
  }, [token]);

  useEffect(() => {
    const waitForElementAndPosition = () => {
      const el = anchorRef?.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const dropdownHeight = 260;
      const spaceBelow = window.innerHeight - rect.bottom;

      setPosition({
        top: spaceBelow < dropdownHeight ? rect.top - dropdownHeight : rect.bottom,
        left: rect.left,
        flipUp: spaceBelow < dropdownHeight,
      });

      setIsPositioned(true);
    };

    const frame = requestAnimationFrame(waitForElementAndPosition);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSave = async (cookbookId) => {
    setSaving(cookbookId);
    setError(null);
    try {
      await axios.post(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/add-recipe`,
        { recipeId },
        {
          headers: {
            Authorization: `Bearer ${token}` },
      });
      onClose?.(); // close dropdown
    } catch {
      setError("Already saved or failed to save.");
    } finally {
      setSaving(null);
    }
  };

  if (typeof window === "undefined" || !isPositioned) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-50 w-56 rounded-md shadow-lg bg-neutral-900 border border-neutral-700"
      style={{
        top: position.top + window.scrollY,
        left: position.left,
      }}
    >
      {cookbooks.length === 0 ? (
        <div className="text-sm text-gray-400 p-4">No cookbooks found.</div>
      ) : (
        <ul className="max-h-64 overflow-y-auto">
          {cookbooks.map((cookbook) => {
            const alreadySaved = cookbook.recipes?.some((r) => r.id === recipeId);
            return (
              <li
                key={cookbook.id}
                className={`px-4 py-2 text-sm text-white hover:bg-neutral-800 cursor-pointer ${
                  alreadySaved ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => !alreadySaved && handleSave(cookbook.id)}
              >
                {cookbook.title}
              </li>
            );
          })}
        </ul>
      )}
      {error && <div className="text-xs text-red-500 px-4 py-2">{error}</div>}
    </div>,
    document.body
  );
};

export default SaveToCookbookDropdown;
