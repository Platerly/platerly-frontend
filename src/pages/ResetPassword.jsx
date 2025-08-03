import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { resetPassword } from "../utils/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Missing or invalid token.");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);

      if (res.ok) {
        toast.success("Password reset! You may now log in.");
        navigate("/login");
      } else {
        const data = await res.json();
        toast.error(data.message || "Reset failed.");
      }
    } catch (err) {
      console.error("Reset error:", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <form onSubmit={handleReset} className="w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-center">Reset Your Password</h2>
        <input
          type="password"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 transition rounded p-2 font-semibold"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
