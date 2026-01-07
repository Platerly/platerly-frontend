import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

// small avatar / name row like X
const UserRow = ({ u, onFollowToggle, busy }) => {
  const display = u.displayName || u.username;

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-platerly-light bg-platerly-card md:hover:bg-platerly-light/30 transition">
      <Link
        to={`/profile/${u.username}`}
        className="flex items-center gap-3 min-w-0 focus:outline-none focus:ring-2 focus:ring-platerly-green/40 rounded-xl"
      >
        {u.profileImageUrl ? (
          <img
            src={u.profileImageUrl}
            alt={`${display} avatar`}
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-platerly-light"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-platerly-light/50 flex items-center justify-center font-semibold text-platerly-text">
            {u.username?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}

        <div className="min-w-0">
          <div className="font-medium truncate text-platerly-text">{display}</div>
          <div className="text-xs text-platerly-subtle truncate">@{u.username}</div>
        </div>
      </Link>

      {/* Follow/Unfollow only when we KNOW isFollowing */}
      {typeof u.isFollowing === "boolean" && onFollowToggle ? (
        <button
          disabled={busy}
          onClick={() => onFollowToggle(u)}
          className={`px-3 py-1.5 rounded-xl text-sm border transition focus:outline-none focus:ring-2 focus:ring-platerly-green/40 ${
            u.isFollowing
              ? "bg-transparent border-platerly-light text-platerly-subtle md:hover:bg-platerly-light/30"
              : "bg-platerly-green text-platerly-dark border-transparent md:hover:opacity-90"
          } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {busy ? "…" : u.isFollowing ? "Unfollow" : "Follow"}
        </button>
      ) : null}
    </div>
  );
};

const Skeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="h-16 rounded-2xl bg-platerly-light/40 border border-platerly-light animate-pulse"
      />
    ))}
  </div>
);

const FollowListPage = ({ type }) => {
  const { username } = useParams();
  const { token } = useAuth();

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

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 text-platerly-text">
      <div className="mb-5">
        <Link
          to={`/profile/${username}`}
          className="text-sm text-platerly-subtle hover:underline focus:outline-none focus:ring-2 focus:ring-platerly-green/40 rounded"
        >
          ← Back to profile
        </Link>
      </div>

      <h1 className="text-xl font-semibold capitalize">
        {type}{" "}
        <span className="text-platerly-subtle">· @{headerUser?.username || username}</span>
      </h1>

      <div className="mt-4">
        {loading ? (
          <Skeleton />
        ) : rows.length ? (
          <div className="space-y-2">
            {rows.map((u) => (
              <UserRow
                key={u.id || u.username}
                u={u}
                onFollowToggle={onToggleFollow}
                busy={busyId === u.id}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-platerly-subtle">No users yet.</div>
        )}
      </div>
    </div>
  );
};

export default FollowListPage;
