import React from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryApi from '../apis/index.jsx';
import { getAuthUser, removeAuthUser } from '../utils/auth';
import { project_name } from '../config/project';
import logo from '../assets/logo_gainwell_r.png';

/**
 * Global top navigation bar shown on all protected/dashboard pages.
 * Displays the project brand, logged-in user info, and a logout button.
 *
 * Logout flow:
 *  1. Calls backend POST /api/users/logout to clear the HttpOnly cookie.
 *  2. Calls removeAuthUser() to clear localStorage — this dispatches a native
 *     `storage` event that triggers cross-tab logout in all other open tabs.
 *  3. Redirects the current tab to /login.
 */
const Navbar = () => {
  const navigate = useNavigate();
  const session = getAuthUser();
  const user = session?.user;

  const handleLogout = async () => {
    try {
      await fetch(SummaryApi.logout.url, {
        method: SummaryApi.logout.method,
        credentials: 'include',
      });
    } catch {
      // Backend unreachable — proceed with local logout regardless so the
      // user is never stuck on a page they can't leave.
    } finally {
      removeAuthUser(); // Triggers storage event → cross-tab logout
      navigate('/login', { replace: true });
    }
  };

  return (
    <nav
      style={{
        width: '100vw',
        height: '7vh',
        minHeight: '52px',
        background: '#0e1e3d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 3vw',
        boxSizing: 'border-box',
        boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* ── Left: Logo + brand name ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2vw' }}>
        <img
          src={logo}
          alt={project_name}
          style={{ height: '4.5vh', minHeight: '32px', width: 'auto' }}
        />
        <span
          style={{
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 'clamp(12px, 1.8vh, 18px)',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}
        >
          {project_name}
        </span>
      </div>

      {/* ── Right: User info + Logout button ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}>
        {user && (
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                color: '#ffffff',
                fontSize: 'clamp(11px, 1.6vh, 16px)',
                fontWeight: 600,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {user.name}
            </p>
            <p
              style={{
                color: 'rgba(193,221,255,0.7)',
                fontSize: 'clamp(10px, 1.3vh, 13px)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {user.role}
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.35)',
            color: '#ffffff',
            padding: '1vh 1.5vw',
            minWidth: '80px',
            borderRadius: '7px',
            cursor: 'pointer',
            fontSize: 'clamp(11px, 1.5vh, 15px)',
            fontWeight: 600,
            transition: 'background 0.2s ease, border-color 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
