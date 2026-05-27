import React, { useState, useEffect } from 'react';
import { getAuthUser } from '../utils/auth';
import SummaryApi from '../apis/index.jsx';

const DEPARTMENTS = [
  'Mechanical And System Integration',
  'Virtual Engineering Manufacturing',
  'Lean Manufacturing & Tool Design',
  'Electrical And Automation',
  'Hydraulics System Design',
  'Digital Tech. & Program Management',
];

const progressColor = (val) => {
  const n = Number(val);
  if (isNaN(n) || val === '' || val === null || val === undefined) return '#d1d5db';
  if (n <= 33) return '#ef4444';
  if (n <= 66) return '#f97316';
  return '#22c55e';
};

const progressBg = (val) => {
  const n = Number(val);
  if (isNaN(n) || val === '' || val === null || val === undefined) return '#f3f4f6';
  if (n <= 33) return '#fef2f2';
  if (n <= 66) return '#fff7ed';
  return '#f0fdf4';
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const ProjectProgressModal = ({ project, onClose }) => {
  const { user } = getAuthUser();
  const isAdmin      = user?.role === 'Admin';
  const isManagerCOE = user?.role === 'Manager(COE)';

  const [data,    setData]    = useState({});
  const [inputs,  setInputs]  = useState(() => Object.fromEntries(DEPARTMENTS.map(d => [d, ''])));
  const [saving,  setSaving]  = useState({});
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${SummaryApi.getProjectProgress.url}/${project._id}`, {
          method: 'GET', credentials: 'include',
        });
        const json = await res.json();
        if (json.success) {
          const map      = {};
          const inputMap = {};
          json.data.forEach(entry => {
            map[entry.department]      = entry;
            inputMap[entry.department] = String(entry.progress);
          });
          setData(map);
          setInputs(prev => ({ ...prev, ...inputMap }));
        }
      } catch {}
      setLoading(false);
    };
    fetchProgress();
  }, [project._id]);

  const canEdit = () => isAdmin || isManagerCOE;

  const handleSave = async (dept) => {
    const val = inputs[dept];
    if (val === '' || val === null || val === undefined) {
      setErrors(prev => ({ ...prev, [dept]: 'Enter a value (0–100)' }));
      return;
    }
    const n = Number(val);
    if (isNaN(n) || n < 0 || n > 100) {
      setErrors(prev => ({ ...prev, [dept]: 'Must be between 0 and 100' }));
      return;
    }
    setSaving(prev => ({ ...prev, [dept]: true }));
    setErrors(prev => ({ ...prev, [dept]: '' }));
    try {
      const res  = await fetch(SummaryApi.upsertProjectProgress.url, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project._id, department: dept, progress: n }),
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => ({ ...prev, [dept]: json.data }));
      } else {
        setErrors(prev => ({ ...prev, [dept]: json.message || 'Failed to save' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, [dept]: 'Network error. Try again.' }));
    }
    setSaving(prev => ({ ...prev, [dept]: false }));
  };

  const displayVal = (dept) => {
    const input = inputs[dept];
    if (input !== '') return input;
    const entry = data[dept];
    return entry ? String(entry.progress) : null;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        background: 'rgba(14,30,61,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
          padding: '28px 32px', width: '100%', maxWidth: '640px',
          fontFamily: 'Arial, sans-serif', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0e1e3d' }}>
              Project Progress
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#9ca3af' }}>
              {project.projectCode} — {project.projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af', lineHeight: 1, marginTop: '2px' }}
          >✕</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: '88px', borderRadius: '10px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
            ))}
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DEPARTMENTS.map((dept) => {
              const entry    = data[dept];
              const dVal     = displayVal(dept);
              const color    = progressColor(dVal);
              const bgColor  = progressBg(dVal);
              const barWidth = dVal !== null && dVal !== '' ? Math.min(100, Math.max(0, Number(dVal))) : 0;
              const editable = canEdit();

              return (
                <div
                  key={dept}
                  style={{
                    background: bgColor, borderRadius: '10px',
                    padding: '14px 16px',
                    border: `1.5px solid ${color}33`,
                  }}
                >
                  {/* Dept name + last updated */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{dept}</span>
                    {entry?.updatedBy && (
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        Updated by {entry.updatedBy.name} · {fmt(entry.updatedAt)}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: '9px', background: '#e5e7eb', borderRadius: '999px', marginBottom: '10px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%', width: `${barWidth}%`,
                        background: color, borderRadius: '999px',
                        transition: 'width 0.35s ease',
                      }}
                    />
                  </div>

                  {/* Input row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={inputs[dept]}
                      onChange={(e) => {
                        setInputs(prev => ({ ...prev, [dept]: e.target.value }));
                        setErrors(prev => ({ ...prev, [dept]: '' }));
                      }}
                      disabled={!editable}
                      placeholder="0 – 100"
                      style={{
                        width: '86px', padding: '6px 10px', borderRadius: '7px',
                        border: `1.5px solid ${errors[dept] ? '#f87171' : '#d1d5db'}`,
                        fontSize: '13px', outline: 'none',
                        background: editable ? '#fff' : '#f3f4f6',
                        color: editable ? '#374151' : '#9ca3af',
                        cursor: editable ? 'text' : 'not-allowed',
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>%</span>

                    {/* Colored percentage badge */}
                    <span
                      style={{
                        fontWeight: 700, fontSize: '14px', color,
                        minWidth: '40px',
                      }}
                    >
                      {dVal !== null && dVal !== '' ? `${dVal}%` : '—'}
                    </span>

                    {editable && (
                      <button
                        onClick={() => handleSave(dept)}
                        disabled={saving[dept]}
                        style={{
                          marginLeft: 'auto', padding: '6px 18px', borderRadius: '7px', border: 'none',
                          background: saving[dept] ? '#93c5fd' : '#3b82f6',
                          color: '#fff', fontSize: '12px', fontWeight: 600,
                          cursor: saving[dept] ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        {saving[dept] ? 'Saving…' : 'Save'}
                      </button>
                    )}

                    {errors[dept] && (
                      <span style={{ fontSize: '11.5px', color: '#ef4444' }}>{errors[dept]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
          {[
            { color: '#ef4444', bg: '#fef2f2', label: '0 – 33%  Low' },
            { color: '#f97316', bg: '#fff7ed', label: '34 – 66%  Medium' },
            { color: '#22c55e', bg: '#f0fdf4', label: '67 – 100%  High' },
          ].map(({ color, bg, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color }} />
              <span style={{ fontSize: '11.5px', color: '#6b7280' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectProgressModal;
