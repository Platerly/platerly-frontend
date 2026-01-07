// src/pages/UserProfilePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/fetchWithAuth";
import { API_BASE_URL } from "../utils/api";
import CookbookCard from "../components/ui/CookbookCard";

/* ---------- helpers ---------- */
const escapeHTML = (s = "") =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function autolinkBio(text = "") {
  const safe = escapeHTML(text);
  return safe
    .replace(
      /(https?:\/\/[^\s)]+)|((?<!\w)www\.[^\s)]+)/gi,
      (m) =>
        `<a href="${m.startsWith("http") ? m : `https://${m}`}" target="_blank" rel="noopener noreferrer" class="underline">${m}</a>`
    )
    .replace(
      /(^|\s)#([a-z0-9_]{2,30})/gi,
      (_match, p1, p2) =>
        `${p1}<a class="underline" href="/tags/${p2.toLowerCase()}">#${p2}</a>`
    )
    .replace(/\n/g, "<br/>");
}

const withScheme = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `https://${u}`);

const Skeleton = () => (
  <div className="mx-auto max-w-5xl animate-pulse">
    <div className="h-48 md:h-56 bg-platerly-light rounded-b-2xl" />
    <div className="px-4 md:px-6 -mt-10 flex gap-4 items-end">
      <div className="w-24 h-24 rounded-2xl bg-platerly-card border-4 border-platerly-dark" />
      <div className="h-6 w-48 bg-platerly-card rounded" />
    </div>
  </div>
);

const EmptyState = ({ title, subtitle }) => (
  <div className="py-12 text-center">
    <h3 className="font-semibold text-platerly-text">{title}</h3>
    <p className="text-sm text-platerly-muted mt-1">{subtitle}</p>
  </div>
);

