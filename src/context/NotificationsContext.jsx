/**
 * context/NotificationsContext.jsx — Layer: Context / Notifications
 *
 * Provides application-wide notification state and actions via React Context.
 * Notifications are fetched from GET /api/Notification (paginated) and the
 * unread count is polled every 30 seconds while the user is authenticated.
 *
 * Notification types (for reference):
 *  like     — Someone liked your recipe
 *  comment  — Someone commented on your recipe
 *  reply    — Someone replied to your comment
 *  follow   — Someone followed you
 *  mention  — Someone mentioned you in a comment
 *  repost   — Someone reposted your recipe
 *
 * Context shape:
 *  {
 *    notifications     : object[]  — Current page(s) of notification objects
 *    unreadCount       : number    — Badge count shown in the nav
 *    loading           : boolean   — True while a page fetch is in progress
 *    hasMore           : boolean   — True when more pages are available
 *    markAsRead        : function  — Marks a single notification read (optimistic)
 *    markAllAsRead     : function  — Marks all notifications read (optimistic)
 *    deleteNotification: function  — Removes a notification (optimistic)
 *    loadMore          : function  — Appends the next page to the list
 *    refresh           : function  — Resets to page 1 and re-fetches
 *  }
 *
 * Graceful degradation:
 *  - 404 responses from the notification endpoint are treated as "no notifications"
 *    rather than errors, to allow the API to be rolled out independently.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from './AuthContext'
import { logger } from '../utils/logger'

const NotificationsContext = createContext(null)

/**
 * Hook for consuming the NotificationsContext.
 * Must be used inside a component wrapped by NotificationsProvider.
 *
 * @returns {object} The notifications context value
 * @throws {Error} When called outside of NotificationsProvider
 */
export const useNotifications = () => {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}

export const NotificationsProvider = ({ children }) => {
  const { token, authed } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  // hasMore tracks whether the backend has more pages to load
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  /**
   * Fetches a page of notifications from GET /api/Notification.
   * When append=true, the new items are concatenated to the existing list
   * (load-more behaviour); when false, the list is replaced (initial load / refresh).
   * Silently handles 404 (endpoint not yet deployed) to avoid error states.
   *
   * @param {number}  pageNum - Page number to fetch (1-indexed)
   * @param {boolean} append  - If true, appends to existing list; if false, replaces
   */
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!token) return

    try {
      setLoading(true)
      const res = await fetch(
        `${API_BASE_URL}/api/Notification?page=${pageNum}&pageSize=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) {
        // If 404, API might not exist yet - fail silently
        if (res.status === 404) {
          setNotifications([])
          setUnreadCount(0)
          setHasMore(false)
          return
        }
        throw new Error('Failed to fetch notifications')
      }

      const data = await res.json()
      // Support both envelope { notifications: [] } and bare array responses
      const items = Array.isArray(data.notifications) ? data.notifications : Array.isArray(data) ? data : []

      if (append) {
        setNotifications(prev => [...prev, ...items])
      } else {
        setNotifications(items)
      }

      // Prefer server-supplied unreadCount; fall back to counting unread items in this page
      setUnreadCount(data.unreadCount ?? items.filter(n => !n.isRead).length)
      // Assume there are more pages when a full page was returned
      setHasMore(items.length === 20)
      setPage(pageNum)
    } catch (err) {
      logger.error('Failed to fetch notifications', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial fetch on login / auth change; clear state on logout
  useEffect(() => {
    if (authed && token) {
      fetchNotifications(1, false)
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [authed, token, fetchNotifications])

  /**
   * Fetches only the unread count (lightweight endpoint) without reloading the
   * full notification list.  Used by the polling below to keep the badge up-to-date.
   *
   * @returns {boolean} true on success, false on failure (used by backoff logic)
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return false

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/Notification/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) return false

      const data = await res.json()
      // API may return { count: N } or a bare number
      setUnreadCount(data.count ?? data ?? 0)
      return true
    } catch {
      return false
    }
  }, [token])

  // Poll for new notifications while authenticated.
  // Uses exponential backoff on failure: 2s → 4s → 8s → … capped at 60s.
  // Resets to the normal 30-second interval after a successful poll.
  useEffect(() => {
    if (!authed || !token) return

    const NORMAL_INTERVAL_MS = 30_000
    const MIN_BACKOFF_MS     =  2_000
    const MAX_BACKOFF_MS     = 60_000

    let delay = NORMAL_INTERVAL_MS
    let timeoutId

    const poll = async () => {
      const ok = await fetchUnreadCount()
      delay = ok
        ? NORMAL_INTERVAL_MS
        : Math.min(delay === NORMAL_INTERVAL_MS ? MIN_BACKOFF_MS : delay * 2, MAX_BACKOFF_MS)
      timeoutId = setTimeout(poll, delay)
    }

    timeoutId = setTimeout(poll, NORMAL_INTERVAL_MS)

    // Cleanup: stop polling when the user logs out or the component unmounts
    return () => clearTimeout(timeoutId)
  }, [authed, token, fetchUnreadCount])

  /**
   * Optimistically marks a single notification as read.
   * Updates local state immediately, then fires the PUT request.
   * Does not roll back on failure to avoid UI flicker for a non-critical action.
   *
   * @param {string|number} notificationId
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!token) return

    // Optimistic update — flip isRead immediately in local state
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    )
    // Decrement badge count; clamp at 0 to avoid negative values
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      await fetch(`${API_BASE_URL}/api/Notification/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      logger.error('Failed to mark notification as read', err)
    }
  }, [token])

  /**
   * Optimistically marks all notifications as read in a single operation.
   * Resets the unread badge to 0 immediately, then fires the PUT request.
   */
  const markAllAsRead = useCallback(async () => {
    if (!token) return

    // Optimistic update — mark all items read in local state
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      await fetch(`${API_BASE_URL}/api/Notification/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      logger.error('Failed to mark all notifications as read', err)
    }
  }, [token])

  /**
   * Optimistically removes a notification from the list.
   * If the notification was unread, also decrements the badge count.
   * Uses a functional state update to guarantee access to the latest list
   * (avoids stale closure issues in async contexts).
   *
   * @param {string|number} notificationId
   */
  const deleteNotification = useCallback(async (notificationId) => {
    if (!token) return

    // Optimistic update - use functional update to get current notifications
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId)
      // Only decrement count if the deleted notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(c => Math.max(0, c - 1))
      }
      return prev.filter(n => n.id !== notificationId)
    })

    try {
      await fetch(`${API_BASE_URL}/api/Notification/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      logger.error('Failed to delete notification', err)
    }
  }, [token])

  /**
   * Appends the next page of notifications to the current list.
   * No-ops if a fetch is already loading or there are no more pages.
   */
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    fetchNotifications(page + 1, true)
  }, [loading, hasMore, page, fetchNotifications])

  /**
   * Resets to page 1 and re-fetches the notification list.
   * Use this for pull-to-refresh or after an action that could add new notifications.
   */
  const refresh = useCallback(() => {
    fetchNotifications(1, false)
  }, [fetchNotifications])

  // Memoize context value to prevent unnecessary re-renders in consumers
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh
  }), [notifications, unreadCount, loading, hasMore, markAsRead, markAllAsRead, deleteNotification, loadMore, refresh])

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  )
}

export default NotificationsContext
