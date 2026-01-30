import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Settings, User, AlertTriangle, CreditCard, Check, LogOut, Shield, Eye, EyeOff, Mail, Lock, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AllergySettingsTab from "./AllergySettingsTab";
import BillingPanel from "../components/account/BillingPanel";
import Button from "../components/ui/Button";
import { API_BASE_URL } from "../utils/api";
import { BIO_MAX_LENGTH } from "../constants/limits";
import { logger } from "../utils/logger";

/* helpers */
const withScheme = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `https://${u}`);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Region options for trending content
const REGION_OPTIONS = [
  { value: "", label: "Global (No preference)" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "it", label: "Italy" },
  { value: "es", label: "Spain" },
  { value: "mx", label: "Mexico" },
  { value: "br", label: "Brazil" },
  { value: "jp", label: "Japan" },
  { value: "kr", label: "South Korea" },
  { value: "in", label: "India" },
  { value: "ng", label: "Nigeria" },
  { value: "za", label: "South Africa" },
];

const TAB_KEYS = ["profile", "account", "allergies", "subscription"];

const TAB_ICONS = {
  profile: User,
  account: Shield,
  allergies: AlertTriangle,
  subscription: CreditCard,
};

const TabBtn = ({ id, active, onClick, children }) => {
  const Icon = TAB_ICONS[id] || Settings;
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={`${id}-panel`}
      id={`${id}-tab`}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-recipzee-green/50 ${
        active
          ? "bg-recipzee-green text-recipzee-dark shadow-lg shadow-recipzee-green/20"
          : "bg-recipzee-card border border-recipzee-border text-recipzee-text/80 hover:bg-recipzee-light hover:border-recipzee-green/30"
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
};

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm mb-2 text-recipzee-text/80">{label}</label>
    {children}
    {hint && <div className="text-xs text-recipzee-subtle mt-1">{hint}</div>}
  </div>
);

const Skeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-10 bg-recipzee-card rounded-lg border border-recipzee-border" />
    ))}
  </div>
);

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

const inputClasses = "w-full bg-recipzee-card border border-recipzee-border rounded-xl px-3 py-2 text-recipzee-text placeholder:text-recipzee-subtle focus:outline-none focus:ring-2 focus:ring-recipzee-green/40";

