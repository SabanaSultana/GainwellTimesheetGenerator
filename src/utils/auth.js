const AUTH_KEY = 'auth:session';
const MANAGER_ROLES = ['Manager(COE)', 'Admin'];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Persist { token, user, expiry } into localStorage.
 * Expiry matches backend JWT: exactly 24 hours from now.
 */
export function setAuthUser(token, user) {
  const session = {
    token,
    user,
    expiry: Date.now() + ONE_DAY_MS,
  };
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  } catch {
    // quota exceeded or private browsing — silently fail
  }
}

/**
 * Returns the session { token, user, expiry } or null if absent / expired / malformed.
 * Cleans up stale data automatically.
 */
export function getAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);

    // Guard against malformed data
    if (!session?.token || !session?.user || !session?.expiry) {
      removeAuthUser();
      return null;
    }

    if (isTokenExpired(session.expiry)) {
      removeAuthUser();
      return null;
    }

    return session;
  } catch {
    // Invalid JSON or localStorage error
    removeAuthUser();
    return null;
  }
}

/**
 * Remove the auth session from localStorage.
 * Triggers the `storage` event in other tabs for cross-tab sync.
 */
export function removeAuthUser() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns true when a valid, non-expired session exists.
 */
export function isAuthenticated() {
  return getAuthUser() !== null;
}

/**
 * Returns true when the given expiry timestamp (ms) has passed.
 */
export function isTokenExpired(expiry) {
  return typeof expiry === 'number' && Date.now() >= expiry;
}

/**
 * Returns milliseconds remaining until the stored session expires.
 * Returns 0 if expired or session is absent.
 */
export function getRemainingTime() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return 0;
    const session = JSON.parse(raw);
    if (!session?.expiry) return 0;
    const remaining = session.expiry - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

/**
 * Returns true for manager-level roles.
 */
export function isManagerRole(role) {
  return MANAGER_ROLES.includes(role);
}

/**
 * Builds the correct dashboard URL for a given user object.
 * After login users always go to the app launcher first.
 */
export function getDashboardPath(user) {
  if (!user?.employeeId) return '/login';
  return '/launcher';
}

/**
 * Direct dashboard path (bypasses launcher) — used internally for role-guarded redirects.
 */
export function getDirectDashboardPath(user) {
  if (!user?.employeeId) return '/login';
  return isManagerRole(user.role)
    ? `/dashboard/manager/${user.employeeId}`
    : `/dashboard/employee/${user.employeeId}`;
}
