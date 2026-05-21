const BASE = '/api/auth';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const authApi = {
  register: (email, password, display_name) =>
    request('/register', { method: 'POST', body: JSON.stringify({ email, password, display_name }) }),

  login: (email, password) =>
    request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () =>
    request('/logout', { method: 'POST' }),

  me: () =>
    request('/me'),
};
