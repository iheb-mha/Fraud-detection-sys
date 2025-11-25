const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function getToken() {
  return window.localStorage.getItem('auth_token') || null;
}

export function saveToken(token) {
  if (token) {
    window.localStorage.setItem('auth_token', token);
  } else {
    window.localStorage.removeItem('auth_token');
  }
}

export async function registerUser({ email, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  if (data.token) saveToken(data.token);
  return data;
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  if (data.token) saveToken(data.token);
  return data;
}

export async function predict(transaction) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ transaction })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export async function predictModel(features) {
  const res = await fetch(`${BASE_URL}/api/predict-model`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getMyAnalyses() {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/analyses/me`, { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}
