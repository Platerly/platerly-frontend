/**
 * ForgotPassword
 *
 * Layer: Public password-reset request page.
 * Route: /forgot-password
 *
 * Flow:
 *  1. User enters their email address
 *  2. POST to forgotPassword() helper (maps to POST /api/Auth/forgot-password)
 *  3. On success, navigates to /login with a toast confirming the email was sent
 *     (vague message intentional — avoids confirming whether an account exists)
 */
import { useState } from "react";
import { toast } from "react-hot-toast";
import { forgotPassword } from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import logger from "../utils/logger";

/** @returns {JSX.Element} */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.ok) {
        toast.success("If an account exists, a reset email was sent.");
        navigate("/login");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Error sending reset email.");
      }
    } catch (err) {
      logger.error("Forgot password request failed", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-recipzee-dark text-recipzee-text px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 bg-recipzee-card border border-recipzee-light rounded-2xl p-6 shadow"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold">Forgot Password</h2>
          <p className="mt-1 text-sm text-recipzee-subtle">
            Enter your email to receive a reset link.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm mb-1 text-recipzee-subtle">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="w-full p-2.5 rounded-lg bg-recipzee-card border border-recipzee-light text-recipzee-text placeholder-recipzee-subtle focus:outline-none focus:ring-2 focus:ring-recipzee-green/40"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg p-2.5 font-semibold bg-recipzee-green text-recipzee-dark hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-recipzee-green/40"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="text-center text-sm">
          <Link
            to="/login"
            className="text-recipzee-yellow hover:underline focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 rounded"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}
