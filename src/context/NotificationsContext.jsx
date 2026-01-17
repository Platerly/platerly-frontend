import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from './AuthContext'
import { logger } from '../utils/logger'

/**
 * NotificationsContext
 * Manages real-time notification state for the application
 *
 * Notification types:
 * - like: Someone liked your recipe
 * - comment: Someone commented on your recipe
 * - reply: Someone replied to your comment
 * - follow: Someone followed you
 * - mention: Someone mentioned you in a comment
 * - repost: Someone reposted your recipe
 */

const NotificationsContext = createContext(null)

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
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // Fetch notifications
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
      const items = Array.isArray(data.notifications) ? data.notifications : Array.isArray(data) ? data : []

      if (append) {
        setNotifications(prev => [...prev, ...items])
      } else {
        setNotifications(items)
      }

      setUnreadCount(data.unreadCount ?? items.filter(n => !n.isRead).length)
      setHasMore(items.length === 20)
      setPage(pageNum)
    } catch (err) {
      logger.error('Failed to fetch notifications', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial fetch on auth
  useEffect(() => {
    if (authed && token) {
      fetchNotifications(1, false)
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [authed, token, fetchNotifications])

  // Fetch just the unread count (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/Notification/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) return

      const data = await res.json()
      setUnreadCount(data.count ?? data ?? 0)
    } catch {
      // Silent fail
    }
  }, [token])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!authed || !token) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [authed, token, fetchUnreadCount])

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!token) return

    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    )
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

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return

    // Optimistic update
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

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!token) return

    // Optimistic update - use functional update to get current notifications
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId)
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

  // Load more (pagination)
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    fetchNotifications(page + 1, true)
  }, [loading, hasMore, page, fetchNotifications])

  // Refresh notifications
  const refresh = useCallback(() => {
    fetchNotifications(1, false)
  }, [fetchNotifications])

  // Memoize context value to prevent unnecessary re-renders
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
