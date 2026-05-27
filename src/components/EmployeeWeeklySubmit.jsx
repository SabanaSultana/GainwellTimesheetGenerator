import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BsClipboardCheck, BsSearch, BsPlusCircle,
  BsCheckCircle, BsFolderFill, BsX, BsClock, BsExclamationTriangle,
  BsArrowDownUp, BsExclamationOctagon, BsFilePdf,
} from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function mergeEntries(plans, logs) {
  const map = {};
  plans.forEach((p) => {
    const key = `${p.year}-${p.weekNumber}`;
    map[key] = {
      year: p.year, weekNumber: p.weekNumber,
      plannedHours: p.plannedHours || 0,
      totalWeeklyHours: p.totalWeeklyHours || 0,
      workedHours: null, leaveHours: null, trainingHours: null,
      status: null, logId: null,
    };
  });
  logs.forEach((l) => {
    const key = `${l.year}-${l.weekNumber}`;
    if (!map[key]) {
      map[key] = { year: l.year, weekNumber: l.weekNumber, plannedHours: l.plannedHours || 0, totalWeeklyHours: l.totalWeeklyHours || 0 };
    }
    map[key].workedHours    = l.workedHours    ?? null;
    map[key].leaveHours     = l.leaveHours     ?? null;
    map[key].trainingHours  = l.trainingHours  ?? null;
    map[key].status         = l.status || null;
    map[key].logId          = l._id;
    if (l.totalWeeklyHours) map[key].totalWeeklyHours = l.totalWeeklyHours;
    if (l.plannedHours)     map[key].plannedHours     = l.plannedHours;
  });
  return Object.values(map).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.weekNumber - b.weekNumber
  );
}

const WEEK_SORTS = [
  { value: 'yr-wk-asc',   label: 'Year ↑ · Week ↑ (default)' },
  { value: 'yr-wk-desc',  label: 'Year ↓ · Week ↓' },
  { value: 'plan-desc',   label: 'Planned Hrs ↓' },
  { value: 'plan-asc',    label: 'Planned Hrs ↑' },
  { value: 'actual-desc', label: 'Actual Hrs ↓' },
  { value: 'status',      label: 'Status' },
];

function applySortWeeks(entries, sort) {
  const e = [...entries];
  switch (sort) {
    case 'yr-wk-asc':   return e.sort((a, b) => a.year !== b.year ? a.year - b.year : a.weekNumber - b.weekNumber);
    case 'yr-wk-desc':  return e.sort((a, b) => a.year !== b.year ? b.year - a.year : b.weekNumber - a.weekNumber);
    case 'plan-desc':   return e.sort((a, b) => (b.plannedHours || 0) - (a.plannedHours || 0));
    case 'plan-asc':    return e.sort((a, b) => (a.plannedHours || 0) - (b.plannedHours || 0));
    case 'actual-desc': return e.sort((a, b) => (b.workedHours  || 0) - (a.workedHours  || 0));
    case 'status':      return e.sort((a, b) => (a.status || 'z').localeCompare(b.status || 'z'));
    default:            return e;
  }
}

const PROJECT_SORTS = [
  { value: 'name-asc',       label: 'Project Name A→Z' },
  { value: 'name-desc',      label: 'Project Name Z→A' },
  { value: 'code-asc',       label: 'Code A→Z' },
  { value: 'start-asc',      label: 'Start Date ↑' },
  { value: 'start-desc',     label: 'Start Date ↓' },
  { value: 'allocated-desc', label: 'Allocated Hrs ↓' },
];

function sortProjects(projects, sort) {
  const p = [...projects];
  switch (sort) {
    case 'name-asc':       return p.sort((a, b) => (a.project?.projectName || '').localeCompare(b.project?.projectName || ''));
    case 'name-desc':      return p.sort((a, b) => (b.project?.projectName || '').localeCompare(a.project?.projectName || ''));
    case 'code-asc':       return p.sort((a, b) => (a.project?.projectCode || '').localeCompare(b.project?.projectCode || ''));
    case 'start-asc':      return p.sort((a, b) => new Date(a.project?.startDate) - new Date(b.project?.startDate));
    case 'start-desc':     return p.sort((a, b) => new Date(b.project?.startDate) - new Date(a.project?.startDate));
    case 'allocated-desc': return p.sort((a, b) => (b.totalAllocatedHours || 0) - (a.totalAllocatedHours || 0));
    default: return p;
  }
}

