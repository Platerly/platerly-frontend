import React, { useState } from 'react'
import { API_BASE_URL } from '../../utils/api'

const FollowButton = ({ targetUserId, isInitiallyFollowing }) => {
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing)

  const handleToggleFollow = async () => {
    const token = localStorage.getItem('platerly_token')
    const method = isFollowing ? 'DELETE' : 'POST'

    try {
      const res = await fetch(`${API_BASE_URL}/api/User/${targetUserId}/follow`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setIsFollowing(!isFollowing)
      } else {
        console.error('Follow/unfollow failed')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        handleToggleFollow()
      }}
      className={`text-sm px-3 py-1 rounded-full border transition duration-150 ${
        isFollowing
          ? 'text-gray-400 border-gray-600 hover:border-gray-400'
          : 'text-green-400 border-green-500 hover:border-green-400'
      }`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}

export default FollowButton
