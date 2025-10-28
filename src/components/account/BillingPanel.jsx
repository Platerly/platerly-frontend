import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

/* ---------- utils ---------- */
const fmtDate = (isoLike) => {
  if (!isoLike) return null;
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const cx = (...xs) => xs.filter(Boolean).join(" ");

/* ---------- status badge ---------- */
const statusStyle = {
  active: "bg-green-600/10 text-green-500 border-green-500/30",
  trialing: "bg-blue-600/10 text-blue-400 border-blue-500/30",
  past_due: "bg-amber-600/10 text-amber-400 border-amber-500/30",
  canceled: "bg-zinc-600/10 text-zinc-300 border-zinc-500/30",
  unpaid: "bg-red-700/10 text-red-400 border-red-500/30",
  incomplete: "bg-orange-700/10 text-orange-300 border-orange-500/30",
  incomplete_expired: "bg-orange-900/15 text-orange-300 border-orange-700/30",
  paused: "bg-zinc-700/15 text-zinc-200 border-zinc-500/30",
};

const StatusBadge = ({ status }) => {
  const cls = statusStyle[status] ?? statusStyle.paused;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border",
        "text-sm capitalize",
        cls
      )}
      aria-label={`Subscription status: ${status || "unknown"}`}
    >
      <span className="w-2 h-2 rounded-full bg-current opacity-70" />
      <span>{status || "unknown"}</span>
    </span>
  );
};

/* ---------- skeleton ---------- */
const Skeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-5 w-40 bg-platerly-border/50 rounded" />
    <div className="h-4 w-56 bg-platerly-border/40 rounded" />
    <div className="h-10 w-44 bg-platerly-border/40 rounded-xl" />
  </div>
);

export default function BillingPanel() {
  const { user, token } = useAuth();
  const location = useLocation();

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const isPremium = !!status?.isPremium;
  const premiumStatus = status?.premiumStatus;
  const cancelAtPeriodEnd = !!status?.premiumCancelAtPeriodEnd;
  const currentPeriodEnd = status?.premiumCurrentPeriodEnd;

  // handle /settings?sub=success|cancel return from Stripe Checkout
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const sub = sp.get("sub");
    if (sub === "success") toast.success("Subscription successful. Welcome to Premium!");
    if (sub === "cancel") toast("Checkout canceled.");
  }, [location.search]);

  const fetchStatus = async () => {
    if (!user?.id || !token) {
      setInitialLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/status/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setStatus({
        isPremium: data.isPremium ?? data.IsPremium,
        premiumStatus: data.premiumStatus ?? data.PremiumStatus,
        premiumSince: data.premiumSince ?? data.PremiumSince,
        premiumCancelAtPeriodEnd:
          data.premiumCancelAtPeriodEnd ?? data.PremiumCancelAtPeriodEnd,
        premiumCurrentPeriodEnd:
          data.premiumCurrentPeriodEnd ?? data.PremiumCurrentPeriodEnd,
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load billing status.");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchStatus();
  }, [user?.id, token]);

  const actionBtn = (label, onClick, variant = "primary", disabled = false) => {
    const base =
      "px-4 py-2 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platerly-green/60";
    const styles = {
      primary:
        "bg-platerly-green hover:bg-platerly-green/90 text-white disabled:opacity-50",
      neutral:
        "bg-platerly-card hover:bg-platerly-card/80 text-platerly-text border border-platerly-border disabled:opacity-50",
      danger:
        "bg-red-700 hover:bg-red-600 text-white disabled:opacity-50",
      warn:
        "bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50",
    };
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cx(base, styles[variant])}
        aria-busy={disabled || undefined}
      >
        {label}
      </button>
    );
  };

  const startCheckout = async () => {
    if (!user?.id || !token) return;
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE_URL}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error(`Create checkout ${res.status}`);
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      console.error(e);
      toast.error("Could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  const openPortal = async () => {
    if (!user?.id || !token) return;
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE_URL}/api/billing/create-portal-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error(`Create portal ${res.status}`);
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      console.error(e);
      toast.error("Could not open billing portal.");
    } finally {
      setBusy(false);
    }
  };

  const cancelAtEnd = async () => {
    if (!user?.id || !token) return;
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE_URL}/api/billing/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error(`Cancel ${res.status}`);
      toast("Subscription will cancel at period end.");
      await fetchStatus();
    } catch (e) {
      console.error(e);
      toast.error("Failed to schedule cancellation.");
    } finally {
      setBusy(false);
    }
  };

  const resume = async () => {
    if (!user?.id || !token) return;
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE_URL}/api/billing/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error(`Resume ${res.status}`);
      toast.success("Subscription resumed.");
      await fetchStatus();
    } catch (e) {
      console.error(e);
      toast.error("Failed to resume subscription.");
    } finally {
      setBusy(false);
    }
  };

  const headerNote = useMemo(() => {
    if (!status) return "$6.99/month • Manage with Stripe";
    if (!isPremium) return "$6.99/month • Upgrade in seconds";
    return cancelAtPeriodEnd
      ? "Will cancel at period end"
      : "Renews automatically";
  }, [status, isPremium, cancelAtPeriodEnd]);

  return (
    <div className="w-full">
      <section
        className={cx(
          "rounded-2xl border p-5 md:p-6",
          "bg-platerly-card border-platerly-border text-platerly-text"
        )}
        aria-labelledby="billing-title"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="billing-title" className="text-xl font-semibold tracking-tight">
              Platerly Premium
            </h3>
            <p className="text-sm opacity-70 mt-1">{headerNote}</p>
          </div>
          {premiumStatus && <StatusBadge status={premiumStatus} />}
        </div>

        <div className="mt-5">
          {initialLoading ? (
            <Skeleton />
          ) : (
            <div className="grid gap-2 text-sm opacity-90">
              {isPremium ? (
                <>
                  <div>
                    <span className="opacity-70 mr-2">Plan:</span>
                    <span>Premium</span>
                  </div>
                  {cancelAtPeriodEnd ? (
                    <div>
                      <span className="opacity-70 mr-2">Cancels on:</span>
                      <span>{fmtDate(currentPeriodEnd) ?? "—"}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="opacity-70 mr-2">Renews on:</span>
                      <span>{fmtDate(currentPeriodEnd) ?? "—"}</span>
                    </div>
                  )}
                </>
              ) : (
                <div>You're on the free plan. Upgrade to unlock all features.</div>
              )}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!initialLoading && !isPremium && actionBtn("Upgrade to Premium", startCheckout, "primary", busy)}
          {!initialLoading && isPremium && (
            <>
              {actionBtn("Manage Billing", openPortal, "neutral", busy)}
              {!cancelAtPeriodEnd
                ? actionBtn("Cancel at Period End", cancelAtEnd, "danger", busy)
                : actionBtn("Resume Subscription", resume, "warn", busy)}
            </>
          )}

          {/* Try again if initial fetch failed and left us without status */}
          {!initialLoading && !status && actionBtn("Retry", fetchStatus, "neutral", busy)}
        </div>
      </section>
    </div>
  );
}
