// src/pages/AccountPage.jsx
import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AccountPage() {
  const [sp] = useSearchParams();
  const sub = sp.get("sub");
  const { refreshUser, user } = useAuth();

  useEffect(() => {
    if (sub === "success") {
      const t = setTimeout(() => refreshUser?.(), 1200);
      return () => clearTimeout(t);
    }
  }, [sub, refreshUser]);

  const message =
    sub === "success"
      ? "Your Recipzee Premium subscription is active. Enjoy the full experience!"
      : sub === "cancel"
      ? "Your checkout was canceled. No worries — you can retry anytime."
      : "Manage your subscription and account settings below.";

  return (
    <main className="mx-auto max-w-xl p-6 md:p-10">
      <h1 className="text-3xl font-bold text-recipzee-text mb-4">
        Account
      </h1>

      {/* Status Banner */}
      {sub && (
        <div
          className={`mb-6 rounded-md px-4 py-3 text-sm font-medium ${
            sub === "success"
              ? "bg-green-600/10 text-green-600 border border-green-600/40"
              : "bg-red-600/10 text-red-600 border border-red-600/40"
          }`}
        >
          {sub === "success"
            ? "✅ Subscription Successful"
            : "⚠️ Checkout Canceled"}
        </div>
      )}

      <p className="text-recipzee-text/80 leading-relaxed mb-8">{message}</p>

      {/* Premium Status */}
      {user?.isPremium ? (
        <div className="rounded-lg border border-recipzee-border bg-recipzee-card p-5 mb-10">
          <h2 className="text-xl font-semibold mb-2 text-recipzee-text">
            Your Plan
          </h2>
          <p className="text-recipzee-text/80">
            ✅ You’re currently subscribed to{" "}
            <span className="font-medium">Recipzee Premium</span>.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-recipzee-border bg-recipzee-card p-5 mb-10">
          <h2 className="text-xl font-semibold mb-3 text-recipzee-text">
            Unlock Premium
          </h2>
          <p className="text-recipzee-text/80 mb-4">
            Upgrade to access smart allergy insights, advanced chef discovery,
            and more powerful recipe tools.
          </p>
          <Link
            to="/settings?tab=subscription"
            className="block text-center bg-recipzee-green hover:bg-recipzee-green/90 transition text-white font-medium px-4 py-2 rounded-md"
          >
            Upgrade to Premium
          </Link>
        </div>
      )}

      {/* Settings shortcut */}
      <Link
        to="/settings"
        className="inline-flex items-center text-recipzee-green font-medium hover:underline"
      >
        Go to Settings →
      </Link>
    </main>
  );
}
