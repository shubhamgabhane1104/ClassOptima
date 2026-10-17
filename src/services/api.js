// Small fetch wrapper that adds the JWT token and turns API errors into exceptions.
// In development, Vite proxies /api to the Express server (see vite.config.js).
const BASE = import.meta.env.VITE_API_URL || '/api/v1';
// The login token is kept only in memory (a JavaScript variable), never in
// localStorage or cookies. So closing the tab, closing the browser or
// refreshing the page ends the session and the user must sign in again.
let memoryToken = null;

// Remove a token saved by older versions of the app, which used localStorage.
try { localStorage.removeItem('classoptima_token'); } catch { /* storage unavailable */ }

export const tokenStore = {
  get: () => memoryToken,
  set: (t) => { memoryToken = t; },
  clear: () => { memoryToken = null; },
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Cannot reach the ClassOptima server. Make sure it is running (cd server && npm run dev).', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status, data.details);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b || {}),
  put: (p, b) => request('PUT', p, b || {}),
  patch: (p, b) => request('PATCH', p, b || {}),
  del: (p) => request('DELETE', p),
};

// Downloads a file (e.g. PDF) from an authenticated endpoint.
export async function downloadFile(path, fallbackName) {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.message || 'Download failed', res.status);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = match ? match[1] : fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
