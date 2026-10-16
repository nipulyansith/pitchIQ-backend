import { apiRequest } from './apiClient';

export async function login({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function signup({ name, email, password, role }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password, role },
  });
}

export async function currentUser() {
  return apiRequest('/auth/me');
}

export async function logout() {
  return apiRequest('/auth/logout', { method: 'POST' });
}
