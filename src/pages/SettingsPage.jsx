import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AllergySettingsTab from "./AllergySettingsTab";
import BillingPanel from "../components/account/BillingPanel";
import { API_BASE_URL } from "../utils/api";

/* helper */
const withScheme = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `https://${u}`);

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

  // load current user for form defaults
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // safest: use the public profile for the username shown in the URL bar/sidebar
        const username = user?.username;
        const res = await fetch(`${API_BASE_URL}/api/user/profile/${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();

        const u = data.user || {};
        if (!alive) return;

        setDisplayName(u.displayName || "");
        setBio(u.bio || "");
        setWebsiteUrl(u.websiteUrl || "");
        setYouTubeUrl(u.youTubeUrl || ""); // backend property becomes youTubeUrl in JSON
        setXUrl(u.xUrl || "");
        setInstagramUrl(u.instagramUrl || "");
        setProfileImageUrl(u.profileImageUrl || "");
      } catch (e) {
        setError("Could not load your profile.");
        console.error(e);
      } finally {
        alive = false ? undefined : setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, API_BASE_URL]);

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
      // use the PUT route we exposed (also have POST back-compat)
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

    // Send only fields your API understands. Note the lower-camel JSON names:
    // WebsiteUrl → websiteUrl, YouTubeUrl → youTubeUrl, XUrl → xUrl, InstagramUrl → instagramUrl
    const payload = {
      displayName,
      bio,
      websiteUrl,
      youTubeUrl,   // important: capital T in C# => lower-camel `youTubeUrl` over JSON
      xUrl,
      instagramUrl,
      // profileImageUrl is updated via upload endpoint; no need to send here.
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

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 text-white">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-neutral-700 mb-8">
        <button
          className={`pb-2 font-medium ${
            activeTab === "profile" ? "border-b-2 border-green-500 text-green-400" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          className={`pb-2 font-medium ${
            activeTab === "allergies" ? "border-b-2 border-green-500 text-green-400" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("allergies")}
        >
          Allergies
        </button>
        <button
          className={`pb-2 font-medium ${
            activeTab === "subscription" ? "border-b-2 border-green-500 text-green-400" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("subscription")}
        >
          Subscription
        </button>
      </div>

      {/* Tab Content */}
      <div className="mb-12">
        {activeTab === "profile" ? (
          <form onSubmit={onSave} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <img
                src={profileImageUrl || "/placeholder-avatar.png"}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border border-neutral-700"
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

            {/* Display Name */}
            <div>
              <label className="block text-sm mb-2">Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2"
                placeholder="Tell people a little about you…"
              />
              <div className="text-xs text-neutral-400 mt-1">{bio?.length || 0}/500</div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm mb-2">Website</label>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://your-site.com"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2"
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
            </div>

            {/* YouTube */}
            <div>
              <label className="block text-sm mb-2">YouTube</label>
              <input
                value={youTubeUrl}
                onChange={(e) => setYouTubeUrl(e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2"
              />
            </div>

            {/* X (Twitter) */}
            <div>
              <label className="block text-sm mb-2">X (Twitter)</label>
              <input
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
                placeholder="https://x.com/yourhandle"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm mb-2">Instagram</label>
              <input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2"
              />
            </div>

            {/* Messages */}
            {error && <div className="text-sm text-red-400">{error}</div>}
            {ok && <div className="text-sm text-emerald-400">{ok}</div>}

            {/* Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        ) : activeTab === "allergies" ? (
          <AllergySettingsTab />
        ) : (
          <BillingPanel />
        )}
      </div>

      {/* Logout Button */}
      <div className="border-t border-neutral-700 pt-6 text-right">
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
