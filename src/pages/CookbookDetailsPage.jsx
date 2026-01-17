// src/pages/CookbookDetailsPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Info, GripVertical, ImagePlus, UserPlus, Check, Pencil, Trash2, X, Globe, Lock, Clock, CheckCircle, XCircle, PlusCircle, ChefHat, StickyNote, Save, Share2, Copy, Twitter, Facebook, Eye, Edit3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/fetchWithAuth";
import { API_BASE_URL } from "../utils/api";
import CookbookRecipeCard from "../components/ui/CookbookRecipeCard";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Button from "../components/ui/Button";
import { formatDate } from "../utils/formatDate";
import { logger } from "../utils/logger";

/* ---------------- Helpers ---------------- */
const getErrorText = (err, fallback = "Something went wrong.") => {
  try {
    if (typeof err === "string") return err;
    if (err?.message) return err.message;
    const d = err?.response?.data || err?.data;
    if (typeof d === "string") return d;
    if (d?.title) return d.title;
    if (d?.error) return d.error;
  } catch { /* ignore */ }
  return fallback;
};

const isGuid = (q) => /^[0-9a-fA-F-]{36}$/.test(q || "");

const moveIndex = (arr, from, to) => {
  if (from === to) return arr;
  const a = [...arr];
  const item = a.splice(from, 1)[0];
  a.splice(to, 0, item);
  return a;
};

