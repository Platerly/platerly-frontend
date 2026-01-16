// utils/api.js

// Prefer VITE_API_BASE_URL; fallback to local API in dev; else same-origin
const RAW = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'https://localhost:7142' : '')).toString().trim();
export const API_BASE_URL = RAW.replace(/\/+$/, '');

// ---------- helpers ----------

async function tryParse(res) {
  // If there's no content, bail early
  const contentLength = res.headers.get('content-length');
  if (contentLength === '0') return null;

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text();
  if (!text) return null;

  if (ct.includes('application/json')) {
    try { return JSON.parse(text); } catch { /* fallthrough */ }
  }
  return text; // non-JSON: return as text
}

function buildOpts(method, body, extra = {}) {
  const headers = new Headers(extra.headers || {});
  const isStringBody = typeof body === 'string';
  const hasFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !hasFormData && !isStringBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const init = { method, headers, ...extra };
  if (body !== undefined) {
    init.body = hasFormData || isStringBody ? body : JSON.stringify(body);
  }
  return init;
}

function errorMessage(payload, res) {
  if (!payload) return `Request failed (${res.status})`;
  if (typeof payload === 'string') return payload;
  return payload.error || payload.message || `Request failed (${res.status})`;
}

function withTimeout(promise, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return Promise.race([
    promise(ctrl.signal).finally(() => clearTimeout(t)),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Request timed out')), ms + 10))
  ]);
}

async function request(path, { method = 'GET', body, includeCredentials = false, ...extra } = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const init = buildOpts(method, body, {
    ...extra,
    credentials: includeCredentials ? 'include' : (extra.credentials ?? 'same-origin')
  });

  const res = await withTimeout((signal) => fetch(url, { ...init, signal }));
  const data = await tryParse(res);
  if (!res.ok) throw new Error(errorMessage(data, res));
  return data;
}

// ---------- exported API calls ----------

// Auth (use credentials: include for login so refresh cookie can be set cross-site)
export function login(email, password) {
  return request('/api/Auth/login', {
    method: 'POST',
    body: { email, password },
    includeCredentials: true
  });
}

export function resendVerificationEmail(email) {
  return request('/api/User/resend-verification-email', { method: 'POST', body: { email } });
}

export function resetPassword(token, newPassword) {
  return request('/api/User/reset-password', { method: 'POST', body: { token, newPassword } });
}

export function forgotPassword(email) {
  return request('/api/User/forgot-password', { method: 'POST', body: { email } });
}

// Unauthenticated helpers may continue to use `request`.
// For protected routes, prefer the `apiFetch` wrapper from fetchWithAuth.js.
export async function fetchCurrentUser(token) {
  return request('/api/User/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}
