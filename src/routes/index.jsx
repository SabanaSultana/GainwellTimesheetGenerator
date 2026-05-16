import { createBrowserRouter, Navigate } from 'react-router-dom';
import React from 'react';
import Login             from '../pages/Login.jsx';
import Signup            from '../pages/Signup.jsx';
import App               from '../App.jsx';
import ProtectedRoute    from '../components/ProtectedRoute.jsx';
import RoleProtectedRoute from '../components/RoleProtectedRoute.jsx';
import ManagerDashboard  from '../pages/ManagerDashboard.jsx';
import EmployeeDashboard from '../pages/EmployeeDashboard.jsx';
import CreateProject     from '../components/CreateProject.jsx';
import ProjectDetailPage from '../pages/ProjectDetailPage.jsx';

/**
 * Route hierarchy:
 *
 *  /                         → redirect to /login
 *  /login                    → Login (public, redirects away if already authenticated)
 *  /signup                   → Signup (public)
 *  <ProtectedRoute>          → auth gate (redirects to /login if no valid session)
 *    <App>                   → layout: Navbar + <Outlet>
 *      <RoleProtectedRoute allowedType="manager">
 *        /dashboard/manager/:employeeId  → ManagerDashboard
 *      <RoleProtectedRoute allowedType="employee">
 *        /dashboard/employee/:employeeId → EmployeeDashboard
 */
const router = createBrowserRouter([
  // Root redirect
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // ── Public routes ────────────────────────────────
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },

  // ── Protected routes (auth gate → layout → role gate) ────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />,
        children: [
          // Any authenticated user
          {
            path: '/create-project',
            element: <CreateProject />,
          },
          // Manager-only section
          {
            element: <RoleProtectedRoute allowedType="manager" />,
            children: [
              {
                path: '/dashboard/manager/:employeeId',
                element: <ManagerDashboard />,
              },
              {
                path: '/dashboard/manager/:employeeId/project/:projectId',
                element: <ProjectDetailPage />,
              },
            ],
          },
          // Employee-only section
          {
            element: <RoleProtectedRoute allowedType="employee" />,
            children: [
              {
                path: '/dashboard/employee/:employeeId',
                element: <EmployeeDashboard />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
