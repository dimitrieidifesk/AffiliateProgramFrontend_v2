// Users service: centralized API calls for user-related endpoints
import http from 'services/http';

/**
 * Fetch user profile by id. Pass '00000' to resolve current user when no id is known.
 * Options may include navigate and other http options.
 */
export async function fetchUserProfile(userIdOrFallback = '00000', options = {}) {
  const id = String(userIdOrFallback || '00000');
  const res = await http.get(`/api/v2/users/${id}?with_requisites=true`, { ensureAuthCheck: false, ...options });
  if (!res.ok) {
    const message = typeof res.data === 'string' ? res.data : (res.data?.error || res.data?.message || 'Failed to load user');
    throw new Error(message);
  }
  return res.data;
}

export default { fetchUserProfile };
