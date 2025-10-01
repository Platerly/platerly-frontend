import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/* ───────────── helpers ───────────── */
function autolinkBio(text = "") {
  return text
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
    <div className="h-48 md:h-56 bg-neutral-900/70 rounded-b-2xl" />
    <div className="px-4 md:px-6 -mt-10 flex gap-4 items-end">
      <div className="w-24 h-24 rounded-2xl bg-neutral-900 border-4 border-neutral-950" />
      <div className="h-6 w-48 bg-neutral-900 rounded" />
    </div>
    <div className="px-4 md:px-6 mt-4 h-4 w-80 bg-neutral-900 rounded" />
  </div>
);

const EmptyState = ({ title, subtitle }) => (
  <div className="py-12 text-center">
    <h3 className="font-medium">{title}</h3>
    <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>
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
    <div className="flex flex-wrap items-center gap-2 text-neutral-300">
      {items.map(({ key, href, label, icon }) => (
        <a
          key={key}
          href={withScheme(href)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-neutral-700/70 bg-neutral-800/40 hover:bg-neutral-700/50 px-2.5 py-1.5"
          aria-label={label}
          title={label}
        >
          {icon}
        </a>
      ))}
    </div>
  );
};

const UserProfilePage = () => {
  const { username } = useParams();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [cookbooks, setCookbooks] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState("recipes");

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileRef = useRef(null);

  const isOwnProfile = user?.username?.toLowerCase?.() === username?.toLowerCase?.();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    (async () => {
      try {
        const [userRes, cookbooksRes, followersRes, followingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/user/profile/${encodeURIComponent(username)}`),
          fetch(`${API_BASE_URL}/api/user/profile/${encodeURIComponent(username)}/cookbooks`),
          fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(username)}/followers`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(username)}/following`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        if (!userRes.ok) throw new Error("Failed to load profile");

        const userData = await userRes.json();
        const cbData = cookbooksRes.ok ? await cookbooksRes.json() : [];
        const folData = followersRes.ok ? await followersRes.json() : [];
        const ingData = followingRes.ok ? await followingRes.json() : [];

        if (!isMounted) return;
        setProfile(userData.user);
        setRecipes(userData.recipes || []);
        setCookbooks(cbData || []);
        setFollowers(folData || []);
        setFollowing(ingData || []);
      } catch (e) {
        console.error(e);
      } finally {
        isMounted && setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [username, token]);

  useEffect(() => {
    if (!token || !user || !followers.length) return;
    setIsFollowing(followers.some((f) => f.username === user.username));
  }, [followers, user, token]);

  const followerCount = followers.length;
  const followingCount = following.length;

  const handleFollowToggle = async () => {
    if (!token || !profile) return;
    const endpoint = `${API_BASE_URL}/api/user/${profile.id}/follow`;
    const method = isFollowing ? "DELETE" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle follow");

      if (isFollowing) {
        setFollowers((prev) => prev.filter((f) => f.username !== user.username));
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
    return w ? w.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
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
  if (!profile)
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 text-center">
        User not found.
      </div>
    );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl">
        {/* Banner */}
        <div className="relative h-44 md:h-56 rounded-b-2xl overflow-hidden bg-neutral-900/60 z-0">
          {profile.bannerImageUrl && (
            <img src={profile.bannerImageUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Row 1: avatar + name (overlaps banner) */}
        <div className="px-4 md:px-6 -mt-8 flex items-end gap-4">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={`${profile.username} avatar`}
              className="z-20 w-24 h-24 rounded-2xl border-4 border-neutral-950 object-cover shadow"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl border-4 border-neutral-950 bg-neutral-800 flex items-center justify-center text-2xl font-bold">
              {profile.username[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div className="pb-2">
            <h1 className="text-xl md:text-2xl font-semibold">
              {profile.displayName || profile.username}
            </h1>
            <div className="text-sm text-neutral-400">@{profile.username}</div>
          </div>
        </div>

        {/* Row 2: actions + social (under banner) */}
        <div className="px-4 md:px-6 mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex gap-2">
            {isOwnProfile && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm disabled:opacity-60"
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
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm"
              >
                Edit Profile
              </Link>
            ) : token ? (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded-xl text-sm border transition ${
                  isFollowing
                    ? "bg-neutral-800 border-red-500 text-red-400 hover:bg-red-900/40"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
                }`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            ) : null}
          </div>

          {/* Social icons */}
          <SocialLinksRow
            websiteUrl={profile.websiteUrl}
            youTubeUrl={profile.youTubeUrl} /* backend uses capital T */
            xUrl={profile.xUrl}
            instagramUrl={profile.instagramUrl}
          />
        </div>

        {/* Meta row */}
        <div className="px-4 md:px-6 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-300">
          {profile.location && <span>{profile.location}</span>}
          {profile.websiteUrl && (
            <a
              className="underline"
              href={withScheme(profile.websiteUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {websiteShort}
            </a>
          )}
          <span>
            <b>{followerCount}</b> Followers
          </span>
          <span>
            <b>{followingCount}</b> Following
          </span>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div
            className="px-4 md:px-6 mt-3 text-neutral-200 text-sm leading-6"
            dangerouslySetInnerHTML={{ __html: autolinkBio(profile.bio) }}
          />
        )}

        {/* Tabs */}
        <div className="px-4 md:px-6 mt-6 border-b border-neutral-800">
          <nav className="flex gap-6">
            <button
              className={`px-1 pb-3 -mb-px text-sm ${
                tab === "recipes" ? "border-b-2 border-emerald-400 text-white" : "text-neutral-400 hover:text-white"
              }`}
              onClick={() => setTab("recipes")}
            >
              Recipes
            </button>
            <button
              className={`px-1 pb-3 -mb-px text-sm ${
                tab === "cookbooks" ? "border-b-2 border-emerald-400 text-white" : "text-neutral-400 hover:text-white"
              }`}
              onClick={() => setTab("cookbooks")}
            >
              Cookbooks
            </button>
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
                    className="group rounded-2xl overflow-hidden bg-neutral-900 hover:bg-neutral-800 transition border border-neutral-800"
                  >
                    <div className="w-full aspect-[4/3] bg-neutral-900 overflow-hidden">
                      {r.imageUrl && <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-3">
                      <div className="font-medium line-clamp-1 group-hover:underline">{r.title}</div>
                      {r.description && (
                        <div className="text-xs text-neutral-400 line-clamp-2 mt-1">{r.description}</div>
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
                  className="rounded-2xl overflow-hidden bg-neutral-900 hover:bg-neutral-800 transition border border-neutral-800"
                >
                  <div className="w-full aspect-[4/3] bg-neutral-900 overflow-hidden">
                    {c.coverUrl && <img src={c.coverUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-3">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-neutral-400">{c.recipeCount ?? 0} recipes</div>
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
