const BASE = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem('mf_access_token');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get:    <T>(path: string)                 => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body ?? {}) }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string)                => request<T>(path, { method: 'DELETE' }),

  setToken:  (token: string) => localStorage.setItem('mf_access_token', token),
  clearToken: ()             => localStorage.removeItem('mf_access_token'),
  hasToken:  ()              => !!localStorage.getItem('mf_access_token'),
};
