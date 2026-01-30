// BillingPanel.jsx (FULL WORKING VERSION)
// ✅ Re-fetches status after returning from Stripe portal (portal=return)
// ✅ Also re-fetches after checkout success/cancel
// ✅ Uses the backend fields you return (cancelAtPeriodEnd + currentPeriodEnd)

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/formatDate";
import { logger } from "../../utils/logger";

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
    <div className="h-5 w-40 bg-recipzee-border/50 rounded" />
    <div className="h-4 w-56 bg-recipzee-border/40 rounded" />
    <div className="h-10 w-44 bg-recipzee-border/40 rounded-xl" />
  </div>
);

export default function BillingPanel() {
  const { user, token } = useAuth();
  const location = useLocation();

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const didToastBillingFailRef = useRef(false);

  const isPremium = !!status?.isPremium;
  const premiumStatus = status?.premiumStatus;
  const cancelAtPeriodEnd = !!status?.premiumCancelAtPeriodEnd;
  const currentPeriodEnd = status?.premiumCurrentPeriodEnd;

  const mapStatus = (data) => ({
    isPremium: data.isPremium ?? data.IsPremium,
    premiumStatus: data.premiumStatus ?? data.PremiumStatus,
    premiumSince: data.premiumSince ?? data.PremiumSince,

    premiumCancelAtPeriodEnd:
      data.cancelAtPeriodEnd ??
      data.premiumCancelAtPeriodEnd ??
      data.PremiumCancelAtPeriodEnd,

    premiumCurrentPeriodEnd:
      data.currentPeriodEnd ??
      data.premiumCurrentPeriodEnd ??
      data.PremiumCurrentPeriodEnd,
  });

  const fetchStatus = async ({ silent = false } = {}) => {
    if (!user?.id || !token) {
      setInitialLoading(false);
      return;
    }

    try {
      if (!silent) setBusy(true);

      const url = `${API_BASE_URL}/api/billing/status?userId=${encodeURIComponent(user.id)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data = await res.json();
      setStatus(mapStatus(data));
    } catch (e) {
      logger.error("Billing error", e);

      if (!didToastBillingFailRef.current) {
        didToastBillingFailRef.current = true;
        toast.error("Failed to load billing status.");
      }

      setStatus(null);
    } finally {
      if (!silent) setBusy(false);
      setInitialLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  // handle return from Checkout + Portal
  useEffect(() => {
    const sp = new URLSearchParams(location.search);

    const sub = sp.get("sub");
    if (sub === "success") toast.success("Subscription successful. Welcome to Premium!");
    if (sub === "cancel") toast("Checkout canceled.");

    const portal = sp.get("portal");
    if (portal === "return") {
      // fetch immediately, then again after a short delay (webhook latency)
      fetchStatus({ silent: true });
      const t = setTimeout(() => fetchStatus({ silent: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [location.search]); // intentionally not including fetchStatus to avoid loops

  const actionBtn = (label, onClick, variant = "primary", disabled = false) => {
    const base =
      "px-4 py-2 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-recipzee-green/60";
    const styles = {
      primary: "bg-recipzee-green hover:bg-recipzee-green/90 text-white disabled:opacity-50",
      neutral:
        "bg-recipzee-card hover:bg-recipzee-card/80 text-recipzee-text border border-recipzee-border disabled:opacity-50",
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
      logger.error("Billing error", e);
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
      logger.error("Billing error", e);
      toast.error("Could not open billing portal.");
    } finally {
      setBusy(false);
    }
  };

  const headerNote = useMemo(() => {
    if (!status) return "$6.99/month • Manage with Stripe";
    if (!isPremium) return "$6.99/month • Upgrade in seconds";
    return cancelAtPeriodEnd ? "Active until period end" : "Renews automatically";
  }, [status, isPremium, cancelAtPeriodEnd]);

  return (
    <div className="w-full">
      <section
        className={cx(
          "rounded-2xl border p-5 md:p-6",
          "bg-recipzee-card border-recipzee-border text-recipzee-text"
        )}
        aria-labelledby="billing-title"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="billing-title" className="text-xl font-semibold tracking-tight">
              Recipzee Premium
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

                  <div>
                    <span className="opacity-70 mr-2">
                      {cancelAtPeriodEnd ? "Ends on:" : "Renews on:"}
                    </span>
                    <span>{formatDate(currentPeriodEnd)}</span>
                  </div>
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
            </>
          )}

          {!initialLoading && !status && actionBtn("Retry", () => fetchStatus(), "neutral", busy)}
        </div>
      </section>
    </div>
  );
}
