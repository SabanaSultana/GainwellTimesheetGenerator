import React, { useState, useEffect, useCallback } from 'react';
import SummaryApi from '../apis/index.jsx';
import formBg from '../assets/highwall_ele_form.png';
import { BsBarChartFill } from 'react-icons/bs';
import { BsArrowCounterclockwise } from 'react-icons/bs';
import { TbInfoCircle } from 'react-icons/tb';

const countWords = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

// ── Derive next ENT#### from existing codes ───────────────────────────────
const generateNextCode = (codes) => {
  if (!codes || codes.length === 0) return 'ENT0001';
  const nums = codes
    .filter((c) => /^ENT\d{4}$/i.test(c))
    .map((c) => parseInt(c.slice(3), 10));
  if (nums.length === 0) return 'ENT0001';
  const numSet = new Set(nums);
  let next = 1;
  while (numSet.has(next)) next++;
  return `ENT${String(next).padStart(4, '0')}`;
};

// embedded=true  → rendered inside ManagerDashboard tab (no outer wrapper)
// embedded=false → standalone protected page at /create-project
const CreateProject = ({ embedded = false, onSuccess, refreshKey = 0 }) => {
  const [formData, setFormData] = useState({
    projectCode: '', projectName: '', projectDescription: '', startDate: '', endDate: '',
  });
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [fetchingCode, setFetchingCode] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState('');
  const [totalProjects, setTotalProjects] = useState(0);
  const [successMsg, setSuccessMsg]   = useState('');
  const [apiError, setApiError]       = useState('');

  // ── Fetch existing codes ────────────────────────────────────────────────
  const fetchNextCode = useCallback(async () => {
    setFetchingCode(true);
    try {
      const res  = await fetch(SummaryApi.getProjects.url, { method: SummaryApi.getProjects.method, credentials: 'include' });
      const data = await res.json();
      let nextCode = 'ENT0001';
      if (data.success && Array.isArray(data.data)) {
        setTotalProjects(data.data.length);
        nextCode = generateNextCode(data.data.map((p) => p.projectCode));
      }
      setSuggestedCode(nextCode);
      setFormData((prev) => prev.projectCode ? prev : { ...prev, projectCode: nextCode });
    } catch {
      setSuggestedCode('ENT0001');
      setFormData((prev) => prev.projectCode ? prev : { ...prev, projectCode: 'ENT0001' });
    } finally {
      setFetchingCode(false);
    }
  }, []);

  useEffect(() => { fetchNextCode(); }, [fetchNextCode]);
  useEffect(() => { if (refreshKey > 0) fetchNextCode(); }, [refreshKey]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const applySuggested = () => {
    if (!fetchingCode && suggestedCode) {
      setFormData((prev) => ({ ...prev, projectCode: suggestedCode }));
      if (errors.projectCode) setErrors((prev) => ({ ...prev, projectCode: '' }));
    }
  };

  const validateForm = () => {
    const e = {};
    if (!formData.projectCode.trim()) {
      e.projectCode = 'Project code is required';
    } else if (!/^ENT\d{4}$/i.test(formData.projectCode.trim())) {
      e.projectCode = 'Format must be ENT#### (e.g. ENT0001)';
    }
    if (!formData.projectName.trim()) e.projectName = 'Project name is required';
    if (!formData.projectDescription.trim()) e.projectDescription = 'Description is required';
    else if (countWords(formData.projectDescription) > 100) e.projectDescription = 'Maximum 100 words allowed';
    if (!formData.startDate)          e.startDate   = 'Start date is required';
    if (!formData.endDate) {
      e.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      e.endDate = 'End date must be after start date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setApiError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res  = await fetch(SummaryApi.createProject.url, {
        method: SummaryApi.createProject.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectCode:        formData.projectCode.trim().toUpperCase(),
          projectName:        formData.projectName.trim(),
          projectDescription: formData.projectDescription.trim(),
          startDate:          formData.startDate,
          endDate:            formData.endDate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Project "${data.project.projectCode}" created successfully!`);
        setFormData({ projectCode: '', projectName: '', projectDescription: '', startDate: '', endDate: '' });
        setErrors({});
        await fetchNextCode();
        if (onSuccess) onSuccess(data.project);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setApiError(data.message || 'Failed to create project. Please try again.');
      }
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ projectCode: '', projectName: '', projectDescription: '', startDate: '', endDate: '' });
    setErrors({});
    setSuccessMsg('');
    setApiError('');
  };

  // Whether the current code input matches the suggestion (shows ✓ Suggested badge)
  const isCodeSuggested =
    suggestedCode &&
    formData.projectCode.trim().toUpperCase() === suggestedCode.toUpperCase();

  // ── Style tokens ─────────────────────────────────────────────────────────
  const inputBase = {
    width: '100%', borderRadius: '8px', padding: '11px 14px',
    fontSize: '14px', outline: 'none', color: '#111827',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };
  const inp = (field) => ({
    ...inputBase,
    border:     `1px solid ${errors[field] ? '#f87171' : '#e2e8f0'}`,
    background: errors[field] ? '#fff5f5' : '#ffffff',
  });
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' };
  const errStyle   = { color: '#ef4444', fontSize: '11.5px', marginTop: '4px' };

  // ── Inner card ────────────────────────────────────────────────────────────
  const card = (
    <div style={{ display: 'flex', width: '100%', minHeight: '500px' }}>

      {/* ── LEFT image panel ────────────────────────────────────────────── */}
      <div
        style={{
          flex: '0 0 30%',
          backgroundImage: `url(${formBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '32px 28px',
          minWidth: '220px',
        }}
      >
        {/* Blue gradient overlay — matches Figma blue tint over image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(29,78,216,0.54) 0%, rgba(14,30,61,0.79) 100%)',
        }} />

        {/* Content over image */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2
            style={{
              fontSize: '22px', fontWeight: 700, color: '#ffffff',
              margin: '0 0 10px', lineHeight: 1.3,
            }}
          >
            Build the future with well-planned projects
          </h2>

          {/* Red accent line matching Figma */}
          <div style={{ width: '32px', height: '3px', background: '#ef4444', borderRadius: '2px', marginBottom: '14px' }} />

          <p style={{ fontSize: '13.5px', color: 'rgba(193,221,255,0.82)', lineHeight: 1.65, margin: '0 0 28px' }}>
            Create, organize and track your projects efficiently.
          </p>

          {/* Bottom project count pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '10px',
              padding: '10px 14px',
            }}
          >
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <BsBarChartFill size={16} color="#93c5fd" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#ffffff', lineHeight: 1.2 }}>
                {fetchingCode ? '…' : `${totalProjects} project${totalProjects !== 1 ? 's' : ''} registered`}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(193,221,255,0.7)', lineHeight: 1.3 }}>
                Keep building great things!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT form panel ────────────────────────────────────────────── */}
      <div style={{ flex: 1, background: '#ffffff', padding: '36px 40px', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>

        <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0e1e3d', margin: '0 0 4px' }}>
          Create New Project
        </h3>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 24px' }}>
          All fields marked <span style={{ color: '#ef4444' }}>*</span> are required
        </p>

        {/* Success */}
        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✓</span> {successMsg}
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '20px' }}>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1 }}>

          {/* ── Row 1: Project Code + Project Name side by side ─────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Project Code */}
            <div>
              {/* "Suggested next code" row acts as label for the code field */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  {fetchingCode ? 'Fetching code…' : 'Suggested next code'}
                </span>
                {!fetchingCode && suggestedCode && (
                  <>
                    <button
                      type="button"
                      onClick={applySuggested}
                      style={{
                        background: '#eff6ff', border: '1.5px solid #bfdbfe',
                        color: '#1d4ed8', borderRadius: '20px', padding: '2px 10px',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        letterSpacing: '0.3px', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = '1.5px solid transparent'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#1d4ed8'; e.currentTarget.style.border = '1.5px solid #bfdbfe'; }}
                    >
                      {suggestedCode}
                    </button>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>— click to use</span>
                  </>
                )}
              </div>

              {/* Code input with ✓ Suggested badge inside */}
              <div style={{ position: 'relative' }}>
                <input
                  name="projectCode"
                  value={formData.projectCode}
                  onChange={handleChange}
                  placeholder="e.g. ENT0001"
                  style={{ ...inp('projectCode'), paddingRight: isCodeSuggested ? '120px' : '14px' }}
                />
                {isCodeSuggested && (
                  <div
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: '#dcfce7', color: '#16a34a',
                      fontSize: '12px', fontWeight: 600,
                      padding: '3px 10px', borderRadius: '20px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      pointerEvents: 'none',
                    }}
                  >
                    ✓ Suggested
                  </div>
                )}
              </div>
              {errors.projectCode && <p style={errStyle}>{errors.projectCode}</p>}
            </div>

            {/* Project Name */}
            <div>
              <label style={labelStyle}>
                Project Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                placeholder="Enter project name"
                style={inp('projectName')}
              />
              {errors.projectName && <p style={errStyle}>{errors.projectName}</p>}
            </div>
          </div>

          {/* ── Description (full width) ─────────────────────────────────── */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Description <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleChange}
              placeholder="Brief project description (optional)"
              rows={3}
              style={{
                ...inputBase,
                border: `1px solid ${errors.projectDescription ? '#f87171' : '#e2e8f0'}`,
                background: errors.projectDescription ? '#fff5f5' : '#ffffff',
                resize: 'vertical', fontFamily: 'inherit', minHeight: '80px',
                overflowY: 'auto', overflowX: 'hidden',
              }}
            />
            <p style={{ textAlign: 'right', fontSize: '11px', margin: '3px 0 0', color: countWords(formData.projectDescription) > 100 ? '#ef4444' : '#9ca3af' }}>
              {countWords(formData.projectDescription)}/100 words
            </p>
            {errors.projectDescription && <p style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '2px' }}>{errors.projectDescription}</p>}
          </div>

          {/* ── Start + End dates side by side ───────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '10px' }}>
            <div>
              <label style={labelStyle}>
                Start Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} style={inp('startDate')} />
              {errors.startDate && <p style={errStyle}>{errors.startDate}</p>}
            </div>
            <div>
              <label style={labelStyle}>
                End Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} style={inp('endDate')} />
              {errors.endDate && <p style={errStyle}>{errors.endDate}</p>}
            </div>
          </div>

          {/* ── Info hint below dates ─────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '28px' }}>
            <TbInfoCircle size={15} color="#3b82f6" />
            <span style={{ fontSize: '12.5px', color: '#3b82f6' }}>End date must be after start date</span>
          </div>

          {/* ── Buttons — right aligned ───────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto' }}>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#ffffff'; }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#ffffff', color: '#374151',
                border: '1.5px solid #e2e8f0', borderRadius: '8px',
                padding: '11px 24px', fontSize: '14px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              }}
            >
              <BsArrowCounterclockwise size={15} />
              Reset
            </button>

            <button
              type="submit"
              disabled={loading || fetchingCode}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: loading || fetchingCode ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)',
                color: '#ffffff', border: 'none', borderRadius: '8px',
                padding: '11px 28px', fontSize: '14px', fontWeight: 600,
                cursor: loading || fetchingCode ? 'not-allowed' : 'pointer',
                boxShadow: loading || fetchingCode ? 'none' : '0 4px 12px rgba(0,0,0,0.12)',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Creating…' : 'Create Project →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── Standalone page (/create-project) ─────────────────────────────────────
  if (!embedded) {
    return (
      <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px' }}>
        <div style={{ width: '100%', maxWidth: '1000px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          {card}
        </div>
      </div>
    );
  }

  // ── Embedded in ManagerDashboard tab ──────────────────────────────────────
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
      {card}
      
    </div>
  );
};

export default CreateProject;
