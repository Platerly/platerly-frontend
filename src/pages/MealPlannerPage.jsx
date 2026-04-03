/**
 * MealPlannerPage
 *
 * Layer: Authenticated, premium/trial-gated meal planning page.
 * Route: /meal-planner
 *
 * What this page does:
 *  - Lets premium/trial users create named weekly meal plans with a date range
 *  - Within a plan: assign recipes to specific days and meal types (Breakfast/Lunch/Dinner/Snack)
 *  - Calendar week view navigates with ChevronLeft/ChevronRight buttons
 *  - Recipe picker modal searches the user's own recipes and cookbook recipes
 *  - Generates a shopping list from the plan's ingredients via a dedicated button
 *  - Free users without premium access see an upgrade prompt
 *
 * State managed:
 *  - plans — list of the user's meal plans
 *  - selectedPlanId, selectedPlan — currently viewed plan and its full data
 *  - showCreateForm, newPlanName, newPlanStart, newPlanEnd — create form state
 *  - showRecipePicker, pickerDate, pickerMealType — recipe picker modal state
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Plus, Trash2, ChevronLeft, ChevronRight, X, Loader2,
  ShoppingCart, Crown, Search, BookOpen, Book, Users as UsersIcon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePremium } from '../hooks/usePremium'
import { API_BASE_URL } from '../utils/api'
import { toast } from 'react-hot-toast'
import logger from '../utils/logger'
import ConfirmDialog from '../components/common/ConfirmDialog'

const cx = (...a) => a.filter(Boolean).join(' ')

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MealPlannerPage() {
  const { token } = useAuth()
  const { isPremium, isOnTrial } = usePremium()
  const hasPremiumAccess = isPremium || isOnTrial

  // Meal plans list
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loadingPlan, setLoadingPlan] = useState(false)

  // Create plan form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanStart, setNewPlanStart] = useState('')
  const [newPlanEnd, setNewPlanEnd] = useState('')
  const [creatingPlan, setCreatingPlan] = useState(false)

  // Recipe picker
  const [showRecipePicker, setShowRecipePicker] = useState(false)
  const [pickerDate, setPickerDate] = useState(null)
  const [pickerMealType, setPickerMealType] = useState('Dinner')
  const [recipeSearch, setRecipeSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addingEntry, setAddingEntry] = useState(false)

  // Delete confirmation
  const [deletePlanId, setDeletePlanId] = useState(null)
  const [deleteEntryId, setDeleteEntryId] = useState(null)

  // Calendar view
  const [viewStartDate, setViewStartDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const day = today.getDay()
    today.setDate(today.getDate() - day) // Start of week (Sunday)
    return today
  })

  // Fetch all plans
  const fetchPlans = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/meal-plan`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch plans')
      const data = await res.json()
      setPlans(data)
      if (data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data[0].id)
      }
    } catch (err) {
      logger.error('Failed to fetch meal plans', err)
      toast.error('Failed to load meal plans')
    } finally {
      setLoading(false)
    }
  }, [token, selectedPlanId])

  // Fetch specific plan
  const fetchPlanDetails = useCallback(async (planId) => {
    if (!token || !planId) return
    try {
      setLoadingPlan(true)
      const res = await fetch(`${API_BASE_URL}/api/meal-plan/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch plan')
      const data = await res.json()
      setSelectedPlan(data)
    } catch (err) {
      logger.error('Failed to fetch plan details', err)
      toast.error('Failed to load plan')
    } finally {
      setLoadingPlan(false)
    }
  }, [token])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  useEffect(() => {
    if (selectedPlanId) {
      fetchPlanDetails(selectedPlanId)
    }
  }, [selectedPlanId, fetchPlanDetails])

  // Create plan
  const handleCreatePlan = async (e) => {
    e.preventDefault()
    if (!newPlanName.trim() || !newPlanStart || !newPlanEnd || !token) return

    const startDate = new Date(newPlanStart)
    const endDate = new Date(newPlanEnd)
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
    const maxDays = hasPremiumAccess ? 31 : 7

    if (days > maxDays) {
      toast.error(hasPremiumAccess
        ? `Plans cannot exceed ${maxDays} days`
        : `Free users can only create ${maxDays}-day plans. Upgrade for longer plans.`)
      return
    }

    try {
      setCreatingPlan(true)
      const res = await fetch(`${API_BASE_URL}/api/meal-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPlanName.trim(),
          startDate: newPlanStart,
          endDate: newPlanEnd
        })
      })

      if (res.status === 402) {
        const data = await res.json()
        toast.error(data.message || 'Premium required')
        return
      }

      if (!res.ok) throw new Error('Failed to create plan')
      const newPlan = await res.json()
      setPlans(prev => [newPlan, ...prev])
      setSelectedPlanId(newPlan.id)
      setNewPlanName('')
      setNewPlanStart('')
      setNewPlanEnd('')
      setShowCreateForm(false)
      toast.success('Meal plan created!')
    } catch (err) {
      logger.error('Failed to create plan', err)
      toast.error('Failed to create plan')
    } finally {
      setCreatingPlan(false)
    }
  }

  // Delete plan
  const handleDeletePlan = async () => {
    if (!deletePlanId || !token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/meal-plan/${deletePlanId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete')
      setPlans(prev => prev.filter(p => p.id !== deletePlanId))
      if (selectedPlanId === deletePlanId) {
        const remaining = plans.filter(p => p.id !== deletePlanId)
        setSelectedPlanId(remaining[0]?.id || null)
        setSelectedPlan(null)
      }
      toast.success('Plan deleted')
    } catch (err) {
      logger.error('Failed to delete plan', err)
      toast.error('Failed to delete plan')
    } finally {
      setDeletePlanId(null)
    }
  }

  // Search recipes from user's cookbooks
  const handleSearchRecipes = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    try {
      setSearchLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/meal-plan/recipes/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSearchResults(data.recipes || [])
    } catch (err) {
      logger.error('Recipe search failed', err)
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recipeSearch) handleSearchRecipes(recipeSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [recipeSearch])

  // Add entry
  const handleAddEntry = async (recipeId) => {
    if (!selectedPlanId || !pickerDate || !token) return
    try {
      setAddingEntry(true)
      const res = await fetch(`${API_BASE_URL}/api/meal-plan/${selectedPlanId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipeId,
          date: pickerDate,
          mealType: pickerMealType,
          scaleFactor: 1
        })
      })
      if (!res.ok) throw new Error('Failed to add')
      await fetchPlanDetails(selectedPlanId)
      setShowRecipePicker(false)
      setRecipeSearch('')
      setSearchResults([])
      toast.success('Recipe added to plan!')
    } catch (err) {
      logger.error('Failed to add entry', err)
      toast.error('Failed to add recipe')
    } finally {
      setAddingEntry(false)
    }
  }

  // Delete entry
  const handleDeleteEntry = async () => {
    if (!selectedPlanId || !deleteEntryId || !token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/meal-plan/${selectedPlanId}/entries/${deleteEntryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchPlanDetails(selectedPlanId)
      toast.success('Entry removed')
    } catch (err) {
      logger.error('Failed to delete entry', err)
      toast.error('Failed to remove entry')
    } finally {
      setDeleteEntryId(null)
    }
  }

  // Generate shopping list
  const handleGenerateShoppingList = async () => {
    if (!selectedPlanId || !token) return
    if (!hasPremiumAccess) {
      toast.error('Generating shopping lists from meal plans is a Premium feature')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/meal-plan/${selectedPlanId}/shopping-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      })
      if (res.status === 402) {
        const data = await res.json()
        toast.error(data.message || 'Premium required')
        return
      }
      if (!res.ok) throw new Error('Failed to generate')
      toast.success('Shopping list created! Check your Shopping Lists.')
    } catch (err) {
      logger.error('Failed to generate shopping list', err)
      toast.error('Failed to generate shopping list')
    }
  }

  // Calendar helpers
  const getWeekDates = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(viewStartDate)
      d.setDate(d.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  const getEntriesForDate = (date) => {
    if (!selectedPlan?.entries) return []
    const dateStr = date.toISOString().split('T')[0]
    return selectedPlan.entries.filter(e => e.date.split('T')[0] === dateStr)
  }

  const navigateWeek = (dir) => {
    const newDate = new Date(viewStartDate)
    newDate.setDate(newDate.getDate() + (dir * 7))
    setViewStartDate(newDate)
  }

  const openRecipePicker = (date, mealType = 'Dinner') => {
    setPickerDate(date.toISOString().split('T')[0])
    setPickerMealType(mealType)
    setShowRecipePicker(true)
  }

  // Max days for new plan
  const maxDays = hasPremiumAccess ? 31 : 7

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-recipzee-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-recipzee-green/20 flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-recipzee-green" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-recipzee-text">Meal Planner</h1>
            <p className="text-base text-recipzee-subtle">
              Plan your meals for the week
              {!hasPremiumAccess && <span className="text-recipzee-muted"> (up to 7 days)</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-recipzee-green text-recipzee-dark font-semibold text-base hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          New Plan
        </button>
      </div>

      {/* Create Plan Form */}
      {showCreateForm && (() => {
        const selectedDays = newPlanStart && newPlanEnd
          ? Math.ceil((new Date(newPlanEnd) - new Date(newPlanStart)) / (1000 * 60 * 60 * 24)) + 1
          : 0
        const exceedsLimit = !hasPremiumAccess && selectedDays > 7

        return (
          <div className="mb-6 p-5 rounded-xl bg-recipzee-card border border-recipzee-border">
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-recipzee-subtle mb-1">Plan Name</label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g., This Week's Meals"
                  className="w-full px-4 py-2 rounded-lg bg-recipzee-light border border-recipzee-border text-recipzee-text placeholder-recipzee-muted focus:outline-none focus:ring-2 focus:ring-recipzee-green/40"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-recipzee-subtle mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newPlanStart}
                    onChange={(e) => setNewPlanStart(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-recipzee-light border border-recipzee-border text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-recipzee-subtle mb-1">
                    End Date
                    {!hasPremiumAccess && <span className="text-xs text-recipzee-muted ml-1">(max {maxDays} days)</span>}
                  </label>
                  <input
                    type="date"
                    value={newPlanEnd}
                    onChange={(e) => setNewPlanEnd(e.target.value)}
                    className={cx(
                      'w-full px-4 py-2 rounded-lg bg-recipzee-light border text-recipzee-text focus:outline-none focus:ring-2',
                      exceedsLimit
                        ? 'border-amber-500/50 focus:ring-amber-500/40'
                        : 'border-recipzee-border focus:ring-recipzee-green/40'
                    )}
                  />
                </div>
              </div>

              {/* Premium Upgrade Banner */}
              {exceedsLimit && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-recipzee-text">
                      {selectedDays}-day plans require Premium
                    </p>
                    <p className="text-sm text-recipzee-subtle">
                      Free accounts can create plans up to 7 days. Upgrade to plan up to 31 days ahead.
                    </p>
                  </div>
                  <Link
                    to="/settings?tab=subscription"
                    className="px-4 py-2 rounded-lg bg-amber-500 text-recipzee-dark font-semibold hover:bg-amber-400 transition-colors flex-shrink-0"
                  >
                    Upgrade
                  </Link>
                </div>
              )}

              <div className="flex gap-3">
                {exceedsLimit ? (
                  <Link
                    to="/settings?tab=subscription"
                    className="px-4 py-2 rounded-lg bg-amber-500 text-recipzee-dark font-medium hover:bg-amber-400 transition-colors inline-flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Create
                  </Link>
                ) : (
                  <button
                    type="submit"
                    disabled={creatingPlan || !newPlanName.trim() || !newPlanStart || !newPlanEnd}
                    className="px-4 py-2 rounded-lg bg-recipzee-green text-recipzee-dark font-medium disabled:opacity-50"
                  >
                    {creatingPlan ? 'Creating...' : 'Create Plan'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-lg bg-recipzee-light text-recipzee-subtle hover:text-recipzee-text"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )
      })()}

      {plans.length === 0 && !showCreateForm ? (
        /* Empty State */
        <div className="text-center py-16">
          <CalendarDays className="w-16 h-16 mx-auto text-recipzee-muted mb-4" />
          <h2 className="text-xl font-semibold text-recipzee-text mb-2">
            No meal plans yet
          </h2>
          <p className="text-recipzee-subtle mb-6">
            Create your first meal plan to start organizing your meals
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-recipzee-green text-recipzee-dark font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Meal Plan
          </button>
        </div>
      ) : plans.length > 0 && (
        <div className="space-y-6">
          {/* Plans Horizontal Selector */}
          <div>
            <h3 className="text-base font-semibold text-recipzee-subtle mb-3">Your Plans</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {plans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cx(
                    'flex-shrink-0 flex items-center gap-4 px-5 py-3 rounded-xl text-left transition-all',
                    selectedPlanId === plan.id
                      ? 'bg-recipzee-green text-recipzee-dark'
                      : 'bg-recipzee-card border border-recipzee-border hover:border-recipzee-green/30'
                  )}
                >
                  <div className="min-w-0">
                    <span className="block font-semibold text-base whitespace-nowrap">{plan.name}</span>
                    <span className="text-sm opacity-70 whitespace-nowrap">
                      {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={cx(
                    'text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap',
                    selectedPlanId === plan.id ? 'bg-recipzee-dark/20' : 'bg-recipzee-light'
                  )}>
                    {plan.totalMeals} meals
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Calendar View - Full Width */}
          <div className="rounded-2xl border border-recipzee-border bg-recipzee-card overflow-hidden">
            {loadingPlan ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-recipzee-green animate-spin" />
              </div>
            ) : selectedPlan ? (
              <>
                {/* Plan Header */}
                <div className="px-6 py-4 bg-recipzee-light/30 border-b border-recipzee-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-recipzee-text">{selectedPlan.name}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-recipzee-subtle">{selectedPlan.entries?.length || 0} meals</span>
                        <div className="flex items-center gap-4 text-xs text-recipzee-muted">
                          <span className="flex items-center gap-1.5">
                            <span className="relative flex items-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8),0_0_20px_rgba(251,191,36,0.4)]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-300/70 ml-0.5" />
                              <span className="w-1 h-1 rounded-full bg-amber-200/50 ml-0.5" />
                            </span>
                            Breakfast
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="relative flex items-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8),0_0_20px_rgba(96,165,250,0.4)]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-300/70 ml-0.5" />
                              <span className="w-1 h-1 rounded-full bg-blue-200/50 ml-0.5" />
                            </span>
                            Lunch
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="relative flex items-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8),0_0_20px_rgba(192,132,252,0.4)]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-300/70 ml-0.5" />
                              <span className="w-1 h-1 rounded-full bg-purple-200/50 ml-0.5" />
                            </span>
                            Dinner
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="relative flex items-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8),0_0_20px_rgba(74,222,128,0.4)]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-green-300/70 ml-0.5" />
                              <span className="w-1 h-1 rounded-full bg-green-200/50 ml-0.5" />
                            </span>
                            Snack
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasPremiumAccess ? (
                        <button
                          onClick={handleGenerateShoppingList}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-recipzee-green text-recipzee-dark text-base font-semibold hover:opacity-90"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          Generate Shopping List
                        </button>
                      ) : (
                        <Link
                          to="/settings?tab=subscription"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-recipzee-light text-recipzee-subtle text-base font-medium hover:text-recipzee-text"
                        >
                          <Crown className="w-5 h-5 text-amber-400" />
                          Upgrade to generate list
                        </Link>
                      )}
                      <button
                        onClick={() => setDeletePlanId(selectedPlanId)}
                        className="p-2.5 rounded-xl hover:bg-red-500/10 text-recipzee-subtle hover:text-red-400"
                        title="Delete plan"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Week Navigation */}
                <div className="px-6 py-4 border-b border-recipzee-border flex items-center justify-between">
                  <button
                    onClick={() => navigateWeek(-1)}
                    className="p-2.5 rounded-xl hover:bg-recipzee-light text-recipzee-subtle hover:text-recipzee-text"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-lg font-semibold text-recipzee-text">
                    {viewStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => navigateWeek(1)}
                    className="p-2.5 rounded-xl hover:bg-recipzee-light text-recipzee-subtle hover:text-recipzee-text"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                  {getWeekDates().map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString()
                    const entries = getEntriesForDate(date)
                    return (
                      <div
                        key={i}
                        className={cx(
                          'min-h-[280px] border-r border-recipzee-border last:border-r-0 p-4 flex flex-col',
                          isToday && 'bg-recipzee-green/5'
                        )}
                      >
                        <div className={cx(
                          'text-center mb-3 pb-2',
                          isToday && 'text-recipzee-green'
                        )}>
                          <div className="text-xs text-recipzee-subtle font-medium uppercase tracking-wider">{DAYS_OF_WEEK[i]}</div>
                          <div className={cx(
                            'text-2xl font-semibold',
                            isToday ? 'text-recipzee-green' : 'text-recipzee-text'
                          )}>
                            {date.getDate()}
                          </div>
                        </div>

                        {/* Entries */}
                        <div className="space-y-2 flex-1">
                          {entries.map(entry => (
                            <Link
                              key={entry.id}
                              to={`/recipe/${entry.recipeId}`}
                              className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-recipzee-light/80 transition-colors"
                            >
                              <span className="flex items-center flex-shrink-0">
                                <span className={cx(
                                  'w-2.5 h-2.5 rounded-full',
                                  entry.mealType === 'Breakfast' && 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8),0_0_20px_rgba(251,191,36,0.4)]',
                                  entry.mealType === 'Lunch' && 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8),0_0_20px_rgba(96,165,250,0.4)]',
                                  entry.mealType === 'Dinner' && 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8),0_0_20px_rgba(192,132,252,0.4)]',
                                  entry.mealType === 'Snack' && 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8),0_0_20px_rgba(74,222,128,0.4)]'
                                )} />
                                <span className={cx(
                                  'w-1.5 h-1.5 rounded-full ml-0.5',
                                  entry.mealType === 'Breakfast' && 'bg-amber-300/70',
                                  entry.mealType === 'Lunch' && 'bg-blue-300/70',
                                  entry.mealType === 'Dinner' && 'bg-purple-300/70',
                                  entry.mealType === 'Snack' && 'bg-green-300/70'
                                )} />
                                <span className={cx(
                                  'w-1 h-1 rounded-full ml-0.5',
                                  entry.mealType === 'Breakfast' && 'bg-amber-200/50',
                                  entry.mealType === 'Lunch' && 'bg-blue-200/50',
                                  entry.mealType === 'Dinner' && 'bg-purple-200/50',
                                  entry.mealType === 'Snack' && 'bg-green-200/50'
                                )} />
                              </span>
                              <span className="text-sm text-recipzee-text truncate flex-1" title={entry.recipeTitle}>
                                {entry.recipeTitle}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setDeleteEntryId(entry.id)
                                }}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-recipzee-subtle hover:text-red-400 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          ))}
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={() => openRecipePicker(date)}
                          className="mt-3 w-full py-2 rounded-lg text-recipzee-muted hover:text-recipzee-green hover:bg-recipzee-green/5 text-sm flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-recipzee-subtle">
                Select a plan to view meals
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipe Picker Modal */}
      {showRecipePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl bg-recipzee-card rounded-2xl border border-recipzee-border shadow-2xl">
            <div className="px-6 py-4 border-b border-recipzee-border flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-recipzee-text">Add Recipe to Plan</h3>
                <p className="text-base text-recipzee-subtle mt-1">
                  {pickerDate && new Date(pickerDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRecipePicker(false)
                  setRecipeSearch('')
                  setSearchResults([])
                }}
                className="p-2.5 rounded-xl hover:bg-recipzee-light text-recipzee-subtle"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Meal Type */}
              <div>
                <label className="block text-base font-semibold text-recipzee-subtle mb-3">Meal Type</label>
                <div className="flex gap-3">
                  {MEAL_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setPickerMealType(type)}
                      className={cx(
                        'px-5 py-2.5 rounded-xl text-base font-semibold transition',
                        pickerMealType === type
                          ? 'bg-recipzee-green text-recipzee-dark'
                          : 'bg-recipzee-light text-recipzee-subtle hover:text-recipzee-text'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-base font-semibold text-recipzee-subtle mb-3">Search Your Cookbooks</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-recipzee-muted" />
                  <input
                    type="text"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder="Search recipes in your cookbooks..."
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-recipzee-light border border-recipzee-border text-recipzee-text text-base placeholder-recipzee-muted focus:outline-none focus:ring-2 focus:ring-recipzee-green/40"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto space-y-3">
                {searchLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-recipzee-green animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(recipe => (
                    <button
                      key={recipe.id}
                      onClick={() => handleAddEntry(recipe.id)}
                      disabled={addingEntry}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-recipzee-light/50 hover:bg-recipzee-light text-left transition disabled:opacity-50"
                    >
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-recipzee-border flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-recipzee-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base text-recipzee-text truncate">{recipe.title}</div>
                        <div className="flex items-center gap-3 text-sm text-recipzee-subtle mt-1">
                          {recipe.cookbookName && (
                            <span className="flex items-center gap-1.5">
                              <Book className="w-4 h-4" />
                              {recipe.cookbookName}
                            </span>
                          )}
                          {recipe.authorUsername && (
                            <span>by @{recipe.authorUsername}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : recipeSearch ? (
                  <div className="text-center py-12 text-recipzee-subtle text-base">
                    No recipes found in your cookbooks
                  </div>
                ) : (
                  <div className="text-center py-12 text-recipzee-subtle text-base">
                    Search for recipes from your cookbooks
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Dialog */}
      <ConfirmDialog
        open={!!deletePlanId}
        onOpenChange={(open) => !open && setDeletePlanId(null)}
        title="Delete Meal Plan?"
        description="This will permanently delete this meal plan and all its entries. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDeletePlan}
      />

      {/* Delete Entry Dialog */}
      <ConfirmDialog
        open={!!deleteEntryId}
        onOpenChange={(open) => !open && setDeleteEntryId(null)}
        title="Remove Recipe?"
        description="Remove this recipe from your meal plan?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDeleteEntry}
      />
    </div>
  )
}
