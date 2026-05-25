import React, { useState, useEffect, useCallback } from 'react';
import { getAuthUser } from '../utils/auth';
import SummaryApi from '../apis/index.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import { BsPersonPlusFill, BsTrash, BsPencil } from 'react-icons/bs';

const countWords = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const AllocationSection = ({ projectId }) => {
  const { user } = getAuthUser();
  const canEdit  = ['Manager(COE)', 'Admin'].includes(user?.role);

  // ── Core data ────────────────────────────────────────────────────────────
  const [allocations, setAllocations]     = useState([]);
  const [deptHoursData, setDeptHoursData] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  // ── Add allocation form ───────────────────────────────────────────────────
  const [showForm, setShowForm]           = useState(false);
  const [deptEmployees, setDeptEmployees] = useState([]);
  const [form, setForm]                   = useState({ employeeUserId: '', totalAllocatedHours: '', justification: '' });
  const [formErrors, setFormErrors]       = useState({});
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState('');
  const [addConfirm, setAddConfirm]       = useState(null);

  // ── Update allocation ─────────────────────────────────────────────────────
  const [updateTarget, setUpdateTarget]   = useState(null);
  const [updateForm, setUpdateForm]       = useState({ totalAllocatedHours: '', justification: '' });
  const [updateErrors, setUpdateErrors]   = useState({});
  const [updateSaving, setUpdateSaving]   = useState(false);
  const [updateSaveError, setUpdateSaveError] = useState('');
  const [updateConfirm, setUpdateConfirm] = useState(null);

  // ── Remove allocation ─────────────────────────────────────────────────────
  const [removeTarget, setRemoveTarget]   = useState(null);
  const [removeJust, setRemoveJust]       = useState('');
  const [removing, setRemoving]           = useState(false);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchAllocations = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${SummaryApi.getAllocations.url}/${projectId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setAllocations(data.data);
      else setError(data.message || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [projectId]);

  const fetchDeptHours = useCallback(async () => {
    try {
      const res  = await fetch(`${SummaryApi.getDeptHours.url}/${projectId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setDeptHoursData(data.data);
    } catch { /* silent */ }
  }, [projectId]);

  useEffect(() => { fetchAllocations(); fetchDeptHours(); }, [fetchAllocations, fetchDeptHours]);

  const refreshAll = async () => { await fetchAllocations(); await fetchDeptHours(); };

  const loadEmployees = useCallback(async () => {
    if (!canEdit) return;
    try {
      const dept = user?.role === 'Manager(COE)' ? user.department : null;
      const url  = dept
        ? `${SummaryApi.getUsersByDepartment.url}/${encodeURIComponent(dept)}`
        : SummaryApi.getAllUsers.url;
      const res  = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setDeptEmployees((data.data || []).filter((u) => u.role === 'Employee'));
    } catch { /* silent */ }
  }, [canEdit, user]);

  useEffect(() => { if (showForm) loadEmployees(); }, [showForm, loadEmployees]);

  // ── Summary computation ───────────────────────────────────────────────────
  const deptHoursMap = {};
  deptHoursData.forEach((d) => { deptHoursMap[d.department] = d.totalHours; });

  const allocationsByDept = {};
  allocations.forEach((a) => {
    const dept = a.department;
    allocationsByDept[dept] = (allocationsByDept[dept] || 0) + a.totalAllocatedHours;
  });

  const allDepts = [...new Set([...Object.keys(allocationsByDept), ...Object.keys(deptHoursMap)])];
  const summary  = allDepts.map((dept) => ({
    department:   dept,
    deptHours:    deptHoursMap[dept] ?? null,
    allocated:    allocationsByDept[dept] || 0,
    remaining:    deptHoursMap[dept] != null ? deptHoursMap[dept] - (allocationsByDept[dept] || 0) : null,
  }));

  // ── Validation helpers ────────────────────────────────────────────────────
  const getDeptHoursForDept = (dept) => deptHoursMap[dept] ?? null;

  const validateAdd = () => {
    const e = {};
    if (!form.employeeUserId)                            e.employeeUserId       = 'Select an employee';
    if (!form.totalAllocatedHours || Number(form.totalAllocatedHours) <= 0) e.totalAllocatedHours = 'Enter valid hours';
    if (!form.justification.trim())                      e.justification        = 'Justification required';
    else if (countWords(form.justification) > 100)       e.justification        = 'Maximum 100 words allowed';

    // Frontend dept-hours cap check
    if (form.employeeUserId && form.totalAllocatedHours) {
      const emp  = deptEmployees.find((e) => e._id === form.employeeUserId);
      if (emp) {
        const cap = getDeptHoursForDept(emp.department);
        if (cap != null) {
          const currentTotal = allocations
            .filter((a) => a.department === emp.department && a.employee?._id !== form.employeeUserId)
            .reduce((sum, a) => sum + a.totalAllocatedHours, 0);
          if (currentTotal + Number(form.totalAllocatedHours) > cap) {
            const remaining = cap - currentTotal;
            e.totalAllocatedHours = `Exceeds dept hours cap. Remaining capacity: ${remaining}h. Update departmental hours first if more is needed.`;
          }
        }
      }
    }

    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateUpdate = () => {
    const e = {};
    if (!updateForm.totalAllocatedHours || Number(updateForm.totalAllocatedHours) <= 0) e.totalAllocatedHours = 'Enter valid hours';
    if (!updateForm.justification.trim())                e.justification = 'Justification required';
    else if (countWords(updateForm.justification) > 100) e.justification = 'Maximum 100 words allowed';

    if (updateTarget && updateForm.totalAllocatedHours) {
      const cap = getDeptHoursForDept(updateTarget.department);
      if (cap != null) {
        const otherTotal = allocations
          .filter((a) => a.department === updateTarget.department && a._id !== updateTarget._id)
          .reduce((sum, a) => sum + a.totalAllocatedHours, 0);
        if (otherTotal + Number(updateForm.totalAllocatedHours) > cap) {
          const remaining = cap - otherTotal;
          e.totalAllocatedHours = `Updated allocation exceeds departmental hours. Remaining capacity: ${remaining}h. Please update departmental hours first.`;
        }
      }
    }

    setUpdateErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Add allocation flow ───────────────────────────────────────────────────
  const handleAddClick = () => {
    if (!validateAdd()) return;
    const emp = deptEmployees.find((e) => e._id === form.employeeUserId);
    setAddConfirm({
      title:   'Confirm Allocation',
      message: `Allocate ${form.totalAllocatedHours}h to ${emp?.name || 'employee'} (${emp?.department})? Justification: "${form.justification.trim()}"`,
      onConfirm: async () => {
        setSaving(true); setSaveError('');
        try {
          const res  = await fetch(SummaryApi.allocateEmployee.url, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              employeeUserId:      form.employeeUserId,
              totalAllocatedHours: Number(form.totalAllocatedHours),
              justification:       form.justification,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setForm({ employeeUserId: '', totalAllocatedHours: '', justification: '' });
            setShowForm(false); setAddConfirm(null);
            await refreshAll();
          } else {
            setSaveError(data.message || 'Failed to allocate'); setAddConfirm(null);
          }
        } catch { setSaveError('Network error'); setAddConfirm(null); }
        finally { setSaving(false); }
      },
    });
  };

  // ── Update allocation flow ────────────────────────────────────────────────
  const openUpdate = (allocation) => {
    setUpdateTarget(allocation);
    setUpdateForm({ totalAllocatedHours: String(allocation.totalAllocatedHours), justification: '' });
    setUpdateErrors({});
    setUpdateSaveError('');
  };

  const handleUpdateClick = () => {
    if (!validateUpdate()) return;
    setUpdateConfirm({
      title:   'Update Allocation',
      message: `Update ${updateTarget.employee?.name}'s allocation from ${updateTarget.totalAllocatedHours}h → ${updateForm.totalAllocatedHours}h? Justification: "${updateForm.justification.trim()}"`,
      onConfirm: async () => {
        setUpdateSaving(true); setUpdateSaveError('');
        try {
          const res  = await fetch(SummaryApi.allocateEmployee.url, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              employeeUserId:      updateTarget.employee?._id,
              totalAllocatedHours: Number(updateForm.totalAllocatedHours),
              justification:       updateForm.justification,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setUpdateTarget(null); setUpdateConfirm(null);
            await refreshAll();
          } else {
            setUpdateSaveError(data.message || 'Failed to update'); setUpdateConfirm(null);
          }
        } catch { setUpdateSaveError('Network error'); setUpdateConfirm(null); }
        finally { setUpdateSaving(false); }
      },
    });
  };

  // ── Remove allocation flow ────────────────────────────────────────────────
  const confirmRemove = (allocation) => { setRemoveTarget(allocation); setRemoveJust(''); };

  const handleRemove = async () => {
    if (!removeJust.trim()) return;
    setRemoving(true);
    try {
      const res  = await fetch(`${SummaryApi.removeAllocation.url}/${removeTarget._id}`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justification: removeJust }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setRemoveTarget(null); await refreshAll(); }
    } catch { /* silent */ }
    finally { setRemoving(false); }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inp = (field, errors = formErrors) => ({
    width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px',
    border: `1.5px solid ${errors[field] ? '#f87171' : '#e2e8f0'}`,
    background: errors[field] ? '#fff5f5' : '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
  });

  const tdStyle = { padding: '13px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' };
  const errStyle   = { color: '#ef4444', fontSize: '11.5px', margin: '3px 0 0' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Employee Allocation</h3>
        {canEdit && (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)', color: '#fff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >
            <BsPersonPlusFill size={14} /> {showForm ? 'Cancel' : 'Allocate Employee'}
          </button>
        )}
      </div>

      {saveError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
          {saveError}
        </div>
      )}

      {/* Add Allocation Form */}
      {showForm && canEdit && (
        <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                value={form.employeeUserId}
                onChange={(e) => { setForm((p) => ({ ...p, employeeUserId: e.target.value })); setFormErrors((p) => ({ ...p, employeeUserId: '' })); }}
                style={inp('employeeUserId')}
              >
                <option value="">Select employee…</option>
                {deptEmployees
                  .filter((e) => !allocations.some((a) => a.employee?._id === e._id || a.employee === e._id))
                  .map((e) => (
                    <option key={e._id} value={e._id}>{e.name} ({e.employeeId}) — {e.department}</option>
                  ))}
              </select>
              {formErrors.employeeUserId && <p style={errStyle}>{formErrors.employeeUserId}</p>}
            </div>
            <div>
              <label style={labelStyle}>Total Hours <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="number" min="1" value={form.totalAllocatedHours}
                onChange={(e) => { setForm((p) => ({ ...p, totalAllocatedHours: e.target.value })); setFormErrors((p) => ({ ...p, totalAllocatedHours: '' })); }}
                placeholder="e.g. 200" style={inp('totalAllocatedHours')}
              />
              {formErrors.totalAllocatedHours && <p style={{ ...errStyle, fontWeight: 500 }}>{formErrors.totalAllocatedHours}</p>}
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Justification <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              value={form.justification} rows={2} placeholder="Reason for allocation…"
              onChange={(e) => { setForm((p) => ({ ...p, justification: e.target.value })); setFormErrors((p) => ({ ...p, justification: '' })); }}
              style={{ ...inp('justification'), resize: 'vertical', minHeight: '56px', overflowY: 'auto', overflowX: 'hidden' }}
            />
            <p style={{ textAlign: 'right', fontSize: '11px', margin: '3px 0 0', color: countWords(form.justification) > 100 ? '#ef4444' : '#9ca3af' }}>
              {countWords(form.justification)}/100 words
            </p>
            {formErrors.justification && <p style={errStyle}>{formErrors.justification}</p>}
          </div>
          <button
            onClick={handleAddClick} disabled={saving}
            style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: saving ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >{saving ? 'Allocating…' : 'Confirm Allocation'}</button>
        </div>
      )}

      {/* Allocation Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(3)].map((_, i) => <div key={i} style={{ height: '48px', borderRadius: '8px', background: '#f3f4f6' }} />)}
        </div>
      ) : error ? (
        <div style={{ color: '#dc2626', fontSize: '13px', padding: '16px', textAlign: 'center' }}>{error}</div>
      ) : allocations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>No employees allocated yet.</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Employee', 'Department', 'Allocated', 'Consumed', 'Remaining', 'Allocated By', ...(canEdit ? ['Actions'] : [])].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allocations.map((a, i) => {
                const pct = a.totalAllocatedHours > 0 ? Math.min(100, Math.round((a.consumedHours / a.totalAllocatedHours) * 100)) : 0;
                return (
                  <tr key={a._id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#0e1e3d' }}>{a.employee?.name || '—'}</div>
                      <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{a.employeeId}</div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px' }}>{a.department}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#1d4ed8' }}>{a.totalAllocatedHours}h</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#e5e7eb', minWidth: '60px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#dc2626' : '#1d4ed8', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '12px' }}>{a.consumedHours}h</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: a.remainingHours <= 0 ? '#dc2626' : '#16a34a' }}>{a.remainingHours}h</td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#6b7280' }}>{a.allocatedBy?.name || '—'}</td>
                    {canEdit && (
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => openUpdate(a)}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            <BsPencil size={11} /> Update
                          </button>
                          <button
                            onClick={() => confirmRemove(a)}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            <BsTrash size={11} /> Remove
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Dept Hours Summary ──────────────────────────────────────────────── */}
      {summary.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '13.5px', fontWeight: 700, color: '#0e1e3d' }}>Allocation Summary by Department</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {summary.map((s) => {
              const pct      = s.deptHours ? Math.min(100, Math.round((s.allocated / s.deptHours) * 100)) : 0;
              const isOver   = s.deptHours != null && s.remaining != null && s.remaining < 0;
              const isFull   = s.deptHours != null && s.remaining === 0;
              const noLimit  = s.deptHours == null;

              return (
                <div key={s.department} style={{ background: isOver ? '#fff1f1' : '#f8faff', border: `1.5px solid ${isOver ? '#fca5a5' : '#dde7ff'}`, borderRadius: '10px', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0e1e3d' }}>{s.department}</span>
                    {isFull && !isOver && (
                      <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px' }}>Fully Allocated</span>
                    )}
                    {isOver && (
                      <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px' }}>⚠ Over Capacity</span>
                    )}
                    {noLimit && (
                      <span style={{ background: '#fffbeb', color: '#d97706', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px' }}>No Dept Hours Set</span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: noLimit ? 0 : '10px' }}>
                    {[
                      { label: 'Dept Hours',  value: s.deptHours != null ? `${s.deptHours}h` : '—', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
                      { label: 'Allocated',   value: `${s.allocated}h`,                             color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                      { label: 'Remaining',
                        value: s.remaining != null ? `${s.remaining}h` : '—',
                        color: isOver ? '#dc2626' : isFull ? '#16a34a' : '#0891b2',
                        bg:    isOver ? '#fef2f2' : isFull ? '#f0fdf4' : '#ecfeff',
                        border:isOver ? '#fca5a5' : isFull ? '#bbf7d0' : '#a5f3fc',
                      },
                    ].map((stat) => (
                      <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 2px', fontSize: '10.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  {!noLimit && (
                    <div>
                      <div style={{ height: '6px', borderRadius: '3px', background: '#e5e7eb', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isOver ? '#dc2626' : pct >= 90 ? '#f59e0b' : '#3b82f6', borderRadius: '3px', transition: 'width 0.3s' }} />
                      </div>
                      <p style={{ margin: '4px 0 0', textAlign: 'right', fontSize: '11px', color: '#9ca3af' }}>{pct}% utilized</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add confirm modal ─────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!addConfirm} title={addConfirm?.title} message={addConfirm?.message}
        confirmLabel="Yes, Allocate" loading={saving}
        onConfirm={addConfirm?.onConfirm} onCancel={() => setAddConfirm(null)}
      />

      {/* ── Update allocation modal ───────────────────────────────────────── */}
      {updateTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(14,30,61,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => !updateSaving && setUpdateTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', padding: '28px', width: '100%', maxWidth: '440px', fontFamily: 'Arial, sans-serif' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: '#0e1e3d' }}>Update Hours Allocation</h3>
            <p style={{ margin: '0 0 18px', fontSize: '12.5px', color: '#9ca3af' }}>
              {updateTarget.employee?.name} ({updateTarget.employeeId}) — {updateTarget.department}
            </p>

            {/* Previous value reference */}
            <div style={{ background: '#f8faff', border: '1px solid #dde7ff', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#374151' }}>
              Current allocation: <strong>{updateTarget.totalAllocatedHours}h</strong>
              {deptHoursMap[updateTarget.department] != null && (
                <span style={{ marginLeft: '12px', color: '#6b7280' }}>
                  Dept cap: <strong>{deptHoursMap[updateTarget.department]}h</strong>
                </span>
              )}
            </div>

            {updateSaveError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
                {updateSaveError}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>New Allocated Hours <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="number" min="1" value={updateForm.totalAllocatedHours}
                onChange={(e) => { setUpdateForm((p) => ({ ...p, totalAllocatedHours: e.target.value })); setUpdateErrors((p) => ({ ...p, totalAllocatedHours: '' })); }}
                placeholder="e.g. 250"
                style={inp('totalAllocatedHours', updateErrors)}
              />
              {updateErrors.totalAllocatedHours && <p style={{ ...errStyle, fontWeight: 500 }}>{updateErrors.totalAllocatedHours}</p>}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Justification <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                value={updateForm.justification} rows={2} placeholder="Reason for this change…"
                onChange={(e) => { setUpdateForm((p) => ({ ...p, justification: e.target.value })); setUpdateErrors((p) => ({ ...p, justification: '' })); }}
                style={{ ...inp('justification', updateErrors), resize: 'vertical', minHeight: '56px', overflowY: 'auto', overflowX: 'hidden' }}
              />
              <p style={{ textAlign: 'right', fontSize: '11px', margin: '3px 0 0', color: countWords(updateForm.justification) > 100 ? '#ef4444' : '#9ca3af' }}>
                {countWords(updateForm.justification)}/100 words
              </p>
              {updateErrors.justification && <p style={errStyle}>{updateErrors.justification}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setUpdateTarget(null)} disabled={updateSaving} style={{ padding: '9px 20px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleUpdateClick} disabled={updateSaving} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: updateSaving ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: updateSaving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                {updateSaving ? 'Saving…' : 'Update Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Update confirm modal ──────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!updateConfirm} title={updateConfirm?.title} message={updateConfirm?.message}
        confirmLabel="Yes, Update" loading={updateSaving}
        onConfirm={updateConfirm?.onConfirm} onCancel={() => setUpdateConfirm(null)}
      />

      {/* ── Remove allocation modal ───────────────────────────────────────── */}
      {removeTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(14,30,61,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setRemoveTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', padding: '32px', width: '100%', maxWidth: '440px', fontFamily: 'Arial, sans-serif' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#0e1e3d' }}>Remove Allocation</h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#6b7280' }}>
              Remove <strong>{removeTarget.employee?.name}</strong> ({removeTarget.employeeId}) from this project? This will deactivate their allocation. Enter a justification.
            </p>
            <textarea
              value={removeJust} rows={2} placeholder="Justification (required)…"
              onChange={(e) => setRemoveJust(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '56px', fontFamily: 'Arial, sans-serif', marginBottom: '4px', overflowY: 'auto', overflowX: 'hidden' }}
            />
            <p style={{ textAlign: 'right', fontSize: '11px', margin: '0 0 14px', color: countWords(removeJust) > 100 ? '#ef4444' : '#9ca3af' }}>
              {countWords(removeJust)}/100 words
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setRemoveTarget(null)} style={{ padding: '9px 20px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleRemove} disabled={removing || !removeJust.trim()}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: removing || !removeJust.trim() ? '#fca5a5' : '#dc2626', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: removing || !removeJust.trim() ? 'not-allowed' : 'pointer' }}
              >{removing ? 'Removing…' : 'Remove'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationSection;
