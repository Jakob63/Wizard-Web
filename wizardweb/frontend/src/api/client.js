export const BACKEND = (import.meta?.env?.VITE_BACKEND_URL) || 'http://localhost:9000';

function buildUrl(path, query) {
  const base = `${BACKEND}${path.startsWith('/') ? '' : '/'}${path}`;
  if (!query) return base;
  const usp = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((vv) => usp.append(k, String(vv)));
    else usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}

function getCsrfToken() {
  // Try meta tag injected by backend; fallback to Play's 'nocheck' header
  try {
    const m = (typeof document !== 'undefined') && document.querySelector('meta[name="csrf-token"]');
    const t = m && m.getAttribute('content');
    return t || 'nocheck';
  } catch (_) {
    return 'nocheck';
  }
}

async function handle(res) {
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    let body;
    try {
      body = ct.includes('application/json') ? await res.json() : await res.text();
    } catch (_) {
      body = null;
    }
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export function apiGet(path, { query, headers, credentials = 'include', ...rest } = {}) {
  return fetch(buildUrl(path, query), {
    method: 'GET',
    credentials,
    headers: { Accept: 'application/json', ...(headers || {}) },
    ...rest,
  }).then(handle);
}

export function apiPost(path, body, { headers, credentials = 'include', ...rest } = {}) {
  return fetch(buildUrl(path), {
    method: 'POST',
    credentials,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Csrf-Token': getCsrfToken(), ...(headers || {}) },
    body: body != null ? JSON.stringify(body) : undefined,
    ...rest,
  }).then(handle);
}

export function apiPut(path, body, { headers, credentials = 'include', ...rest } = {}) {
  return fetch(buildUrl(path), {
    method: 'PUT',
    credentials,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Csrf-Token': getCsrfToken(), ...(headers || {}) },
    body: body != null ? JSON.stringify(body) : undefined,
    ...rest,
  }).then(handle);
}

export function apiDelete(path, { headers, credentials = 'include', ...rest } = {}) {
  return fetch(buildUrl(path), {
    method: 'DELETE',
    credentials,
    headers: { Accept: 'application/json', 'Csrf-Token': getCsrfToken(), ...(headers || {}) },
    ...rest,
  }).then(handle);
}

export const api = { BACKEND, buildUrl, apiGet, apiPost, apiPut, apiDelete };
