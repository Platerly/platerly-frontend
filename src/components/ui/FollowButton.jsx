import React, { useState } from "react";
import { API_BASE_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

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
    setLoading(true);
    const method = isFollowing ? "DELETE" : "POST";

    try {
      const res = await fetch(`${API_BASE_URL}/api/User/${targetUserId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Follow/unfollow failed");
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const baseStyles =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 select-none min-h-[44px]";

  const variants = {
    outline: isFollowing
      ? "text-platerly-subtle border border-platerly-border bg-transparent hover:text-white hover:border-white/50 focus:ring-emerald-500"
      : "text-emerald-400 border border-emerald-500 hover:bg-emerald-900/30 focus:ring-emerald-500",
    solid: isFollowing
      ? "bg-platerly-border text-platerly-subtle hover:bg-platerly-border/70 focus:ring-emerald-500"
      : "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
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
        fullWidth ? "w-full" : "px-4 sm:px-5 py-1.5 text-sm",
        loading && "opacity-60 cursor-not-allowed",
      ].join(" ")}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
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
      ) : null}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
