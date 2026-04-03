/**
 * utils/api.js — Layer: Utility / HTTP transport
 *
 * Central API client for unauthenticated (or manually-authed) requests.
 * Exports:
 *  - API_BASE_URL  : resolved base URL used by every fetch in the app
 *  - Thin wrappers : login, forgotPassword, resetPassword, resendVerificationEmail, fetchCurrentUser
 *
 * For authenticated requests inside React components, prefer the `useApi` hook
 * from fetchWithAuth.js, which handles token injection and silent refresh automatically.
 */

// Prefer VITE_API_BASE_URL (set in .env / Azure App Settings); fall back to the
// Vite dev server's HTTPS localhost in development; in production with no env
// var set, use same-origin (empty string) so relative paths resolve against the
// host that served the page.
const RAW = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'https://localhost:7142' : '')).toString().trim();
// Strip any trailing slashes so every path can safely be prefixed with "/"
export const API_BASE_URL = RAW.replace(/\/+$/, '');

// ---------- helpers ----------

/**
 * Safely reads the response body as JSON or plain text.
 * Returns null when the response carries no content (204, explicit content-length: 0,
 * or an empty body), avoiding JSON.parse errors on empty responses.
 *
 * @param {Response} res - The fetch Response object
 * @returns {Promise<object|string|null>} Parsed JSON, raw text, or null
 */
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

/**
 * Builds a RequestInit object for fetch, handling JSON serialisation,
 * FormData pass-through, and pre-string bodies (e.g. already-serialised JSON).
 * Content-Type is only set for JSON objects; FormData and string bodies are
 * sent as-is so the browser can set the correct multipart boundary.
 *
 * @param {string} method - HTTP verb (GET, POST, etc.)
 * @param {*} body - Request payload (object → JSON, FormData → multipart, string → raw)
 * @param {RequestInit} extra - Additional fetch options (headers, credentials, etc.)
 * @returns {RequestInit} A fully-configured fetch init object
 */
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

/**
 * Extracts the most human-readable error string from an API response payload.
 * Precedence: payload.error → payload.message → generic "Request failed (status)".
 *
 * @param {object|string|null} payload - Parsed response body
 * @param {Response} res - The original fetch Response (used for status code fallback)
 * @returns {string} A displayable error message
 */
function errorMessage(payload, res) {
  if (!payload) return `Request failed (${res.status})`;
  if (typeof payload === 'string') return payload;
  return payload.error || payload.message || `Request failed (${res.status})`;
}

/**
 * Races a fetch promise against a hard timeout.
 * Uses AbortController to cancel the in-flight request when the timeout fires,
 * and a second timer (+10ms) that rejects with a human-readable error to ensure
 * the race resolves even if the abort doesn't cancel immediately.
 *
 * @param {function(AbortSignal): Promise<Response>} promise - Factory that accepts a signal
 * @param {number} ms - Timeout in milliseconds (default 15000)
 * @returns {Promise<Response>} Resolves with the response or rejects on timeout/network error
 */
function withTimeout(promise, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return Promise.race([
    promise(ctrl.signal).finally(() => clearTimeout(t)),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Request timed out')), ms + 10))
  ]);
}

/**
 * Core request helper. Prepends API_BASE_URL to relative paths, calls withTimeout,
 * parses the response body, and throws on non-2xx status codes.
 *
 * @param {string} path - API path (absolute or relative; relative paths are prefixed with API_BASE_URL)
 * @param {object} options
 * @param {string}  options.method            - HTTP verb (default 'GET')
 * @param {*}       options.body              - Request payload
 * @param {boolean} options.includeCredentials - Send cookies cross-origin (needed for login/refresh)
 * @param {...*}    options.extra             - Any additional RequestInit fields
 * @returns {Promise<object|string|null>} Parsed response body
 * @throws {Error} On non-2xx status or network/timeout error
 */
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
/**
 * Authenticates the user with email and password.
 * Sends credentials: 'include' so the backend can set the HttpOnly refresh cookie
 * on a cross-origin response (required when API and frontend are on different origins
 * in development or staging).
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: object}>}
 */
export function login(email, password) {
  return request('/api/Auth/login', {
    method: 'POST',
    body: { email, password },
    includeCredentials: true
  });
}

/**
 * Triggers a new verification email for the given address.
 * Used on the ResendVerification page when the original email was missed or expired.
 *
 * @param {string} email
 * @returns {Promise<null>}
 */
export function resendVerificationEmail(email) {
  return request('/api/User/resend-verification-email', { method: 'POST', body: { email } });
}

/**
 * Completes a password-reset flow using the one-time token from the email link.
 *
 * @param {string} token      - Reset token from the email query-string
 * @param {string} newPassword
 * @returns {Promise<null>}
 */
export function resetPassword(token, newPassword) {
  return request('/api/User/reset-password', { method: 'POST', body: { token, newPassword } });
}

/**
 * Initiates a password-reset email for the given address.
 *
 * @param {string} email
 * @returns {Promise<null>}
 */
export function forgotPassword(email) {
  return request('/api/User/forgot-password', { method: 'POST', body: { email } });
}

// Unauthenticated helpers may continue to use `request`.
// For protected routes, prefer the `apiFetch` wrapper from fetchWithAuth.js.
/**
 * Fetches the currently-authenticated user's profile.
 * Used during session bootstrap (e.g. after a token refresh) to hydrate user state.
 * Manually injects the Authorization header because this function lives outside
 * React and cannot call the useAuth hook.
 *
 * @param {string} token - Bearer token
 * @returns {Promise<object>} User profile object
 */
export async function fetchCurrentUser(token) {
  return request('/api/User/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}
