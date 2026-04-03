/**
 * ShoppingListSection.jsx — Inline expandable section to add a recipe's
 * ingredients to a user's shopping list.
 *
 * Layer: Feature / recipe detail page.
 *
 * Add-to-list flow:
 *   - Section header is always visible; clicking it toggles expansion and
 *     triggers a fetch of the user's shopping lists.
 *   - User selects an existing list → POST /api/shopping-list/:id/recipes
 *     with `{ recipeId, scaleFactor }`.
 *   - User creates a new list → POST /api/shopping-list/from-recipe/:recipeId
 *     which auto-populates the list from the recipe's ingredients.
 *   - HTTP 402 from either endpoint means the free-tier recipe-per-list limit
 *     has been reached; the error message is surfaced inline.
 *   - HTTP 409 means the recipe is already in that list (shown as "Already added").
 *
 * Free-tier limit:
 *   - `canCreateNew` is false for free users who already have ≥1 list (premium
 *     required for multiple lists).  The "Create new list" button is replaced by
 *     an upgrade link in that case.
 *
 * Scale factor:
 *   - A ± stepper allows 0.5× to 10× scaling; sent as `scaleFactor` to the API
 *     so quantities are adjusted server-side before adding items.
 *
 * Props:
 *   @prop {string[]} [ingredients=[]] — Ingredient strings (used to decide whether
 *     to render at all — returns null when empty).
 *   @prop {string|number} recipeId   — The recipe whose ingredients are being added.
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart, Check, Copy, Download, Printer, X, Plus, Minus, Crown, Loader2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePremium } from '../../hooks/usePremium'
import { API_BASE_URL } from '../../utils/api'

/**
 * ShoppingListSection - Add recipe ingredients to shopping list
 * Follows the SaveToCookbookSection pattern - inline expandable section
 */

