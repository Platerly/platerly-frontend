import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AllergySettingsTab from "./AllergySettingsTab";
import BillingPanel from "../components/account/BillingPanel";
import { API_BASE_URL } from "../utils/api";

/* helpers */
const withScheme = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `https://${u}`);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const TAB_KEYS = ["profile", "allergies", "subscription"];

const TabBtn = ({ id, active, onClick, children }) => (
  <button
    role="tab"
    aria-selected={active}
    aria-controls={`${id}-panel`}
    id={`${id}-tab`}
    onClick={onClick}
    className={`px-3 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
      active
        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-900 shadow"
        : "bg-neutral-900/60 border border-neutral-800 text-neutral-300 hover:bg-neutral-900"
    }`}
  >
    {children}
  </button>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm mb-2 text-neutral-300">{label}</label>
    {children}
    {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
  </div>
);

const Skeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-10 bg-neutral-900 rounded-lg border border-neutral-800" />
    ))}
  </div>
);

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const { logout, token, user } = useAuth();

  // profile form state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [youTubeUrl, setYouTubeUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const fileRef = useRef(null);
  const BIO_MAX = 500;

  // load current user for form defaults
  useEffect(() => {
    if (!user?.username) return;
    setLoading(true);
    setError("");
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/user/profile/${encodeURIComponent(user.username)}`,
          { signal: ac.signal }
        );
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        const u = data.user || {};
        setDisplayName(u.displayName || "");
        setBio((u.bio || "").slice(0, BIO_MAX));
        setWebsiteUrl(u.websiteUrl || "");
        setYouTubeUrl(u.youTubeUrl || ""); // backend YouTubeUrl -> youTubeUrl
        setXUrl(u.xUrl || "");
        setInstagramUrl(u.instagramUrl || "");
        setProfileImageUrl(u.profileImageUrl || "");
      } catch (e) {
        if (ac.signal.aborted) return;
        console.error(e);
        setError("Could not load your profile.");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [user?.username]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const onUploadAvatar = async (file) => {
    if (!file || !token) return;
    setError("");
    setOk("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/user/update-profile-image`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfileImageUrl(data.imageUrl);
      setOk("Profile picture updated.");
    } catch (e) {
      console.error(e);
      setError("Failed to upload profile picture.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setOk("");

    const payload = {
      displayName: displayName.trim(),
      bio: bio.trim().slice(0, BIO_MAX),
      websiteUrl: websiteUrl.trim(),
      youTubeUrl: youTubeUrl.trim(), // note JSON lower-camel
      xUrl: xUrl.trim(),
      instagramUrl: instagramUrl.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to save.");
      }
      setOk("Profile saved.");
    } catch (e) {
      console.error(e);
      setError("Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  const TabPanel = ({ id, active, children }) => (
    <div
      role="tabpanel"
      id={`${id}-panel`}
      aria-labelledby={`${id}-tab`}
      hidden={!active}
      className="mb-12"
    >
      {active && children}
    </div>
  );

  const photo = profileImageUrl || "/placeholder-avatar.png";

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-10 px-4 text-neutral-100">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Settings</h1>

      {/* Tab Switcher */}
      <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-2 border-b border-neutral-800 pb-4 mb-8">
        <TabBtn id="profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
          Profile
        </TabBtn>
        <TabBtn id="allergies" active={activeTab === "allergies"} onClick={() => setActiveTab("allergies")}>
          Allergies
        </TabBtn>
        <TabBtn id="subscription" active={activeTab === "subscription"} onClick={() => setActiveTab("subscription")}>
          Subscription
        </TabBtn>
      </div>

      {/* Profile */}
      <TabPanel id="profile" active={activeTab === "profile"}>
        {loading ? (
          <Skeleton />
        ) : (
          <form onSubmit={onSave} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 sm:gap-6">
              <img
                src={photo}
                alt="Profile"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-neutral-800"
              />
              <div>
                <label className="block text-sm mb-2">Upload Profile Picture</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => onUploadAvatar(e.target.files?.[0])}
                  className="block text-sm"
                />
              </div>
            </div>

            <Field label="Display Name">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={80}
                className="w-full bg-neutral-950/60 border border-neutral-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </Field>

            <Field label="Bio" hint={`${clamp(bio?.length || 0, 0, BIO_MAX)}/${BIO_MAX}`}>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                rows={5}
                className="w-full bg-neutral-950/60 border border-neutral-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                placeholder="Tell people a little about you…"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Website">
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://your-site.com"
                  className="w-full bg-neutral-950/60 border border-neutral-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
                {websiteUrl && (
                  <a
                    href={withScheme(websiteUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline text-neutral-300 mt-1 inline-block"
                  >
                    Preview: {withScheme(websiteUrl)}
                  </a>
                )}
              </Field>

              <Field label="YouTube">
                <input
                  value={youTubeUrl}
                  onChange={(e) => setYouTubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full bg-neutral-950/60 border border-neutral-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </Field>

              <Field label="X (Twitter)">
                <input
                  value={xUrl}
                  onChange={(e) => setXUrl(e.target.value)}
                  placeholder="https://x.com/yourhandle"
                  className="w-full bg-neutral-950/60 border border-neutral-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </Field>

              <Field label="Instagram">
                <input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full bg-neutral-950/60 border border-neutral-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </Field>
            </div>

            {/* Messages */}
            {error && <div className="text-sm text-red-400">{error}</div>}
            {ok && <div className="text-sm text-emerald-400">{ok}</div>}

            {/* Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-900 font-medium shadow disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </TabPanel>

      {/* Allergies */}
      <TabPanel id="allergies" active={activeTab === "allergies"}>
        <AllergySettingsTab />
      </TabPanel>

      {/* Subscription */}
      <TabPanel id="subscription" active={activeTab === "subscription"}>
        <BillingPanel />
      </TabPanel>

      {/* Logout */}
      <div className="border-t border-neutral-800 pt-6 text-right">
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
export default SettingsPage;