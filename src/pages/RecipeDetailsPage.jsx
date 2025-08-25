import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SaveToCookbookSection from '../pages/SaveToCookbookSection'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import {
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  BookmarkPlus,
} from 'lucide-react'

const DIFFICULTY_MAP = { 0: 'Easy', 1: 'Medium', 2: 'Hard' }

function fmtMinutes(mins) {
  if (mins === null || mins === undefined) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr`
  return `${m} min`
}

function coerceTags(v) {
  if (!v) return []
  return Array.isArray(v)
    ? v
    : String(v).split(',').map(t => t.trim()).filter(Boolean)
}

function toMinutes(v) {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = parseInt(String(v), 10)
  return Number.isNaN(n) ? 0 : n
}

/** Lightweight confirm modal (no external UI lib needed) */
function ConfirmModal({ open, title = 'Are you sure?', description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:w-[420px] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl mx-3 mb-3 sm:mx-0 sm:mb-0">
        <div className="px-5 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && <p className="mt-1.5 text-sm text-neutral-300">{description}</p>}
          <div className="mt-5 flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-md text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const RecipeDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [recipe, setRecipe] = useState(null)
  const [remixMeta, setRemixMeta] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [userAllergies, setUserAllergies] = useState([])
  const [matchingAllergens, setMatchingAllergens] = useState([])

  // UI state
  const [menuOpen, setMenuOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const menuRef = useRef(null)

  // Close kebab menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  // Fetch recipe & comments
useEffect(() => {
  const recipeCtl = new AbortController();
  const commentsCtl = new AbortController();

  const fetchRecipe = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: recipeCtl.signal,
      });
      if (!res.ok) throw new Error('Failed to fetch recipe');
      const data = await res.json();
      setRecipe(data.recipe);
      setRemixMeta(data.remixMeta ?? null);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: commentsCtl.signal,
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  };

  fetchRecipe();
  fetchComments();

  return () => {
    recipeCtl.abort();
    commentsCtl.abort();
  };
}, [id, token]);

// Fetch allergy list
useEffect(() => {
  if (!token) return;
  const ctl = new AbortController();

  const fetchAllergies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Allergy/my-allergies`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctl.signal,
      });
      if (!res.ok) return;
      const allergyData = await res.json();
      const lowerAllergies = allergyData.map((a) => a.toLowerCase());
      setUserAllergies(lowerAllergies);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error loading allergies:', err);
      }
    }
  };

  fetchAllergies();
  return () => ctl.abort();
}, [token]);


  // Compare recipe ingredients to allergies
  useEffect(() => {
    if (!recipe || !userAllergies.length) return

    const matched = (recipe.ingredients || [])
      .map(i => i.name?.toLowerCase())
      .filter(name => !!name && userAllergies.includes(name))

    setMatchingAllergens(matched)
  }, [recipe, userAllergies])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: id,
          content: newComment,
        }),
      })

      if (!res.ok) throw new Error('Failed to post comment')
      setNewComment('')

      const refreshed = await fetch(`${API_BASE_URL}/api/Recipe/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const updated = await refreshed.json()
      setComments(updated)
      setCommentsOpen(true) // open comments after posting
    } catch (err) {
      console.error(err)
    }
  }

  // Ownership check (hide edit/delete if we can't determine)
  const isOwner = useMemo(() => {
    if (!user?.username || !recipe?.authorUsername) return false
    return String(user.username).toLowerCase() === String(recipe.authorUsername).toLowerCase()
  }, [user?.username, recipe?.authorUsername])

  // Actions
  const goEdit = () => navigate(`/edit-recipe/${id}`)
  const goRemix = () => navigate(`/remix/${id}`)

  const doDelete = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/Recipe/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    // Treat 2xx (incl. 204) as success — do NOT parse body
    if (res.status === 204 || (res.ok && res.status >= 200 && res.status < 300)) {
      // Hard redirect to the feed to avoid SPA guards/interceptors sending you to /login
      window.location.assign('/'); // if your feed is a different route, put it here
      return;
    }

    if (res.status === 401 || res.status === 403) {
      // Respect real auth failures
      window.location.assign('/login');
      return;
    }

    // Try to read any server message without breaking on empty bodies
    let msg = '';
    try { msg = await res.text(); } catch {}
    throw new Error(`Delete failed (${res.status})${msg ? `: ${msg}` : ''}`);
  } catch (e) {
    console.error('Delete error:', e);
    alert('Sorry, delete failed.');
  }
};


  if (loading) return <p className="text-gray-400 p-4">Loading recipe...</p>
  if (!recipe) return <p className="text-red-500 p-4">Recipe not found.</p>

  // --- Derived fields for the info row ---
  const difficultyRaw = recipe.difficulty ?? recipe.difficultyLevel
  const difficulty = typeof difficultyRaw === 'number'
    ? (DIFFICULTY_MAP[difficultyRaw] ?? String(difficultyRaw))
    : difficultyRaw

  const prepRaw = recipe.prepTimeMinutes ?? recipe.prepMinutes ?? recipe.prepTime
  const cookRaw = recipe.cookTimeMinutes ?? recipe.cookMinutes ?? recipe.cookTime
  const prepMin = toMinutes(prepRaw)
  const cookMin = toMinutes(cookRaw)
  const prep = prepMin ? fmtMinutes(prepMin) : null
  const cook = cookMin ? fmtMinutes(cookMin) : null
  const totalFmt = (prepMin + cookMin) > 0 ? fmtMinutes(prepMin + cookMin) : null

  const tags = coerceTags(recipe.tags)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-platerly-text">
      {/* Header Image Section */}
      <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-lg">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />

        {/* Dark overlay with title/author/date (bottom-left) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-4xl font-bold text-white">{recipe.title}</h1>
            {remixMeta?.isRemix && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-200/20 text-purple-100 ring-1 ring-purple-300/30">
                Remix
              </span>
            )}
          </div>

          <div className="flex justify-between items-center text-sm text-gray-300">
            <Link to={`/profile/${recipe.authorUsername}`} className="hover:text-platerly-green hover:underline  text-gray-300 transition-all">
              @{recipe.authorUsername}
            </Link>
            <span>
              {new Date(recipe.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Kebab actions (top-right) */}
        <div ref={menuRef} className="absolute top-3 right-3">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-full bg-black/45 hover:bg-black/60 border border-white/10 text-white shadow"
            aria-label="Actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className="mt-2 w-44 rounded-md bg-neutral-900/95 backdrop-blur border border-white/10 shadow-lg overflow-hidden">
              {isOwner && (
                <>
                  <button onClick={goEdit} className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmOpen(true) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 text-red-300 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <div className="h-px bg-white/10" />
                </>
              )}
              <button onClick={goRemix} className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Remix
              </button>
            </div>
          )}
        </div>

        {/* Floating Save button (top-left, subtle) */}
        {token && (
          <div className="absolute top-3 left-3">
            <button
              onClick={() => setSaveOpen(v => !v)}
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow inline-flex items-center gap-1.5"
            >
              <BookmarkPlus className="w-4 h-4" /> Save
            </button>
          </div>
        )}

        {/* Remix lineage pill (bottom-right) */}
        {remixMeta?.isRemix && (
          <div className="absolute bottom-3 right-3 text-[11px] sm:text-xs bg-black/45 backdrop-blur rounded-full px-3 py-1.5 border border-white/10 shadow-md">
            <span className="opacity-80 mr-1">Lineage:</span>
            <span className="space-x-1">
              {remixMeta.parentRecipeId ? (
                <Link
                  to={`/recipe/${remixMeta.parentRecipeId}`}
                  className="underline hover:no-underline"
                  title="Direct recipe this was remixed from"
                >
                  source
                </Link>
              ) : (
                <span className="opacity-70">source</span>
              )}
              <span aria-hidden>·</span>
              {remixMeta.originalRecipeId ? (
                <Link
                  to={`/recipe/${remixMeta.originalRecipeId}`}
                  className="underline hover:no-underline"
                  title="Root/original recipe in this remix chain"
                >
                  origin
                </Link>
              ) : (
                <span className="opacity-70">origin</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Inline save panel (compact) */}
      {token && saveOpen && recipe?.id && (
        <div className="mt-3 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
          <SaveToCookbookSection recipeId={recipe.id} />
        </div>
      )}

      {/* Info Row: Difficulty / Time / Total */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {difficulty && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-900/30 px-3 py-1 text-sm text-emerald-200">
            <span className="font-semibold">Difficulty:</span> {difficulty}
          </span>
        )}
        {(prep || cook) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-600 bg-neutral-800 px-3 py-1 text-sm text-neutral-200">
            <span className="font-semibold">Time:</span>
            <span>
              {prep && `${prep} prep`}
              {prep && cook ? ', ' : ''}
              {cook && `${cook} cook`}
            </span>
          </span>
        )}
        {totalFmt && (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-600 bg-neutral-800 px-3 py-1 text-sm text-neutral-200">
            <span className="font-semibold">Total:</span> {totalFmt}
          </span>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-emerald-900/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-700/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Allergy Notice */}
      {matchingAllergens.length > 0 && (
        <div className="mt-6 bg-red-900/80 border border-red-500 text-red-300 px-5 py-3 rounded-lg shadow-sm">
          ⚠️ <strong>This recipe contains allergens:</strong>{' '}
          <span className="font-semibold">{matchingAllergens.join(', ')}</span>
        </div>
      )}

      {/* Recipe Info Sections (collapsible) */}
      <div className="space-y-4 mt-10">
        <details open className="rounded-lg border border-neutral-700">
          <summary className="cursor-pointer select-none px-4 py-3 text-lg font-semibold">📍 Region</summary>
          <div className="px-4 pb-4 text-gray-300">{recipe.region || '—'}</div>
        </details>

        <details open className="rounded-lg border border-neutral-700">
          <summary className="cursor-pointer select-none px-4 py-3 text-lg font-semibold">📝 Description</summary>
          <div className="px-4 pb-4 text-gray-300">{recipe.description || 'No description provided.'}</div>
        </details>

        <details open className="rounded-lg border border-neutral-700">
          <summary className="cursor-pointer select-none px-4 py-3 text-lg font-semibold">📋 Instructions</summary>
          <div className="px-4 pb-4 text-gray-300 whitespace-pre-line">{recipe.instructions || 'No instructions provided.'}</div>
        </details>

        <details open className="rounded-lg border border-neutral-700">
          <summary className="cursor-pointer select-none px-4 py-3 text-lg font-semibold">🧂 Ingredients</summary>
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-3">
              {(recipe.ingredients || []).map((ing, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-sm bg-neutral-800 border border-neutral-600 text-white"
                >
                  <span className="text-green-400 font-semibold">{ing.quantity}</span> {ing.name}
                </span>
              ))}
            </div>
          </div>
        </details>
      </div>

      {/* Comments Section (collapsed by default) */}
      {token && (
        <div className="mt-10 pt-8 border-t border-neutral-700">
          <button
            onClick={() => setCommentsOpen(v => !v)}
            className="mb-4 inline-flex items-center gap-2 text-left text-lg font-semibold hover:text-platerly-green transition"
          >
            <span>💬 Comments</span>
            <span className="text-sm text-neutral-400">({comments.length})</span>
            <span className="text-neutral-400">{commentsOpen ? '▾' : '▸'}</span>
          </button>

          {commentsOpen && (
            <>
              {/* Comment box */}
              <div className="space-y-3 mb-6">
                <textarea
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-md p-3 focus:outline-none focus:ring focus:ring-green-500"
                />
                <button
                  onClick={handleSubmitComment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition"
                >
                  Post Comment
                </button>
              </div>

              {/* Existing comments */}
              {comments.length === 0 ? (
                <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
                        <Link
                          to={`/profile/${comment.username}`}
                          className="font-medium hover:text-platerly-green transition-colors"
                        >
                          @{comment.username}
                        </Link>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-200">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete recipe?"
        description="This will hide the recipe for everyone else. You can’t recover it here."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => { setConfirmOpen(false); await doDelete() }}
        danger
      />
    </div>
  )
}

export default RecipeDetailsPage
