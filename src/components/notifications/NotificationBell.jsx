import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Heart, MessageSquare, UserPlus, Repeat2, AtSign, X, Check } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'
import { useAuth } from '../../context/AuthContext'

/**
 * NotificationBell - Premium notification bell with dropdown
 * Shows unread count badge and recent notifications
 */

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHour < 24) return `${diffHour}h`
  if (diffDay < 7) return `${diffDay}d`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'like': return <Heart className="w-4 h-4 text-red-400" />
    case 'comment': return <MessageSquare className="w-4 h-4 text-blue-400" />
    case 'reply': return <MessageSquare className="w-4 h-4 text-purple-400" />
    case 'follow': return <UserPlus className="w-4 h-4 text-platerly-green" />
    case 'repost': return <Repeat2 className="w-4 h-4 text-platerly-green" />
    case 'mention': return <AtSign className="w-4 h-4 text-amber-400" />
    default: return <Bell className="w-4 h-4 text-platerly-subtle" />
  }
}

const getNotificationLink = (notification) => {
  const { type, recipeId, commentId, actorUsername } = notification

  switch (type) {
    case 'like':
    case 'comment':
    case 'reply':
    case 'repost':
    case 'mention':
      return recipeId ? `/recipe/${recipeId}` : null
    case 'follow':
      return actorUsername ? `/profile/${actorUsername}` : null
    default:
      return null
  }
}

// Build notification message from API data
const getNotificationMessage = (notification) => {
  const { type, actorUsername, actorDisplayName, recipeTitle, commentPreview } = notification
  const actor = actorDisplayName || actorUsername || 'Someone'

  switch (type) {
    case 'like':
      return `${actor} liked your recipe${recipeTitle ? ` "${recipeTitle}"` : ''}`
    case 'comment':
      return `${actor} commented on your recipe${recipeTitle ? ` "${recipeTitle}"` : ''}`
    case 'reply':
      return `${actor} replied to your comment${commentPreview ? `: "${commentPreview}"` : ''}`
    case 'follow':
      return `${actor} started following you`
    case 'repost':
      return `${actor} reposted your recipe${recipeTitle ? ` "${recipeTitle}"` : ''}`
    case 'mention':
      return `${actor} mentioned you in a comment${recipeTitle ? ` on "${recipeTitle}"` : ''}`
    default:
      return 'You have a new notification'
  }
}

const NotificationItem = ({ notification, onMarkRead, onClick }) => {
  const link = getNotificationLink(notification)
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id)
    }
    if (link) {
      navigate(link)
    }
    onClick?.()
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-3 rounded-xl transition-all ${
        notification.isRead
          ? 'bg-transparent hover:bg-platerly-light/30'
          : 'bg-platerly-green/5 hover:bg-platerly-green/10'
      }`}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            notification.isRead ? 'bg-platerly-light/50' : 'bg-platerly-light'
          }`}>
            {getNotificationIcon(notification.type)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm line-clamp-2 ${
            notification.isRead ? 'text-platerly-subtle' : 'text-platerly-text'
          }`}>
            {getNotificationMessage(notification)}
          </p>
          <p className="text-xs text-platerly-muted mt-0.5">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {!notification.isRead && (
          <div className="shrink-0">
            <div className="w-2 h-2 rounded-full bg-platerly-green" />
          </div>
        )}
      </div>
    </button>
  )
}

const NotificationBell = ({ variant = 'default' }) => {
  const { authed } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [])

  if (!authed) return null

  const recentNotifications = notifications.slice(0, 5)

  // Compact variant for mobile tab bar
  if (variant === 'compact') {
    return (
      <Link
        to="/notifications"
        className="relative p-2"
      >
        <Bell className="w-6 h-6 text-platerly-subtle" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-platerly-green text-platerly-dark text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="relative p-2 rounded-xl hover:bg-platerly-light/50 transition-colors focus:outline-none focus:ring-2 focus:ring-platerly-green/40"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className={`w-5 h-5 transition-colors ${open ? 'text-platerly-green' : 'text-platerly-subtle hover:text-platerly-text'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-platerly-green text-platerly-dark text-[10px] font-bold px-1 shadow-lg shadow-platerly-green/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] rounded-2xl border border-platerly-border bg-platerly-card/95 backdrop-blur-md shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="sticky top-0 bg-platerly-card border-b border-platerly-border px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-platerly-text">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); markAllAsRead() }}
                  className="text-xs text-platerly-green hover:underline flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false) }}
                className="p-1 rounded-lg hover:bg-platerly-light/50 text-platerly-subtle hover:text-platerly-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[50vh] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-platerly-light" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-platerly-light rounded" />
                      <div className="h-3 w-1/4 bg-platerly-light/70 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentNotifications.length > 0 ? (
              <div className="p-2 space-y-1">
                {recentNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-platerly-muted mx-auto mb-3" />
                <p className="text-sm text-platerly-subtle">No notifications yet</p>
                <p className="text-xs text-platerly-muted mt-1">
                  When someone interacts with you, you'll see it here
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="sticky bottom-0 bg-platerly-card border-t border-platerly-border px-4 py-2">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-sm text-platerly-green hover:underline font-medium"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
