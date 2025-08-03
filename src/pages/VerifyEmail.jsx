import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, fetchCurrentUser } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);
  const hasVerified = useRef(false);

  const token = searchParams.get("token");
  const { token: authToken, setUser } = useAuth();

  useEffect(() => {
    isMounted.current = true;

    if (!token) {
      setStatus("error");
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading

        const response = await axios.get(`${API_BASE_URL}/api/User/verify-email?token=${token}`);

        if (response.status === 200 && isMounted.current) {
          toast.success("Email verified successfully!");

          // Try to refresh current user if logged in
          try {
            const storedToken = authToken || localStorage.getItem("token");

            // After successful verification, always refresh user via token (even if auth context is empty)
            // Fixes issue where isEmailVerified was not syncing unless user was fully logged in

            if (storedToken) {
              const updatedUser = await fetchCurrentUser(storedToken);
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          } catch (refreshError) {
            console.warn("⚠️ Failed to refresh user after verification:", refreshError);
          }

          setStatus("success");

          timeoutRef.current = setTimeout(() => {
            if (isMounted.current) navigate("/feed");
          }, 2500);
        } else if (isMounted.current) {
          setStatus("error");
        }
      } catch (error) {
        console.error("❌ Verification failed:", error);
        if (isMounted.current) setStatus("error");
      }
    };

    verify();

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [token, navigate, authToken, setUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-gray-900 text-center">
      {status === "verifying" && <p className="text-lg">Verifying your email...</p>}
      {status === "success" && <p className="text-green-400 text-lg">Email verified! Redirecting to your feed...</p>}
      {status === "error" && (
        <div>
          <p className="text-red-500 text-lg">Invalid or expired token.</p>
          <p className="mt-2">Please try again or request a new verification email.</p>
        </div>
      )}
    </div>
  );
}
