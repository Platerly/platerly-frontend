import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Lock } from "lucide-react";
import { resetPassword } from "../utils/api";

/**
 * ResetPassword
 * - Brand-consistent + mobile-first
 * - Strong a11y (labels, aria-live, focus rings)
 * - Inline password validator + strength bar
 * - Works in both light/dark (uses Tailwind classes; swap colors to your theme tokens)
 *
 * If you maintain shared UI primitives (Input/Button), you can easily
 * swap the <input> / <button> elements for those components and keep
 * the surrounding layout and logic as-is.
 */

const MIN_LEN = 8;

const rules = [
  {
    key: "length",
    label: `At least ${MIN_LEN} characters`,
    test: (v) => v.length >= MIN_LEN,
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
      console.error("Reset error:", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Map score to bar styles
  const barIdx = Math.min(score, 5);
  const barLabels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

  return (
    <div className="min-h-svh bg-neutral-950 text-neutral-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-neutral-900/70 backdrop-blur border border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 mb-6">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">Platerly</h1>
              <p className="text-xs text-neutral-400">Reset your password</p>
            </div>
          </div>

          <form onSubmit={handleReset} className="space-y-5" noValidate>
            {/* New Password */}
            <label className="block">
              <span className="block text-sm mb-1">New password</span>
              <div className={`flex items-center gap-2 rounded-xl border bg-neutral-950/60 focus-within:ring-2 focus-within:ring-teal-500/60 transition ${
                password
                  ? "border-neutral-700"
                  : "border-neutral-800 hover:border-neutral-700"
              }`}>
                <span className="pl-3 text-neutral-500"><Lock size={18} /></span>
                <input
                  type={showPw ? "text" : "password"}
                  inputMode="text"
                  autoComplete="new-password"
                  className="w-full bg-transparent px-1 py-3 text-sm outline-none placeholder:text-neutral-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="password-help"
                  required
                  minLength={MIN_LEN}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="pr-3 text-neutral-400 hover:text-neutral-200"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {/* Strength Bar */}
            <div aria-live="polite" className="-mt-1">
              <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    barIdx <= 1
                      ? "bg-red-500"
                      : barIdx === 2
                      ? "bg-amber-500"
                      : barIdx === 3
                      ? "bg-lime-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${(barIdx / 5) * 100}%` }}
                />
              </div>
              <p id="password-help" className="mt-2 text-xs text-neutral-400">
                {barLabels[Math.max(0, barIdx - 1)] || "Very weak"}
              </p>
            </div>

            {/* Confirm */}
            <label className="block">
              <span className="block text-sm mb-1">Confirm new password</span>
              <div className={`flex items-center gap-2 rounded-xl border bg-neutral-950/60 focus-within:ring-2 focus-within:ring-teal-500/60 transition ${
                confirm
                  ? "border-neutral-700"
                  : "border-neutral-800 hover:border-neutral-700"
              }`}>
                <span className="pl-3 text-neutral-500"><Lock size={18} /></span>
                <input
                  type={showConfirm ? "text" : "password"}
                  inputMode="text"
                  autoComplete="new-password"
                  className="w-full bg-transparent px-1 py-3 text-sm outline-none placeholder:text-neutral-500"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={MIN_LEN}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="pr-3 text-neutral-400 hover:text-neutral-200"
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
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
              {rules.map((r, i) => (
                <li key={r.key} className="flex items-center gap-2">
                  <span
                    className={`inline-block size-2 rounded-full ${
                      matches[i] ? "bg-emerald-500" : "bg-neutral-600"
                    }`}
                  />
                  {r.label}
                </li>
              ))}
            </ul>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-900 shadow-lg shadow-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-400/60"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>

            {/* Footer actions */}
            <div className="text-center text-xs text-neutral-400 space-x-4">
              <Link to="/login" className="hover:text-neutral-200 underline underline-offset-4">
                Back to login
              </Link>
              <Link to="/forgot-password" className="hover:text-neutral-200 underline underline-offset-4">
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