/* ---------------- Small UI bits ---------------- */
const Chip = ({ children, tone = "neutral" }) => {
  const toneClass =
    tone === "success"
      ? "bg-platerly-green/10 text-platerly-green border-platerly-green/20"
      : tone === "danger"
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : "bg-platerly-light text-platerly-subtle border-platerly-border";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${toneClass}`}
    >
      {children}
    </span>
  );
};

const Section = ({ title, right, children }) => (
  <section className="mb-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
      <h2 className="text-lg sm:text-xl font-semibold text-platerly-text">{title}</h2>
      {right}
    </div>
    <div className="bg-platerly-card border border-platerly-border rounded-2xl p-4 sm:p-6">
      {children}
    </div>
  </section>
);

/* ---------------- Edit Cookbook Modal ---------------- */
const EditCookbookModal = ({ cookbook, isOpen, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    title: cookbook?.title || '',
    description: cookbook?.description || '',
    isPublic: cookbook?.isPublic || false
  });

  // Sync form when cookbook changes
  useEffect(() => {
    if (cookbook && isOpen) {
      setForm({
        title: cookbook.title || '',
        description: cookbook.description || '',
        isPublic: cookbook.isPublic || false
      });
    }
  }, [cookbook, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-platerly-card border border-platerly-border rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-platerly-border">
          <h2 className="text-xl font-semibold text-platerly-text">Edit Cookbook</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-platerly-light transition-colors text-platerly-subtle hover:text-platerly-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-platerly-text mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="My Cookbook"
              className="w-full px-4 py-2.5 rounded-xl bg-platerly-light border border-platerly-border text-platerly-text placeholder:text-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/50 focus:border-platerly-green transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-platerly-text mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="A collection of my favorite recipes..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-platerly-light border border-platerly-border text-platerly-text placeholder:text-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/50 focus:border-platerly-green transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-platerly-text mb-2">
              Visibility
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isPublic: false }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  !form.isPublic
                    ? 'border-platerly-green bg-platerly-green/10 text-platerly-green'
                    : 'border-platerly-border bg-platerly-light text-platerly-subtle hover:border-platerly-green/30'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span className="font-medium">Private</span>
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isPublic: true }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  form.isPublic
                    ? 'border-platerly-green bg-platerly-green/10 text-platerly-green'
                    : 'border-platerly-border bg-platerly-light text-platerly-subtle hover:border-platerly-green/30'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">Public</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-platerly-subtle">
              {form.isPublic
                ? 'Anyone can view this cookbook and its recipes.'
                : 'Only you and contributors can view this cookbook.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-platerly-subtle hover:text-platerly-text hover:bg-platerly-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-platerly-green text-platerly-dark hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-platerly-green/20"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- Page ---------------- */
const CookbookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading, user } = useAuth();

  const [cookbook, setCookbook] = useState(null);
  const [contributors, setContributors] = useState([]); // null => hide panel (non-owner / forbidden)
  const [pendingRequests, setPendingRequests] = useState([]);
  const [, setRequestsLoading] = useState(false);

  // Request to add recipe (non-owner, public cookbook)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [myRecipes, setMyRecipes] = useState([]);
  const [myRecipesLoading, setMyRecipesLoading] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Share state
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);

  // Edit/Delete state
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // contributor search state
  const [lookup, setLookup] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sOpen, setSOpen] = useState(false);
  const [sLoading, setSLoading] = useState(false);
  const [sError, setSError] = useState("");
  const [sIndex, setSIndex] = useState(-1);
  const selectedUserIdRef = useRef(null);
  const [newContributorRole, setNewContributorRole] = useState("Write");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [inlineMsg, setInlineMsg] = useState("");

  // reorder state (grid, drag & drop)
  const [recipes, setRecipes] = useState([]); // normalized from cookbook.items
  const [dragIndex, setDragIndex] = useState(-1);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const autosaveTimer = useRef(null);

  const fileInputRef = useRef(null);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const formWrapRef = useRef(null);
  const debounceRef = useRef(null);

  /* --------- API calls ---------- */
  const fetchCookbook = async (signal) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}`, {
        headers: authHeaders,
        signal,
      });
      if (res.status === 401) throw new Error("Unauthorized — please log in again.");
      if (res.status === 404) throw new Error("Cookbook not found.");
      if (!res.ok) throw new Error(`Unexpected error (${res.status}).`);
      const data = await res.json();
      setCookbook(data);
      return data;
    } catch (err) {
      if (err?.name === "AbortError") return;
      logger.error("fetchCookbook failed:", err);
      setError(err.message || "Failed to load cookbook.");
      throw err;
    }
  };

  const fetchContributors = async (signal) => {
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/Cookbook/${id}/contributors`,
        {
          headers: authHeaders,
          signal,
        }
      );
      if (res.status === 403) {
        setContributors(null); // hide if not owner
        return;
      }
      if (!res.ok)
        throw new Error(`Failed to load contributors (${res.status})`);
      const data = await res.json();
      setContributors(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.name === "AbortError") return;
      logger.warn("fetchContributors failed, hiding panel:", err);
      setContributors(null);
    }
  };

  const fetchPendingRequests = async (signal) => {
    setRequestsLoading(true);
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/Cookbook/${id}/requests?status=Pending`,
        {
          headers: authHeaders,
          signal,
        }
      );
      if (res.status === 403) {
        setPendingRequests([]);
        return;
      }
      if (!res.ok)
        throw new Error(`Failed to load requests (${res.status})`);
      const data = await res.json();
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.name === "AbortError") return;
      logger.warn("fetchPendingRequests failed:", err);
      setPendingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const approveRequest = async (requestId) => {
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/Cookbook/${id}/requests/${requestId}/approve`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );
      if (!res.ok) throw new Error("Failed to approve request.");
      // Refresh both requests and cookbook data
      await fetchPendingRequests();
      const data = await fetchCookbook();
      const normalized = (data?.items || []).map((r) => ({
        id: r.recipeId ?? r.id,
        title: r.title,
        imageUrl: r.imageUrl,
        description: r.description,
        addedByUsername: r.addedByUsername,
        addedAt: r.addedAt,
        note: r.note,
      }));
      setRecipes(normalized);
      setInlineMsg("Request approved! Recipe added to cookbook.");
      setTimeout(() => setInlineMsg(""), 2500);
    } catch (err) {
      setInlineMsg(getErrorText(err, "Failed to approve request."));
      setTimeout(() => setInlineMsg(""), 3000);
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/Cookbook/${id}/requests/${requestId}/reject`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );
      if (!res.ok) throw new Error("Failed to reject request.");
      await fetchPendingRequests();
      setInlineMsg("Request declined.");
      setTimeout(() => setInlineMsg(""), 2500);
    } catch (err) {
      setInlineMsg(getErrorText(err, "Failed to reject request."));
      setTimeout(() => setInlineMsg(""), 3000);
    }
  };

  const fetchMyRecipes = async () => {
    if (!user?.id) return;
    setMyRecipesLoading(true);
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/Recipe/user/${user.id}?page=1&pageSize=50`,
        { headers: authHeaders }
      );
      if (!res.ok) throw new Error("Failed to load your recipes.");
      const data = await res.json();
      const items = Array.isArray(data.recipes) ? data.recipes : Array.isArray(data) ? data : [];
      // Filter out recipes already in this cookbook
      const existingRecipeIds = new Set((cookbook?.items || []).map(r => r.recipeId ?? r.id));
      const filtered = items.filter(r => !existingRecipeIds.has(r.id));
      setMyRecipes(filtered);
    } catch (err) {
      logger.error("fetchMyRecipes failed:", err);
      setMyRecipes([]);
    } finally {
      setMyRecipesLoading(false);
    }
  };

  const openRequestModal = async () => {
    setShowRequestModal(true);
    setSelectedRecipeId(null);
    setRequestMessage("");
    await fetchMyRecipes();
  };

  const submitContributionRequest = async () => {
    if (!selectedRecipeId) return;
    setSubmittingRequest(true);
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/Cookbook/${id}/requests`,
        {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeId: selectedRecipeId,
            message: requestMessage.trim() || null,
          }),
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to submit request.");
      }
      setShowRequestModal(false);
      setSelectedRecipeId(null);
      setRequestMessage("");
      setInlineMsg("Request sent! The cookbook owner will review it.");
      setTimeout(() => setInlineMsg(""), 3000);
    } catch (err) {
      setInlineMsg(getErrorText(err, "Failed to submit request."));
      setTimeout(() => setInlineMsg(""), 3000);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const startEditingNote = (recipeId, currentNote) => {
    setEditingNoteId(recipeId);
    setEditingNoteText(currentNote || "");
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
  };

  const saveNote = async (recipeId) => {
    setSavingNote(true);
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/Cookbook/${id}/recipes/${recipeId}/note`,
        {
          method: "PUT",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ note: editingNoteText.trim() || null }),
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to save note.");
      }
      // Update local state
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId ? { ...r, note: editingNoteText.trim() || null } : r
        )
      );
      setEditingNoteId(null);
      setEditingNoteText("");
      setInlineMsg("Note saved.");
      setTimeout(() => setInlineMsg(""), 2000);
    } catch (err) {
      setInlineMsg(getErrorText(err, "Failed to save note."));
      setTimeout(() => setInlineMsg(""), 3000);
    } finally {
      setSavingNote(false);
    }
  };

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    // Use /api/share/ so social media crawlers get OG meta tags
    return `${window.location.origin}/api/share/cookbook/${id}`;
  };

  const copyShareLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setInlineMsg("Link copied to clipboard!");
      setTimeout(() => setInlineMsg(""), 2000);
    } catch {
      setInlineMsg("Failed to copy link.");
      setTimeout(() => setInlineMsg(""), 2000);
    }
    setShowShareMenu(false);
  };

  const shareToTwitter = () => {
    const url = getShareUrl();
    const text = encodeURIComponent(`Check out this cookbook: ${cookbook?.title || "Cookbook"}`);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    const url = getShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToPinterest = () => {
    const url = getShareUrl();
    const description = encodeURIComponent(cookbook?.title || "Cookbook");
    const media = encodeURIComponent(cookbook?.coverImageUrl || "");
    window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${media}&description=${description}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToReddit = () => {
    const url = getShareUrl();
    const title = encodeURIComponent(`Check out this cookbook: ${cookbook?.title || "Cookbook"}`);
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${title}`, "_blank");
    setShowShareMenu(false);
  };

  const searchUsers = async (q, signal) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setSOpen(false);
      setSError("");
      return;
    }
    setSLoading(true);
    setSError("");
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/User/search?q=${encodeURIComponent(q.trim())}`,
        {
          headers: authHeaders,
          signal,
        }
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const list = await res.json();

      let norm = (Array.isArray(list) ? list : []).map((u) => ({
        id: u.id,
        username: u.username || u.userName || "",
        displayName: u.displayName || u.fullName || u.username || "User",
        avatarUrl: u.avatarUrl || u.profileImageUrl || "",
      }));

      const existingIds = new Set(
        (Array.isArray(contributors) ? contributors : []).map((c) => c.userId)
      );
      norm = norm.filter(
        (u) => u.id && u.id !== user?.id && !existingIds.has(u.id)
      );

      setSuggestions(norm);
      setSOpen(true);
      setSIndex(norm.length ? 0 : -1);
    } catch (err) {
      if (err?.name === "AbortError") return;
      logger.error("User search error:", err);
      setSError(getErrorText(err, "Search failed."));
      setSuggestions([]);
      setSOpen(true);
      setSIndex(-1);
    } finally {
      setSLoading(false);
    }
  };

  const findUserId = async (q) => {
    const text = q?.trim();
    if (!text) throw new Error("Enter a username or user ID.");
    if (isGuid(text)) {
      if (text === user?.id) throw new Error("You can't add yourself.");
      const exists = (Array.isArray(contributors) ? contributors : []).some(
        (c) => c.userId === text
      );
      if (exists) throw new Error("User is already a contributor.");
      return text;
    }

    const res = await apiFetch(
      `${API_BASE_URL}/api/User/search?q=${encodeURIComponent(text)}`,
      {
        headers: authHeaders,
      }
    );
    if (!res.ok) throw new Error("Search failed.");
    const list = await res.json();

    const existingIds = new Set(
      (Array.isArray(contributors) ? contributors : []).map((c) => c.userId)
    );
    const match = (Array.isArray(list) ? list : []).find(
      (u) => u?.id && u.id !== user?.id && !existingIds.has(u.id)
    );

    if (!match?.id) throw new Error("No other users found with that name.");
    return match.id;
  };

  const addContributorById = async (userId, role = "Write") => {
    const res = await apiFetch(
      `${API_BASE_URL}/api/Cookbook/${id}/contributors`,
      {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      }
    );

    if (!res.ok) {
      let msg = "Failed to add contributor.";
      if (res.status === 400 || res.status === 403) {
        try {
          const text = await res.text();
          if (text) msg = text;
        } catch { /* ignore */ }
      }
      throw new Error(msg);
    }
  };

  const updateContributorRole = async (userId, newRole) => {
    const res = await apiFetch(
      `${API_BASE_URL}/api/Cookbook/${id}/contributors/${userId}/role`,
      {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      }
    );
    if (!res.ok) throw new Error("Failed to update role.");
    await fetchContributors();
    setInlineMsg(`Role updated to ${newRole}.`);
    setTimeout(() => setInlineMsg(""), 2000);
  };

  /* --------- Edit/Delete Cookbook ---------- */
  const handleSaveCookbook = async (formData) => {
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          isPublic: formData.isPublic,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to update cookbook.");
      }

      // Update local state
      setCookbook((prev) => ({
        ...prev,
        title: formData.title,
        description: formData.description,
        isPublic: formData.isPublic,
      }));

      setEditOpen(false);
      setInlineMsg("Cookbook updated.");
      setTimeout(() => setInlineMsg(""), 2500);
    } catch (err) {
      logger.error("Update cookbook failed:", err);
      setInlineMsg(getErrorText(err, "Failed to update cookbook."));
      setTimeout(() => setInlineMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCookbook = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to delete cookbook.");
      }

      // Navigate back to cookbooks list
      navigate("/cookbooks", { replace: true });
    } catch (err) {
      logger.error("Delete cookbook failed:", err);
      setInlineMsg(getErrorText(err, "Failed to delete cookbook."));
      setTimeout(() => setInlineMsg(""), 3000);
    } finally {
      setDeleting(false);
    }
  };

  /* --------- Effects ---------- */
  useEffect(() => {
    if (authLoading) return;
    const ac = new AbortController();
    const { signal } = ac;

    setLoading(true);
    setError("");
    setInlineMsg("");

    (async () => {
      try {
        const data = await fetchCookbook(signal);
        await fetchContributors(signal);
        await fetchPendingRequests(signal);

        // normalize items for reorder list
        const normalized = (data?.items || []).map((r) => ({
          id: r.recipeId ?? r.id,
          title: r.title,
          imageUrl: r.imageUrl,
          description: r.description,
          addedByUsername: r.addedByUsername,
          addedAt: r.addedAt,
          note: r.note,
        }));
        setRecipes(normalized);
        setOrderDirty(false);
      } catch (e) {
        if (e?.name === "AbortError" || e?.name === "CanceledError") return;
        logger.error("Cookbook load error:", e);
        setError(getErrorText(e, "Failed to load cookbook."));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, authLoading]);

  // Debounce user search on lookup changes
  useEffect(() => {
    if (!contributors) return; // non-owner: no panel
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = lookup;
    debounceRef.current = setTimeout(() => {
      const ac = new AbortController();
      searchUsers(q, ac.signal);
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup]);

  // Close suggestions on outside click
  useEffect(() => {
    const onDocDown = (e) => {
      if (!formWrapRef.current) return;
      if (!formWrapRef.current.contains(e.target)) {
        setSOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  // Close share menu on outside click
  useEffect(() => {
    const onDocDown = (e) => {
      if (!shareMenuRef.current) return;
      if (!shareMenuRef.current.contains(e.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  /* --------- Cover upload ---------- */
  const onPickCover = () => fileInputRef.current?.click();

  const onCoverSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${id}/cover`, {
        method: "PUT",
        headers: authHeaders,
        body: form,
      });
      if (!res.ok) {
        throw new Error(
          res.status === 403
            ? "Only the owner can change the cover."
            : "Failed to upload cover."
        );
      }
      const data = await res.json();
      setCookbook((prev) => ({ ...prev, coverImageUrl: data.coverUrl }));
      setInlineMsg("Cover updated.");
    } catch (err) {
      setInlineMsg(getErrorText(err));
      logger.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
      setTimeout(() => setInlineMsg(""), 2500);
    }
  };

  /* --------- Contributors CRUD ---------- */
  const onPickSuggestion = (userRow) => {
    selectedUserIdRef.current = userRow.id;
    setLookup(userRow.username || userRow.displayName || userRow.id);
    setSOpen(false);
  };

  const addContributor = async (e) => {
    e.preventDefault();
    if (!lookup.trim()) return;
    setAdding(true);
    try {
      const userId = selectedUserIdRef.current
        ? selectedUserIdRef.current
        : await findUserId(lookup);

      await addContributorById(userId, newContributorRole);

      selectedUserIdRef.current = null;
      setLookup("");
      setSuggestions([]);
      setSOpen(false);
      setNewContributorRole("Write");

      await fetchContributors();
      setInlineMsg("Contributor added.");
    } catch (err) {
      setInlineMsg(getErrorText(err, "Failed to add contributor."));
      logger.error(err);
    } finally {
      setAdding(false);
      setTimeout(() => setInlineMsg(""), 2500);
    }
  };

  const removeContributor = async (userId) => {
    const res = await apiFetch(
      `${API_BASE_URL}/api/Cookbook/${id}/contributors/${userId}`,
      {
        method: "DELETE",
        headers: authHeaders,
      }
    );
    if (!res.ok) throw new Error("Failed to remove contributor.");
    await fetchContributors();
  };

  /* --------- Item removal (local state reaction) ---------- */
  const handleRecipeRemove = (recipeId) => {
    setCookbook((prev) => {
      const next = { ...(prev || {}) };
      next.items = (prev?.items || []).filter(
        (r) => (r.recipeId ?? r.id) !== recipeId
      );
      return next;
    });
    setRecipes((prev) => {
      const n = (prev || []).filter((x) => x.id !== recipeId);
      setOrderDirty(true);
      scheduleAutoSave(n);
      return n;
    });
  };

  /* --------- Drag & Drop ---------- */
  const isOwner = useMemo(() => Array.isArray(contributors), [contributors]);

  const onDragStart = (idx) => () => {
    setDragIndex(idx);
  };

  const onDragOver = (e, overIdx) => {
    e.preventDefault(); // allow drop
    if (dragIndex === -1 || overIdx === dragIndex) return;
    setRecipes((prev) => moveIndex(prev, dragIndex, overIdx));
    setDragIndex(overIdx);
    setOrderDirty(true);
  };

  const onDragEnd = () => {
    setDragIndex(-1);
    if (orderDirty) scheduleAutoSave();
  };

  const scheduleAutoSave = (overrideList) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveOrder(overrideList);
    }, 700); // debounce
  };

  const saveOrder = async (overrideList) => {
    if (savingOrder || !isOwner) return;
    const list = overrideList || recipes;
    if (!list || list.length < 1) return;

    setSavingOrder(true);
    try {
      // ✅ Match backend signature: PUT /recipes/order with { items: [{recipeId, sortOrder}] }
      const items = list.map((r, i) => ({ recipeId: r.id, sortOrder: i }));

      const res = await apiFetch(
        `${API_BASE_URL}/api/Cookbook/${id}/recipes/order`,
        {
          method: "PUT",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to save order (${res.status})`);
      }

      // reflect new order into cookbook.items
      setCookbook((prev) => {
        if (!prev?.items) return prev;
        const byId = new Map(prev.items.map((it) => [String(it.recipeId ?? it.id), it]));
        const reordered = list
          .map((r, i) => {
            const it = byId.get(String(r.id));
            return it ? { ...it, sortOrder: i } : null;
          })
          .filter(Boolean);
        return { ...prev, items: reordered };
      });

      setOrderDirty(false);
      setInlineMsg("Order saved.");
      setTimeout(() => setInlineMsg(""), 2000);
    } catch (err) {
      setInlineMsg(getErrorText(err, "Failed to save order."));
      logger.error(err);
      setTimeout(() => setInlineMsg(""), 3000);
    } finally {
      setSavingOrder(false);
    }
  };

  /* --------- Render ---------- */
  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 text-platerly-text">
        <div className="animate-pulse space-y-4">
          <div className="h-40 sm:h-56 w-full rounded-2xl bg-platerly-light" />
          <div className="h-6 w-1/2 rounded-lg bg-platerly-light" />
          <div className="h-4 w-1/3 rounded-lg bg-platerly-light" />
          <div className="h-24 w-full rounded-2xl bg-platerly-card" />
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-red-400">
        {error}
      </div>
    );
  if (!cookbook)
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-red-400">
        Cookbook not found.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-platerly-text">
      {/* Header with cover */}
      <div className="mb-8">
        <div className="w-full max-w-4xl aspect-[16/9] sm:aspect-[7/3] bg-platerly-card rounded-2xl overflow-hidden border border-platerly-border mx-auto relative group">
          {cookbook.coverImageUrl ? (
            <img
              src={cookbook.coverImageUrl}
              alt={`${cookbook.title} cover`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-platerly-subtle gap-3">
              <ImagePlus className="w-12 h-12 opacity-50" />
              <span>No cover image yet</span>
            </div>
          )}

          {/* Accent color overlay stripe */}
          {cookbook.accentColor && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: cookbook.accentColor }}
            />
          )}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate text-platerly-text">
              {cookbook.title}
            </h1>
            {cookbook.description && (
              <p className="mt-1 text-platerly-subtle line-clamp-2">{cookbook.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-platerly-subtle">
              <Chip tone={cookbook.isPublic ? "success" : "neutral"}>
                {cookbook.isPublic ? "Public" : "Private"}
              </Chip>
              <span className="text-platerly-border" aria-hidden>•</span>
              <span>Created {formatDate(cookbook.createdAt)}</span>
              {inlineMsg && (
                <>
                  <span className="text-platerly-border" aria-hidden>•</span>
                  <span className="inline-flex items-center gap-1.5 text-platerly-green text-sm font-medium">
                    <Check className="w-4 h-4" />
                    {inlineMsg}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button
                onClick={() => setEditOpen(true)}
                variant="secondary"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
              <Button
                onClick={onPickCover}
                loading={uploading}
                variant="secondary"
              >
                <ImagePlus className="w-4 h-4" />
                {uploading ? "Uploading…" : "Cover"}
              </Button>
              <ConfirmDialog
                title="Delete this cookbook?"
                description="This action cannot be undone. All recipes will be removed from this cookbook (the original recipes will not be deleted)."
                confirmLabel={deleting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
                tone="danger"
                onConfirm={handleDeleteCookbook}
                trigger={
                  <Button variant="danger" disabled={deleting}>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                }
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={onCoverSelected}
                className="hidden"
              />
            </div>
          )}

          {/* Non-owner action for public cookbooks */}
          {!isOwner && cookbook.isPublic && user && (
            <div className="sm:ml-auto flex items-center gap-2">
              <Button onClick={openRequestModal} variant="secondary">
                <PlusCircle className="w-4 h-4" />
                Request to Add Recipe
              </Button>
            </div>
          )}

          {/* Share button (for public cookbooks) */}
          {cookbook.isPublic && (
            <div className="relative" ref={shareMenuRef}>
              <Button
                onClick={() => setShowShareMenu(!showShareMenu)}
                variant="secondary"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>

              {/* Share dropdown */}
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-platerly-border bg-platerly-card shadow-xl z-30">
                  <button
                    onClick={copyShareLink}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-platerly-text hover:bg-platerly-light transition-colors rounded-t-xl"
                  >
                    <Copy className="w-4 h-4 text-platerly-subtle" />
                    Copy Link
                  </button>
                  <button
                    onClick={shareToTwitter}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-platerly-text hover:bg-platerly-light transition-colors"
                  >
                    <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                    Share on X
                  </button>
                  <button
                    onClick={shareToFacebook}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-platerly-text hover:bg-platerly-light transition-colors"
                  >
                    <Facebook className="w-4 h-4 text-[#4267B2]" />
                    Share on Facebook
                  </button>
                  <button
                    onClick={shareToPinterest}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-platerly-text hover:bg-platerly-light transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#E60023]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.43l1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.91 2.17-2.91 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-.99 3.99-.28 1.19.6 2.16 1.77 2.16 2.13 0 3.76-2.24 3.76-5.48 0-2.87-2.06-4.87-5-4.87-3.4 0-5.4 2.55-5.4 5.19 0 1.03.39 2.13.89 2.73.1.12.11.22.08.34l-.33 1.34c-.05.21-.18.26-.4.16-1.5-.7-2.44-2.88-2.44-4.64 0-3.78 2.75-7.25 7.92-7.25 4.16 0 7.4 2.97 7.4 6.93 0 4.13-2.6 7.46-6.22 7.46-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z"/>
                    </svg>
                    Share on Pinterest
                  </button>
                  <button
                    onClick={shareToReddit}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-platerly-text hover:bg-platerly-light transition-colors rounded-b-xl"
                  >
                    <svg className="w-4 h-4 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                    Share on Reddit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contributors panel (only if owner) */}
      {isOwner && (
        <Section title="Contributors">
          {contributors.length === 0 ? (
            <div className="flex items-center gap-3 text-platerly-subtle py-2 mb-4">
              <UserPlus className="w-5 h-5 opacity-60" />
              <span>No contributors yet. Invite someone to collaborate.</span>
            </div>
          ) : (
            <ul className="mb-4 divide-y divide-platerly-border">
              {contributors.map((c) => (
                <li
                  key={c.userId}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-platerly-light border border-platerly-border flex items-center justify-center text-sm font-medium text-platerly-text">
                      {(c.displayName || "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate text-platerly-text">
                        {c.displayName || c.userId}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <button
                          type="button"
                          onClick={() => updateContributorRole(c.userId, c.role === "Write" ? "Read" : "Write")}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            c.role === "Write"
                              ? "bg-platerly-green/10 text-platerly-green hover:bg-platerly-green/20"
                              : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          }`}
                          title={`Click to change to ${c.role === "Write" ? "Read" : "Write"}`}
                        >
                          {c.role === "Write" ? (
                            <><Edit3 className="w-3 h-3" /> Can edit</>
                          ) : (
                            <><Eye className="w-3 h-3" /> View only</>
                          )}
                        </button>
                        <span className="text-xs text-platerly-muted">
                          Added {formatDate(c.addedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ConfirmDialog
                    title="Remove contributor?"
                    description={`This will revoke ${
                      c.displayName || "this user"
                    }'s access to this cookbook.`}
                    confirmLabel="Remove"
                    cancelLabel="Cancel"
                    tone="danger"
                    onConfirm={async () => {
                      try {
                        await removeContributor(c.userId);
                        setInlineMsg("Contributor removed.");
                      } catch (err) {
                        setInlineMsg(
                          getErrorText(err, "Failed to remove contributor.")
                        );
                      } finally {
                        setTimeout(() => setInlineMsg(""), 2500);
                      }
                    }}
                    trigger={
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="ml-3"
                      >
                        Remove
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Add contributor with autocomplete */}
          <form
            onSubmit={addContributor}
            className="relative"
            aria-label="Add contributor"
            ref={formWrapRef}
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="search"
                name="contrib-search"
                id={`contrib-search-${id}`}
                value={lookup}
                onChange={(e) => {
                  selectedUserIdRef.current = null;
                  setLookup(e.target.value);
                  setSOpen(true);
                }}
                onKeyDown={(e) => {
                  if (!sOpen || !suggestions.length) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSIndex((i) => (i + 1) % suggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSIndex(
                      (i) => (i - 1 + suggestions.length) % suggestions.length
                    );
                  } else if (e.key === "Enter") {
                    if (sIndex >= 0) {
                      e.preventDefault();
                      onPickSuggestion(suggestions[sIndex]);
                    }
                  } else if (e.key === "Escape") {
                    setSOpen(false);
                  }
                }}
                placeholder="Type a username or paste userId"
                className="flex-1 px-4 py-2.5 rounded-xl bg-platerly-light border border-platerly-border text-platerly-text placeholder:text-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/50 focus:border-platerly-green transition min-h-[44px]"
                aria-label="Contributor username or user ID"
                aria-autocomplete="list"
                aria-expanded={sOpen}
                aria-controls="contrib-suggestions"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                inputMode="text"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore="true"
                data-form-type="other"
              />
              <div className="flex gap-1 p-1 rounded-xl bg-platerly-light border border-platerly-border">
                <button
                  type="button"
                  onClick={() => setNewContributorRole("Write")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    newContributorRole === "Write"
                      ? "bg-platerly-green text-platerly-dark"
                      : "text-platerly-subtle hover:text-platerly-text hover:bg-platerly-card"
                  }`}
                  title="Can add, edit, and remove recipes"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setNewContributorRole("Read")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    newContributorRole === "Read"
                      ? "bg-amber-500 text-platerly-dark"
                      : "text-platerly-subtle hover:text-platerly-text hover:bg-platerly-card"
                  }`}
                  title="Can only view the cookbook"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>
              </div>
              <Button
                type="submit"
                disabled={!lookup.trim()}
                loading={adding}
              >
                <UserPlus className="w-4 h-4" />
                {adding ? "Adding…" : "Add"}
              </Button>
            </div>

            {/* Suggestions popover */}
            {sOpen && (
              <div
                id="contrib-suggestions"
                role="listbox"
                className="absolute z-20 mt-2 w-full sm:w-[60%] max-h-72 overflow-auto rounded-xl border border-platerly-border bg-platerly-card/95 backdrop-blur shadow-xl"
              >
                {sLoading ? (
                  <div className="px-4 py-3 text-sm text-platerly-subtle">
                    Searching…
                  </div>
                ) : sError ? (
                  <div className="px-4 py-3 text-sm text-red-400">
                    {sError}
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-platerly-subtle">
                    No matches found.
                  </div>
                ) : (
                  suggestions.map((u, i) => (
                    <div
                      key={u.id}
                      role="option"
                      aria-selected={i === sIndex}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onPickSuggestion(u)}
                      className={[
                        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                        i === sIndex
                          ? "bg-platerly-light"
                          : "hover:bg-platerly-light/50",
                      ].join(" ")}
                    >
                      <img
                        src={
                          u.avatarUrl ||
                          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                        }
                        alt=""
                        className="h-9 w-9 rounded-full border border-platerly-border object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "";
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate text-platerly-text">
                          {u.displayName}
                        </div>
                        <div className="text-xs text-platerly-subtle truncate">
                          @{u.username || "user"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs px-3 py-1.5 rounded-lg bg-platerly-green hover:bg-platerly-green/90 text-platerly-dark font-medium transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await addContributorById(u.id, newContributorRole);
                            selectedUserIdRef.current = null;
                            setLookup("");
                            setSuggestions([]);
                            setSOpen(false);
                            setNewContributorRole("Write");
                            await fetchContributors();
                            setInlineMsg("Contributor added.");
                            setTimeout(() => setInlineMsg(""), 2000);
                          } catch (err) {
                            setInlineMsg(
                              getErrorText(err, "Failed to add contributor.")
                            );
                            setTimeout(() => setInlineMsg(""), 2500);
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </form>
        </Section>
      )}

      {/* Pending Contribution Requests (only if owner and has requests) */}
      {isOwner && pendingRequests.length > 0 && (
        <Section
          title={`Pending Requests (${pendingRequests.length})`}
          right={
            <div className="flex items-center gap-2 text-xs text-platerly-subtle">
              <Clock className="w-4 h-4" />
              Awaiting your review
            </div>
          }
        >
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-platerly-light/50 border border-platerly-border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-platerly-subtle">Recipe:</span>
                    <a
                      href={`/recipe/${req.recipeId}`}
                      className="font-medium text-platerly-green hover:underline truncate"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Recipe
                    </a>
                  </div>
                  {req.message && (
                    <p className="mt-1.5 text-sm text-platerly-subtle italic">
                      "{req.message}"
                    </p>
                  )}
                  <div className="mt-2 text-xs text-platerly-muted">
                    Requested {formatDate(req.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveRequest(req.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-platerly-green text-platerly-dark text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recipes grid with Drag & Drop (owner-only handles) */}
      <Section
        title={`Recipes (${recipes.length})`}
        right={
          isOwner ? (
            <div className="text-xs text-platerly-subtle">
              {savingOrder
                ? "Saving…"
                : orderDirty
                ? "Reordered – saving shortly"
                : "Drag the handle to reorder"}
            </div>
          ) : null
        }
      >
        {recipes.length === 0 ? (
          <p className="text-platerly-subtle">No recipes saved in this cookbook yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((r, idx) => (
              <div
                key={r.id}
                className={[
                  "group relative rounded-2xl border border-platerly-border bg-platerly-card overflow-hidden transition-all",
                  dragIndex === idx ? "opacity-80 ring-2 ring-platerly-green/40 scale-[1.02]" : "",
                ].join(" ")}
                draggable={isOwner}
                onDragStart={isOwner ? onDragStart(idx) : undefined}
                onDragOver={isOwner ? (e) => onDragOver(e, idx) : undefined}
                onDragEnd={isOwner ? onDragEnd : undefined}
              >
                {/* Drag handle (owner only) */}
                {isOwner && (
                  <div
                    className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-platerly-border bg-platerly-card/90 backdrop-blur text-xs text-platerly-subtle cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                    #{idx + 1}
                  </div>
                )}

                {/* Use your existing card inside for consistent visuals */}
                <CookbookRecipeCard
                  recipe={{
                    id: r.id,
                    title: r.title,
                    description: r.description,
                    imageUrl: r.imageUrl,
                  }}
                  cookbookId={cookbook.id}
                  onRemove={handleRecipeRemove}
                />

                {/* Attribution badge */}
                {r.addedByUsername && (
                  <div className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-platerly-green">@{r.addedByUsername}</span>
                    <span className="text-white/60">added</span>
                  </div>
                )}

                {/* Note display/edit */}
                {editingNoteId === r.id ? (
                  <div className="absolute inset-x-0 bottom-0 z-20 p-3 bg-platerly-card/95 backdrop-blur border-t border-platerly-border">
                    <textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      placeholder="Add a personal note for this recipe..."
                      className="w-full px-3 py-2 rounded-lg bg-platerly-light border border-platerly-border text-sm text-platerly-text placeholder:text-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/50 resize-none"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={cancelEditingNote}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-platerly-subtle hover:text-platerly-text hover:bg-platerly-light transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveNote(r.id)}
                        disabled={savingNote}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-platerly-green text-platerly-dark hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        {savingNote ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : r.note ? (
                  <div
                    className="absolute inset-x-0 bottom-0 z-10 p-2.5 bg-gradient-to-t from-platerly-dark/90 via-platerly-dark/70 to-transparent cursor-pointer"
                    onClick={(e) => {
                      if (isOwner) {
                        e.stopPropagation();
                        startEditingNote(r.id, r.note);
                      }
                    }}
                    title={isOwner ? "Click to edit note" : undefined}
                  >
                    <div className="flex items-start gap-2">
                      <StickyNote className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/90 line-clamp-2">{r.note}</p>
                    </div>
                  </div>
                ) : isOwner ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingNote(r.id, "");
                    }}
                    className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur text-xs text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <StickyNote className="w-3 h-3" />
                    Add note
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Edit Cookbook Modal */}
      <EditCookbookModal
        cookbook={cookbook}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveCookbook}
        saving={saving}
      />

      {/* Request to Add Recipe Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRequestModal(false)}
          />
          <div className="relative bg-platerly-card border border-platerly-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-platerly-border">
              <h2 className="text-xl font-semibold text-platerly-text">Request to Add Recipe</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 rounded-lg hover:bg-platerly-light transition-colors text-platerly-subtle hover:text-platerly-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-sm text-platerly-subtle mb-4">
                Select one of your recipes to request adding it to "{cookbook.title}". The cookbook owner will review your request.
              </p>

              {myRecipesLoading ? (
                <div className="py-8 text-center text-platerly-subtle">Loading your recipes...</div>
              ) : myRecipes.length === 0 ? (
                <div className="py-8 text-center">
                  <ChefHat className="w-12 h-12 text-platerly-muted mx-auto mb-3" />
                  <p className="text-platerly-subtle">
                    You don't have any recipes to add, or all your recipes are already in this cookbook.
                  </p>
                  <Link
                    to="/create"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-platerly-green text-platerly-dark rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create a Recipe
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {myRecipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => setSelectedRecipeId(recipe.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                          selectedRecipeId === recipe.id
                            ? 'border-platerly-green bg-platerly-green/10'
                            : 'border-platerly-border bg-platerly-light/50 hover:border-platerly-green/30'
                        }`}
                      >
                        {recipe.imageUrl ? (
                          <img
                            src={recipe.imageUrl}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-platerly-light flex items-center justify-center flex-shrink-0">
                            <ChefHat className="w-6 h-6 text-platerly-muted" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-platerly-text truncate">{recipe.title}</div>
                          {recipe.description && (
                            <div className="text-xs text-platerly-subtle truncate mt-0.5">{recipe.description}</div>
                          )}
                        </div>
                        {selectedRecipeId === recipe.id && (
                          <CheckCircle className="w-5 h-5 text-platerly-green flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-platerly-text mb-1.5">
                      Message (optional)
                    </label>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Why should this recipe be in this cookbook?"
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl bg-platerly-light border border-platerly-border text-platerly-text placeholder:text-platerly-subtle focus:outline-none focus:ring-2 focus:ring-platerly-green/50 focus:border-platerly-green transition resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {myRecipes.length > 0 && (
              <div className="flex justify-end gap-3 p-5 border-t border-platerly-border">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  disabled={submittingRequest}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-platerly-subtle hover:text-platerly-text hover:bg-platerly-light transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitContributionRequest}
                  disabled={!selectedRecipeId || submittingRequest}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-platerly-green text-platerly-dark hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-platerly-green/20"
                >
                  {submittingRequest ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CookbookDetailsPage;
