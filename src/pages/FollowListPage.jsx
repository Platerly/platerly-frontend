import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

// small avatar / name row like X
const UserRow = ({ u, onFollowToggle, busy }) => {
  const display = u.displayName || u.username;
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800">
      <Link to={`/user/${u.username}`} className="flex items-center gap-3 min-w-0">
        {u.profileImageUrl ? (
          <img src={u.profileImageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center font-semibold">
            {u.username?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-medium truncate">{display}</div>
          <div className="text-xs text-neutral-400 truncate">@{u.username}</div>
          {u.bio ? <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{u.bio}</div> : null}
        </div>
      </Link>

      {/* show Follow/Unfollow if the API included `isFollowing` or we infer from row */}
      {typeof u.isFollowing === "boolean" && onFollowToggle ? (
        <button
          disabled={busy}
          onClick={() => onFollowToggle(u)}
          className={`px-3 py-1.5 rounded-xl text-sm border transition ${
            u.isFollowing
              ? "bg-neutral-800 border-red-500 text-red-400 hover:bg-red-900/40"
              : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
          }`}
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
      <div key={i} className="h-16 rounded-2xl bg-neutral-900/70 border border-neutral-900 animate-pulse" />
    ))}
  </div>
);

const FollowListPage = ({ type }) => {
  const { username } = useParams();
  const { token, user: me } = useAuth();
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
    return data?.user; // expects { id, username, displayName, ... }
  };

  // try username param first; if server doesn’t support it, fall back to userId
  const fetchList = async (uname) => {
    // first, fetch header user (for display + potential fallback id)
    const u = await resolveUserByUsername(uname);
    setHeaderUser(u);

    const tryUsername = async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/Follow/${type}?username=${encodeURIComponent(uname)}`,
        { headers: authHeader }
      );
      if (!res.ok) throw new Error("username not supported");
      return res.json();
    };

    const tryUserId = async () => {
      if (!u?.id) throw new Error("no userId to use");
      const res = await fetch(
        `${API_BASE_URL}/api/Follow/${type}?userId=${encodeURIComponent(u.id)}`,
        { headers: authHeader }
      );
      if (!res.ok) throw new Error("userId query failed");
      return res.json();
    };

    try {
      return await tryUsername();
    } catch {
      return await tryUserId();
    }
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchList(username)
      .then((list) => {
        if (!alive) return;
        // normalize shape a bit: expect { id, username, displayName, profileImageUrl, bio, isFollowing? }
        const normalized = (list || []).map((u) => ({
          id: u.id ?? u.userId ?? null,
          username: u.username,
          displayName: u.displayName,
          profileImageUrl: u.profileImageUrl,
          bio: u.bio,
          // if backend didn’t include following state, infer false for safety
          isFollowing: typeof u.isFollowing === "boolean" ? u.isFollowing : false,
        }));
        setRows(normalized);
      })
      .catch(() => setRows([]))
      .finally(() => alive && setLoading(false));
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

    setBusyId(targetId);
    const method = row.isFollowing ? "DELETE" : "POST";
    const url = `${API_BASE_URL}/api/Follow/${targetId}`;

    // optimistic update
    setRows((prev) => prev.map((r) => (r.id === targetId ? { ...r, isFollowing: !row.isFollowing } : r)));
    try {
      const res = await fetch(url, { method, headers: authHeader });
      if (!res.ok) throw new Error("toggle failed");
    } catch {
      // revert on failure
      setRows((prev) => prev.map((r) => (r.id === targetId ? { ...r, isFollowing: row.isFollowing } : r)));
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
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-5">
        <Link to={`/profile/${username}`} className="text-sm text-neutral-400 hover:underline">
          ← Back to profile
        </Link>
      </div>

      <h1 className="text-xl font-semibold capitalize">
        {type} <span className="text-neutral-400">· @{headerUser?.username || username}</span>
      </h1>

      <div className="mt-4">{loading ? <Skeleton /> : rows.length ? (
        <div className="space-y-2">
          {rows.map((u) => (
            <UserRow key={u.id || u.username} u={u} onFollowToggle={onToggleFollow} busy={busyId === u.id} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-neutral-400">No users yet.</div>
      )}</div>
    </div>
  );
};

export default FollowListPage;
