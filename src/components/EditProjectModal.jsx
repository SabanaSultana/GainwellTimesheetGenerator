import React, { useState, useEffect } from 'react';
import SummaryApi from '../apis/index.jsx';

const countWords = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const EditProjectModal = ({ project, onClose, onSuccess }) => {
  const [form, setForm]         = useState({ projectName: '', projectDescription: '', startDate: '', endDate: '', justification: '' });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (project) {
      setForm({
        projectName:        project.projectName || '',
        projectDescription: project.projectDescription || '',
        startDate:          project.startDate ? project.startDate.slice(0, 10) : '',
        endDate:            project.endDate   ? project.endDate.slice(0, 10)   : '',
        justification:      '',
      });
    }
  }, [project]);

  if (!project) return null;

  const validate = () => {
    const e = {};
    if (!form.projectName.trim())   e.projectName   = 'Project name is required';
    if (!form.startDate)            e.startDate      = 'Start date is required';
    if (!form.endDate)              e.endDate        = 'End date is required';
    else if (form.startDate && new Date(form.endDate) <= new Date(form.startDate))
      e.endDate = 'End date must be after start date';
    if (countWords(form.projectDescription) > 100) e.projectDescription = 'Maximum 100 words allowed';
    if (!form.justification.trim()) e.justification  = 'Justification is required';
    else if (countWords(form.justification) > 100)  e.justification      = 'Maximum 100 words allowed';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res  = await fetch(`${SummaryApi.updateProject.url}/${project._id}`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          projectName:        form.projectName.trim(),
          projectDescription: form.projectDescription.trim(),
          startDate:          form.startDate,
          endDate:            form.endDate,
          justification:      form.justification.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setApiError(data.message || 'Update failed');
      }
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = (field) => ({
    width: '100%', borderRadius: '8px', padding: '10px 13px',
    fontSize: '14px', outline: 'none', color: '#111827',
    boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
    border: `1.5px solid ${errors[field] ? '#f87171' : '#e2e8f0'}`,
    background: errors[field] ? '#fff5f5' : '#ffffff',
  });

  const labelStyle = { display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '5px' };
  const errStyle   = { color: '#ef4444', fontSize: '11.5px', marginTop: '3px' };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(14,30,61,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: '14px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          padding: '32px', width: '100%', maxWidth: '560px',
          fontFamily: 'Arial, sans-serif', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#0e1e3d' }}>
            Edit Project
          </h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#9ca3af' }}>
            {project.projectCode} — all changes are audited
          </p>
        </div>

        {apiError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Project Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input name="projectName" value={form.projectName} onChange={handleChange} style={inp('projectName')} placeholder="Enter project name" />
            {errors.projectName && <p style={errStyle}>{errors.projectName}</p>}
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              name="projectDescription" value={form.projectDescription} onChange={handleChange}
              rows={3} placeholder="Brief description (optional)"
              style={{ ...inp('projectDescription'), resize: 'vertical', minHeight: '72px', overflowY: 'auto', overflowX: 'hidden' }}
            />
            <p style={{ textAlign: 'right', fontSize: '11px', margin: '3px 0 0', color: countWords(form.projectDescription) > 100 ? '#ef4444' : '#9ca3af' }}>
              {countWords(form.projectDescription)}/100 words
            </p>
            {errors.projectDescription && <p style={errStyle}>{errors.projectDescription}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={inp('startDate')} />
              {errors.startDate && <p style={errStyle}>{errors.startDate}</p>}
            </div>
            <div>
              <label style={labelStyle}>End Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} style={inp('endDate')} />
              {errors.endDate && <p style={errStyle}>{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Justification <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              name="justification" value={form.justification} onChange={handleChange}
              rows={2} placeholder="Reason for this change (required for audit)"
              style={{ ...inp('justification'), resize: 'vertical', minHeight: '60px', overflowY: 'auto', overflowX: 'hidden' }}
            />
            <p style={{ textAlign: 'right', fontSize: '11px', margin: '3px 0 0', color: countWords(form.justification) > 100 ? '#ef4444' : '#9ca3af' }}>
              {countWords(form.justification)}/100 words
            </p>
            {errors.justification && <p style={errStyle}>{errors.justification}</p>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
            <button
              type="button" onClick={onClose} disabled={loading}
              style={{
                padding: '10px 22px', borderRadius: '8px',
                border: '1.5px solid #e5e7eb', background: '#ffffff',
                color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              style={{
                padding: '10px 26px', borderRadius: '8px', border: 'none',
                background: loading ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)',
                color: '#ffffff', fontSize: '13px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(0,0,0,0.12)',
              }}
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
