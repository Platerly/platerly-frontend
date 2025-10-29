import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/* ───────────── helpers ───────────── */
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
      (_match, p1, p2) => `${p1}<a class="underline" href="/tags/${p2.toLowerCase()}">#${p2}</a>`
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
    <div className="px-4 md:px-6 mt-4 h-4 w-80 bg-platerly-card rounded" />
  </div>
);

const EmptyState = ({ title, subtitle }) => (
  <div className="py-12 text-center">
    <div className="mx-auto mb-3 h-10 w-10 rounded-xl grid place-content-center border border-platerly-border bg-platerly-card/70 shadow">
      <span className="text-platerly-yellow">★</span>
    </div>
    <h3 className="font-semibold text-platerly-text">{title}</h3>
    <p className="text-sm text-platerly-muted mt-1">{subtitle}</p>
  </div>
);

/* Social icon row (renders only provided links) */
const SocialLinksRow = ({ websiteUrl, youTubeUrl, xUrl, instagramUrl }) => {
  const items = [
    {
      key: "youTubeUrl",
      href: youTubeUrl,
      label: "YouTube",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41 41 0 0 0 0 12a41 41 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8A41 41 0 0 0 24 12a41 41 0 0 0-.5-5.8zM9.8 15.5v-7l6 3.5z"
          />
        </svg>
      ),
    },
    {
      key: "xUrl",
      href: xUrl,
      label: "X (Twitter)",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path fill="currentColor" d="M18 2h3l-7 8 8 10h-6l-5-6-6 6H2l7-8-8-10h6l5 6z" />
        </svg>
      ),
    },
    {
      key: "instagramUrl",
      href: instagramUrl,
      label: "Instagram",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM18.5 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
          />
        </svg>
      ),
    },
    {
      key: "websiteUrl",
      href: websiteUrl,
      label: "Website",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm7.9 9h-3.2a14 14 0 0 0-1.4-5 8 8 0 0 1 4.6 5zM12 4c.9 1.2 1.7 3 2.2 5H9.8c.5-2 1.3-3.8 2.2-5zM4.1 11a8 8 0 0 1 4.6-5 14 14 0 0 0-1.4 5H4.1zM7.3 13a14 14 0 0 0 1.4 5 8 8 0 0 1-4.6-5h3.2zm2.5 0h4.4c-.5 2-1.3 3.8-2.2 5-.9-1.2-1.7-3-2.2-5zm6.9 0h3.2a8 8 0 0 1-4.6 5c.6-1.2 1.1-3 1.4-5z"
          />
        </svg>
      ),
    },
  ].filter((i) => !!i.href);

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ key, href, label, icon }) => (
        <a
          key={key}
          href={withScheme(href)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-platerly-border bg-platerly-card hover:ring-2 hover:ring-platerly-green/40 px-2.5 py-1.5 transition"
          aria-label={label}
          title={label}
        >
          <span className="text-platerly-text/90">{icon}</span>
        </a>
      ))}
    </div>
  );
};

