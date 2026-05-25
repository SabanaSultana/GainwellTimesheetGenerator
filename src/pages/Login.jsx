import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryApi from '../apis/index.jsx';
import logo from '../assets/logo_gainwell_main.png';
import { setAuthUser, getAuthUser, getDashboardPath } from '../utils/auth';
import { project_name } from '../config/project';
import '../styles/portal.css';

const Login = () => {
  const navigate = useNavigate();

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
    const newErrors = {};
    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const response = await fetch(SummaryApi.signIn.url, {
        method: SummaryApi.signIn.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const res_json = await response.json();
      const data = res_json.user;
      if (response.ok && res_json.success && data) {
        setAuthUser(res_json.token, {
          id: data.id,
          employeeId: data.employeeId,
          role: data.role,
          name: data.name,
          department: data.department || '',
        });
        navigate('/launcher', { replace: true });
      } else {
        setErrors({ api: res_json.message || 'Login failed. Please try again.' });
      }
    } catch {
      setErrors({ api: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #243252 0%, #1e2947 45%, #1b2644 100%)' }}
    >
      {/* Subtle red radial glow — echoes the logo's red ring */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 30% 55%, rgba(198,40,40,0.09) 0%, transparent 55%)',
        pointerEvents: 'none',
      }} />
      {/* Subtle blue radial glow — echoes the logo's wing blue */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 75% 30%, rgba(91,155,213,0.07) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      <div className="relative z-10 min-h-screen flex flex-col px-6 py-8 lg:px-28 lg:py-10">

        {/* Logo — blends seamlessly: its navy bg matches the page navy */}
        <img
          src={logo}
          alt={project_name}
          className="object-left flex-shrink-0"
          style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 mt-6 pb-4">

          {/* Left branding */}
          <div className="hidden lg:flex flex-col" style={{ color: '#ffffff', width: '48%', flexShrink: 0 }}>
            <h1 style={{ fontSize: '72px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1px', margin: 0 }}>
              ONE<br />ENGINEERING
            </h1>
            <p style={{ fontSize: '14.5px', lineHeight: 1.65, color: 'rgba(193,221,255,0.85)', marginTop: '22px', maxWidth: '400px' }}>
              Unified access to engineering operations, analytics platforms, workflow systems and enterprise collaboration tools.
            </p>
            <ul style={{ marginTop: '20px', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {[
                'NEXUS workflow platform',
                'DesignWorks collaboration suite',
                'Role-based engineering access',
                'Department analytics & reporting',
                'Cross-functional approval systems',
                'Operational workflow management',
              ].map((item) => (
                <li key={item} className="auth-feature-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(183,213,255,0.82)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#5b9bd5', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '28px' }}>
              {['Employee', 'Manager(COE)', 'Head of Engineering', 'Admin'].map((r) => (
                <span key={r} className="auth-chip" style={{ borderColor: 'rgba(91,155,213,0.35)', color: 'rgba(193,221,255,0.85)' }}>{r}</span>
              ))}
            </div>
          </div>

          {/* Right card */}
          <div className="w-full lg:flex-shrink-0 auth-card" style={{ padding: '40px', maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <span className="auth-badge" style={{ background: 'rgba(198,40,40,0.10)', border: '1px solid rgba(198,40,40,0.22)', color: '#e57373' }}>
                SECURE ACCESS
              </span>
            </div>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle" style={{ marginTop: '6px' }}>Sign in to {project_name}</p>

            {errors.api && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 13px', borderRadius: '8px', fontSize: '12.5px', marginTop: '16px' }}>
                {errors.api}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '7px' }}>
                  Employee ID
                </label>
                <input
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. GEPL0106"
                  className="auth-input"
                  style={errors.employeeId ? { borderColor: '#f87171', background: '#fff5f5' } : {}}
                />
                {errors.employeeId && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.employeeId}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '7px' }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="auth-input"
                  style={errors.password ? { borderColor: '#f87171', background: '#fff5f5' } : {}}
                />
                {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
              </div>

              <button type="submit" disabled={loading} className="auth-button" style={{ marginTop: '2px' }}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '20px' }}>
              Don't have an account?{' '}
              <a href="/signup" className="auth-link" style={{ color: '#4a7fc1' }}>Create one</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
