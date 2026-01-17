import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Lock, KeyRound } from "lucide-react";
import { resetPassword } from "../utils/api";
import { PASSWORD_MIN_LENGTH } from "../constants/limits";
import logger from "../utils/logger";

/**
 * ResetPassword
 * - Premium platerly styling with gradient orbs
 * - Strong a11y (labels, aria-live, focus rings)
 * - Inline password validator + strength bar
 */

const rules = [
  {
    key: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  {
    key: "upper",
    label: "One uppercase letter",
    test: (v) => /[A-Z]/.test(v),
  },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "digit", label: "One number", test: (v) => /\d/.test(v) },
  { key: "symbol", label: "One symbol (!@#$…) ", test: (v) => /[^\w\s]/.test(v) },
];

const scorePassword = (v) => rules.reduce((acc, r) => acc + (r.test(v) ? 1 : 0), 0);

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const matches = useMemo(() => rules.map((r) => r.test(password)), [password]);
  const score = useMemo(() => scorePassword(password), [password]);
  const allGood = score === rules.length;
  const mismatch = confirm.length > 0 && password !== confirm;

  useEffect(() => {
    if (!token) {
      toast.error("Missing or invalid token.");
    }
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!allGood) {
      toast.error("Please meet all password requirements.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      if (res.ok) {
        toast.success("Password reset! You may now log in.");
        navigate("/login");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Reset failed.");
      }
    } catch (err) {
      logger.error("Password reset failed", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Map score to bar styles
  const barIdx = Math.min(score, 5);
  const barLabels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

  return (
    <div className="min-h-svh bg-platerly-dark text-platerly-text flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background gradient orbs - hidden on mobile for performance */}
      <div className="hidden sm:block absolute top-0 left-1/4 w-80 h-80 bg-platerly-green/5 rounded-full blur-[120px]" />
      <div className="hidden sm:block absolute bottom-1/3 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Card - no backdrop-blur on mobile for performance */}
        <div className="bg-platerly-card sm:bg-platerly-card/80 sm:backdrop-blur-sm border border-platerly-border rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-platerly-green/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-platerly-green" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-platerly-text">Platerly</h1>
              <p className="text-xs text-platerly-subtle">Reset your password</p>
            </div>
          </div>

          <form onSubmit={handleReset} className="space-y-5" noValidate>
            {/* New Password */}
            <label className="block">
              <span className="block text-sm mb-1 text-platerly-text">New password</span>
              <div className={`flex items-center gap-2 rounded-xl border bg-platerly-light/50 focus-within:ring-2 focus-within:ring-platerly-green/40 transition ${
                password
                  ? "border-platerly-border"
                  : "border-platerly-border hover:border-platerly-green/30"
              }`}>
                <span className="pl-3 text-platerly-subtle"><Lock size={18} /></span>
                <input
                  type={showPw ? "text" : "password"}
                  inputMode="text"
                  autoComplete="new-password"
                  className="w-full bg-transparent px-1 py-3 text-sm outline-none placeholder:text-platerly-muted text-platerly-text"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="password-help"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="pr-3 text-platerly-subtle hover:text-platerly-text transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {/* Strength Bar */}
            <div aria-live="polite" className="-mt-1">
              <div className="h-2 w-full rounded-full bg-platerly-light overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    barIdx <= 1
                      ? "bg-red-500"
                      : barIdx === 2
                      ? "bg-amber-500"
                      : barIdx === 3
                      ? "bg-lime-500"
                      : "bg-platerly-green"
                  }`}
                  style={{ width: `${(barIdx / 5) * 100}%` }}
                />
              </div>
              <p id="password-help" className="mt-2 text-xs text-platerly-subtle">
                {barLabels[Math.max(0, barIdx - 1)] || "Very weak"}
              </p>
            </div>

            {/* Confirm */}
            <label className="block">
              <span className="block text-sm mb-1 text-platerly-text">Confirm new password</span>
              <div className={`flex items-center gap-2 rounded-xl border bg-platerly-light/50 focus-within:ring-2 focus-within:ring-platerly-green/40 transition ${
                confirm
                  ? "border-platerly-border"
                  : "border-platerly-border hover:border-platerly-green/30"
              }`}>
                <span className="pl-3 text-platerly-subtle"><Lock size={18} /></span>
                <input
                  type={showConfirm ? "text" : "password"}
                  inputMode="text"
                  autoComplete="new-password"
                  className="w-full bg-transparent px-1 py-3 text-sm outline-none placeholder:text-platerly-muted text-platerly-text"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="pr-3 text-platerly-subtle hover:text-platerly-text transition-colors"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {mismatch && (
                <p className="mt-2 text-xs text-red-400">Passwords do not match.</p>
              )}
            </label>

            {/* Requirements checklist */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-platerly-subtle">
              {rules.map((r, i) => (
                <li key={r.key} className="flex items-center gap-2">
                  <span
                    className={`inline-block size-2 rounded-full transition-colors ${
                      matches[i] ? "bg-platerly-green" : "bg-platerly-light"
                    }`}
                  />
                  <span className={matches[i] ? "text-platerly-text" : ""}>{r.label}</span>
                </li>
              ))}
            </ul>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-platerly-green text-platerly-dark shadow-lg shadow-platerly-green/20 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-platerly-green/40 transition-all"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>

            {/* Footer actions */}
            <div className="text-center text-xs text-platerly-subtle space-x-4">
              <Link to="/login" className="hover:text-platerly-text underline underline-offset-4 transition-colors">
                Back to login
              </Link>
              <Link to="/forgot-password" className="hover:text-platerly-text underline underline-offset-4 transition-colors">
                Forgot your link?
              </Link>
            </div>
          </form>
        </div>

        {/* Safe area spacing on mobile */}
        <div className="h-4" />
      </div>
    </div>
  );
}