/* ---------- component ---------- */
const UserProfilePage = () => {
  const { username } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [cookbooks, setCookbooks] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // ✅ correct meaning: does CURRENT USER follow THIS PROFILE?
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileRef = useRef(null);

  const tab = (searchParams.get("tab") || "recipes").toLowerCase();
  const setTab = (t) => setSearchParams({ tab: t });
  const isOwnProfile = user?.username?.toLowerCase() === username?.toLowerCase();

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // normalize one cookbook row from various shapes
  const normalizeCookbook = (c) => {
    if (!c) return null;

    const id = c.id ?? c.Id ?? c.cookbookId ?? c.CookbookId;
    const title = c.title ?? c.Title ?? "Untitled";
    const description = c.description ?? c.Description ?? "";
    const isPublic = (typeof c.isPublic === "boolean" ? c.isPublic : c.IsPublic) ?? false;
    const createdAt = c.createdAt ?? c.CreatedAt ?? null;

    // recipe count across shapes
    const recipeCount =
      (typeof c.recipeCount === "number" && c.recipeCount) ??
      (typeof c.recipesCount === "number" && c.recipesCount) ??
      (typeof c.totalRecipes === "number" && c.totalRecipes) ??
      (typeof c.RecipeCount === "number" && c.RecipeCount) ??
      (Array.isArray(c.recipes) ? c.recipes.length : undefined);

    // cover across shapes
    const coverImageUrl =
      c.coverImageUrl ??
      c.coverUrl ??
      c.imageUrl ??
      c.CoverImageUrl ??
      c.ImageUrl ??
      null;

    return { id, title, description, isPublic, createdAt, recipeCount, coverImageUrl };
  };

  // fetch details for any cookbook missing cover or count
  const hydrateMissingCookbookBits = async (rows) => {
    const needHydrate = rows.filter((r) => !r || r.coverImageUrl == null || typeof r.recipeCount !== "number");
    if (needHydrate.length === 0) return rows;

    const byId = new Map(rows.map((r) => [r.id, { ...r }]));

    await Promise.all(
      needHydrate.map(async (r) => {
        try {
          const res = await apiFetch(`${API_BASE_URL}/api/Cookbook/${r.id}`, { headers: authHeaders });
          if (!res.ok) return;
          const json = await res.json();
          const full = normalizeCookbook(json);
          if (!full) return;
          const base = byId.get(full.id) || {};
          byId.set(full.id, {
            ...base,
            coverImageUrl: base.coverImageUrl ?? full.coverImageUrl ?? null,
            recipeCount:
              typeof base.recipeCount === "number"
                ? base.recipeCount
                : typeof full.recipeCount === "number"
                ? full.recipeCount
                : 0,
            title: base.title ?? full.title,
            description: base.description ?? full.description,
            isPublic: typeof base.isPublic === "boolean" ? base.isPublic : full.isPublic ?? false,
            createdAt: base.createdAt ?? full.createdAt ?? null,
            id: base.id ?? full.id,
          });
        } catch {
          // ignore hydration failures silently
        }
      })
    );

    return Array.from(byId.values());
  };

  /* ---------- fetch profile ---------- */
  useEffect(() => {
    if (authLoading) return;
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setError("");

      try {
        // ✅ Use UserController endpoints for followers/following by username
        const [userRes, cookbooksRes, followersRes, followingRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/user/profile/${encodeURIComponent(username)}`, {
            signal: ac.signal,
            headers: authHeaders,
          }),
          apiFetch(`${API_BASE_URL}/api/user/profile/${encodeURIComponent(username)}/cookbooks`, {
            signal: ac.signal,
            headers: authHeaders,
          }),
          apiFetch(`${API_BASE_URL}/api/User/${encodeURIComponent(username)}/followers`, {
            signal: ac.signal,
            headers: authHeaders,
          }),
          apiFetch(`${API_BASE_URL}/api/User/${encodeURIComponent(username)}/following`, {
            signal: ac.signal,
            headers: authHeaders,
          }),
        ]);

        const userData = await userRes.json();

        // unwrap items if the cookbooks response is paginated
        let cbRaw = cookbooksRes.ok ? await cookbooksRes.json() : [];
        const cbList = Array.isArray(cbRaw) ? cbRaw : Array.isArray(cbRaw?.items) ? cbRaw.items : [];

        // normalize rows
        let normalized = cbList.map(normalizeCookbook).filter(Boolean);

        // hydrate any missing cover/count from cookbook details
        normalized = await hydrateMissingCookbookBits(normalized);

        if (ac.signal.aborted) return;

        setProfile(userData.user);
        setRecipes(userData.recipes || []);
        setCookbooks(normalized);
        setFollowers(followersRes.ok ? await followersRes.json() : []);
        setFollowing(followingRes.ok ? await followingRes.json() : []);
      } catch (e) {
        if (ac.signal.aborted) return;
        console.error(e);
        setError("Failed to load profile.");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, token, authLoading]);

  // ✅ compute "do I follow this profile?" correctly
  useEffect(() => {
    let alive = true;

    (async () => {
      // default
      if (!token || !user || !profile || isOwnProfile) {
        setIsFollowing(false);
        return;
      }

      try {
        // fetch MY following list and check if it contains this profile's id
        const res = await apiFetch(
          `${API_BASE_URL}/api/User/${encodeURIComponent(user.username)}/following`,
          { headers: authHeaders }
        );
        if (!res.ok) {
          if (alive) setIsFollowing(false);
          return;
        }

        const list = await res.json();
        const myFollowingIds = new Set(
          (list || [])
            .map((u) => u.id ?? u.userId ?? null)
            .filter(Boolean)
        );

        if (alive) setIsFollowing(myFollowingIds.has(profile.id));
      } catch {
        if (alive) setIsFollowing(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, profile, isOwnProfile, username]);

  const onToggleFollow = async () => {
    if (!token || !profile?.id || followBusy) return;

    setFollowBusy(true);
    const prev = isFollowing;
    const method = prev ? "DELETE" : "POST";

    // optimistic
    setIsFollowing(!prev);

    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/User/${encodeURIComponent(profile.id)}/follow`,
        { method, headers: authHeaders }
      );
      if (!res.ok) throw new Error("toggle failed");
    } catch (e) {
      // revert
      setIsFollowing(prev);
    } finally {
      setFollowBusy(false);
    }
  };

  const onBannerFile = async (file) => {
    if (!file) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch(`${API_BASE_URL}/api/user/banner`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfile((p) => ({ ...p, bannerImageUrl: data.imageUrl }));
    } catch (err) {
      console.error(err);
      alert("Banner upload failed");
    } finally {
      setUploadingBanner(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const followerCount = followers.length;
  const followingCount = following.length;

  const websiteShort = useMemo(() => {
    const w = profile?.websiteUrl;
    if (!w) return null;
    return w.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }, [profile]);

  if (authLoading || loading) return <Skeleton />;
  if (error) return <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 text-red-300">{error}</div>;
  if (!profile) return <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 text-center">User not found.</div>;

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen text-platerly-text">
      <div className="mx-auto max-w-5xl">
        {/* Banner */}
        <div className="relative h-44 md:h-56 rounded-b-2xl overflow-hidden bg-platerly-light z-0">
          {profile.bannerImageUrl && (
            <img src={profile.bannerImageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
        </div>

        {/* Row 1: avatar + name + actions */}
        <div className="px-4 md:px-6 -mt-8 flex items-end gap-4">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={`${profile.username} avatar`}
              loading="lazy"
              className="z-20 w-24 h-24 rounded-2xl border-4 border-platerly-dark object-cover shadow-[0_10px_30px_-10px_rgba(34,197,94,0.35)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl border-4 border-platerly-dark bg-platerly-card grid place-content-center text-2xl font-bold text-platerly-cream">
              {profile.username[0]?.toUpperCase() ?? "U"}
            </div>
          )}

          <div className="pb-2">
            <h1 className="text-xl md:text-2xl font-semibold text-platerly-text">
              {profile.displayName || profile.username}
            </h1>
            <div className="text-sm text-platerly-muted">@{profile.username}</div>
          </div>

          {/* Actions */}
          <div className="ml-auto pb-2 flex items-center gap-2">
            {/* ✅ Follow/Unfollow for other users */}
            {!isOwnProfile && token ? (
              <button
                onClick={onToggleFollow}
                disabled={followBusy}
                className={[
                  "px-4 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 focus:ring-platerly-green/40",
                  isFollowing
                    ? "bg-transparent border-platerly-light text-platerly-subtle md:hover:bg-platerly-light/30"
                    : "bg-platerly-green text-platerly-dark border-transparent md:hover:opacity-90",
                  followBusy ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {followBusy ? "…" : isFollowing ? "Unfollow" : "Follow"}
              </button>
            ) : null}

            {/* Banner button only for own profile */}
            {isOwnProfile && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-platerly-card hover:bg-platerly-light border border-platerly-border text-sm text-platerly-text focus:outline-none focus:ring-2 focus:ring-platerly-green/40"
                  disabled={uploadingBanner}
                  aria-label="Change banner image"
                >
                  {uploadingBanner ? "Uploading..." : "Change banner"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onBannerFile(e.target.files?.[0])}
                />
              </>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="px-4 md:px-6 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {profile.location && <span className="text-platerly-muted">{profile.location}</span>}
          {profile.websiteUrl && (
            <a
              className="underline text-platerly-cream/90 hover:text-platerly-cream"
              href={withScheme(profile.websiteUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {websiteShort}
            </a>
          )}

          <Link to={`/user/${profile.username}/followers`} className="underline-offset-2 hover:underline text-platerly-text">
            <b>{followerCount}</b> Followers
          </Link>
          <Link to={`/user/${profile.username}/following`} className="underline-offset-2 hover:underline text-platerly-text">
            <b>{followingCount}</b> Following
          </Link>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div
            className="px-4 md:px-6 mt-3 text-platerly-cream/95 text-sm leading-6"
            dangerouslySetInnerHTML={{ __html: autolinkBio(profile.bio) }}
          />
        )}

        {/* Tabs */}
        <div className="px-4 md:px-6 mt-6 border-b border-platerly-border">
          <nav className="flex gap-2" role="tablist" aria-label="Profile content tabs">
            {[
              { k: "recipes", label: "Recipes" },
              { k: "cookbooks", label: "Cookbooks" },
            ].map(({ k, label }) => {
              const active = tab === k;
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={active}
                  className={[
                    "px-3 py-1.5 rounded-full text-sm transition",
                    active
                      ? "bg-platerly-green text-black font-semibold shadow-sm"
                      : "text-platerly-muted hover:text-platerly-text hover:bg-platerly-card",
                  ].join(" ")}
                  onClick={() => setTab(k)}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 py-6">
          {tab === "recipes" ? (
            recipes?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map((r) => (
                  <Link
                    key={r.recipeId || r.id}
                    to={`/recipe/${r.recipeId || r.id}`}
                    className="group rounded-2xl overflow-hidden border border-platerly-border bg-platerly-card shadow transition hover:shadow-[0_12px_30px_-12px_rgba(34,197,94,0.35)] hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-platerly-green/40"
                  >
                    <div className="relative w-full aspect-[4/3] bg-platerly-light overflow-hidden">
                      {r.imageUrl && (
                        <img
                          src={r.imageUrl}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.015]"
                        />
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-platerly-text line-clamp-1 group-hover:underline">
                        {r.title}
                      </div>
                      {r.description && (
                        <div className="text-xs text-platerly-muted line-clamp-2 mt-1">
                          {r.description}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No recipes yet" subtitle="When they post, you’ll see them here." />
            )
          ) : cookbooks?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cookbooks.map((c) => (
                <CookbookCard
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  isPublic={c.isPublic}
                  createdAt={c.createdAt}
                  coverImageUrl={c.coverImageUrl}
                  recipeCount={typeof c.recipeCount === "number" ? c.recipeCount : 0}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No cookbooks yet" subtitle="Cookbooks they create will show up here." />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
