import React, { useState, useEffect, useCallback } from 'react';
import {
  BsClipboardCheck, BsSearch, BsPencil, BsPlusCircle,
  BsCheckCircle, BsFolderFill, BsX, BsClock, BsExclamationTriangle,
  BsArrowDownUp,
} from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

const countWords = (t) => (t.trim() === '' ? 0 : t.trim().split(/\s+/).length);
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Merge weekly plans + work logs keyed by year-weekNumber
function mergeEntries(plans, logs) {
  const map = {};
  plans.forEach((p) => {
    const key = `${p.year}-${p.weekNumber}`;
    map[key] = {
      year: p.year, weekNumber: p.weekNumber,
      plannedHours: p.plannedHours || 0,
      totalWeeklyHours: p.totalWeeklyHours || 0,
      workedHours: null, leaveHours: null, trainingHours: null,
      remarks: '', status: null, logId: null,
    };
  });
  logs.forEach((l) => {
    const key = `${l.year}-${l.weekNumber}`;
    if (!map[key]) {
      map[key] = { year: l.year, weekNumber: l.weekNumber, plannedHours: l.plannedHours || 0, totalWeeklyHours: l.totalWeeklyHours || 0 };
    }
    map[key].workedHours   = l.workedHours   ?? null;
    map[key].leaveHours    = l.leaveHours    ?? null;
    map[key].trainingHours = l.trainingHours ?? null;
    map[key].remarks       = l.remarks || '';
    map[key].status        = l.status || null;
    map[key].logId         = l._id;
    if (l.totalWeeklyHours) map[key].totalWeeklyHours = l.totalWeeklyHours;
    if (l.plannedHours)     map[key].plannedHours     = l.plannedHours;
  });
  return Object.values(map).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.weekNumber - b.weekNumber
  );
}

const WEEK_SORTS = [
  { value: 'yr-wk-asc',    label: 'Year ↑ · Week ↑ (default)' },
  { value: 'yr-wk-desc',   label: 'Year ↓ · Week ↓' },
  { value: 'plan-desc',    label: 'Planned Hrs ↓' },
  { value: 'plan-asc',     label: 'Planned Hrs ↑' },
  { value: 'actual-desc',  label: 'Actual Hrs ↓' },
  { value: 'status',       label: 'Status' },
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

const StatusBadge = ({ status }) => {
  if (status === 'submitted') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 700 }}>
        <BsCheckCircle size={10} /> Submitted
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 700 }}>
      <BsClock size={10} /> Pending
    </span>
  );
};

