import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const fmtDate = (isoLike) => {
  if (!isoLike) return null;
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const StatusBadge = ({ status }) => {
  const map = {
    active: "bg-green-600/20 text-green-300 border-green-500/40",
    trialing: "bg-blue-600/20 text-blue-300 border-blue-500/40",
    past_due: "bg-yellow-600/20 text-yellow-200 border-yellow-500/40",
    canceled: "bg-zinc-600/20 text-zinc-300 border-zinc-500/40",
    unpaid: "bg-red-700/20 text-red-200 border-red-500/40",
    incomplete: "bg-orange-700/20 text-orange-200 border-orange-500/40",
    incomplete_expired: "bg-orange-900/30 text-orange-200 border-orange-700/40",
    paused: "bg-zinc-700/30 text-zinc-200 border-zinc-500/40",
  };
  const cls = map[status] || "bg-zinc-700/30 text-zinc-200 border-zinc-500/40";
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${cls}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-70" />
      <span className="text-sm capitalize">{status || "unknown"}</span>
    </span>
  );
};

export default function BillingPanel() {
  const { user, token } = useAuth();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

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
    if (!user?.id || !token) return;
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
    }
  };

  useEffect(() => { fetchStatus(); /* eslint-disable-next-line */ }, [user?.id, token]);

  const startCheckout = async () => {
    if (!user?.id || !token) return;
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const openPortal = async () => {
    if (!user?.id || !token) return;
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const cancelAtEnd = async () => {
    if (!user?.id || !token) return;
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const resume = async () => {
    if (!user?.id || !token) return;
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900/50 p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Platerly Premium</h3>
            <p className="text-sm text-zinc-400 mt-1">$6.99/month • Manage with Stripe</p>
          </div>
          {premiumStatus && <StatusBadge status={premiumStatus} />}
        </div>

        <div className="mt-5 grid gap-2 text-sm text-zinc-300">
          {isPremium ? (
            <>
              <div><span className="text-zinc-400 mr-2">Plan:</span><span>Premium</span></div>
              {cancelAtPeriodEnd ? (
                <div><span className="text-zinc-400 mr-2">Cancels on:</span><span>{fmtDate(currentPeriodEnd) ?? "—"}</span></div>
              ) : (
                <div><span className="text-zinc-400 mr-2">Renews on:</span><span>{fmtDate(currentPeriodEnd) ?? "—"}</span></div>
              )}
            </>
          ) : (
            <div className="text-zinc-300">You’re on the free plan. Upgrade to unlock all features.</div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!isPremium && (
            <button
              onClick={startCheckout}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              Upgrade to Premium
            </button>
          )}

          {isPremium && (
            <>
              <button
                onClick={openPortal}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 disabled:opacity-50"
              >
                Manage Billing
              </button>

              {!cancelAtPeriodEnd ? (
                <button
                  onClick={cancelAtEnd}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-50"
                >
                  Cancel at Period End
                </button>
              ) : (
                <button
                  onClick={resume}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                >
                  Resume Subscription
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
