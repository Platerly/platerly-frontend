import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell, Heart, MessageSquare, UserPlus, Repeat2, AtSign,
  Trash2, Check, CheckCheck, ArrowLeft, Book, CheckCircle, XCircle, Flame
} from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext'
import { useAuth } from '../context/AuthContext'

/**
 * NotificationsPage - Full notifications view with filtering and actions
 */

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHour < 24) return `${diffHour} hr ago`
  if (diffDay < 7) return `${diffDay} days ago`
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const getNotificationIcon = (type, size = 'normal') => {
  const iconClass = size === 'large' ? 'w-5 h-5' : 'w-4 h-4'

  switch (type) {
    case 'like': return <Heart className={`${iconClass} text-red-400`} />
    case 'comment': return <MessageSquare className={`${iconClass} text-blue-400`} />
    case 'reply': return <MessageSquare className={`${iconClass} text-purple-400`} />
    case 'follow': return <UserPlus className={`${iconClass} text-recipzee-green`} />
    case 'repost': return <Repeat2 className={`${iconClass} text-recipzee-green`} />
    case 'mention': return <AtSign className={`${iconClass} text-amber-400`} />
    case 'cookbookinvite': return <Book className={`${iconClass} text-recipzee-green`} />
    case 'cookbookreciperequest': return <Book className={`${iconClass} text-blue-400`} />
    case 'cookbookrequestapproved': return <CheckCircle className={`${iconClass} text-recipzee-green`} />
    case 'cookbookrequestrejected': return <XCircle className={`${iconClass} text-red-400`} />
    case 'recipetrending': return <Flame className={`${iconClass} text-orange-400`} />
    default: return <Bell className={`${iconClass} text-recipzee-subtle`} />
  }
}

const getNotificationLink = (notification) => {
  const { type, recipeId, actorUsername, cookbookId } = notification

  switch (type) {
    case 'like':
    case 'comment':
    case 'reply':
    case 'repost':
    case 'mention':
      return recipeId ? `/recipe/${recipeId}` : null
    case 'follow':
      return actorUsername ? `/profile/${actorUsername}` : null
    case 'cookbookinvite':
    case 'cookbookreciperequest':
    case 'cookbookrequestapproved':
    case 'cookbookrequestrejected':
      return cookbookId ? `/cookbook/${cookbookId}` : null
    case 'recipetrending':
      return recipeId ? `/recipe/${recipeId}` : null
    default:
      return null
  }
}

// Build notification message from API data
const getNotificationMessage = (notification) => {
  const { type, actorUsername, actorDisplayName, recipeTitle, commentPreview, cookbookTitle } = notification
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
    case 'cookbookinvite':
      return `${actor} added you as a contributor to${cookbookTitle ? ` "${cookbookTitle}"` : ' a cookbook'}`
    case 'cookbookreciperequest':
      return `${actor} wants to add${recipeTitle ? ` "${recipeTitle}"` : ' a recipe'} to your cookbook${cookbookTitle ? ` "${cookbookTitle}"` : ''}`
    case 'cookbookrequestapproved':
      return `Your recipe${recipeTitle ? ` "${recipeTitle}"` : ''} was added to${cookbookTitle ? ` "${cookbookTitle}"` : ' a cookbook'}`
    case 'cookbookrequestrejected':
      return `Your request to add${recipeTitle ? ` "${recipeTitle}"` : ' a recipe'} to${cookbookTitle ? ` "${cookbookTitle}"` : ' a cookbook'} was declined`
    case 'recipetrending':
      return `Your recipe${recipeTitle ? ` "${recipeTitle}"` : ''} is now trending!`
    default:
      return 'You have a new notification'
  }
}

const NotificationCard = ({ notification, onMarkRead, onDelete }) => {
  const navigate = useNavigate()
  const link = getNotificationLink(notification)

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id)
    }
    if (link) {
      navigate(link)
    }
  }

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        notification.isRead
          ? 'border-recipzee-border bg-recipzee-card/50 hover:bg-recipzee-card/80'
          : 'border-recipzee-green/30 bg-recipzee-green/5 hover:bg-recipzee-green/10'
      }`}
    >
      <button
        onClick={handleClick}
        className="w-full text-left p-4 sm:p-5"
      >
        <div className="flex gap-4">
          {/* Icon */}
          <div className="shrink-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              notification.isRead ? 'bg-recipzee-light/50' : 'bg-recipzee-light'
            }`}>
              {getNotificationIcon(notification.type, 'large')}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm sm:text-base ${
                notification.isRead ? 'text-recipzee-subtle' : 'text-recipzee-text font-medium'
              }`}>
                {getNotificationMessage(notification)}
              </p>
              {!notification.isRead && (
                <div className="shrink-0 mt-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-recipzee-green shadow-lg shadow-recipzee-green/30" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-recipzee-muted">
                {formatRelativeTime(notification.createdAt)}
              </span>
              {notification.actorUsername && (
                <Link
                  to={`/profile/${notification.actorUsername}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-recipzee-green hover:underline"
                >
                  @{notification.actorUsername}
                </Link>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Actions - show on hover */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        {!notification.isRead && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id) }}
            className="p-2 rounded-lg bg-recipzee-card/80 hover:bg-recipzee-light text-recipzee-subtle hover:text-recipzee-text transition-colors"
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }}
          className="p-2 rounded-lg bg-recipzee-card/80 hover:bg-red-500/20 text-recipzee-subtle hover:text-red-400 transition-colors"
          title="Delete notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

const SkeletonCard = () => (
  <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/50 p-5 animate-pulse">
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-xl bg-recipzee-light" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-recipzee-light rounded" />
        <div className="h-3 w-1/4 bg-recipzee-light/70 rounded" />
      </div>
    </div>
  </div>
)

const NotificationsPage = () => {
  const { authed } = useAuth()
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore
  } = useNotifications()

  useEffect(() => {
    document.title = 'Notifications - Recipzee'
  }, [])

  // Redirect if not logged in
  if (!authed) {
    return (
      <div className="min-h-screen bg-recipzee-dark text-recipzee-text flex items-center justify-center px-4">
        <div className="text-center">
          <Bell className="w-12 h-12 text-recipzee-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to view notifications</h2>
          <p className="text-recipzee-subtle mb-4">Stay updated on activity related to your recipes and profile.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-recipzee-green text-recipzee-dark rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-recipzee-green/20"
          >
            Log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-recipzee-green/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 text-sm text-recipzee-subtle hover:text-recipzee-text transition-colors mb-8 focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 rounded-lg px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-recipzee-green/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-recipzee-green" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
              <p className="text-recipzee-subtle text-sm mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-recipzee-border bg-recipzee-card/50 hover:bg-recipzee-light/50 text-sm font-medium transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading && notifications.length === 0 ? (
            // Loading state
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : notifications.length > 0 ? (
            // Notifications list
            <>
              {notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="pt-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl border border-recipzee-border bg-recipzee-card/50 hover:bg-recipzee-light/50 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          ) : (
            // Empty state
            <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/30 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-recipzee-light flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-recipzee-muted" />
              </div>
              <h3 className="text-lg font-semibold text-recipzee-text">No notifications yet</h3>
              <p className="text-sm text-recipzee-subtle mt-1 max-w-sm mx-auto">
                When someone likes, comments, or interacts with your content, you'll see it here.
              </p>
              <Link
                to="/feed"
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-recipzee-green text-recipzee-dark rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-recipzee-green/20"
              >
                Explore recipes
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