// Password strength validation
const PASSWORD_MIN_LENGTH = 8;
const validatePassword = (pwd) => {
  const rules = [
    { test: pwd.length >= PASSWORD_MIN_LENGTH, label: `At least ${PASSWORD_MIN_LENGTH} characters` },
    { test: /[A-Z]/.test(pwd), label: "One uppercase letter" },
    { test: /[a-z]/.test(pwd), label: "One lowercase letter" },
    { test: /\d/.test(pwd), label: "One number" },
    { test: /[!@#$%^&*(),.?":{}|<>]/.test(pwd), label: "One symbol" },
  ];
  const passed = rules.filter(r => r.test).length;
  return { rules, passed, isValid: passed >= 4 };
};

const AccountSecurityTab = ({ token, user }) => {
  // Change Email state
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  // Set Password state (for OAuth users)
  const [initPwdNew, setInitPwdNew] = useState("");
  const [initPwdConfirm, setInitPwdConfirm] = useState("");
  const [showInitPwdNew, setShowInitPwdNew] = useState(false);
  const [showInitPwdConfirm, setShowInitPwdConfirm] = useState(false);
  const [initPwdLoading, setInitPwdLoading] = useState(false);
  const [initPwdError, setInitPwdError] = useState("");
  const [initPwdSuccess, setInitPwdSuccess] = useState("");

  const isOAuthUser = user?.authProvider && user.authProvider !== "local";
  const hasPassword = !isOAuthUser; // Assume local users have password

  const passwordValidation = validatePassword(newPassword);
  const initPwdValidation = validatePassword(initPwdNew);

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");

    if (!newEmail.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/change-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail, password: emailPassword }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to change email");
      }

      setEmailSuccess("Verification email sent! Please check your new email inbox.");
      setNewEmail("");
      setEmailPassword("");
    } catch (err) {
      setEmailError(err.message || "Failed to change email");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!passwordValidation.isValid) {
      setPwdError("Password doesn't meet requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("Passwords don't match.");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to change password");
      }

      setPwdSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdError(err.message || "Failed to change password");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setInitPwdError("");
    setInitPwdSuccess("");

    if (!initPwdValidation.isValid) {
      setInitPwdError("Password doesn't meet requirements.");
      return;
    }

    if (initPwdNew !== initPwdConfirm) {
      setInitPwdError("Passwords don't match.");
      return;
    }

    setInitPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: initPwdNew }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to set password");
      }

      setInitPwdSuccess("Password set successfully! You can now log in with email and password.");
      setInitPwdNew("");
      setInitPwdConfirm("");
    } catch (err) {
      setInitPwdError(err.message || "Failed to set password");
    } finally {
      setInitPwdLoading(false);
    }
  };

  const PasswordInput = ({ value, onChange, show, setShow, placeholder, id }) => (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClasses + " pr-10"}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-recipzee-subtle hover:text-recipzee-text"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  const PasswordStrengthBar = ({ validation }) => {
    const strength = validation.passed;
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
    return (
      <div className="mt-2">
        <div className="flex gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < strength ? colors[strength - 1] : "bg-recipzee-border"
              }`}
            />
          ))}
        </div>
        <ul className="text-xs space-y-1">
          {validation.rules.map((rule, i) => (
            <li key={i} className={rule.test ? "text-recipzee-green" : "text-recipzee-subtle"}>
              {rule.test ? "✓" : "○"} {rule.label}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Current Email Display */}
      <div className="bg-recipzee-card border border-recipzee-border rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-5 h-5 text-recipzee-green" />
          <span className="text-sm font-medium">Current Email</span>
        </div>
        <p className="text-recipzee-text">{user?.email}</p>
        {user?.isEmailVerified ? (
          <span className="inline-flex items-center gap-1 text-xs text-recipzee-green mt-1">
            <Check className="w-3 h-3" /> Verified
          </span>
        ) : (
          <span className="text-xs text-yellow-500 mt-1">Not verified</span>
        )}
        {isOAuthUser && (
          <p className="text-xs text-recipzee-subtle mt-2">
            Signed in with {user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1)}
          </p>
        )}
      </div>

      {/* Change Email */}
      <div className="bg-recipzee-card border border-recipzee-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-recipzee-green" />
          <h3 className="text-lg font-semibold">Change Email</h3>
        </div>
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <Field label="New Email Address">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="newemail@example.com"
              required
              className={inputClasses}
            />
          </Field>
          {hasPassword && (
            <Field label="Current Password" hint="Required to confirm your identity">
              <PasswordInput
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                show={showCurrentPwd}
                setShow={setShowCurrentPwd}
                placeholder="Enter your password"
              />
            </Field>
          )}

          {emailError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {emailError}
            </div>
          )}
          {emailSuccess && (
            <div className="flex items-center gap-2 text-sm text-recipzee-green bg-recipzee-green/10 border border-recipzee-green/20 rounded-xl px-4 py-3">
              <Check className="w-4 h-4" />
              {emailSuccess}
            </div>
          )}

          <Button type="submit" loading={emailLoading} disabled={emailLoading}>
            {emailLoading ? "Sending..." : "Send Verification Email"}
          </Button>
        </form>
      </div>

      {/* Change Password or Set Password */}
      <div className="bg-recipzee-card border border-recipzee-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-recipzee-green" />
          <h3 className="text-lg font-semibold">
            {isOAuthUser && !hasPassword ? "Set Password" : "Change Password"}
          </h3>
        </div>

        {isOAuthUser && !hasPassword ? (
          // Set password form for OAuth users
          <form onSubmit={handleSetPassword} className="space-y-4">
            <p className="text-sm text-recipzee-subtle mb-4">
              Set a password to enable email login in addition to {user?.authProvider} sign-in.
            </p>
            <Field label="New Password">
              <PasswordInput
                value={initPwdNew}
                onChange={(e) => setInitPwdNew(e.target.value)}
                show={showInitPwdNew}
                setShow={setShowInitPwdNew}
                placeholder="Create a password"
              />
              {initPwdNew && <PasswordStrengthBar validation={initPwdValidation} />}
            </Field>
            <Field label="Confirm Password">
              <PasswordInput
                value={initPwdConfirm}
                onChange={(e) => setInitPwdConfirm(e.target.value)}
                show={showInitPwdConfirm}
                setShow={setShowInitPwdConfirm}
                placeholder="Confirm your password"
              />
              {initPwdConfirm && initPwdNew !== initPwdConfirm && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </Field>

            {initPwdError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {initPwdError}
              </div>
            )}
            {initPwdSuccess && (
              <div className="flex items-center gap-2 text-sm text-recipzee-green bg-recipzee-green/10 border border-recipzee-green/20 rounded-xl px-4 py-3">
                <Check className="w-4 h-4" />
                {initPwdSuccess}
              </div>
            )}

            <Button type="submit" loading={initPwdLoading} disabled={initPwdLoading || !initPwdValidation.isValid || initPwdNew !== initPwdConfirm}>
              {initPwdLoading ? "Setting..." : "Set Password"}
            </Button>
          </form>
        ) : (
          // Change password form for local users
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Field label="Current Password">
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                show={showCurrentPwd}
                setShow={setShowCurrentPwd}
                placeholder="Enter current password"
              />
            </Field>
            <Field label="New Password">
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                show={showNewPwd}
                setShow={setShowNewPwd}
                placeholder="Create new password"
              />
              {newPassword && <PasswordStrengthBar validation={passwordValidation} />}
            </Field>
            <Field label="Confirm New Password">
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                show={showConfirmPwd}
                setShow={setShowConfirmPwd}
                placeholder="Confirm new password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </Field>

            {pwdError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="flex items-center gap-2 text-sm text-recipzee-green bg-recipzee-green/10 border border-recipzee-green/20 rounded-xl px-4 py-3">
                <Check className="w-4 h-4" />
                {pwdSuccess}
              </div>
            )}

            <Button type="submit" loading={pwdLoading} disabled={pwdLoading || !passwordValidation.isValid || newPassword !== confirmPassword}>
              {pwdLoading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return TAB_KEYS.includes(tab) ? tab : "profile";
  });
  const navigate = useNavigate();
  const { logout, token, user } = useAuth();

  // profile form state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    websiteUrl: "",
    youTubeUrl: "",
    xUrl: "",
    instagramUrl: "",
    profileImageUrl: "",
    region: "",
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const fileRef = useRef(null);

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
        setProfileForm({
          displayName: u.displayName || "",
          bio: (u.bio || "").slice(0, BIO_MAX_LENGTH),
          websiteUrl: u.websiteUrl || "",
          youTubeUrl: u.youTubeUrl || "",
          xUrl: u.xUrl || "",
          instagramUrl: u.instagramUrl || "",
          profileImageUrl: u.profileImageUrl || "",
          region: u.region || "",
        });
      } catch (e) {
        if (ac.signal.aborted) return;
        logger.error("Failed to load profile", e);
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
      setProfileForm((prev) => ({ ...prev, profileImageUrl: data.imageUrl }));
      setOk("Profile picture updated.");
    } catch (e) {
      logger.error("Failed to upload profile picture", e);
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
      displayName: profileForm.displayName.trim(),
      bio: profileForm.bio.trim().slice(0, BIO_MAX_LENGTH),
      websiteUrl: profileForm.websiteUrl.trim(),
      youTubeUrl: profileForm.youTubeUrl.trim(),
      xUrl: profileForm.xUrl.trim(),
      instagramUrl: profileForm.instagramUrl.trim(),
      region: profileForm.region.trim(),
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
      logger.error("Failed to save profile", e);
      setError("Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  const photo = profileForm.profileImageUrl || "/placeholder-avatar.png";

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-recipzee-green/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-4xl mx-auto py-8 sm:py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-recipzee-green/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-recipzee-green" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-recipzee-subtle">Manage your profile, allergies, and subscription</p>
        </div>

        {/* Tab Switcher */}
        <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-2 border-b border-recipzee-border pb-4 mb-8">
          <TabBtn id="profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
            Profile
          </TabBtn>
          <TabBtn id="account" active={activeTab === "account"} onClick={() => setActiveTab("account")}>
            Account
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
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-recipzee-border"
              />
              <div>
                <label className="block text-sm mb-2">Profile Picture</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => onUploadAvatar(e.target.files?.[0])}
                  className="hidden"
                  id="avatar-upload"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-recipzee-green text-recipzee-dark font-medium hover:bg-recipzee-green/90 transition-colors"
                >
                  Choose Image
                </button>
              </div>
            </div>

            <Field label="Display Name">
              <input
                name="displayName"
                value={profileForm.displayName}
                onChange={handleProfileChange}
                required
                maxLength={80}
                className={inputClasses}
              />
            </Field>

            <Field label="Bio" hint={`${clamp(profileForm.bio?.length || 0, 0, BIO_MAX_LENGTH)}/${BIO_MAX_LENGTH}`}>
              <textarea
                name="bio"
                value={profileForm.bio}
                onChange={(e) => {
                  const val = e.target.value.slice(0, BIO_MAX_LENGTH);
                  setProfileForm((prev) => ({ ...prev, bio: val }));
                }}
                rows={5}
                className={inputClasses}
                placeholder="Tell people a little about you..."
              />
            </Field>

            <Field label="Region Preference" hint="Used for regional trending content">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-recipzee-subtle pointer-events-none" />
                <select
                  name="region"
                  value={profileForm.region}
                  onChange={handleProfileChange}
                  className={inputClasses + " pl-10 appearance-none cursor-pointer"}
                >
                  {REGION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-recipzee-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Website">
                <input
                  name="websiteUrl"
                  value={profileForm.websiteUrl}
                  onChange={handleProfileChange}
                  placeholder="https://your-site.com"
                  className={inputClasses}
                />
                {profileForm.websiteUrl && (
                  <a
                    href={withScheme(profileForm.websiteUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline text-recipzee-subtle hover:text-recipzee-text mt-1 inline-block"
                  >
                    Preview: {withScheme(profileForm.websiteUrl)}
                  </a>
                )}
              </Field>

              <Field label="YouTube">
                <input
                  name="youTubeUrl"
                  value={profileForm.youTubeUrl}
                  onChange={handleProfileChange}
                  placeholder="https://youtube.com/@yourchannel"
                  className={inputClasses}
                />
              </Field>

              <Field label="X (Twitter)">
                <input
                  name="xUrl"
                  value={profileForm.xUrl}
                  onChange={handleProfileChange}
                  placeholder="https://x.com/yourhandle"
                  className={inputClasses}
                />
              </Field>

              <Field label="Instagram">
                <input
                  name="instagramUrl"
                  value={profileForm.instagramUrl}
                  onChange={handleProfileChange}
                  placeholder="https://instagram.com/yourhandle"
                  className={inputClasses}
                />
              </Field>
            </div>

            {/* Messages */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {ok && (
              <div className="flex items-center gap-2 text-sm text-recipzee-green bg-recipzee-green/10 border border-recipzee-green/20 rounded-xl px-4 py-3">
                <Check className="w-4 h-4" />
                {ok}
              </div>
            )}

            {/* Actions */}
            <div className="pt-2">
              <Button type="submit" loading={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </TabPanel>

      {/* Account Security */}
      <TabPanel id="account" active={activeTab === "account"}>
        <AccountSecurityTab token={token} user={user} />
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
        <div className="border-t border-recipzee-border pt-6 mt-8 flex items-center justify-between">
          <div className="text-sm text-recipzee-subtle">
            Need to sign out?
          </div>
          <Button onClick={handleLogout} variant="danger">
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
export default SettingsPage;