const UserProfilePage = () => {
  const { username } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [cookbooks, setCookbooks] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileRef = useRef(null);

  const tab = (searchParams.get("tab") || "recipes").toLowerCase();
  const setTab = (t) => setSearchParams({ tab: t });

  const isOwnProfile = user?.username?.toLowerCase?.() === username?.toLowerCase?.();

  // Fetch profile + lists
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError("");

    (async () => {
      try {
        const [userRes, cookbooksRes, followersRes, followingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/user/profile/${encodeURIComponent(username)}`, { signal: ac.signal }),
          fetch(`${API_BASE_URL}/api/user/profile/${encodeURIComponent(username)}/cookbooks`, { signal: ac.signal }),
          fetch(`${API_BASE_URL}/api/Follow/followers?username=${encodeURIComponent(username)}` , { signal: ac.signal, headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch(`${API_BASE_URL}/api/Follow/following?username=${encodeURIComponent(username)}` , { signal: ac.signal, headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        ]);

        if (!userRes.ok) throw new Error("Failed to load profile");

        const userData = await userRes.json();
        const cbData = cookbooksRes.ok ? await cookbooksRes.json() : [];
        const folData = followersRes.ok ? await followersRes.json() : [];
        const ingData = followingRes.ok ? await followingRes.json() : [];

        if (ac.signal.aborted) return;
        setProfile(userData.user);
        setRecipes(userData.recipes || []);
        setCookbooks(cbData || []);
        setFollowers(folData || []);
        setFollowing(ingData || []);
      } catch (e) {
        if (ac.signal.aborted) return;
        console.error(e);
        setError("Failed to load profile.");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [username, token]);

  // Determine if current user follows this profile
  useEffect(() => {
    if (!token || !user || !followers?.length) return setIsFollowing(false);
    setIsFollowing(
      followers.some((f) => f.username?.toLowerCase?.() === user.username?.toLowerCase?.())
    );
  }, [followers, user, token]);

  const followerCount = followers.length;
  const followingCount = following.length;

  const handleFollowToggle = async () => {
    if (!token || !profile) return;
    const endpoint = `${API_BASE_URL}/api/Follow/${profile.id}`;
    const method = isFollowing ? "DELETE" : "POST";

    try {
      const res = await fetch(endpoint, { method, headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to toggle follow");
      if (isFollowing) {
        setFollowers((prev) => prev.filter((f) => f.username?.toLowerCase?.() !== user.username?.toLowerCase?.()));
      } else {
        setFollowers((prev) => [...prev, { username: user.username }]);
      }
      setIsFollowing(!isFollowing);
    } catch (e) {
      console.error(e);
    }
  };

  const websiteShort = useMemo(() => {
    const w = profile?.websiteUrl;
    return w ? w.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
  }, [profile]);

  const onBannerFile = async (file) => {
    if (!file) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/user/banner`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
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

  if (loading) return <Skeleton />;
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16">
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 text-red-200 p-4">{error}</div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 text-center">User not found.</div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl">
        {/* Banner */}
        <div className="relative h-44 md:h-56 rounded-b-2xl overflow-hidden bg-platerly-light z-0">
          {profile.bannerImageUrl && (
            <img src={profile.bannerImageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
          )}
          {/* soft gradient for premium sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
        </div>

        {/* Row 1: avatar + name (overlaps banner) */}
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
        </div>

        {/* Row 2: actions + social */}
        <div className="px-4 md:px-6 mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex gap-2">
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

            {isOwnProfile ? (
              <Link
                to="/settings"
                className="px-4 py-2 rounded-xl bg-platerly-card hover:bg-platerly-light border border-platerly-border text-sm text-platerly-text focus:outline-none focus:ring-2 focus:ring-platerly-green/40"
              >
                Edit Profile
              </Link>
            ) : token ? (
              <button
                onClick={handleFollowToggle}
                className={[
                  "px-4 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2",
                  isFollowing
                    ? "bg-transparent border-red-500/60 text-red-300 hover:bg-red-900/30 focus:ring-red-400/30"
                    : "bg-platerly-green/90 hover:bg-platerly-green text-white border-emerald-700 focus:ring-platerly-green/40",
                ].join(" ")}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            ) : null}
          </div>

          <SocialLinksRow
            websiteUrl={profile.websiteUrl}
            youTubeUrl={profile.youTubeUrl}
            xUrl={profile.xUrl}
            instagramUrl={profile.instagramUrl}
          />
        </div>

        {/* Meta row */}
        <div className="px-4 md:px-6 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {profile.location && <span className="text-platerly-muted">{profile.location}</span>}
          {profile.websiteUrl && (
            <a className="underline text-platerly-cream/90 hover:text-platerly-cream" href={withScheme(profile.websiteUrl)} target="_blank" rel="noopener noreferrer">
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
                <Link
                  key={c.id}
                  to={`/cookbook/${c.id}`}
                  className="group rounded-2xl overflow-hidden border border-platerly-border bg-platerly-card shadow transition hover:shadow-[0_12px_30px_-12px_rgba(246,200,105,0.35)] hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-platerly-yellow/40"
                >
                  <div className="relative w-full aspect-[4/3] bg-platerly-light overflow-hidden">
                    {c.coverUrl && (
                      <img
                        src={c.coverUrl}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.015]"
                      />
                    )}
                    {/* gold badge for count */}
                    <div className="absolute left-2 top-2 rounded-full bg-platerly-yellow/90 text-black text-[11px] font-semibold px-2 py-0.5 shadow">
                      {(c.recipeCount ?? 0)} recipes
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-platerly-text line-clamp-1 group-hover:underline">
                      {c.title}
                    </div>
                    {c.description ? (
                      <div className="text-xs text-platerly-muted line-clamp-2 mt-1">
                        {c.description}
                      </div>
                    ) : null}
                  </div>
                </Link>
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
