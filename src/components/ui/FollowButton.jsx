import React, { useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { API_BASE_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { logger } from "../../utils/logger";

const FollowButton = ({
  targetUserId,
  isInitiallyFollowing = false,
  variant = "outline", // 'outline' | 'solid'
  fullWidth = false,
}) => {
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleToggleFollow = async () => {
    if (!token || !targetUserId || loading) return;

    // Optimistic update - change UI immediately
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setLoading(true);

    const method = wasFollowing ? "DELETE" : "POST";

    try {
      const res = await fetch(`${API_BASE_URL}/api/User/${targetUserId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Revert on failure
        setIsFollowing(wasFollowing);
        throw new Error("Follow/unfollow failed");
      }
    } catch (err) {
      // Revert on error
      setIsFollowing(wasFollowing);
      logger.error('Follow toggle failed', err);
    } finally {
      setLoading(false);
    }
  };

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-recipzee-dark select-none min-h-[44px]";

  const variants = {
    outline: isFollowing
      ? "text-recipzee-subtle border border-recipzee-border bg-transparent hover:text-recipzee-text hover:border-recipzee-green/30 hover:bg-recipzee-light/50 focus:ring-recipzee-green/50"
      : "text-recipzee-green border border-recipzee-green/50 hover:bg-recipzee-green/10 focus:ring-recipzee-green/50",
    solid: isFollowing
      ? "bg-recipzee-light text-recipzee-subtle border border-recipzee-border hover:bg-recipzee-light/70 hover:border-recipzee-green/30 focus:ring-recipzee-green/50"
      : "bg-recipzee-green text-recipzee-dark border border-transparent hover:brightness-110 focus:ring-recipzee-green/50",
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleToggleFollow();
      }}
      disabled={loading}
      aria-pressed={isFollowing}
      className={[
        baseStyles,
        variants[variant],
        fullWidth ? "w-full" : "px-4 sm:px-5 py-2 text-sm",
        loading && "opacity-60 cursor-not-allowed",
      ].join(" ")}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
          />
        </svg>
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
