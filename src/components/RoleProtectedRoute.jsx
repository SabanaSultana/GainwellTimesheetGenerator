import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthUser, isManagerRole, getDashboardPath } from '../utils/auth';

/**
 * Enforces role-based access on a route group.
 *
 * Props:
 *   allowedType — 'manager' | 'employee'
 *
 * Behaviour:
 *  - Employee visiting /dashboard/manager/:id → redirected to their employee dashboard.
 *  - Manager visiting /dashboard/employee/:id → redirected to their manager dashboard.
 *  - Unauthenticated users fall back to /login (belt-and-suspenders; ProtectedRoute should
 *    catch these first).
 */
const RoleProtectedRoute = ({ allowedType }) => {
  const session = getAuthUser();

  if (!session) return <Navigate to="/login" replace />;

  const { user } = session;
  const userIsManager = isManagerRole(user.role);

  if (allowedType === 'manager' && !userIsManager) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  if (allowedType === 'employee' && userIsManager) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