const ShoppingListSection = ({ ingredients = [], recipeId }) => {
  const { token } = useAuth()
  const { isPremium } = usePremium()

  // Backend shopping list states
  const [userLists, setUserLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [addingToListId, setAddingToListId] = useState(null)
  const [addedTo, setAddedTo] = useState(new Set())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Scale for adding
  const [scale, setScale] = useState(1)

  // Fetch user's shopping lists when opened
  useEffect(() => {
    if (!isOpen || !token) return

    const fetchLists = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE_URL}/api/shopping-list`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUserLists(data)
        } else {
          setError('Failed to load shopping lists')
        }
      } catch (err) {
        console.error('Failed to fetch shopping lists', err)
        setError('Failed to load shopping lists')
      } finally {
        setLoading(false)
      }
    }

    fetchLists()
  }, [isOpen, token])

  // Add recipe to existing list
  const handleAddToList = async (listId) => {
    if (!token || !recipeId) return

    setAddingToListId(listId)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/shopping-list/${listId}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipeId: recipeId,
          scaleFactor: scale
        })
      })

      if (res.status === 402) {
        const data = await res.json()
        setError(data.message || 'Upgrade to Premium to add more recipes per list')
        return
      }

      if (res.status === 409) {
        const data = await res.json()
        setError(data.message || 'This recipe is already in the shopping list')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to add to list')
      }

      setAddedTo(prev => new Set([...prev, listId]))
      setSuccess('Recipe added to shopping list!')
    } catch (err) {
      console.error('Failed to add to list', err)
      setError(err.message || 'Failed to add to shopping list')
    } finally {
      setAddingToListId(null)
    }
  }

  // Create new list from this recipe
  const handleCreateNewList = async () => {
    if (!token || !recipeId) return

    setAddingToListId('new')
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/shopping-list/from-recipe/${recipeId}?scaleFactor=${scale}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.status === 402) {
        const data = await res.json()
        setError(data.message || 'Upgrade to Premium for more lists')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to create list')
      }

      const newList = await res.json()
      setUserLists(prev => [newList, ...prev])
      setAddedTo(prev => new Set([...prev, newList.id]))
      setSuccess('Shopping list created with ingredients!')
    } catch (err) {
      console.error('Failed to create list', err)
      setError(err.message || 'Failed to create shopping list')
    } finally {
      setAddingToListId(null)
    }
  }

  if (!ingredients.length) return null

  // Can create new list?
  const canCreateNew = isPremium || userLists.length === 0

  return (
    <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/70 backdrop-blur-sm overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-recipzee-green" />
          <h2 className="text-base sm:text-lg font-semibold text-recipzee-text">
            Add to Shopping List
          </h2>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-recipzee-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="border-t border-recipzee-border">
          {!token ? (
            <div className="px-4 py-6 text-center">
              <p className="text-recipzee-subtle mb-3">Log in to save shopping lists</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-recipzee-green text-recipzee-dark font-medium"
              >
                Log in
              </Link>
            </div>
          ) : !recipeId ? (
            <div className="px-4 py-6 text-center text-recipzee-subtle">
              Recipe not available for shopping list
            </div>
          ) : (
            <>
              {/* Scale selector */}
              <div className="px-4 py-3 border-b border-recipzee-border bg-recipzee-light/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-recipzee-subtle">Scale ingredients:</span>
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => setScale(s => Math.max(0.5, s - 0.5))}
                      disabled={scale <= 0.5}
                      className="w-8 h-8 rounded-lg bg-recipzee-card border border-recipzee-border flex items-center justify-center hover:bg-recipzee-light disabled:opacity-50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium text-recipzee-text">{scale}x</span>
                    <button
                      onClick={() => setScale(s => Math.min(10, s + 0.5))}
                      disabled={scale >= 10}
                      className="w-8 h-8 rounded-lg bg-recipzee-card border border-recipzee-border flex items-center justify-center hover:bg-recipzee-light disabled:opacity-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Lists section */}
              <div className="px-4 py-4">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="px-3 py-3 rounded-lg border border-recipzee-border bg-recipzee-light/30 animate-pulse">
                        <div className="h-4 w-48 bg-recipzee-border rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Existing lists */}
                    {userLists.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-recipzee-subtle mb-2">
                          Add to existing list
                        </h4>
                        <ul className="space-y-2">
                          {userLists.map(list => {
                            const isAdded = addedTo.has(list.id)
                            const isBusy = addingToListId === list.id
                            const alreadyHasThisRecipe = list.recipeIds?.includes(recipeId)

                            return (
                              <li
                                key={list.id}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-recipzee-border bg-recipzee-light/20"
                              >
                                <div className="flex-1 min-w-0 mr-3">
                                  <span className="text-recipzee-text text-sm truncate block">
                                    {list.name}
                                  </span>
                                  <span className="text-xs text-recipzee-subtle">
                                    {list.totalItems || 0} items • {list.recipeCount || 0} recipe{list.recipeCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleAddToList(list.id)}
                                  disabled={isAdded || isBusy || alreadyHasThisRecipe}
                                  className={`text-sm px-3 py-1.5 rounded-lg transition shadow disabled:opacity-60 disabled:cursor-not-allowed ${
                                    isAdded || alreadyHasThisRecipe
                                      ? 'bg-recipzee-light text-recipzee-subtle'
                                      : 'bg-recipzee-green text-recipzee-dark hover:opacity-90'
                                  }`}
                                >
                                  {alreadyHasThisRecipe ? 'Already added' : isAdded ? 'Added' : isBusy ? 'Adding...' : 'Add'}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Create new list */}
                    <div>
                      <h4 className="text-sm font-medium text-recipzee-subtle mb-2">
                        Create new list
                      </h4>
                      {canCreateNew ? (
                        <button
                          onClick={handleCreateNewList}
                          disabled={addingToListId === 'new'}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-recipzee-border hover:border-recipzee-green/50 hover:bg-recipzee-green/5 text-recipzee-text transition-colors disabled:opacity-50"
                        >
                          {addingToListId === 'new' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 text-recipzee-green" />
                          )}
                          <span>Create new list from this recipe</span>
                        </button>
                      ) : (
                        <Link
                          to="/settings?tab=subscription"
                          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-recipzee-light/20 text-recipzee-subtle hover:text-recipzee-text hover:bg-recipzee-light/30 transition-colors"
                        >
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span className="text-sm">Upgrade to Premium for multiple lists</span>
                        </Link>
                      )}
                    </div>

                    {/* View shopping lists link */}
                    <div className="pt-2 border-t border-recipzee-border">
                      <Link
                        to="/shopping-list"
                        className="text-sm text-recipzee-green hover:underline"
                      >
                        View all shopping lists →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Error/Success messages */}
                {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                {success && <p className="text-emerald-400 text-sm mt-3">{success}</p>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ShoppingListSection
