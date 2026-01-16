import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Users, UserPlus, UserMinus, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

// User row with premium styling
const UserRow = ({ u, onFollowToggle, busy, isOwnProfile }) => {
  const display = u.displayName || u.username;

  // Don't show follow button for your own profile
  const showFollowButton = typeof u.isFollowing === "boolean" && onFollowToggle && !isOwnProfile;

  return (
    <div className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-platerly-border bg-platerly-card/80 backdrop-blur-sm
                    transition-all duration-200 hover:border-platerly-green/30 hover:bg-platerly-light/50 hover:shadow-lg hover:shadow-platerly-green/5">
      <Link
        to={`/profile/${u.username}`}
        className="flex items-center gap-4 min-w-0 flex-1 focus:outline-none focus:ring-2 focus:ring-platerly-green/40 rounded-xl"
      >
        {u.profileImageUrl ? (
          <img
            src={u.profileImageUrl}
            alt={`${display} avatar`}
            className="w-14 h-14 rounded-xl object-cover border-2 border-platerly-border group-hover:border-platerly-green/30 transition-colors shadow-md"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-platerly-green/20 to-platerly-light flex items-center justify-center font-bold text-lg text-platerly-text border-2 border-platerly-border group-hover:border-platerly-green/30 transition-colors">
            {u.username?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate text-platerly-text group-hover:text-platerly-green transition-colors">
            {display}
          </div>
          <div className="text-sm text-platerly-subtle truncate">@{u.username}</div>
        </div>
      </Link>

      {/* Follow/Unfollow - hidden for own profile */}
      {showFollowButton ? (
        <Button
          onClick={() => onFollowToggle(u)}
          disabled={busy}
          loading={busy}
          variant={u.isFollowing ? "secondary" : "primary"}
          className="shrink-0"
        >
          {u.isFollowing ? (
            <>
              <UserMinus className="w-4 h-4" />
              <span className="hidden sm:inline">Unfollow</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Follow</span>
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
};

const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 rounded-2xl bg-platerly-card border border-platerly-border animate-pulse"
      >
        <div className="w-14 h-14 rounded-xl bg-platerly-light" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-platerly-light rounded-lg" />
          <div className="h-4 w-24 bg-platerly-light/70 rounded-lg" />
        </div>
        <div className="h-10 w-24 bg-platerly-light rounded-xl hidden sm:block" />
      </div>
    ))}
  </div>
);

const FollowListPage = ({ type }) => {
  const { username } = useParams();
  const { token, user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [headerUser, setHeaderUser] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  // helper: resolve userId + header info by username
  const resolveUserByUsername = async (uname) => {
    const r = await fetch(`${API_BASE_URL}/api/user/profile/${encodeURIComponent(uname)}`);
    if (!r.ok) throw new Error("profile lookup failed");
    const data = await r.json(); // { user, recipes? }
    return data?.user;
  };

  // helper: current user (viewer) from token
  const fetchMe = async () => {
    if (!token) return null;
    const r = await fetch(`${API_BASE_URL}/api/User/me`, { headers: authHeader });
    if (!r.ok) return null;
    return r.json(); // UserDto
  };

  // helper: get viewer's following ids (so we can mark isFollowing correctly)
  const fetchMyFollowingIds = async (viewerUsername) => {
    if (!viewerUsername) return new Set();
    const r = await fetch(
      `${API_BASE_URL}/api/User/${encodeURIComponent(viewerUsername)}/following`,
      { headers: authHeader }
    );
    if (!r.ok) return new Set();

    const list = await r.json(); // FollowUserDto[]
    const ids = new Set();
    (list || []).forEach((u) => {
      const id = u.id ?? u.userId ?? null;
      if (id) ids.add(id);
    });
    return ids;
  };

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      try {
        // header info for @handle display
        const header = await resolveUserByUsername(username);
        if (!alive) return;
        setHeaderUser(header);

        // list for the profile being viewed (followers or following)
        const listRes = await fetch(
          `${API_BASE_URL}/api/User/${encodeURIComponent(username)}/${type}`,
          { headers: authHeader } // safe to include; endpoint is AllowAnonymous
        );
        if (!listRes.ok) throw new Error("list fetch failed");
        const list = await listRes.json();

        // compute follow-state for the VIEWER (logged-in user)
        // so buttons show correctly (especially on your own Following page)
        let myFollowingIds = null;
        const me = await fetchMe();
        if (me?.username) {
          myFollowingIds = await fetchMyFollowingIds(me.username);
        }

        const normalized = (list || []).map((u) => {
          const id = u.id ?? u.userId ?? null;
          const isFollowing =
            myFollowingIds && id ? myFollowingIds.has(id) : undefined; // undefined = hide button

          return {
            id,
            username: u.username,
            displayName: u.displayName,
            profileImageUrl: u.profileImageUrl,
            isFollowing,
          };
        });

        if (!alive) return;
        setRows(normalized);
      } catch (e) {
        if (!alive) return;
        setRows([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, type, token]);

  // follow/unfollow inline (optimistic)
  const onToggleFollow = async (row) => {
    if (!token) return;
    const targetId = row.id;
    if (!targetId) return;

    // if we don't know follow-state, don't allow toggle here
    if (typeof row.isFollowing !== "boolean") return;

    setBusyId(targetId);
    const method = row.isFollowing ? "DELETE" : "POST";
    const url = `${API_BASE_URL}/api/User/${encodeURIComponent(targetId)}/follow`;

    // optimistic update
    setRows((prev) =>
      prev.map((r) => (r.id === targetId ? { ...r, isFollowing: !row.isFollowing } : r))
    );

    try {
      const res = await fetch(url, { method, headers: authHeader });
      if (!res.ok) throw new Error("toggle failed");
    } catch {
      // revert on failure
      setRows((prev) =>
        prev.map((r) => (r.id === targetId ? { ...r, isFollowing: row.isFollowing } : r))
      );
    } finally {
      setBusyId(null);
    }
  };

  const title = useMemo(() => {
    const handle = headerUser?.username || username;
    const cap = type === "followers" ? "Followers" : "Following";
    return `${cap} · @${handle}`;
  }, [headerUser, username, type]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  const isFollowers = type === "followers";
  const Icon = isFollowers ? Users : UserPlus;

  return (
    <div className="min-h-screen bg-platerly-dark text-platerly-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-platerly-green/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          to={`/profile/${username}`}
          className="inline-flex items-center gap-2 text-sm text-platerly-subtle hover:text-platerly-text transition-colors mb-8 focus:outline-none focus:ring-2 focus:ring-platerly-green/40 rounded-lg px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-platerly-green/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-platerly-green" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold capitalize">{type}</h1>
              <p className="text-platerly-subtle">@{headerUser?.username || username}</p>
            </div>
          </div>
        </div>

        {/* User List */}
        <div>
          {loading ? (
            <Skeleton />
          ) : rows.length ? (
            <div className="space-y-3">
              {rows.map((u) => (
                <UserRow
                  key={u.id || u.username}
                  u={u}
                  onFollowToggle={onToggleFollow}
                  busy={busyId === u.id}
                  isOwnProfile={currentUser?.username?.toLowerCase() === u.username?.toLowerCase()}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-platerly-light flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-platerly-subtle" />
              </div>
              <h3 className="text-lg font-semibold text-platerly-text">
                {isFollowers ? "No followers yet" : "Not following anyone"}
              </h3>
              <p className="text-sm text-platerly-subtle mt-1 max-w-sm mx-auto">
                {isFollowers
                  ? "When people follow this account, they'll show up here."
                  : "When this account follows people, they'll show up here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowListPage;
