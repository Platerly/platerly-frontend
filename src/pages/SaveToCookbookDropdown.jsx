import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Loader2, Plus } from "lucide-react";

/**
 * SaveToCookbookDropdown
 *
 * Layer: Reusable UI component — portalled dropdown for saving a recipe to a cookbook.
 * Used by: IndexedRecipeCard, RecipeCard, and any other card that has a "Save" action.
 *
 * What this component does:
 *  - Fetches the user's own cookbooks (GET /api/Cookbook/mine) and cookbooks they
 *    can collaborate on (GET /api/Cookbook/can-write) in parallel on mount
 *  - Deduplicates: collaborative cookbooks already in "mine" are filtered out
 *  - POST /api/Cookbook/:cookbookId/recipes to save the recipe
 *  - Portalled to document.body via createPortal to escape any overflow:hidden parents
 *  - Smart positioning: measures anchor rect and flips vertically if not enough space below
 *  - On mobile (<420px) renders as a bottom-anchored sheet rather than a dropdown
 *
 * A11y: role="menu", keyboard nav (↑/↓ arrow keys, Enter to select, Escape to close),
 *       focus management (first item receives focus when opened)
 *
 * @param {{ recipeId: string, onClose: () => void, anchorRef: React.RefObject, onCreateNew?: () => void }} props
 * @returns {JSX.Element | null}
 */

const MOBILE_BREAKPOINT = 420;

export default function SaveToCookbookDropdown({ recipeId, onClose, anchorRef, onCreateNew }) {
  const { token } = useAuth();
  const [mine, setMine] = useState([]);
  const [writable, setWritable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 288 });
  const [isMobile, setIsMobile] = useState(false);

  const dropdownRef = useRef(null);
  const firstItemRef = useRef(null);

  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // fetch lists
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [mineRes, writeRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/Cookbook/mine?page=1&pageSize=100`, { headers }),
          axios.get(`${API_BASE_URL}/api/Cookbook/can-write?page=1&pageSize=100`, { headers }).catch(() => ({ data: { items: [] } })),
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
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [headers]);

  // determine mobile mode + position dropdown relative to anchor
  useLayoutEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    onResize();

    const position = () => {
      const el = anchorRef?.current;
      const dd = dropdownRef.current;
      if (!el || !dd) return;

      const rect = el.getBoundingClientRect();
      const ddRect = dd.getBoundingClientRect();

      // Default below-left of anchor
      let top = rect.bottom + window.scrollY;
      let left = rect.left + window.scrollX;

      // Flip vertically if not enough space below
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < ddRect.height + 12) {
        top = rect.top + window.scrollY - ddRect.height;
      }

      // Prevent overflow horizontally
      if (left + ddRect.width > window.scrollX + window.innerWidth - 8) {
        left = window.scrollX + window.innerWidth - ddRect.width - 8;
      }
      if (left < window.scrollX + 8) left = window.scrollX + 8;

      setCoords({ top, left, width: ddRect.width });
      setReady(true);
    };

    // initial + after paint
    requestAnimationFrame(position);

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", position, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", position);
    };
  }, [anchorRef]);

  // click outside / escape to close
  useEffect(() => {
    const onDocClick = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if ((e.key === "ArrowDown" || e.key === "Down") && firstItemRef.current) {
        e.preventDefault();
        firstItemRef.current.focus();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleSave = async (cookbookId) => {
    if (!recipeId) return;
    setSavingId(cookbookId);
    setError("");
    try {
      await axios.post(
        `${API_BASE_URL}/api/Cookbook/${cookbookId}/recipes`,
        { recipeId },
        { headers }
      );
      onClose?.();
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

  // Group the two lists under separate section headers for clarity
  const menuItems = useMemo(() => [{ title: "My cookbooks", list: mine }, { title: "I can collaborate on", list: writable }], [mine, writable]);

  if (typeof window === "undefined") return null;

  // container styles differ on mobile (sheet) vs desktop (dropdown)
  const containerClass = isMobile
    ? "fixed inset-x-0 top-4 mx-4 z-50 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl"
    : "fixed z-50 w-72 rounded-xl bg-neutral-900/95 backdrop-blur border border-neutral-800 shadow-xl";

  const containerStyle = isMobile
    ? undefined
    : { top: ready ? coords.top : -9999, left: ready ? coords.left : -9999 };

  const stop = (e) => e.stopPropagation();

  const Item = ({ cb, idx }) => (
    <li role="none">
      <button
        role="menuitem"
        ref={idx === 0 ? firstItemRef : undefined}
        onClick={() => handleSave(cb.id)}
        disabled={savingId === cb.id}
        className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition outline-none focus:ring-2 focus:ring-teal-500/50 focus:bg-neutral-800/80 hover:bg-neutral-800/70 disabled:opacity-60 disabled:cursor-not-allowed ${
          savingId === cb.id ? "cursor-wait" : ""
        }`}
        onKeyDown={(e) => {
          const current = e.currentTarget;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            current.parentElement?.nextElementSibling?.querySelector("button")?.focus();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            current.parentElement?.previousElementSibling?.querySelector("button")?.focus();
          }
        }}
      >
        <span className="truncate block text-neutral-200">{cb.title}</span>
      </button>
    </li>
  );

  const Header = ({ children }) => (
    <div className="px-4 py-2 text-xs font-medium tracking-wide text-neutral-400 border-t border-neutral-800 first:border-t-0">
      {children}
    </div>
  );

  const List = ({ list }) => (
    list.length === 0 ? (
      <div className="px-4 py-3 text-sm text-neutral-400">None.</div>
    ) : (
      <ul role="menu" className="max-h-64 overflow-y-auto px-2 py-1 space-y-1">
        {list.map((cb, i) => (
          <Item cb={cb} key={cb.id} idx={i} />
        ))}
      </ul>
    )
  );

  const Skeleton = () => (
    <div className="p-3 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-8 rounded-lg bg-neutral-800 animate-pulse" />
      ))}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[49]" onMouseDown={onClose}>
      {/* container */}
      <div
        ref={dropdownRef}
        className={`${containerClass} ${ready || isMobile ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"} transition-opacity duration-150`}
        style={containerStyle}
        onMouseDown={stop}
      >
        {/* Title */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="text-sm font-semibold text-neutral-200">Save to Cookbook</div>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-900 font-medium shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <Plus size={14} /> New
            </button>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-2"><Skeleton /></div>
        ) : (
          <>
            {menuItems.map((m) => (
              <div key={m.title}>
                <Header>{m.title}</Header>
                <List list={m.list} />
              </div>
            ))}
          </>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-2 text-xs text-red-400 border-t border-neutral-800">{error}</div>
        )}

        {/* Saving footer indicator on mobile */}
        {savingId && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-300 border-t border-neutral-800">
            <Loader2 className="animate-spin" size={14} /> Saving…
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
