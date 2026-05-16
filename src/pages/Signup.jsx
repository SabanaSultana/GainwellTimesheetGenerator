import React, { useState, useEffect } from 'react';
import SummaryApi from '../apis';
import { useNavigate } from 'react-router-dom';
import { roleOptions, departmentOptions } from '../role_details';
import backgroundImage from '../assets/cm.jpg';
import logo from '../assets/logo_gainwell_r.png';
import { project_name } from '../config/project';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', employeeId: '', password: '',
    confirmPassword: '', managerEmpId: '', role: '', department: '',
  });

  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.role === 'Employee' || formData.role === 'Manager(COE)') fetchManagersByRole();
    else setManagers([]);
  }, [formData.role]);

  const fetchManagersByRole = async () => {
    try {
      setLoadingManagers(true);
      let roleToFetch = formData.role === 'Employee' ? 'Manager(COE)' : 'Head of Engineering';
      const response = await fetch(`${SummaryApi.getUsersByRole.url}/${encodeURIComponent(roleToFetch)}`);
      const data = await response.json();
      setManagers(data.success && data.data?.length > 0 ? data.data : []);
    } catch {
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const hasManagerDropdown = formData.role === 'Employee' || formData.role === 'Manager(COE)';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'role' ? { managerEmpId: '' } : {}) }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Please enter a valid email address';
    if (!formData.employeeId.trim()) e.employeeId = 'Employee ID is required';
    if (!formData.role) e.role = 'Please select a role';
    if (!formData.department) e.department = 'Please select a department';
    if (hasManagerDropdown && managers.length > 0 && !formData.managerEmpId) e.managerEmpId = 'Please select your manager';
    if (formData.role === 'Employee' && formData.managerEmpId) {
      const sel = managers.find(m => m.employeeId === formData.managerEmpId);
      if (sel?.department && sel.department !== formData.department)
        e.department = 'You have entered a different department than your manager. Kindly recheck.';
    }
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      e.password = 'Password must contain uppercase, lowercase, and numbers';
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForm()) return;
    if (hasManagerDropdown && managers.length === 0) {
      setErrors({ managerEmpId: 'Please ask your respective manager to register first.' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.signUp.url, {
        method: SummaryApi.signUp.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name, email: formData.email, employeeId: formData.employeeId,
          password: formData.password, managerEmployeeId: formData.managerEmpId || null,
          role: formData.role, department: formData.department,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Signup failed');
      alert('Signup successful! Please login to continue.');
      navigate('/login');
    } catch (error) {
      setErrors({ apiError: error.message });
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    width: '100%', borderRadius: '8px', padding: '10px 13px',
    fontSize: '13.5px', outline: 'none', color: '#111827', boxSizing: 'border-box',
  };
  const inp = (field) => ({ ...inputBase, border: `1px solid ${errors[field] ? '#f87171' : '#d1d5db'}`, background: errors[field] ? '#fff5f5' : '#fff' });
  const selectInp = (field) => ({ ...inp(field), appearance: 'auto' });

  return (
    /* ═══════════════════════════════════════════════
       PAGE WRAPPER — full-page bg: cm.jpg + overlays
    ═══════════════════════════════════════════════ */
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* 1. Dark navy overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(3, 11, 43, 0.80)' }} />

      {/* 2. Diagonal beam 1 */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(45deg, transparent 20%, rgba(100,168,255,0.04) 24%, rgba(132,193,255,0.17) 31%, rgba(158,215,255,0.26) 36%, rgba(132,193,255,0.17) 41%, rgba(100,168,255,0.04) 45%, transparent 49%)',
      }} />

      {/* 3. Diagonal beam 2 */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(45deg, transparent 55%, rgba(85,155,255,0.03) 59%, rgba(115,178,255,0.13) 65%, rgba(130,192,255,0.19) 69%, rgba(115,178,255,0.13) 73%, rgba(85,155,255,0.03) 77%, transparent 81%)',
      }} />

      

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
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 mt-6 pb-6">

          {/* ── LEFT branding text (desktop only) ── */}
          <div className="hidden lg:flex flex-col" style={{ color: '#ffffff', width: '48%', flexShrink: 0 }}>

            <h1 style={{ fontSize: '80px', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', margin: 0 }}>
              GAINWELL
            </h1>

            <p style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '5px', marginTop: '9px' }}>
              TIMESHEET GENERATOR, 
              <span style={{ textTransform: 'uppercase' }} className='text-red-300'>{project_name}</span>
              
            </p>

            <p style={{ fontSize: '14.5px', lineHeight: 1.65, color: 'rgba(193,221,255,0.85)', marginTop: '22px', maxWidth: '360px' }}>
              Your central hub for managing timesheets across teams, years, and milestones — all in one place.
            </p>

            <ul style={{ marginTop: '20px', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {[
                'Multi-role timesheet management',
                'Real-time manager approval workflow',
                'Department-wise reporting & analytics',
                'Critical deadline tracking',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(183,213,255,0.82)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4f9cf9', flexShrink: 0 }} />
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
              padding: '36px 40px',
              maxWidth: '420px',
            }}
          >
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0e1e3d', margin: 0 }}>
              Create Account
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
              Register for {project_name}
            </p>

            {errors.apiError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 13px', borderRadius: '8px', fontSize: '12.5px', marginTop: '14px' }}>
                {errors.apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1f2937', marginBottom: '6px' }}>Full Name</label>
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" style={inp('name')} />
                {errors.name && <p style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1f2937', marginBottom: '6px' }}>Email</label>
                <input name="email" value={formData.email} onChange={handleChange} placeholder="you@gainwellengineering.com" style={inp('email')} />
                {errors.email && <p style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{errors.email}</p>}
              </div>

              {/* Employee ID */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1f2937', marginBottom: '6px' }}>Employee ID</label>
                <input name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="e.g. GEPL0106" style={inp('employeeId')} />
                {errors.employeeId && <p style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{errors.employeeId}</p>}
              </div>

              {/* Role + Department (2 col) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1f2937', marginBottom: '6px' }}>Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} style={selectInp('role')}>
                    <option value="">— Select Role —</option>
                    {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.role && <p style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{errors.role}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1f2937', marginBottom: '6px' }}>Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} style={selectInp('department')}>
                    <option value="">— Select Dept —</option>
                    {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && <p style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{errors.department}</p>}
                </div>
              </div>

              {/* Manager (conditional) */}
              {hasManagerDropdown && (
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1f2937', marginBottom: '6px' }}>Manager</label>
                  {loadingManagers ? (
                    <p style={{ fontSize: '12.5px', color: '#9ca3af', padding: '8px 0' }}>Loading managers…</p>
                  ) : managers.length === 0 ? (
                    <p style={{ fontSize: '12.5px', color: '#d97706', padding: '6px 0' }}>
                      No managers registered yet. Ask your manager to register first.
                    </p>
                  ) : (
                    <select name="managerEmpId" value={formData.managerEmpId} onChange={handleChange} style={selectInp('managerEmpId')}>
                      <option value="">Select Manager</option>
                      {managers.map((m) => <option key={m.employeeId} value={m.employeeId}>{m.name} ({m.employeeId})</option>)}
                    </select>
                  )}
                  {errors.managerEmpId && <p style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{errors.managerEmpId}</p>}
                </div>
              )}

              {/* Password + Confirm (2 col) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1f2937', marginBottom: '6px' }}>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 chars" style={inp('password')} />
                  {errors.password && <p style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{errors.password}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1f2937', marginBottom: '6px' }}>Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" style={inp('confirmPassword')} />
                  {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px' }}>{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: loading ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '13px 0', fontSize: '15px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.3px',
                  marginTop: '4px',
                }}
              >
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>

            </form>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '18px' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
