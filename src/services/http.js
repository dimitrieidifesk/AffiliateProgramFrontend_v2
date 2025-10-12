// Thin HTTP service with JWT refresh + retry logic
// - Uses cookies with credentials: 'include'
// - If 401/422, tries to refresh once and retries the original request
// - If no refresh/access token cookies detected, redirects to /login immediately

const DEFAULT_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  refreshEndpoint: '/api/v2/auth/refresh',
  loginPath: '/login',
  accessCookieName: 'access_token_cookie',
  refreshCookieName: 'refresh_token_cookie',
};

let runtimeConfig = { ...DEFAULT_CONFIG };
let refreshInFlight = null; // Promise | null

export function setAuthConfig(partial) {
  runtimeConfig = { ...runtimeConfig, ...partial };
}

function joinURL(base, path) {
  if (!base) return path;
  if (!path) return base;
  if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
  if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
  return base + path;
}

function parseCookies() {
  if (typeof document === 'undefined') return {};
  return document.cookie.split(';').reduce((acc, raw) => {
    const [k, ...rest] = raw.trim().split('=');
    if (!k) return acc;
    acc[decodeURIComponent(k)] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function hasCookie(name) {
  try {
    const cookies = parseCookies();
    return Boolean(cookies[name]);
  } catch {
    return false;
  }
}

function shouldPreRedirectToLogin({ ensureAuthCheck = true } = {}) {
  // In production with HttpOnly cookies, JS cannot read cookies, so pre-redirect is unreliable.
  // We skip pre-redirect and let the server return 401/422; then refresh+redirect logic below applies.
  return false;
}

function redirectToLogin(navigate) {
  if (navigate && typeof navigate === 'function') {
    try { navigate(runtimeConfig.loginPath, { replace: true }); return; } catch {}
  }
  if (typeof window !== 'undefined') {
    window.location.assign(runtimeConfig.loginPath);
  }
}

async function tryRefreshToken() {
  if (refreshInFlight) {
    try { return await refreshInFlight; } catch { return false; }
  }
  const url = joinURL(runtimeConfig.baseURL, runtimeConfig.refreshEndpoint);
  refreshInFlight = (async () => {
    try {
      const resp = await fetch(url, { method: 'POST', credentials: 'include' });
      if (resp.ok) {
        // Optionally parse JSON to update any local state if needed
        // eslint-disable-next-line no-unused-vars
        const _ = await safeParseJSON(resp);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  try { return await refreshInFlight; } catch { return false; }
}

async function safeParseJSON(response) {
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { return await response.json(); } catch { return null; }
  }
  try { return await response.text(); } catch { return null; }
}

function normalizeOptions(method, options) {
  const { body, headers = {}, credentials = 'include', signal } = options || {};
  const opts = { method, headers: { Accept: 'application/json', ...headers }, credentials, signal };
  if (body !== undefined && body !== null) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      // Let the browser set proper multipart boundary
    } else if (typeof body === 'string' || body instanceof Blob) {
      opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  return opts;
}

async function coreRequest(path, method = 'GET', options = {}) {
  const {
    navigate, // optional: react-router navigate function
    ensureAuthCheck = true,
    retryOn401 = true,
    baseURL,
    // anything else passes through to fetch
    ...fetchOptions
  } = options;

  const effectiveBaseURL = baseURL ?? runtimeConfig.baseURL;

  // Do not pre-redirect based on client-side cookie visibility; proceed and rely on server response.

  const url = joinURL(effectiveBaseURL, path);
  const opts = normalizeOptions(method, fetchOptions);

  let response = await fetch(url, opts);
  if (response.status === 401 || response.status === 422) {
    if (retryOn401) {
      // Only attempt refresh if we have a visible refresh cookie; if not visible, we can still try once
      const hasRefresh = hasCookie(runtimeConfig.refreshCookieName);
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        response = await fetch(url, opts);
      } else {
        // No refresh or failed refresh
        if (!hasRefresh || response.status === 401 || response.status === 422) {
          redirectToLogin(navigate);
        }
        // Fall through to return the error response
      }
    }
  }

  const data = await safeParseJSON(response);
  return { ok: response.ok, status: response.status, data, headers: response.headers };
}

export const http = {
  request: coreRequest,
  get: (path, opts) => coreRequest(path, 'GET', opts),
  post: (path, body, opts) => coreRequest(path, 'POST', { ...opts, body }),
  put: (path, body, opts) => coreRequest(path, 'PUT', { ...opts, body }),
  patch: (path, body, opts) => coreRequest(path, 'PATCH', { ...opts, body }),
  delete: (path, opts) => coreRequest(path, 'DELETE', opts),
};

export default http;
