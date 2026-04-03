/**
 * ShoppingListPage
 *
 * Layer: Authenticated, premium/trial-gated shopping list manager.
 * Route: /shopping-list
 *
 * What this page does:
 *  - Lets premium/trial users create and manage multiple named shopping lists
 *  - Items can be manually added, checked off, or deleted
 *  - Recipe-generated items (added via MealPlannerPage or RecipeDetailsPage) are
 *    grouped separately under "From Recipes" within each list
 *  - Lists can be shared (copy link) or cleared in bulk
 *  - Confirm dialogs prevent accidental destructive actions (clear all, clear recipe items, delete list)
 *  - Free users see an upgrade prompt
 *
 * State managed:
 *  - lists — user's shopping list metadata
 *  - selectedListId, selectedList — currently viewed list with items
 *  - newListName, showNewListForm — create form state
 *  - newItemName, addingItem — add item form state
 *  - deleteListId, showClearAllConfirm, showClearRecipesConfirm — confirm dialog triggers
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart, Plus, Trash2, Check, Share2, Copy,
  ChevronDown, ChevronRight, X, Loader2, Lock, BookOpen, Crown
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePremium } from '../hooks/usePremium'
import { API_BASE_URL } from '../utils/api'
import { toast } from 'react-hot-toast'
import logger from '../utils/logger'
import ConfirmDialog from '../components/common/ConfirmDialog'

const cx = (...a) => a.filter(Boolean).join(' ')

export default function ShoppingListPage() {
  const { token } = useAuth()
  const { isPremium, isOnTrial } = usePremium()
  const hasPremiumAccess = isPremium || isOnTrial

  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedListId, setSelectedListId] = useState(null)
  const [selectedList, setSelectedList] = useState(null)
  const [loadingList, setLoadingList] = useState(false)
  const [creatingList, setCreatingList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [showNewListForm, setShowNewListForm] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  // Confirm dialog states
  const [deleteListId, setDeleteListId] = useState(null)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [showClearRecipesConfirm, setShowClearRecipesConfirm] = useState(false)

  // Fetch all user's shopping lists
  const fetchLists = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/shopping-list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch lists')
      const data = await res.json()
      setLists(data)

      // Auto-select first list if none selected
      if (data.length > 0 && !selectedListId) {
        setSelectedListId(data[0].id)
      }
    } catch (err) {
      logger.error('Failed to fetch shopping lists', err)
      toast.error('Failed to load shopping lists')
    } finally {
      setLoading(false)
    }
  }, [token, selectedListId])

  // Fetch specific list details
  const fetchListDetails = useCallback(async (listId) => {
    if (!token || !listId) return
    try {
      setLoadingList(true)
      const res = await fetch(`${API_BASE_URL}/api/shopping-list/${listId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch list')
      const data = await res.json()
      setSelectedList(data)
    } catch (err) {
      logger.error('Failed to fetch list details', err)
      toast.error('Failed to load list')
    } finally {
      setLoadingList(false)
    }
  }, [token])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  useEffect(() => {
    if (selectedListId) {
      fetchListDetails(selectedListId)
    }
  }, [selectedListId, fetchListDetails])

  // Create new shopping list
  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListName.trim() || !token) return

    try {
      setCreatingList(true)
      const res = await fetch(`${API_BASE_URL}/api/shopping-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newListName.trim() })
      })

      // Handle premium limit error
      if (res.status === 402) {
        const data = await res.json()
        toast.error(data.message || 'Premium subscription required')
        setShowNewListForm(false)
        return
      }

      if (!res.ok) throw new Error('Failed to create list')
      const newList = await res.json()
      setLists(prev => [newList, ...prev])
      setSelectedListId(newList.id)
      setNewListName('')
      setShowNewListForm(false)
      toast.success('Shopping list created!')
    } catch (err) {
      logger.error('Failed to create list', err)
      toast.error('Failed to create list')
    } finally {
      setCreatingList(false)
    }
  }

  // Delete a shopping list
  const handleDeleteList = async () => {
    if (!deleteListId || !token) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/shopping-list/${deleteListId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete')
      setLists(prev => prev.filter(l => l.id !== deleteListId))
      if (selectedListId === deleteListId) {
        const remaining = lists.filter(l => l.id !== deleteListId)
        setSelectedListId(remaining[0]?.id || null)
        setSelectedList(null)
      }
      toast.success('List deleted')
    } catch (err) {
      logger.error('Failed to delete list', err)
      toast.error('Failed to delete list')
    } finally {
      setDeleteListId(null)
    }
  }

  // Clear all items from list
  const handleClearAllItems = async () => {
    if (!selectedListId || !token) return

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/shopping-list/${selectedListId}/items/clear-all`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (!res.ok) throw new Error('Failed to clear')

      setSelectedList(prev => ({
        ...prev,
        items: [],
        sourceRecipes: prev.sourceRecipes
      }))
      toast.success('All items cleared')
    } catch (err) {
      logger.error('Failed to clear items', err)
      toast.error('Failed to clear items')
    } finally {
      setShowClearAllConfirm(false)
    }
  }

  // Clear all recipes from list
  const handleClearAllRecipes = async () => {
    if (!selectedListId || !token) return

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/shopping-list/${selectedListId}/recipes/clear-all`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (!res.ok) throw new Error('Failed to clear')

      // Refresh the list to get updated state
      await fetchListDetails(selectedListId)
      toast.success('Recipes cleared from list')
    } catch (err) {
      logger.error('Failed to clear recipes', err)
      toast.error('Failed to clear recipes')
    } finally {
      setShowClearRecipesConfirm(false)
    }
  }

  // Toggle item checked state
  const handleToggleItem = async (itemId, isChecked) => {
    if (!selectedListId || !token) return

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/shopping-list/${selectedListId}/items/${itemId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isChecked: !isChecked })
        }
      )
      if (!res.ok) throw new Error('Failed to update')

      // Update local state
      setSelectedList(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, isChecked: !isChecked } : item
        )
      }))
    } catch (err) {
      logger.error('Failed to toggle item', err)
    }
  }

  // Add manual item
  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!newItemName.trim() || !selectedListId || !token) return

    try {
      setAddingItem(true)
      const res = await fetch(
        `${API_BASE_URL}/api/shopping-list/${selectedListId}/items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: newItemName.trim() })
        }
      )
      if (!res.ok) throw new Error('Failed to add item')
      const newItem = await res.json()

      setSelectedList(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }))
      setNewItemName('')
    } catch (err) {
      logger.error('Failed to add item', err)
      toast.error('Failed to add item')
    } finally {
      setAddingItem(false)
    }
  }

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!selectedListId || !token) return

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/shopping-list/${selectedListId}/items/${itemId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (!res.ok) throw new Error('Failed to delete')

      setSelectedList(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }))
    } catch (err) {
      logger.error('Failed to delete item', err)
    }
  }

  // Clear checked items
  const handleClearChecked = async () => {
    if (!selectedListId || !token) return

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/shopping-list/${selectedListId}/items/clear-checked`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (!res.ok) throw new Error('Failed to clear')

      setSelectedList(prev => ({
        ...prev,
        items: prev.items.filter(item => !item.isChecked)
      }))
      toast.success('Checked items cleared')
    } catch (err) {
      logger.error('Failed to clear checked', err)
      toast.error('Failed to clear items')
    }
  }

  // Copy list to clipboard
  const handleCopyList = async () => {
    if (!selectedList) return

    const text = selectedList.items
      .map(item => `${item.isChecked ? '[x]' : '[ ]'} ${item.quantity || ''} ${item.name}`.trim())
      .join('\n')

    try {
      await navigator.clipboard.writeText(`${selectedList.name}\n\n${text}`)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const checkedCount = selectedList?.items?.filter(i => i.isChecked).length || 0
  const totalCount = selectedList?.items?.length || 0

  // Premium gate for multiple lists
  const canCreateMoreLists = hasPremiumAccess || lists.length === 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-recipzee-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-recipzee-green/20 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-recipzee-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-recipzee-text">Shopping Lists</h1>
            <p className="text-sm text-recipzee-subtle">
              Manage your grocery lists
            </p>
          </div>
        </div>

        {canCreateMoreLists ? (
          <button
            onClick={() => setShowNewListForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-recipzee-green text-recipzee-dark font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New List
          </button>
        ) : (
          <Link
            to="/settings?tab=subscription"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-recipzee-card border border-recipzee-border text-recipzee-subtle hover:text-recipzee-text transition-colors"
          >
            <Lock className="w-4 h-4" />
            Upgrade for more lists
          </Link>
        )}
      </div>

      {/* New List Form */}
      {showNewListForm && (
        <div className="mb-6 p-4 rounded-xl bg-recipzee-card border border-recipzee-border">
          <form onSubmit={handleCreateList} className="flex gap-3">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name (e.g., Weekly groceries)"
              className="flex-1 px-4 py-2 rounded-lg bg-recipzee-light border border-recipzee-border text-recipzee-text placeholder-recipzee-muted focus:outline-none focus:ring-2 focus:ring-recipzee-green/40"
              autoFocus
            />
            <button
              type="submit"
              disabled={creatingList || !newListName.trim()}
              className="px-4 py-2 rounded-lg bg-recipzee-green text-recipzee-dark font-medium disabled:opacity-50"
            >
              {creatingList ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewListForm(false)}
              className="px-3 py-2 rounded-lg bg-recipzee-light text-recipzee-subtle hover:text-recipzee-text"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {lists.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <ShoppingCart className="w-16 h-16 mx-auto text-recipzee-muted mb-4" />
          <h2 className="text-xl font-semibold text-recipzee-text mb-2">
            No shopping lists yet
          </h2>
          <p className="text-recipzee-subtle mb-6">
            Create your first shopping list or add ingredients from a recipe
          </p>
          <button
            onClick={() => setShowNewListForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-recipzee-green text-recipzee-dark font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Shopping List
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Lists Sidebar */}
          <div className="space-y-2">
            {lists.map(list => (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={cx(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all',
                  selectedListId === list.id
                    ? 'bg-recipzee-green text-recipzee-dark'
                    : 'bg-recipzee-card border border-recipzee-border hover:border-recipzee-green/30'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span className="truncate font-medium">{list.name}</span>
                </div>
                {list.itemCount > 0 && (
                  <span className={cx(
                    'text-xs px-2 py-0.5 rounded-full',
                    selectedListId === list.id
                      ? 'bg-recipzee-dark/20'
                      : 'bg-recipzee-light'
                  )}>
                    {list.itemCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Selected List Details */}
          <div className="rounded-2xl border border-recipzee-border bg-recipzee-card overflow-hidden">
            {loadingList ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-recipzee-green animate-spin" />
              </div>
            ) : selectedList ? (
              <>
                {/* List Header */}
                <div className="px-4 py-3 bg-recipzee-light/30 border-b border-recipzee-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-recipzee-text">
                        {selectedList.name}
                      </h2>
                      <p className="text-sm text-recipzee-subtle">
                        {checkedCount}/{totalCount} items checked
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyList}
                        className="p-2 rounded-lg hover:bg-recipzee-light text-recipzee-subtle hover:text-recipzee-text transition-colors"
                        title="Copy list"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteListId(selectedListId)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-recipzee-subtle hover:text-red-400 transition-colors"
                        title="Delete list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Source Recipes */}
                  {selectedList.sourceRecipes?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-recipzee-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-recipzee-subtle" />
                          <span className="text-xs font-medium text-recipzee-subtle uppercase tracking-wide">
                            Recipes in this list
                          </span>
                        </div>
                        <button
                          onClick={() => setShowClearRecipesConfirm(true)}
                          className="text-xs text-recipzee-subtle hover:text-red-400 transition-colors"
                        >
                          Clear all recipes
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedList.sourceRecipes.map(recipe => (
                          <Link
                            key={recipe.recipeId}
                            to={`/recipe/${recipe.recipeId}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-recipzee-light hover:bg-recipzee-green/10 text-sm text-recipzee-text hover:text-recipzee-green transition-colors"
                          >
                            {recipe.thumbnailUrl && (
                              <img
                                src={recipe.thumbnailUrl}
                                alt=""
                                className="w-5 h-5 rounded object-cover"
                              />
                            )}
                            <span className="max-w-[150px] truncate">{recipe.title}</span>
                            {recipe.scaleFactor !== 1 && (
                              <span className="text-xs text-recipzee-muted">
                                ({recipe.scaleFactor}x)
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Item Form */}
                <form onSubmit={handleAddItem} className="px-4 py-3 border-b border-recipzee-border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Add an item..."
                      className="flex-1 px-3 py-2 rounded-lg bg-recipzee-light border border-recipzee-border text-recipzee-text placeholder-recipzee-muted text-sm focus:outline-none focus:ring-2 focus:ring-recipzee-green/40"
                    />
                    <button
                      type="submit"
                      disabled={addingItem || !newItemName.trim()}
                      className="px-3 py-2 rounded-lg bg-recipzee-green text-recipzee-dark font-medium text-sm disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Items List */}
                <div className="max-h-[50vh] overflow-y-auto">
                  {selectedList.items?.length > 0 ? (
                    <ul className="divide-y divide-recipzee-border/50">
                      {selectedList.items.map(item => (
                        <li
                          key={item.id}
                          className={cx(
                            'flex items-center gap-3 px-4 py-3 group',
                            item.isChecked && 'bg-recipzee-green/5'
                          )}
                        >
                          <button
                            onClick={() => handleToggleItem(item.id, item.isChecked)}
                            className={cx(
                              'w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0',
                              item.isChecked
                                ? 'bg-recipzee-green border-recipzee-green'
                                : 'border-recipzee-border hover:border-recipzee-green/50'
                            )}
                          >
                            {item.isChecked && (
                              <Check className="w-3 h-3 text-recipzee-dark" />
                            )}
                          </button>
                          <div className={cx(
                            'flex-1 min-w-0',
                            item.isChecked && 'line-through text-recipzee-muted'
                          )}>
                            <div className="flex items-baseline gap-2">
                              {item.quantity && (
                                <span className="text-recipzee-green font-medium">
                                  {item.quantity}
                                </span>
                              )}
                              <span className="text-recipzee-text">{item.name}</span>
                            </div>
                            {item.sources?.length > 0 && (
                              <div className="text-xs text-recipzee-subtle mt-0.5">
                                from {item.sources.map(s => s.recipeTitle).filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-recipzee-subtle hover:text-red-400 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-12 text-center text-recipzee-subtle">
                      <p>No items yet. Add items above or from a recipe.</p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                {totalCount > 0 && (
                  <div className="px-4 py-3 border-t border-recipzee-border bg-recipzee-light/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {checkedCount > 0 && (
                        <button
                          onClick={handleClearChecked}
                          className="text-sm text-recipzee-subtle hover:text-red-400 transition-colors"
                        >
                          Clear {checkedCount} checked item{checkedCount !== 1 ? 's' : ''}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowClearAllConfirm(true)}
                      className="text-sm text-recipzee-subtle hover:text-red-400 transition-colors"
                    >
                      Clear all items
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-recipzee-subtle">
                Select a list to view items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete List Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteListId}
        onOpenChange={(open) => !open && setDeleteListId(null)}
        title="Delete Shopping List?"
        description="This will permanently delete the shopping list and all its items. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDeleteList}
      />

      {/* Clear All Items Confirmation Dialog */}
      <ConfirmDialog
        open={showClearAllConfirm}
        onOpenChange={setShowClearAllConfirm}
        title="Clear All Items?"
        description="This will remove all items from your shopping list. This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleClearAllItems}
      />

      {/* Clear All Recipes Confirmation Dialog */}
      <ConfirmDialog
        open={showClearRecipesConfirm}
        onOpenChange={setShowClearRecipesConfirm}
        title="Clear All Recipes?"
        description="This will remove all recipe ingredients from your shopping list. Manually added items will be kept."
        confirmLabel="Clear Recipes"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleClearAllRecipes}
      />
    </div>
  )
}
