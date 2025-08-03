import { useState } from "react";
import {useAuth} from "../../context/AuthContext"; // assuming you have an AuthContext
import { resendVerificationEmail } from "../../utils/api"; // we'll add this endpoint
import { toast } from "react-hot-toast";

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    try {
      setLoading(true);
      await resendVerificationEmail(user.email);
      toast.success("Verification email sent!");
    } catch (err) {
      toast.error("Failed to send verification email.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm flex items-center justify-between shadow-md">
      <span>
        Your email is not verified.{" "}
        <button
          onClick={handleResend}
          disabled={loading}
          className="underline font-medium"
        >
          {loading ? "Sending..." : "Click here to resend verification email"}
        </button>
      </span>
      <button onClick={() => setDismissed(true)} className="ml-4 text-lg font-bold">
        ×
      </button>
    </div>
  );
}
