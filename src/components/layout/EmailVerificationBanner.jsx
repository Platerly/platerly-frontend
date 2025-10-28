// src/components/banners/EmailVerificationBanner.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { resendVerificationEmail } from "../../utils/api";
import { toast } from "react-hot-toast";
import { MailWarning, X, Loader2 } from "lucide-react";

const DISMISS_KEY = "platerly.emailBanner.dismissed";

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!user || user.isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    try {
      setLoading(true);
      await resendVerificationEmail(user.email);
      toast.success("Verification email sent.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn’t send verification email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Email verification notice"
      className="sticky top-0 z-40 w-full border-b border-white/10
                 bg-platerly-dark/95 backdrop-blur supports-[backdrop-filter]:bg-platerly-dark/75"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Icon + message */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg
                            bg-yellow-500/15 ring-1 ring-yellow-500/25">
              <MailWarning className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="text-sm">
              <p className="text-white">
                Verify your email to unlock all Platerly features.
              </p>
              <p className="mt-0.5 text-platerly-subtle">
                We sent a link to <span className="text-white">{user.email}</span>. Didn’t get it?
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleResend}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg
                         bg-green-500 px-3.5 py-2 text-sm font-medium text-white
                         transition-colors hover:bg-green-600 focus:outline-none
                         focus:ring-2 focus:ring-green-400 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>Resend verification</>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="group rounded-lg p-2 text-platerly-subtle transition
                         hover:bg-white/5 hover:text-white focus:outline-none
                         focus:ring-2 focus:ring-neutral-500"
              aria-label="Dismiss email verification notice"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