// Distinct color palette per project index
const PROJECT_PALETTES = [
  { header: '#1e3a8a', accent: '#3b82f6', badgeBg: '#1d4ed8', headerBg: 'linear-gradient(to right,#eff6ff,#dbeafe)', borderColor: '#bfdbfe' },
  { header: '#4c1d95', accent: '#8b5cf6', badgeBg: '#7c3aed', headerBg: 'linear-gradient(to right,#f5f3ff,#ede9fe)', borderColor: '#ddd6fe' },
];

const StatusBadge = ({ status }) => {
  if (status === 'submitted') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
        <BsCheckCircle size={12} /> Submitted
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
      <BsClock size={12} /> Pending
    </span>
  );
};

// Confirmation modal before final submit
const SubmitConfirmModal = ({ entry, onConfirm, onCancel, saving }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(14,30,61,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', padding: '32px', width: '100%', maxWidth: '480px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fffbeb', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BsExclamationOctagon size={24} color="#d97706" />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0e1e3d' }}>Confirm Submission</h4>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af' }}>
            Week {entry.weekNumber} · Year {entry.year}
          </p>
        </div>
      </div>
      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: '#92400e', lineHeight: 1.7, marginBottom: '24px' }}>
        <strong>Important:</strong> After submitting, you will <strong>not be able to update</strong> this data on your own.
        If you need to make changes, please contact your <strong>Project Manager</strong>.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button onClick={onCancel} disabled={saving}
          style={{ padding: '10px 22px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={saving}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: saving ? '#93c5fd' : 'linear-gradient(135deg,#3b82f6 80%,#60a5fa)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 3px 12px rgba(0,0,0,0.14)' }}>
          {saving ? 'Submitting…' : 'Yes, Submit'}
        </button>
      </div>
    </div>
  </div>
);

// Inline form (no remarks, with confirmation step)
const InlineEditForm = ({ entry, projectId, onSave, onCancel }) => {
  const [form, setForm] = useState({
    workedHours:     entry.workedHours     != null ? String(entry.workedHours)     : '0',
    leaveHours:      entry.leaveHours      != null ? String(entry.leaveHours)      : '0',
    trainingHours:   entry.trainingHours   != null ? String(entry.trainingHours)   : '0',
    justification:   '',
  });
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const e       = {};
    const worked   = Number(form.workedHours   || 0);
    const training = Number(form.trainingHours || 0);
    const leave    = Number(form.leaveHours    || 0);
    if (worked < 0 || training < 0 || leave < 0) e.workedHours = 'Hours cannot be negative';
    if (entry.status === 'submitted' && !form.justification.trim())
      e.justification = 'Justification required to update a submitted log';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSubmit = async () => {
    setSaving(true); setSaveMsg(null); setShowConfirm(false);
    try {
      const res  = await fetch(SummaryApi.submitWorkLog.url, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          year:            entry.year,
          weekNumber:      entry.weekNumber,
          workedHours:     Number(form.workedHours     || 0),
          leaveHours:      Number(form.leaveHours      || 0),
          trainingHours:   Number(form.trainingHours   || 0),
          justification:   form.justification   || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) { onSave(); }
      else { setSaveMsg(data.message || 'Failed to save'); }
    } catch { setSaveMsg('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleClickSubmit = () => {
    if (!validate()) return;
    if (entry.status === 'submitted') {
      doSubmit(); // update without extra confirm if already submitted (justification required)
    } else {
      setShowConfirm(true);
    }
  };

  const fieldStyle = (key) => ({
    width: '100%', padding: '10px 12px', borderRadius: '9px', fontSize: '14px', outline: 'none',
    border: `1.5px solid ${errors[key] ? '#f87171' : '#e2e8f0'}`,
    background: errors[key] ? '#fff5f5' : '#fff',
    boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
  });

  return (
    <>
      {showConfirm && (
        <SubmitConfirmModal
          entry={entry}
          saving={saving}
          onConfirm={doSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div style={{ background: 'linear-gradient(135deg,#f0f7ff,#f5f3ff)', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '22px 24px', margin: '4px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BsClipboardCheck size={17} color="#1d4ed8" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0e1e3d' }}>
              {entry.status === 'submitted' ? 'Update' : 'Submit'} Hours — Year {entry.year} · Week {entry.weekNumber}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#6b7280' }}>
              {entry.plannedHours > 0 ? `Planned: ${entry.plannedHours}h` : 'No plan set'}
              {entry.totalWeeklyHours > 0 ? ` · Weekly budget: ${entry.totalWeeklyHours}h` : ''}
            </p>
          </div>
          {entry.status === 'submitted' && (
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '10px', fontWeight: 600 }}>
              Editing submitted log — justification required
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '16px' }}>
          {[
            { key: 'workedHours',   label: 'Actual / Worked (h)', hint: '' },
            { key: 'leaveHours',    label: 'Leave (h)',            hint: '' },
            { key: 'trainingHours', label: 'Training (h)',         hint: '' },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                {label}
                {hint && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '5px' }}>({hint})</span>}
              </label>
              <input
                type="number" min="0"
                value={form[key]} placeholder="0"
                onChange={(e) => { setForm((p) => ({ ...p, [key]: e.target.value })); setErrors((p) => ({ ...p, [key]: '' })); }}
                style={fieldStyle(key)}
              />
              {key === 'workedHours' && errors.workedHours && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <BsExclamationTriangle size={11} /> {errors.workedHours}
                </p>
              )}
            </div>
          ))}
        </div>

        {entry.status === 'submitted' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Justification <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={form.justification} rows={2} placeholder="Reason for updating this log…"
              onChange={(e) => { setForm((p) => ({ ...p, justification: e.target.value })); setErrors((p) => ({ ...p, justification: '' })); }}
              style={{ ...fieldStyle('justification'), resize: 'vertical', minHeight: '56px' }}
            />
            {errors.justification && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.justification}</p>
            )}
          </div>
        )}

        {saveMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
            {saveMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleClickSubmit} disabled={saving}
            style={{ padding: '10px 26px', borderRadius: '9px', border: 'none', background: saving ? '#93c5fd' : 'linear-gradient(135deg,#3b82f6 80%,#60a5fa)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >
            {saving ? 'Saving…' : entry.status === 'submitted' ? 'Update Log' : 'Submit Log'}
          </button>
          <button
            onClick={onCancel} disabled={saving}
            style={{ padding: '10px 20px', borderRadius: '9px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

// Per-project card
const ProjectCard = ({ project, paletteIdx, refreshKey = 0, onLogSubmitted }) => {
  const palette = PROJECT_PALETTES[paletteIdx % PROJECT_PALETTES.length];

  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [weekSearch, setWeekSearch] = useState('');
  const [weekSort,   setWeekSort]   = useState('yr-wk-asc');
  const [editKey,    setEditKey]    = useState(null);
  const [collapsed,  setCollapsed]  = useState(false);
  const printRef = useRef(null);

  const downloadPdf = () => {
    if (!printRef.current) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Timesheet – ${project.project?.projectCode}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #1f2937; }
        h2   { font-size: 16px; font-weight: 700; color: #0e1e3d; margin: 0 0 4px; }
        p    { margin: 0 0 14px; font-size: 12px; color: #6b7280; }
        table{ border-collapse: collapse; width: 100%; margin-top: 10px; }
        th   { background: #1d4ed8; color: #fff; padding: 8px 10px; font-size: 11px; text-align: left; white-space: nowrap; }
        td   { border: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; }
        tr:nth-child(even) td { background: #f8faff; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-weight: 700; font-size: 11px; }
        .submitted { background: #dcfce7; color: #16a34a; }
        .pending   { background: #fef3c7; color: #d97706; }
      </style>
      </head><body>
        <h2>${project.project?.projectCode} — ${project.project?.projectName}</h2>
        <p>${fmt(project.project?.startDate)} – ${fmt(project.project?.endDate)} &nbsp;|&nbsp; ${project.department || ''}</p>
        ${printRef.current.innerHTML}
      </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [planRes, logRes] = await Promise.all([
        fetch(`${SummaryApi.getWeeklyPlans.url}/${project.project._id}`, { credentials: 'include' }),
        fetch(`${SummaryApi.getWorkLogs.url}/${project.project._id}`,    { credentials: 'include' }),
      ]);
      const [planData, logData] = await Promise.all([planRes.json(), logRes.json()]);
      setEntries(mergeEntries(
        planData.success ? planData.data : [],
        logData.success  ? logData.data  : [],
      ));
    } catch { setError('Failed to load weekly entries.'); }
    finally { setLoading(false); }
  }, [project.project._id]);

  useEffect(() => { fetchEntries(); }, [fetchEntries, refreshKey]);

  const filtered = entries.filter((e) => {
    if (!weekSearch) return true;
    const q = weekSearch.toLowerCase();
    return String(e.year).includes(q) || String(e.weekNumber).includes(q) || (e.status || '').toLowerCase().includes(q);
  });
  const sorted = applySortWeeks(filtered, weekSort);

  const submittedCount = entries.filter((e) => e.status === 'submitted').length;
  const pendingCount   = entries.length - submittedCount;

  const thStyle = { padding: '11px 15px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '2px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '14px 15px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${palette.borderColor}`, borderRadius: '16px', boxShadow: '0 3px 14px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

      {/* Header */}
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{ padding: '20px 26px', background: palette.headerBg, cursor: 'pointer', borderBottom: collapsed ? 'none' : `1px solid ${palette.borderColor}` }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '11px', background: palette.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px rgba(0,0,0,0.18)` }}>
              <BsFolderFill size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ background: palette.badgeBg, color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
                  {project.project?.projectCode}
                </span>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: palette.header }}>{project.project?.projectName}</h4>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                {fmt(project.project?.startDate)} — {fmt(project.project?.endDate)} &nbsp;·&nbsp; {project.department}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Weeks', value: entries.length,  color: '#1e40af' },
              { label: 'Submitted',   value: submittedCount,  color: '#16a34a' },
              { label: 'Pending',     value: pendingCount,    color: pendingCount > 0 ? '#d97706' : '#9ca3af' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</p>
              </div>
            ))}
            <span style={{ fontSize: '18px', color: '#9ca3af', marginLeft: '4px' }}>{collapsed ? '▶' : '▼'}</span>
          </div>
        </div>

      </div>

      {/* Week entries */}
      {!collapsed && (
        <div style={{ padding: '18px 24px 22px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '280px' }}>
              <BsSearch size={13} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={weekSearch} onChange={(e) => setWeekSearch(e.target.value)}
                placeholder="Search year, week, status…"
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BsArrowDownUp size={13} color="#6b7280" />
              <select value={weekSort} onChange={(e) => setWeekSort(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13.5px', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                {WEEK_SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>
              {sorted.length} entr{sorted.length !== 1 ? 'ies' : 'y'}
            </span>
            <button
              onClick={downloadPdf}
              style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <BsFilePdf size={14} /> Download PDF
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ height: '52px', borderRadius: '7px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
              ))}
              <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : error ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 14px', borderRadius: '8px', fontSize: '14px' }}>{error}</div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px', background: '#f9fafb', borderRadius: '10px' }}>
              {weekSearch ? 'No entries match your search.' : 'No weekly plans set for this project yet.'}
            </div>
          ) : (
            <div ref={printRef} style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                <thead>
                  <tr>
                    {['Year', 'Week', 'Wk Cap (h)', 'Planned (h)', 'Actual (h)', 'Leave (h)', 'Training (h)', 'Status', 'Action'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry, i) => {
                    const key       = `${entry.year}-${entry.weekNumber}`;
                    const isEditing = editKey === key;
                    return (
                      <React.Fragment key={key}>
                        <tr style={{ background: isEditing ? '#f0f7ff' : i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.1s' }}>
                          <td style={{ ...tdStyle, fontWeight: 700, fontSize: '15px' }}>{entry.year}</td>
                          <td style={tdStyle}>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                              Wk {entry.weekNumber}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#1d4ed8', fontSize: '15px' }}>
                            {entry.totalWeeklyHours > 0 ? entry.totalWeeklyHours : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#7c3aed', fontSize: '15px' }}>
                            {entry.plannedHours > 0 ? entry.plannedHours : <span style={{ color: '#d1d5db', fontWeight: 400 }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#1d4ed8', fontSize: '15px' }}>
                            {entry.workedHours != null ? entry.workedHours : <span style={{ color: '#d1d5db', fontWeight: 400 }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, color: '#6d28d9', fontSize: '15px' }}>
                            {entry.leaveHours != null ? entry.leaveHours : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, color: '#2563eb', fontSize: '15px' }}>
                            {entry.trainingHours != null ? entry.trainingHours : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={tdStyle}>
                            {entry.status ? <StatusBadge status={entry.status} /> : <span style={{ color: '#d1d5db', fontSize: '13px' }}>Not submitted</span>}
                          </td>
                          <td style={tdStyle}>
                            {entry.status !== 'submitted' && (
                              <button
                                onClick={() => setEditKey(isEditing ? null : key)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                  border:     isEditing ? '1.5px solid #fca5a5' : 'none',
                                  background: isEditing ? '#fef2f2' : `linear-gradient(135deg,${palette.accent} 80%,${palette.accent}cc)`,
                                  color:      isEditing ? '#dc2626' : '#fff',
                                  boxShadow:  isEditing ? 'none' : '0 2px 8px rgba(0,0,0,0.14)',
                                }}
                              >
                                {isEditing ? <><BsX size={15} /> Close</> : <><BsPlusCircle size={13} /> Fill Data</>}
                              </button>
                            )}
                          </td>
                        </tr>

                        {isEditing && (
                          <tr>
                            <td colSpan={10} style={{ padding: '0 14px 4px', borderBottom: '1px solid #e5e7eb', background: '#f8faff' }}>
                              <InlineEditForm
                                entry={entry}
                                projectId={project.project._id}
                                onSave={async () => { setEditKey(null); await fetchEntries(); onLogSubmitted?.(); }}
                                onCancel={() => setEditKey(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main component
const EmployeeWeeklySubmit = ({ refreshKey = 0, onLogSubmitted }) => {
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [projSearch, setProjSearch] = useState('');
  const [projSort,   setProjSort]   = useState('name-asc');

  const fetchProjects = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(SummaryApi.getEmployeeProjects.url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setProjects(data.data);
      else setError(data.message || 'Failed to load projects');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filteredProjects = sortProjects(
    projects.filter((p) => {
      if (!projSearch) return true;
      const q = projSearch.toLowerCase();
      return (
        p.project?.projectName?.toLowerCase().includes(q) ||
        p.project?.projectCode?.toLowerCase().includes(q) ||
        p.department?.toLowerCase().includes(q)
      );
    }),
    projSort,
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '26px' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '13px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', flexShrink: 0 }}>
          <BsClipboardCheck size={24} color="#fff" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0e1e3d' }}>Log My Weekly Hours</h3>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
            View assigned plans · submit actual, leave &amp; training hours each week
          </p>
        </div>
      </div>

      {/* Search + sort */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '22px', padding: '16px 20px', background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '12px' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '380px' }}>
          <BsSearch size={14} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={projSearch} onChange={(e) => setProjSearch(e.target.value)}
            placeholder="Search project name, code or department…"
            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BsArrowDownUp size={14} color="#6b7280" />
          <select value={projSort} onChange={(e) => setProjSort(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', background: '#fff', cursor: 'pointer' }}>
            {PROJECT_SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <span style={{ fontSize: '13.5px', color: '#9ca3af', marginLeft: 'auto' }}>
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '14px 18px', borderRadius: '9px', fontSize: '14px', marginBottom: '18px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ height: '140px', borderRadius: '16px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 40px', background: '#f9fafb', borderRadius: '16px', border: '1.5px dashed #e5e7eb' }}>
          <BsFolderFill size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '17px', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No projects found</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            {projSearch ? 'Try a different search term.' : 'Your manager will allocate you to projects.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredProjects.map((p, idx) => <ProjectCard key={p.allocationId} project={p} paletteIdx={idx} refreshKey={refreshKey} onLogSubmitted={onLogSubmitted} />)}
        </div>
      )}
    </div>
  );
};

export default EmployeeWeeklySubmit;
