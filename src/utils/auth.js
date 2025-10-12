// Lightweight auth-related utilities
// TODO: replace with real auth context/JWT decoding when available

/**
 * Returns the current user id as a string.
 * Priority:
 * 1) Explicit override in localStorage under key 'currentUserId'
 * 2) No hardcoded fallback — return null and let caller resolve via access token (user_id='00000')
 */
export function getCurrentUserId() {
  try {
    const fromLS = typeof window !== 'undefined' ? window.localStorage.getItem('currentUserId') : null;
    if (fromLS) return fromLS;
  } catch (_) {
    // ignore access errors (e.g., disabled storage)
  }
  return null;
}

export function persistUserProfile(user) {
  if (typeof window === 'undefined' || !user || typeof user !== 'object') return;
  try {
    if (user.id != null) window.localStorage.setItem('currentUserId', String(user.id));
    if (user.service_role) window.localStorage.setItem('service_role', String(user.service_role));
    // Store whole profile snapshot for quick access if needed
    window.localStorage.setItem('currentUser', JSON.stringify(user));
  } catch (_) {
    // storage may be unavailable; ignore
  }
}

/**
 * Clears stored user identity and role from localStorage.
 * Removes: 'currentUserId', 'service_role', 'currentUser'.
 */
export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('currentUserId');
    window.localStorage.removeItem('service_role');
    window.localStorage.removeItem('currentUser');
  } catch (_) {
    // ignore storage errors
  }
}

export function getStoredServiceRole() {
  try {
    return typeof window !== 'undefined' ? (window.localStorage.getItem('service_role') || 'default') : 'default';
  } catch (_) {
    return 'default';
  }
}

export default { getCurrentUserId, persistUserProfile, getStoredServiceRole, clearStoredUser };
