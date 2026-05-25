import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryApi from '../apis/index.jsx';
import { getAuthUser, removeAuthUser } from '../utils/auth';
import { project_name } from '../config/project';
import logo from '../assets/logo_gainwell_r.png';
import { BiLogOut } from 'react-icons/bi';

const Navbar = () => {
  const navigate      = useNavigate();
  const session       = getAuthUser();
  const user          = session?.user;
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(SummaryApi.logout.url, { method: SummaryApi.logout.method, credentials: 'include' });
    } catch { /* clear session regardless */ }
    await new Promise((res) => setTimeout(res, 3200));
    removeAuthUser();
    navigate('/login', { replace: true });
  };

  return (
    <>
    {loggingOut && (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(14,30,61,0.55)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '56px', height: '56px', borderRadius: '50%',
            border: '5px solid rgba(255,255,255,0.2)',
            borderTopColor: '#ffffff',
            animation: 'spin 0.85s linear infinite',
          }}
        />
        <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Arial, sans-serif', letterSpacing: '0.3px' }}>
          Logging out…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )}
    <nav
      style={{
        width: '100%',
        height: '68px',
        background: '#0e1e3d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        boxSizing: 'border-box',
        boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Left: Logo + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <img src={logo} alt="ONE ENGINEERING" style={{ height: '44px', width: 'auto', mixBlendMode: 'screen' }} />
        <div>
          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '17px', letterSpacing: '0.3px', lineHeight: 1.2 }}>
            {project_name}
          </div>
          <div style={{ color: 'rgba(193,221,255,0.7)', fontSize: '11px', fontWeight: 400, letterSpacing: '0.2px' }}>
            Unified Engineering Workspace
          </div>
        </div>
      </div>

      {/* Right: User info + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {user && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
              {user.name}
            </p>
            <p style={{ color: 'rgba(193,221,255,0.8)', fontSize: '12.5px', margin: 0, lineHeight: 1.3 }}>
              {user.role}{user.department ? ` · ${user.department}` : ''}
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
          style={{
            background: 'transparent',
            border: '1.5px solid rgba(255,255,255,0.35)',
            color: '#ffffff',
            padding: '8px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s, border-color 0.2s',
            whiteSpace: 'nowrap',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Logout <BiLogOut size={16} />
        </button>
      </div>
    </nav>
    </>
  );
};

export default Navbar;
