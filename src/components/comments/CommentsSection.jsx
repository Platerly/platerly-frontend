import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { API_BASE_URL } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { logger } from '../../utils/logger'
import ConfirmDialog from '../common/ConfirmDialog'
import {
  MessageSquare, Heart, Reply, MoreHorizontal,
  Pencil, Trash2, X, Send, ChevronDown, ChevronUp
} from 'lucide-react'

/**
 * CommentsSection - Premium comments with edit/delete/reply/likes
 * Features:
 * - Threaded replies (1 level deep for simplicity)
 * - Like/unlike comments
 * - Edit own comments
 * - Delete own comments
 * - @mention support (visual only - links to profiles)
 * - Optimistic updates
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
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Parse @mentions in text and render as links
const renderWithMentions = (text) => {
  const parts = text.split(/(@\w+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.slice(1)
      return (
        <Link
          key={i}
          to={`/profile/${username}`}
          className="text-recipzee-green hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      )
    }
    return <span key={i}>{part}</span>
  })
}

const CommentInput = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  submitLabel = 'Post',
  loading = false,
  autoFocus = false
}) => {
  const textareaRef = useRef(null)
  const dropdownRef = useRef(null)
  const [mentionState, setMentionState] = useState({
    isOpen: false,
    query: '',
    startPos: -1,
    results: [],
    selectedIndex: 0,
    loading: false
  })
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // Search for users when mention query changes
  useEffect(() => {
    if (!mentionState.isOpen || !mentionState.query) {
      setMentionState(prev => ({ ...prev, results: [], loading: false }))
      return
    }

    // Debounce search
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    setMentionState(prev => ({ ...prev, loading: true }))
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/User/search?q=${encodeURIComponent(mentionState.query)}&limit=6`)
        if (res.ok) {
          const users = await res.json()
          setMentionState(prev => ({
            ...prev,
            results: Array.isArray(users) ? users : [],
            selectedIndex: 0,
            loading: false
          }))
        }
      } catch (err) {
        logger.error('Mention search failed', err)
        setMentionState(prev => ({ ...prev, results: [], loading: false }))
      }
    }, 150)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [mentionState.query, mentionState.isOpen])

  // Detect @ mentions as user types
  const handleChange = (e) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart
    onChange(newValue)

    // Check if we're in a mention context
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const query = mentionMatch[1]
      const startPos = cursorPos - query.length - 1 // -1 for @
      setMentionState(prev => ({
        ...prev,
        isOpen: true,
        query,
        startPos,
        selectedIndex: 0
      }))
    } else {
      setMentionState(prev => ({ ...prev, isOpen: false, query: '', startPos: -1 }))
    }
  }

  // Insert selected mention
  const insertMention = (username) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const before = value.slice(0, mentionState.startPos)
    const after = value.slice(textarea.selectionStart)
    const newValue = `${before}@${username} ${after}`

    onChange(newValue)
    setMentionState(prev => ({ ...prev, isOpen: false, query: '', startPos: -1, results: [] }))

    // Restore focus and set cursor position after the mention
    setTimeout(() => {
      const newPos = mentionState.startPos + username.length + 2 // @ + username + space
      textarea.focus()
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleKeyDown = (e) => {
    // Handle mention dropdown navigation
    if (mentionState.isOpen && mentionState.results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionState(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1)
        }))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionState(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, 0)
        }))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const selected = mentionState.results[mentionState.selectedIndex]
        if (selected) insertMention(selected.username)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionState(prev => ({ ...prev, isOpen: false }))
        return
      }
    }

    // Normal shortcuts
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit()
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel()
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          rows={3}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay closing to allow click on dropdown
            setTimeout(() => setMentionState(prev => ({ ...prev, isOpen: false })), 150)
          }}
          placeholder={placeholder}
          disabled={loading}
          className="w-full bg-recipzee-light/50 border border-recipzee-border text-recipzee-text rounded-xl p-3 text-sm placeholder:text-recipzee-muted focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:border-recipzee-green/30 transition-all resize-none disabled:opacity-50"
        />

        {/* Mention autocomplete dropdown */}
        {mentionState.isOpen && (mentionState.results.length > 0 || mentionState.loading) && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 bottom-full mb-1 z-20 bg-recipzee-card border border-recipzee-border rounded-xl shadow-xl overflow-hidden"
          >
            {mentionState.loading && mentionState.results.length === 0 ? (
              <div className="px-3 py-2 text-sm text-recipzee-subtle">Searching...</div>
            ) : (
              <ul className="max-h-48 overflow-y-auto">
                {mentionState.results.map((user, idx) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault() // Prevent blur
                        insertMention(user.username)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        idx === mentionState.selectedIndex
                          ? 'bg-recipzee-green/10 text-recipzee-green'
                          : 'hover:bg-recipzee-light/50'
                      }`}
                    >
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-recipzee-border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-recipzee-green/20 flex items-center justify-center text-xs font-bold text-recipzee-green">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-recipzee-text truncate">
                          @{user.username}
                        </div>
                        {user.displayName && (
                          <div className="text-xs text-recipzee-subtle truncate">
                            {user.displayName}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-recipzee-muted">
          Tip: Type @ to mention someone. Ctrl+Enter to post.
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-3 py-1.5 text-sm text-recipzee-subtle hover:text-recipzee-text transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onSubmit}
            disabled={loading || !value.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-recipzee-green text-recipzee-dark rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-recipzee-green/20"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const Comment = ({
  comment,
  currentUser,
  token,
  recipeId,
  onUpdate,
  onDelete,
  onReply,
  onConfirmDelete,
  depth = 0
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  // Map API field names: likesCount -> likeCount, isLiked -> isLiked
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const menuRef = useRef(null)

  const isOwner = currentUser?.username?.toLowerCase() === comment.username?.toLowerCase()
  const replies = comment.replies || []

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleLike = async () => {
    if (!token) return

    // Optimistic update
    const wasLiked = isLiked
    const prevCount = likeCount
    setIsLiked(!wasLiked)
    setLikeCount(prev => prev + (wasLiked ? -1 : 1))

    try {
      // Fixed URL: include recipeId in path
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${recipeId}/comments/${comment.id}/like`, {
        method: wasLiked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Like failed')
      const data = await res.json()
      setLikeCount(data.likesCount ?? likeCount)
    } catch (err) {
      // Revert on failure
      setIsLiked(wasLiked)
      setLikeCount(prevCount)
      logger.error('Comment like failed', err)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) return
    setLoading(true)

    try {
      // Fixed URL: include recipeId in path
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${recipeId}/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent })
      })
      if (!res.ok) throw new Error('Edit failed')

      onUpdate({ ...comment, content: editContent, updatedAt: new Date().toISOString() })
      setIsEditing(false)
    } catch (err) {
      logger.error('Comment edit failed', err)
      toast.error('Failed to save your edit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    // Use the confirm dialog instead of window.confirm
    onConfirmDelete(comment.id)
  }

  const handleReply = async () => {
    if (!replyContent.trim()) return
    setLoading(true)

    try {
      // Fixed URL: use replies endpoint
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${recipeId}/comments/${comment.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyContent })
      })
      if (!res.ok) throw new Error('Reply failed')

      const newReply = await res.json()
      onReply(comment.id, newReply)
      setReplyContent('')
      setShowReplyInput(false)
    } catch (err) {
      logger.error('Comment reply failed', err)
      toast.error('Failed to post your reply. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-recipzee-border/50' : ''}`}>
      <div className="rounded-xl border border-recipzee-border bg-recipzee-card/50 backdrop-blur-sm p-4 transition-all hover:border-recipzee-border/80">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link
              to={`/profile/${comment.username}`}
              className="flex items-center gap-2 group"
            >
              {comment.profileImageUrl ? (
                <img
                  src={comment.profileImageUrl}
                  alt={comment.username}
                  className="w-8 h-8 rounded-full object-cover border border-recipzee-border group-hover:border-recipzee-green/30 transition-colors"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-recipzee-green/20 flex items-center justify-center text-xs font-bold text-recipzee-green">
                  {comment.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="font-medium text-sm text-recipzee-text group-hover:text-recipzee-green transition-colors">
                @{comment.username}
              </span>
            </Link>
            <span className="text-xs text-recipzee-muted">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.updatedAt && (
              <span className="text-xs text-recipzee-muted italic">(edited)</span>
            )}
          </div>

          {/* Menu for owner */}
          {isOwner && (
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
                className="p-1.5 rounded-lg text-recipzee-subtle hover:text-recipzee-text hover:bg-recipzee-light/50 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-32 rounded-xl bg-recipzee-card border border-recipzee-border shadow-xl overflow-hidden z-10">
                  <button
                    onClick={() => { setIsEditing(true); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-recipzee-light/50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { handleDelete(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-recipzee-light/50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <CommentInput
            value={editContent}
            onChange={setEditContent}
            onSubmit={handleEdit}
            onCancel={() => { setIsEditing(false); setEditContent(comment.content) }}
            submitLabel="Save"
            loading={loading}
            autoFocus
          />
        ) : (
          <p className="text-sm text-recipzee-text/90 whitespace-pre-wrap">
            {renderWithMentions(comment.content)}
          </p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-recipzee-border/50">
            <button
              onClick={handleLike}
              disabled={!token}
              className={`inline-flex items-center gap-1.5 text-xs transition-colors ${
                isLiked
                  ? 'text-red-400'
                  : 'text-recipzee-subtle hover:text-red-400'
              } disabled:opacity-50`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-400' : ''}`} />
              {likeCount > 0 && likeCount}
            </button>

            {depth === 0 && token && (
              <button
                onClick={() => setShowReplyInput(v => !v)}
                className="inline-flex items-center gap-1.5 text-xs text-recipzee-subtle hover:text-recipzee-green transition-colors"
              >
                <Reply className="w-4 h-4" />
                Reply
              </button>
            )}

            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(v => !v)}
                className="inline-flex items-center gap-1 text-xs text-recipzee-subtle hover:text-recipzee-text transition-colors ml-auto"
              >
                {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reply Input */}
      {showReplyInput && (
        <div className="mt-3 ml-8">
          <CommentInput
            value={replyContent}
            onChange={setReplyContent}
            onSubmit={handleReply}
            onCancel={() => { setShowReplyInput(false); setReplyContent('') }}
            placeholder={`Reply to @${comment.username}...`}
            submitLabel="Reply"
            loading={loading}
            autoFocus
          />
        </div>
      )}

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              token={token}
              recipeId={recipeId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReply={onReply}
              onConfirmDelete={onConfirmDelete}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const CommentsSection = ({ recipeId, initialComments = [] }) => {
  const { token, user } = useAuth()
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, commentId: null, loading: false })

  // Organize comments into threads
  // Backend returns nested replies in comment.replies, but we also handle
  // optimistically added replies in the flat comments array
  const threadedComments = useMemo(() => {
    const roots = []
    const childrenMap = {}

    for (const c of comments) {
      if (c.parentCommentId) {
        // This is a reply added optimistically to the flat array
        if (!childrenMap[c.parentCommentId]) {
          childrenMap[c.parentCommentId] = []
        }
        childrenMap[c.parentCommentId].push(c)
      } else {
        roots.push(c)
      }
    }

    // Attach replies to parents, merging API-provided replies with optimistic ones
    return roots.map(root => {
      const apiReplies = root.replies || []
      const optimisticReplies = childrenMap[root.id] || []
      // Merge, avoiding duplicates by id
      const apiReplyIds = new Set(apiReplies.map(r => r.id))
      const mergedReplies = [
        ...apiReplies,
        ...optimisticReplies.filter(r => !apiReplyIds.has(r.id))
      ]
      return {
        ...root,
        replies: mergedReplies
      }
    })
  }, [comments])

  const handlePost = async () => {
    if (!newComment.trim() || !token) return
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${recipeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipeId, content: newComment })
      })
      if (!res.ok) throw new Error('Failed to post comment')

      const newC = await res.json()
      setComments(prev => [newC, ...prev])
      setNewComment('')
    } catch (err) {
      logger.error('Post comment failed', err)
      toast.error('Failed to post your comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = (updated) => {
    setComments(prev => prev.map(c => {
      // Check if this is the comment being updated
      if (c.id === updated.id) return updated
      // Check if the updated comment is a reply within this comment's replies
      if (c.replies && c.replies.length > 0) {
        const updatedReplies = c.replies.map(r => r.id === updated.id ? updated : r)
        if (updatedReplies.some((r, i) => r !== c.replies[i])) {
          return { ...c, replies: updatedReplies }
        }
      }
      return c
    }))
  }

  const handleDelete = (id) => {
    setComments(prev => prev
      // Remove the comment if it's a top-level comment or a reply in the flat array
      .filter(c => c.id !== id && c.parentCommentId !== id)
      // Also remove from nested replies within parent comments
      .map(c => {
        if (c.replies && c.replies.length > 0) {
          const filteredReplies = c.replies.filter(r => r.id !== id)
          if (filteredReplies.length !== c.replies.length) {
            return { ...c, replies: filteredReplies }
          }
        }
        return c
      })
    )
  }

  const handleReply = (parentId, reply) => {
    setComments(prev => [...prev, reply])
  }

  const handleConfirmDelete = (commentId) => {
    setDeleteConfirm({ open: true, commentId, loading: false })
  }

  const executeDelete = async () => {
    if (!deleteConfirm.commentId) return
    setDeleteConfirm(prev => ({ ...prev, loading: true }))

    try {
      const res = await fetch(`${API_BASE_URL}/api/Recipe/${recipeId}/comments/${deleteConfirm.commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Delete failed')
      handleDelete(deleteConfirm.commentId)
      setDeleteConfirm({ open: false, commentId: null, loading: false })
    } catch (err) {
      logger.error('Comment delete failed', err)
      toast.error('Failed to delete comment. Please try again.')
      setDeleteConfirm(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-recipzee-green/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-recipzee-green" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-recipzee-text">Comments</h3>
          <p className="text-sm text-recipzee-subtle">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</p>
        </div>
      </div>

      {/* New Comment Form */}
      {token ? (
        <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/70 backdrop-blur-sm p-4">
          <CommentInput
            value={newComment}
            onChange={setNewComment}
            onSubmit={handlePost}
            loading={loading}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/50 p-4 text-center">
          <p className="text-sm text-recipzee-subtle">
            <Link to="/login" className="text-recipzee-green hover:underline font-medium">Log in</Link> to join the conversation.
          </p>
        </div>
      )}

      {/* Comments List */}
      {threadedComments.length > 0 ? (
        <div className="space-y-4">
          {threadedComments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUser={user}
              token={token}
              recipeId={recipeId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onReply={handleReply}
              onConfirmDelete={handleConfirmDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/30 p-8 text-center">
          <MessageSquare className="w-10 h-10 text-recipzee-muted mx-auto mb-3" />
          <p className="text-recipzee-subtle">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !deleteConfirm.loading && setDeleteConfirm({ open, commentId: open ? deleteConfirm.commentId : null, loading: false })}
        title="Delete Comment"
        description="This action cannot be undone. Are you sure you want to delete this comment?"
        confirmLabel={deleteConfirm.loading ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm({ open: false, commentId: null, loading: false })}
      />
    </div>
  )
}

export default CommentsSection
