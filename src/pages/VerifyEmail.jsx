import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, fetchCurrentUser } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { CheckCircle, AlertCircle, Loader2, Mail } from "lucide-react";
import logger from "../utils/logger";

/**
 * VerifyEmail
 *
 * Layer: Public email verification landing page.
 * Route: /verify-email?token=<jwt>
 *
 * Flow:
 *  1. User clicks the verification link from the registration welcome email
 *  2. Token is extracted from ?token= query param
 *  3. GET /api/User/verify-email?token=… is called once (guarded by hasVerified ref
 *     to prevent double-verify in React StrictMode double-invocation)
 *  4. On 200: refreshes AuthContext user object from /api/User/me, then navigates
 *     to /feed after 1.4 s (gives the user time to read the success message)
 *  5. On error: shows retry options (resend link or go home)
 *
 * Styling: premium Platerly dark theme, gradient orbs
 * A11y: aria-live polite status region so screen readers announce verification outcome
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
          toast.success("Email verified!");

          // Refresh current user if we have or find a token
          try {
            const storedToken = authToken || localStorage.getItem("token");
            if (storedToken) {
              const updatedUser = await fetchCurrentUser(storedToken);
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          } catch (refreshErr) {
            logger.warn("Failed to refresh user after verification", refreshErr);
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
        logger.error("Email verification failed", err);
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
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text flex items-center justify-center px-4 py-10 sm:px-6 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-recipzee-green/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border border-recipzee-border bg-recipzee-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl">
          <header className="mb-6 sm:mb-8 text-center">
            <div className={`mx-auto mb-4 h-12 w-12 rounded-xl flex items-center justify-center ${
              status === "success"
                ? "bg-recipzee-green/20"
                : status === "error"
                ? "bg-red-500/20"
                : "bg-recipzee-green/20"
            }`}>
              {status === "success" ? (
                <CheckCircle className="h-6 w-6 text-recipzee-green" />
              ) : status === "error" ? (
                <AlertCircle className="h-6 w-6 text-red-400" />
              ) : (
                <Loader2 className="h-6 w-6 text-recipzee-green animate-spin" />
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-recipzee-text">
              Verify your email
            </h1>
          </header>

          {/* Message area */}
          <div className="space-y-3 text-center" aria-live="polite" role="status">
            {status === "verifying" && (
              <p className="text-sm text-recipzee-subtle">Verifying your email… one sec.</p>
            )}
            {status === "success" && (
              <p className="text-sm text-recipzee-green">{message}</p>
            )}
            {status === "error" && (
              <>
                <p className="text-sm text-red-400">{message || "Invalid or expired token."}</p>
                <p className="text-xs text-recipzee-subtle">You can request a new verification email and try again.</p>
              </>
            )}
          </div>

          {/* Actions for error state */}
          {status === "error" && (
            <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-3">
              <Link
                to="/verify/resend"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-recipzee-green text-recipzee-dark hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 transition-all shadow-lg shadow-recipzee-green/20"
              >
                <Mail className="w-4 h-4" />
                Resend verification email
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium bg-recipzee-light text-recipzee-text hover:bg-recipzee-light/80 focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 transition-all"
              >
                Back to login
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium border border-recipzee-border text-recipzee-subtle hover:bg-recipzee-light/50 hover:text-recipzee-text focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 transition-all"
              >
                Go to Home
              </Link>
            </div>
          )}

          {/* Subtle footer helper */}
          <footer className="mt-6 sm:mt-8 text-center">
            <p className="text-[11px] text-recipzee-muted">
              Having trouble? Contact support at
              {" "}
              <a href="mailto:support@recipzee.com" className="underline hover:text-recipzee-subtle transition-colors">
                support@recipzee.com
              </a>
              .
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
