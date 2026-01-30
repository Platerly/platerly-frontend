// src/pages/UserProfilePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  MapPin,
  Link as LinkIcon,
  Users,
  UserPlus,
  UserMinus,
  ImagePlus,
  ChefHat,
  BookOpen,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/fetchWithAuth";
import { API_BASE_URL } from "../utils/api";
import { logger } from "../utils/logger";
import { toast } from "react-hot-toast";
import Button from "../components/ui/Button";
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
  <div className="min-h-screen bg-recipzee-dark">
    <div className="mx-auto max-w-5xl animate-pulse">
      <div className="h-48 md:h-56 bg-recipzee-light rounded-b-3xl" />
      <div className="px-4 md:px-6 -mt-12 flex gap-4 items-end">
        <div className="w-28 h-28 rounded-2xl bg-recipzee-card border-4 border-recipzee-dark" />
        <div className="flex-1 pb-2 space-y-2">
          <div className="h-7 w-48 bg-recipzee-card rounded-lg" />
          <div className="h-4 w-32 bg-recipzee-card/70 rounded-lg" />
        </div>
      </div>
      <div className="px-4 md:px-6 mt-6 space-y-4">
        <div className="flex gap-4">
          <div className="h-10 w-24 bg-recipzee-card rounded-xl" />
          <div className="h-10 w-24 bg-recipzee-card rounded-xl" />
        </div>
        <div className="h-16 w-full bg-recipzee-card rounded-xl" />
      </div>
    </div>
  </div>
);

