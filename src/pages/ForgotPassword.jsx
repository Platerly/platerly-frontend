import { useState } from "react";
import { toast } from "react-hot-toast";
import { forgotPassword } from "../utils/api";
import { useNavigate } from "react-router-dom";

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
        const data = await res.json();
        toast.error(data.message || "Error sending reset email.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-center">Forgot Password</h2>
        <input
          type="email"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 transition rounded p-2 font-semibold"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
