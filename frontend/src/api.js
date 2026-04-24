const BASE = import.meta.env.VITE_API_BASE || '/api';

function token() {
  return localStorage.getItem('knowall_token') || '';
}

export function setToken(t) {
  if (t) localStorage.setItem('knowall_token', t);
  else localStorage.removeItem('knowall_token');
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : `HTTP ${res.status}`);
  return data;
}
