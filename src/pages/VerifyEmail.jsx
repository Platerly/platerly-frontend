import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, fetchCurrentUser } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

/**
 * Brand + Mobile Notes
 * - Uses a centered card on a neutral-950 canvas to match dark theme.
 * - Accent uses emerald for "success" and rose for "error" to stay consistent.
 * - Mobile-first layout with safe area padding and max-w for readability.
 * - Adds CTA buttons for error state: Resend, Login, Home.
 * - Accessible: aria-live regions, focus-visible rings, descriptive icons.
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(/** @type {"verifying"|"success"|"error"} */("verifying"));
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const controllerRef = useRef(/** @type {AbortController | null} */(null));
  const isMounted = useRef(true);
  const hasVerified = useRef(false);

  const token = searchParams.get("token");
  const { token: authToken, setUser } = useAuth();

  useEffect(() => {
    isMounted.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Missing or invalid verification token.");
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    controllerRef.current = new AbortController();

    const verify = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/User/verify-email`,
          { params: { token }, signal: controllerRef.current?.signal }
        );

        if (!isMounted.current) return;

        if (res.status === 200) {
          toast.success("Email verified! 🎉");

          // Refresh current user if we have or find a token
          try {
            const storedToken = authToken || localStorage.getItem("token");
            if (storedToken) {
              const updatedUser = await fetchCurrentUser(storedToken);
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          } catch (refreshErr) {
            console.warn("Failed to refresh user after verification:", refreshErr);
          }

          setStatus("success");
          setMessage("Email verified! Redirecting to your feed…");

          const t = setTimeout(() => {
            if (isMounted.current) navigate("/feed", { replace: true });
          }, 1400);
          return () => clearTimeout(t);
        }

        setStatus("error");
        setMessage("We couldn't verify that token. It may be expired.");
      } catch (err) {
        if (!isMounted.current) return;
        if (axios.isCancel(err)) return; // aborted
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("Verification failed. Your link may be expired or already used.");
      }
    };

    verify();

    return () => {
      isMounted.current = false;
      controllerRef.current?.abort();
    };
  }, [token, navigate, authToken, setUser]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur p-6 sm:p-8 shadow-xl">
          <header className="mb-6 sm:mb-8 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center">
              {status === "success" ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path className="text-emerald-400" d="M9 12l2 2 4-4" />
                  <circle className="text-emerald-400" cx="12" cy="12" r="9" strokeOpacity="0.35" />
                </svg>
              ) : status === "error" ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path className="text-rose-400" d="M12 8v4m0 4h.01" />
                  <circle className="text-rose-400" cx="12" cy="12" r="9" strokeOpacity="0.35" />
                </svg>
              ) : (
                <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle className="opacity-20" cx="12" cy="12" r="10" />
                  <path className="text-emerald-400" d="M4 12a8 8 0 018-8" />
                </svg>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Verify your email</h1>
          </header>

          {/* Message area */}
          <div className="space-y-3 text-center" aria-live="polite" role="status">
            {status === "verifying" && (
              <p className="text-sm/6 text-neutral-300">Verifying your email… one sec.</p>
            )}
            {status === "success" && (
              <p className="text-sm/6 text-emerald-400">{message}</p>
            )}
            {status === "error" && (
              <>
                <p className="text-sm/6 text-rose-400">{message || "Invalid or expired token."}</p>
                <p className="text-xs/6 text-neutral-400">You can request a new verification email and try again.</p>
              </>
            )}
          </div>

          {/* Actions for error state */}
          {status === "error" && (
            <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-3">
              <Link
                to="/verify/resend"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
              >
                Resend verification email
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium bg-neutral-800 text-neutral-100 hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
              >
                Back to login
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium border border-neutral-800 text-neutral-300 hover:bg-neutral-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
              >
                Go to Home
              </Link>
            </div>
          )}

          {/* Subtle footer helper */}
          <footer className="mt-6 sm:mt-8 text-center">
            <p className="text-[11px] text-neutral-500">
              Having trouble? Contact support at
              {" "}
              <a href="mailto:support@platerly.com" className="underline hover:text-neutral-300">
                support@platerly.com
              </a>
              .
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
