import React, { useState, useEffect, useCallback } from 'react';
import { getAuthUser } from '../utils/auth';
import SummaryApi from '../apis/index.jsx';
import ConfirmModal from './ConfirmModal.jsx';

const countWords = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const DEPARTMENTS = [
  'Mechanical And System Integration', 'Virtual Engineering Manufacturing', 'Lean Manufacturing & Tool Design',
  'Electrical And Automation', 'Hydraulics System Design', 'Digital Tech. & Program Management',
];

const DeptHoursSection = ({ projectId }) => {
  const { user } = getAuthUser();
  const canEdit  = ['Manager(COE)', 'Admin'].includes(user?.role);

  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ department: '', totalHours: '', justification: '' });
  const [formErrors, setFormErrors]= useState({});
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState(null);
  const [saveError, setSaveError] = useState('');

  const visibleDepts = DEPARTMENTS;

  const fetchHours = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${SummaryApi.getDeptHours.url}/${projectId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setRows(data.data);
      else setError(data.message || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchHours(); }, [fetchHours]);

  const validate = () => {
    const e = {};
    if (!form.department)                           e.department    = 'Select a department';
    if (!form.totalHours || form.totalHours <= 0)   e.totalHours    = 'Enter valid hours';
    if (!form.justification.trim())                 e.justification = 'Justification required';
    else if (countWords(form.justification) > 100)  e.justification = 'Maximum 100 words allowed';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setConfirm({
      title:   'Set Departmental Hours',
      message: `Set ${form.totalHours}h for ${form.department}? This action is audited.`,
      onConfirm: async () => {
        setSaving(true); setSaveError('');
        try {
          const res  = await fetch(SummaryApi.upsertDeptHours.url, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, department: form.department, totalHours: Number(form.totalHours), justification: form.justification }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setForm({ department: '', totalHours: '', justification: '' });
            setShowForm(false); setConfirm(null);
            await fetchHours();
          } else { setSaveError(data.message || 'Failed to save'); setConfirm(null); }
        } catch { setSaveError('Network error'); setConfirm(null); }
        finally { setSaving(false); }
      },
    });
  };

  const inp = (field) => ({
    width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px',
    border: `1.5px solid ${formErrors[field] ? '#f87171' : '#e2e8f0'}`,
    background: formErrors[field] ? '#fff5f5' : '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Departmental Hours</h3>
        {canEdit && (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              padding: '8px 18px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)',
              color: '#fff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >{showForm ? 'Cancel' : 'Set / Update Dept Hours'}</button>
        )}
      </div>

      {saveError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
          {saveError}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && canEdit && (
        <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
                Department <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={form.department}
                onChange={(e) => { setForm((p) => ({ ...p, department: e.target.value })); setFormErrors((p) => ({ ...p, department: '' })); }}
                style={inp('department')}
              >
                <option value="">Select department…</option>
                {visibleDepts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {formErrors.department && <p style={{ color: '#ef4444', fontSize: '11.5px', margin: '3px 0 0' }}>{formErrors.department}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
                Total Hours <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number" min="0" value={form.totalHours}
                onChange={(e) => { setForm((p) => ({ ...p, totalHours: e.target.value })); setFormErrors((p) => ({ ...p, totalHours: '' })); }}
                placeholder="e.g. 500" style={inp('totalHours')}
              />
              {formErrors.totalHours && <p style={{ color: '#ef4444', fontSize: '11.5px', margin: '3px 0 0' }}>{formErrors.totalHours}</p>}
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
              Justification <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={form.justification} rows={2} placeholder="Reason for this allocation…"
              onChange={(e) => { setForm((p) => ({ ...p, justification: e.target.value })); setFormErrors((p) => ({ ...p, justification: '' })); }}
              style={{ ...inp('justification'), resize: 'vertical', minHeight: '56px', overflowY: 'auto', overflowX: 'hidden' }}
            />
            <p style={{ textAlign: 'right', fontSize: '11px', margin: '3px 0 0', color: countWords(form.justification) > 100 ? '#ef4444' : '#9ca3af' }}>
              {countWords(form.justification)}/100 words
            </p>
            {formErrors.justification && <p style={{ color: '#ef4444', fontSize: '11.5px', margin: '3px 0 0' }}>{formErrors.justification}</p>}
          </div>
          <button
            onClick={handleSave} disabled={saving}
            style={{
              padding: '9px 24px', borderRadius: '8px', border: 'none',
              background: saving ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)',
              color: '#fff', fontSize: '13px', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >{saving ? 'Saving…' : 'Save Hours'}</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(3)].map((_, i) => <div key={i} style={{ height: '48px', borderRadius: '8px', background: '#f3f4f6' }} />)}
        </div>
      ) : error ? (
        <div style={{ color: '#dc2626', fontSize: '13px', padding: '16px', textAlign: 'center' }}>{error}</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>No departmental hours set yet.</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Department', 'Total Hours', 'Completed', 'Remaining', 'Set By', 'Updated'].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const pct = r.totalHours > 0 ? Math.min(100, Math.round((r.completedHours / r.totalHours) * 100)) : 0;
                return (
                  <tr key={r._id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{r.department}</td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#1d4ed8', borderBottom: '1px solid #f3f4f6' }}>{r.totalHours}h</td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#e5e7eb', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#dc2626' : '#16a34a', borderRadius: '3px', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#374151', minWidth: '60px' }}>{r.completedHours}h ({pct}%)</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: r.remainingHours === 0 ? '#dc2626' : '#16a34a', fontWeight: 700, borderBottom: '1px solid #f3f4f6' }}>{r.remainingHours}h</td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{r.updatedBy?.name || r.setBy?.name || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Yes, Save"
        loading={saving}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default DeptHoursSection;
