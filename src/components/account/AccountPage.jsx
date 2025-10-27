// src/pages/AccountPage.jsx
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // assuming you have this

export default function AccountPage() {
  const [sp] = useSearchParams();
  const sub = sp.get("sub");
  const { refreshUser } = useAuth(); // implement to re-fetch /me

  useEffect(() => {
    if (sub === "success") {
      // give webhook a moment; then refresh profile
      const t = setTimeout(() => refreshUser?.(), 1200);
      return () => clearTimeout(t);
    }
  }, [sub, refreshUser]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Account</h1>
      <p className="opacity-80">
        {sub === "success" && "Thanks for subscribing! Your Premium is active."}
        {sub === "cancel"  && "Checkout canceled. You can retry anytime."}
        {!sub && "Manage your subscription and account settings here."}
      </p>
    </main>
  );
}