// eslint-disable-next-line no-unused-vars
const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-recipzee-light flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-recipzee-subtle" />
    </div>
    <h3 className="text-lg font-semibold text-recipzee-text">{title}</h3>
    <p className="text-sm text-recipzee-subtle mt-1 max-w-sm mx-auto">{subtitle}</p>
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
        logger.error('Profile operation failed', e);
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
    } catch {
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
      logger.error('Profile error', err);
      toast.error("Banner upload failed");
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

  if (error) {
    return (
      <div className="min-h-screen bg-recipzee-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-recipzee-text mb-2">Something went wrong</h2>
          <p className="text-recipzee-subtle">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-recipzee-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-recipzee-light flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-recipzee-subtle" />
          </div>
          <h2 className="text-xl font-semibold text-recipzee-text mb-2">User not found</h2>
          <p className="text-recipzee-subtle">This profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-recipzee-green/5 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-5xl pb-12">
        {/* Banner */}
        <div className="relative h-48 md:h-64 rounded-b-3xl overflow-hidden bg-gradient-to-br from-recipzee-light to-recipzee-card">
          {profile.bannerImageUrl ? (
            <img src={profile.bannerImageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-recipzee-green/10 via-recipzee-light to-recipzee-card" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-recipzee-dark/60 via-transparent to-black/10" />

          {/* Settings link for own profile */}
          {isOwnProfile && (
            <Link
              to="/settings"
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-recipzee-dark/50 backdrop-blur border border-white/10 text-recipzee-text hover:bg-recipzee-dark/70 transition"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* Profile Header Card */}
        <div className="px-4 md:px-6 -mt-16 relative z-20">
          <div className="bg-recipzee-card/80 backdrop-blur-md border border-recipzee-border rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Avatar */}
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={`${profile.username} avatar`}
                  loading="lazy"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-recipzee-card object-cover shadow-xl shadow-recipzee-green/10 -mt-16 sm:-mt-20"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-recipzee-card bg-gradient-to-br from-recipzee-green/20 to-recipzee-light grid place-content-center text-3xl font-bold text-recipzee-text -mt-16 sm:-mt-20 shadow-xl">
                  {profile.username[0]?.toUpperCase() ?? "U"}
                </div>
              )}

              {/* Name & Username */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-recipzee-text truncate">
                  {profile.displayName || profile.username}
                </h1>
                <div className="text-recipzee-subtle">@{profile.username}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:ml-auto">
                {!isOwnProfile && token ? (
                  <Button
                    onClick={onToggleFollow}
                    disabled={followBusy}
                    variant={isFollowing ? "secondary" : "primary"}
                    loading={followBusy}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </Button>
                ) : null}

                {isOwnProfile && (
                  <>
                    <Button
                      onClick={() => fileRef.current?.click()}
                      variant="secondary"
                      loading={uploadingBanner}
                    >
                      <ImagePlus className="w-4 h-4" />
                      {uploadingBanner ? "Uploading..." : "Edit Banner"}
                    </Button>
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

            {/* Stats Row */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to={`/user/${profile.username}/followers`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-recipzee-light hover:bg-recipzee-light/80 border border-recipzee-border hover:border-recipzee-green/30 transition"
              >
                <Users className="w-4 h-4 text-recipzee-green" />
                <span className="font-semibold">{followerCount}</span>
                <span className="text-recipzee-subtle">Followers</span>
              </Link>
              <Link
                to={`/user/${profile.username}/following`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-recipzee-light hover:bg-recipzee-light/80 border border-recipzee-border hover:border-recipzee-green/30 transition"
              >
                <UserPlus className="w-4 h-4 text-recipzee-subtle" />
                <span className="font-semibold">{followingCount}</span>
                <span className="text-recipzee-subtle">Following</span>
              </Link>

              {profile.location && (
                <div className="inline-flex items-center gap-2 px-3 py-2 text-sm text-recipzee-subtle">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}

              {profile.websiteUrl && (
                <a
                  href={withScheme(profile.websiteUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-recipzee-green hover:underline"
                >
                  <LinkIcon className="w-4 h-4" />
                  {websiteShort}
                </a>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div
                className="mt-4 pt-4 border-t border-recipzee-border text-recipzee-text/90 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(autolinkBio(profile.bio), {
                    ALLOWED_TAGS: ["a", "br"],
                    ALLOWED_ATTR: ["href", "target", "rel", "class"],
                  }),
                }}
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-6 mt-8 border-b border-recipzee-border pb-4">
          <nav className="flex gap-2" role="tablist" aria-label="Profile content tabs">
            {[
              { k: "recipes", label: "Recipes", icon: ChefHat },
              { k: "cookbooks", label: "Cookbooks", icon: BookOpen },
            // eslint-disable-next-line no-unused-vars
            ].map(({ k, label, icon: Icon }) => {
              const active = tab === k;
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={active}
                  className={[
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-recipzee-green/50",
                    active
                      ? "bg-recipzee-green text-recipzee-dark shadow-lg shadow-recipzee-green/20"
                      : "bg-recipzee-card border border-recipzee-border text-recipzee-text/80 hover:bg-recipzee-light hover:border-recipzee-green/30",
                  ].join(" ")}
                  onClick={() => setTab(k)}
                >
                  <Icon className="w-4 h-4" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recipes.map((r) => (
                  <Link
                    key={r.recipeId || r.id}
                    to={`/recipe/${r.recipeId || r.id}`}
                    className="group rounded-2xl overflow-hidden border border-recipzee-border bg-recipzee-card shadow-lg transition-all duration-200
                               hover:border-recipzee-green/30 hover:shadow-xl hover:shadow-recipzee-green/10 hover:scale-[1.02]
                               focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 focus:ring-offset-2 focus:ring-offset-recipzee-dark
                               active:scale-[0.99]"
                  >
                    <div className="relative w-full aspect-[4/3] bg-recipzee-light overflow-hidden">
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-recipzee-green/5 to-recipzee-light">
                          <ChefHat className="w-12 h-12 text-recipzee-subtle" />
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-recipzee-text line-clamp-1 group-hover:text-recipzee-green transition-colors">
                        {r.title}
                      </div>
                      {r.description && (
                        <div className="text-sm text-recipzee-subtle line-clamp-2 mt-1.5">
                          {r.description}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={ChefHat} title="No recipes yet" subtitle="When they post, you'll see them here." />
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
            <EmptyState icon={BookOpen} title="No cookbooks yet" subtitle="Cookbooks they create will show up here." />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
