export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7142';

export const resendVerificationEmail = (email) => {
  return fetch(`${API_BASE_URL}/api/User/resend-verification-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
};

export const fetchCurrentUser = async (token) => {
  const res = await fetch(`${API_BASE_URL}/api/User/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('Failed to fetch current user.');
  }

  return res.json(); // This will return { id, email, username, isEmailVerified, ... }
};

export const resetPassword = (token, newPassword) => {
  return fetch(`${API_BASE_URL}/api/User/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
};

export async function forgotPassword(email) {
  return fetch(`${API_BASE_URL}/api/User/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}
