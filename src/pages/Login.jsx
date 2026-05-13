import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryApi from '../apis/index.jsx';
import logo from '../assets/logo_gainwell_r.png';
import backgroundImage from '../assets/cm.jpg';
import { setAuthUser, getAuthUser, getDashboardPath } from '../utils/auth';
import { project_name } from '../config/project';

const Login = () => {
  const navigate = useNavigate();

  // If user is already authenticated (e.g. opened /login in a new tab while logged in),
  // redirect them immediately to their dashboard.
  useEffect(() => {
    const session = getAuthUser();
    if (session) navigate(getDashboardPath(session.user), { replace: true });
  }, [navigate]);

  const [formData, setFormData] = useState({ employeeId: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const newErrors = {};
    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(SummaryApi.signIn.url, {
        method: SummaryApi.signIn.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send/receive HttpOnly cookie
        body: JSON.stringify(formData),
      });

      const res_json = await response.json();
      const data = res_json.user;

      if (response.ok && res_json.success && data) {
        // Persist token + user to localStorage with 24-hour expiry
        setAuthUser(res_json.token, {
          id: data.id,
          employeeId: data.employeeId,
          role: data.role,
          name: data.name,
        });
        navigate(getDashboardPath(data), { replace: true });
      } else {
        setErrors({ api: res_json.message || 'Login failed. Please try again.' });
      }
    } catch {
      setErrors({ api: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    width: '100%',
    borderRadius: '8px',
    padding: '11px 14px',
    fontSize: '14px',
    outline: 'none',
    color: '#111827',
    boxSizing: 'border-box',
  };

  return (
    /* ═══════════════════════════════════════════════
       PAGE WRAPPER — full-page bg: cm.jpg + overlays
    ═══════════════════════════════════════════════ */
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 1. Dark navy overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(3, 11, 43, 0.80)' }} />

      {/* 2. Diagonal beam 1 — main bright streak */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(45deg, transparent 20%, rgba(100,168,255,0.04) 24%, rgba(132,193,255,0.17) 31%, rgba(158,215,255,0.26) 36%, rgba(132,193,255,0.17) 41%, rgba(100,168,255,0.04) 45%, transparent 49%)',
        }}
      />

      {/* 3. Diagonal beam 2 — secondary softer streak */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(45deg, transparent 55%, rgba(85,155,255,0.03) 59%, rgba(115,178,255,0.13) 65%, rgba(130,192,255,0.19) 69%, rgba(115,178,255,0.13) 73%, rgba(85,155,255,0.03) 77%, transparent 81%)',
        }}
      />

      {/* ═══════════════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════════════ */}
      <div className="relative z-10 min-h-screen flex flex-col px-6 py-8 lg:px-28 lg:py-10">

        {/* Logo */}
        <img
          src={logo}
          alt={project_name}
          className="object-contain object-left flex-shrink-0 rounded-50"
          style={{ height: '10vh', width: 'auto' }}
        />

        {/* Main area: left text + right card */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 mt-6 pb-4">

          {/* ── LEFT branding text (desktop only) ── */}
          <div className="hidden lg:flex flex-col" style={{ color: '#ffffff', width: '48%', flexShrink: 0 }}>
            <h1 style={{ fontSize: '80px', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', margin: 0 }}>
              GAINWELL
            </h1>
            <p style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '5px', marginTop: '9px' }}>
              TIMESHEET GENERATOR,{' '}
              <span style={{ textTransform: 'uppercase' }} className="text-red-300">
                {project_name}
              </span>
            </p>
            <p
              style={{
                fontSize: '14.5px',
                lineHeight: 1.65,
                color: 'rgba(193,221,255,0.85)',
                marginTop: '22px',
                maxWidth: '360px',
              }}
            >
              Your central hub for managing timesheets across teams, years, and milestones — all in
              one place.
            </p>
            <ul
              style={{
                marginTop: '20px',
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '13px',
              }}
            >
              {[
                'Multi-role timesheet management',
                'Real-time manager approval workflow',
                'Department-wise reporting & analytics',
                'Critical deadline tracking',
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    color: 'rgba(183,213,255,0.82)',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#4f9cf9',
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ── RIGHT: floating white card ── */}
          <div
            className="w-full lg:flex-shrink-0"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 28px 72px rgba(0,0,0,0.42)',
              padding: '40px',
              width: '100%',
              maxWidth: '400px',
            }}
          >
            <h2 style={{ fontSize: '27px', fontWeight: 700, color: '#0e1e3d', margin: 0 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '5px' }}>
              Sign in to {project_name}
            </p>

            {errors.api && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  padding: '10px 13px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  marginTop: '16px',
                }}
              >
                {errors.api}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}
            >
              {/* Employee ID */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '7px',
                  }}
                >
                  Employee ID
                </label>
                <input
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. GEPL0106"
                  style={{
                    ...inputBase,
                    border: `1px solid ${errors.employeeId ? '#f87171' : '#d1d5db'}`,
                    background: errors.employeeId ? '#fff5f5' : '#fff',
                  }}
                />
                {errors.employeeId && (
                  <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.employeeId}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '7px',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  style={{
                    ...inputBase,
                    border: `1px solid ${errors.password ? '#f87171' : '#d1d5db'}`,
                    background: errors.password ? '#fff5f5' : '#fff',
                  }}
                />
                {errors.password && (
                  <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? '#93b4f0' : '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '13px 0',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.3px',
                  marginTop: '2px',
                }}
              >
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '20px' }}>
              Don't have an account?{' '}
              <a href="/signup" style={{ color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' }}>
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