// ── Inline edit / fill form ────────────────────────────────────────────────
const InlineEditForm = ({ entry, projectId, onSave, onCancel }) => {
  const [form, setForm] = useState({
    workedHours:   entry.workedHours   != null ? String(entry.workedHours)   : '',
    leaveHours:    entry.leaveHours    != null ? String(entry.leaveHours)    : '',
    trainingHours: entry.trainingHours != null ? String(entry.trainingHours) : '',
    remarks:       entry.remarks || '',
    justification: '',
  });
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const validate = () => {
    const e       = {};
    const worked   = Number(form.workedHours   || 0);
    const training = Number(form.trainingHours || 0);
    const leave    = Number(form.leaveHours    || 0);
    if (worked < 0 || training < 0 || leave < 0) e.workedHours = 'Hours cannot be negative';
    if (entry.plannedHours > 0 && worked > entry.plannedHours)
      e.workedHours = `Cannot exceed planned hours (${entry.plannedHours}h)`;
    if (entry.status === 'submitted' && !form.justification.trim())
      e.justification = 'Justification is required to update a submitted log';
    if (form.justification && countWords(form.justification) > 100)
      e.justification = 'Maximum 100 words';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true); setSaveMsg(null);
    try {
      const res  = await fetch(SummaryApi.submitWorkLog.url, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          year:          entry.year,
          weekNumber:    entry.weekNumber,
          workedHours:   Number(form.workedHours   || 0),
          leaveHours:    Number(form.leaveHours    || 0),
          trainingHours: Number(form.trainingHours || 0),
          remarks:       form.remarks   || undefined,
          justification: form.justification || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) { onSave(); }
      else { setSaveMsg(data.message || 'Failed to save'); }
    } catch { setSaveMsg('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const fieldStyle = (key) => ({
    width: '100%', padding: '9px 11px', borderRadius: '8px', fontSize: '13px', outline: 'none',
    border: `1.5px solid ${errors[key] ? '#f87171' : '#e2e8f0'}`,
    background: errors[key] ? '#fff5f5' : '#fff',
    boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
  });

  return (
    <div style={{ background: 'linear-gradient(135deg,#f0f7ff,#f5f3ff)', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '20px 22px', margin: '4px 0 8px' }}>
      {/* Form header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BsClipboardCheck size={16} color="#1d4ed8" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#0e1e3d' }}>
            {entry.status === 'submitted' ? 'Update' : 'Fill'} Hours — Year {entry.year} · Week {entry.weekNumber}
          </p>
          <p style={{ margin: '1px 0 0', fontSize: '11.5px', color: '#6b7280' }}>
            {entry.plannedHours > 0 ? `Planned: ${entry.plannedHours}h` : 'No plan set'} · {entry.totalWeeklyHours > 0 ? `Total weekly budget: ${entry.totalWeeklyHours}h` : ''}
          </p>
        </div>
        {entry.status === 'submitted' && (
          <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '10px', fontWeight: 600 }}>
            Editing submitted log — justification required
          </span>
        )}
      </div>

      {/* Hour inputs row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '14px' }}>
        {[
          { key: 'workedHours',   label: 'Actual / Worked Hours', emoji: '⏱️', hint: entry.plannedHours > 0 ? `max ${entry.plannedHours}h` : '' },
          { key: 'leaveHours',    label: 'Leave Hours',            emoji: '🌴', hint: '' },
          { key: 'trainingHours', label: 'Training Hours',         emoji: '📚', hint: '' },
        ].map(({ key, label, emoji, hint }) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
              {emoji} {label}
              {hint && <span style={{ fontSize: '10.5px', color: '#9ca3af', marginLeft: '5px' }}>({hint})</span>}
            </label>
            <input
              type="number" min="0"
              value={form[key]} placeholder="0"
              onChange={(e) => { setForm((p) => ({ ...p, [key]: e.target.value })); setErrors((p) => ({ ...p, [key]: '' })); }}
              style={fieldStyle(key)}
            />
            {key === 'workedHours' && errors.workedHours && (
              <p style={{ color: '#ef4444', fontSize: '11px', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <BsExclamationTriangle size={10} /> {errors.workedHours}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Remarks */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
          💬 Remarks / Comments <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
        </label>
        <textarea
          value={form.remarks} rows={2} placeholder="Any notes or comments for this week…"
          onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
          style={{ ...fieldStyle('remarks'), resize: 'vertical', minHeight: '54px' }}
        />
      </div>

      {/* Justification (only when editing a submitted log) */}
      {entry.status === 'submitted' && (
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
            Justification <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={form.justification} rows={2} placeholder="Reason for updating this log…"
            onChange={(e) => { setForm((p) => ({ ...p, justification: e.target.value })); setErrors((p) => ({ ...p, justification: '' })); }}
            style={{ ...fieldStyle('justification'), resize: 'vertical', minHeight: '54px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
            {errors.justification
              ? <p style={{ color: '#ef4444', fontSize: '11px', margin: 0 }}>{errors.justification}</p>
              : <span />}
            <p style={{ fontSize: '11px', margin: 0, color: countWords(form.justification) > 100 ? '#ef4444' : '#9ca3af' }}>
              {countWords(form.justification)}/100 words
            </p>
          </div>
        </div>
      )}

      {saveMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '9px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '12px' }}>
          {saveMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSubmit} disabled={saving}
          style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: saving ? '#93c5fd' : 'linear-gradient(135deg,#3b82f6 80%,#60a5fa)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          {saving ? 'Saving…' : entry.status === 'submitted' ? 'Update Log' : 'Submit Log'}
        </button>
        <button
          onClick={onCancel} disabled={saving}
          style={{ padding: '9px 18px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Per-project card ───────────────────────────────────────────────────────
const ProjectCard = ({ project }) => {
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [weekSearch, setWeekSearch] = useState('');
  const [weekSort,   setWeekSort]   = useState('yr-wk-asc');
  const [editKey,    setEditKey]    = useState(null); // 'year-weekNumber'
  const [collapsed,  setCollapsed]  = useState(false);

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

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filtered = entries.filter((e) => {
    if (!weekSearch) return true;
    const q = weekSearch.toLowerCase();
    return (
      String(e.year).includes(q) ||
      String(e.weekNumber).includes(q) ||
      (e.status || '').toLowerCase().includes(q)
    );
  });
  const sorted = applySortWeeks(filtered, weekSort);

  const submittedCount = entries.filter((e) => e.status === 'submitted').length;
  const pendingCount   = entries.length - submittedCount;
  const pct = project.totalAllocatedHours > 0
    ? Math.min(100, Math.round((project.consumedHours / project.totalAllocatedHours) * 100)) : 0;

  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '2px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '13px 14px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

      {/* ── Project header (click to collapse) ── */}
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{ padding: '18px 24px', background: 'linear-gradient(to right,#f8faff,#eef2ff)', cursor: 'pointer', borderBottom: collapsed ? 'none' : '1px solid #e5e7eb' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BsFolderFill size={19} color="#1d4ed8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                <span style={{ background: '#1d4ed8', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                  {project.project?.projectCode}
                </span>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0e1e3d' }}>{project.project?.projectName}</h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                {fmt(project.project?.startDate)} — {fmt(project.project?.endDate)} &nbsp;·&nbsp; {project.department}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Allocated',  value: `${project.totalAllocatedHours}h`, color: '#1d4ed8' },
              { label: 'Consumed',   value: `${project.consumedHours}h`,       color: '#16a34a' },
              { label: 'Remaining',  value: `${project.remainingHours}h`,      color: project.remainingHours <= 0 ? '#dc2626' : '#0891b2' },
              { label: 'Weeks',      value: entries.length,                    color: '#7c3aed' },
              { label: 'Submitted',  value: submittedCount,                    color: '#16a34a' },
              { label: 'Pending',    value: pendingCount,                      color: pendingCount > 0 ? '#d97706' : '#9ca3af' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 1px', fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: s.color }}>{s.value}</p>
              </div>
            ))}
            <span style={{ fontSize: '16px', color: '#9ca3af', marginLeft: '4px' }}>{collapsed ? '▶' : '▼'}</span>
          </div>
        </div>

        {/* Progress bar */}
        {!collapsed && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Overall project progress</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: pct >= 100 ? '#dc2626' : '#1d4ed8' }}>{pct}%</span>
            </div>
            <div style={{ height: '5px', borderRadius: '3px', background: '#e5e7eb', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#dc2626' : '#1d4ed8', borderRadius: '3px', transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Week entries ── */}
      {!collapsed && (
        <div style={{ padding: '16px 22px 20px' }}>

          {/* Search + sort for weeks */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '280px' }}>
              <BsSearch size={12} color="#9ca3af" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={weekSearch} onChange={(e) => setWeekSearch(e.target.value)}
                placeholder="Search year, week, status…"
                style={{ width: '100%', padding: '7px 10px 7px 28px', borderRadius: '7px', border: '1.5px solid #e5e7eb', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BsArrowDownUp size={12} color="#6b7280" />
              <select
                value={weekSort} onChange={(e) => setWeekSort(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '7px', border: '1.5px solid #e5e7eb', fontSize: '12.5px', outline: 'none', background: '#fff', cursor: 'pointer' }}
              >
                {WEEK_SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>
              {sorted.length} entr{sorted.length !== 1 ? 'ies' : 'y'}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ height: '48px', borderRadius: '7px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
              ))}
              <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : error ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '13px', background: '#f9fafb', borderRadius: '10px' }}>
              {weekSearch ? 'No entries match your search.' : 'No weekly plans set for this project yet. Your manager will add them.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
                <thead>
                  <tr>
                    {['Year', 'Week', 'Total Wk Hrs', 'Planned Hrs', 'Actual Hrs', 'Leave Hrs', 'Training Hrs', 'Remarks', 'Status', 'Action'].map((h) => (
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
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{entry.year}</td>
                          <td style={tdStyle}>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                              Wk {entry.weekNumber}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#1d4ed8' }}>
                            {entry.totalWeeklyHours > 0 ? `${entry.totalWeeklyHours}h` : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#7c3aed' }}>
                            {entry.plannedHours > 0 ? `${entry.plannedHours}h` : <span style={{ color: '#d1d5db', fontWeight: 400 }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#16a34a' }}>
                            {entry.workedHours != null ? `${entry.workedHours}h` : <span style={{ color: '#d1d5db', fontWeight: 400 }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, color: '#9333ea' }}>
                            {entry.leaveHours != null ? `${entry.leaveHours}h` : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, color: '#d97706' }}>
                            {entry.trainingHours != null ? `${entry.trainingHours}h` : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, color: '#6b7280', maxWidth: '150px' }}>
                            {entry.remarks
                              ? <span title={entry.remarks}>{entry.remarks.length > 32 ? entry.remarks.slice(0, 32) + '…' : entry.remarks}</span>
                              : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={tdStyle}>
                            {entry.status ? <StatusBadge status={entry.status} /> : <span style={{ color: '#d1d5db', fontSize: '12px' }}>Not submitted</span>}
                          </td>
                          <td style={tdStyle}>
                            <button
                              onClick={() => setEditKey(isEditing ? null : key)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                border:      isEditing ? '1.5px solid #fca5a5' : entry.status === 'submitted' ? '1.5px solid #bfdbfe' : 'none',
                                background:  isEditing ? '#fef2f2' : entry.status === 'submitted' ? '#eff6ff' : 'linear-gradient(135deg,#3b82f6 80%,#60a5fa)',
                                color:       isEditing ? '#dc2626'  : entry.status === 'submitted' ? '#1d4ed8'  : '#fff',
                                boxShadow:   isEditing || entry.status === 'submitted' ? 'none' : '0 2px 8px rgba(0,0,0,0.12)',
                                transition:  'all 0.15s',
                              }}
                            >
                              {isEditing
                                ? <><BsX size={14} /> Close</>
                                : entry.status === 'submitted'
                                  ? <><BsPencil size={12} /> Edit</>
                                  : <><BsPlusCircle size={12} /> Fill</>}
                            </button>
                          </td>
                        </tr>

                        {/* Inline edit form row */}
                        {isEditing && (
                          <tr>
                            <td colSpan={10} style={{ padding: '0 14px 4px', borderBottom: '1px solid #e5e7eb', background: '#f8faff' }}>
                              <InlineEditForm
                                entry={entry}
                                projectId={project.project._id}
                                onSave={async () => { setEditKey(null); await fetchEntries(); }}
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

// ── Main component ─────────────────────────────────────────────────────────
const EmployeeWeeklySubmit = () => {
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [projSearch,  setProjSearch]  = useState('');
  const [projSort,    setProjSort]    = useState('name-asc');

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

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', flexShrink: 0 }}>
          <BsClipboardCheck size={22} color="#fff" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0e1e3d' }}>Log My Weekly Hours</h3>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6b7280' }}>
            View your assigned plans and fill in actual, leave &amp; training hours for each week
          </p>
        </div>
      </div>

      {/* ── Project-level search + sort ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px', padding: '14px 18px', background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '10px' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '360px' }}>
          <BsSearch size={13} color="#9ca3af" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={projSearch} onChange={(e) => setProjSearch(e.target.value)}
            placeholder="Search project name, code or department…"
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BsArrowDownUp size={13} color="#6b7280" />
          <select
            value={projSort} onChange={(e) => setProjSort(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', background: '#fff', cursor: 'pointer' }}
          >
            {PROJECT_SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <span style={{ fontSize: '12.5px', color: '#9ca3af', marginLeft: 'auto' }}>
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ height: '130px', borderRadius: '14px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 40px', background: '#f9fafb', borderRadius: '14px', border: '1.5px dashed #e5e7eb' }}>
          <BsFolderFill size={44} color="#d1d5db" style={{ marginBottom: '14px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No projects found</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            {projSearch ? 'Try a different search term.' : 'Your manager will allocate you to projects.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredProjects.map((p) => <ProjectCard key={p.allocationId} project={p} />)}
        </div>
      )}
    </div>
  );
};

export default EmployeeWeeklySubmit;
