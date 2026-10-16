const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001/api';

/** Fetch wrapper for the Flask session-cookie API. */
export async function apiRequest(path, { method = 'GET', body, headers, ...rest } = {}) {
  const isForm = body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    credentials: 'include',
    ...rest,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message = payload?.error ?? payload?.message ?? 'Something went wrong. Try again.';
    throw new Error(message);
  }
  return res.json();
}
