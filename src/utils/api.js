// utils/api.js

// Base URL: dev -> local API, prod -> empty so calls become same-origin /api/...
const RAW = (import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'https://localhost:7142' : '')).toString().trim();
export const API_BASE_URL = RAW.replace(/\/+$/, '');


// ---------- helpers ----------

async function tryParse(res) {
  // If there's no content, bail early
  const contentLength = res.headers.get('content-length');
  if (contentLength === '0') return null;

  const ct = (res.headers.get('content-type') || '').toLowerCase();

  // Read once; decide how to interpret it
  const text = await res.text();
  if (!text) return null;

  if (ct.includes('application/json')) {
    try { return JSON.parse(text); } catch { /* fallthrough */ }
  }
  // Non-JSON or invalid JSON: return as plain text
  return text;
}

function buildOpts(method, body, extra = {}) {
  const opts = { method, headers: { ...extra.headers } };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  return { ...extra, ...opts };
}

function errorMessage(payload, res) {
  if (!payload) return `Request failed (${res.status})`;
  if (typeof payload === 'string') return payload;
  return payload.error || payload.message || `Request failed (${res.status})`;
}

async function request(path, { method = 'GET', body, ...extra } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, buildOpts(method, body, extra));
  const data = await tryParse(res);

  if (!res.ok) {
    throw new Error(errorMessage(data, res));
  }
  return data;
}

// ---------- exported API calls ----------

// Auth
export function login(email, password) {
  // Your Swagger shows POST /api/User/login
  return request('/api/User/login', { method: 'POST', body: { email, password } });
}

export function resendVerificationEmail(email) {
  return request('/api/User/resend-verification-email', { method: 'POST', body: { email } });
}

export async function fetchCurrentUser(token) {
  return request('/api/User/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function resetPassword(token, newPassword) {
  return request('/api/User/reset-password', { method: 'POST', body: { token, newPassword } });
}

export function forgotPassword(email) {
  return request('/api/User/forgot-password', { method: 'POST', body: { email } });
}
