import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { getAuthUser, removeAuthUser, getRemainingTime } from '../utils/auth';

/**
 * Wraps all authenticated routes.
 *
 * Responsibilities:
 *  - Redirects unauthenticated users to /login immediately.
 *  - Schedules an auto-logout timer that fires exactly when the JWT expires.
 *  - Listens for cross-tab logout/expiry via the `storage` event.
 */
const ProtectedRoute = () => {
  const navigate = useNavigate();
  const session = getAuthUser(); // Synchronous check — also clears expired data

  useEffect(() => {
    if (!session) return;

    // Auto-logout: schedule redirect exactly when the token expires
    const remaining = getRemainingTime();
    const expiryTimer = setTimeout(() => {
      removeAuthUser();
      navigate('/login', { replace: true });
    }, remaining);

    // Cross-tab sync: another tab removed auth:session (logout or expiry)
    const handleStorageChange = (e) => {
      if (e.key === 'auth:session' && e.newValue === null) {
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(expiryTimer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once on mount

  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
