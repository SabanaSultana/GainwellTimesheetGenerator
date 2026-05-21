import React, { useState, useEffect, useCallback } from 'react';
import {
  BsPeopleFill, BsArrowClockwise, BsChevronDown, BsChevronUp,
  BsFolderFill, BsPencilSquare, BsSearch,
} from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

// ── Palettes ──────────────────────────────────────────────────────────────────

const EMP_PALETTES = [
  { accent: '#4b5563', light: '#f9fafb', border: '#e5e7eb', badge: '#f3f4f6', bar: '#6b7280', headerBg: '#f3f4f6', headerText: '#1f2937', headerSub: '#6b7280', statBg: 'rgba(75,85,99,0.08)', statText: '#374151' },
  { accent: '#6b7280', light: '#f9fafb', border: '#e5e7eb', badge: '#f3f4f6', bar: '#9ca3af', headerBg: '#f1f5f9', headerText: '#1f2937', headerSub: '#6b7280', statBg: 'rgba(100,116,139,0.08)', statText: '#374151' },
  { accent: '#4b5563', light: '#f9fafb', border: '#e5e7eb', badge: '#f3f4f6', bar: '#6b7280', headerBg: '#f3f4f6', headerText: '#1f2937', headerSub: '#6b7280', statBg: 'rgba(75,85,99,0.08)', statText: '#374151' },
  { accent: '#6b7280', light: '#f9fafb', border: '#e5e7eb', badge: '#f3f4f6', bar: '#9ca3af', headerBg: '#f1f5f9', headerText: '#1f2937', headerSub: '#6b7280', statBg: 'rgba(100,116,139,0.08)', statText: '#374151' },
];

const TYPE_CFG = {
  actual:   { label: 'Actual',   color: '#d97706', bg: '#fffbeb' },
  leave:    { label: 'Leave',    color: '#9333ea', bg: '#faf5ff' },
  training: { label: 'Training', color: '#ea580c', bg: '#fff7ed' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusBadge = (logStatus) => {
  const map = {
    submitted:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Submitted'  },
    'not submitted':{ bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Pending'    },
    draft:          { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb', label: 'Draft'      },
  };
  const s = map[logStatus] || map['not submitted'];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '2px 9px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

// ── Edit Modal ────────────────────────────────────────────────────────────────

const EditModal = ({ modal, editVal, setEditVal, editJustify, setEditJustify, saving, saveError, onSave, onClose }) => {
  const cfg = TYPE_CFG[modal.type];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '28px 32px', width: '380px', boxShadow: '0 24px 72px rgba(0,0,0,0.22)', border: `2px solid ${cfg.bg}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <BsPencilSquare size={18} color={cfg.color} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0e1e3d' }}>Edit {cfg.label} Hours</h3>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280' }}>
          <strong>{modal.empName}</strong> · Week {modal.weekNumber} ({modal.year})
        </p>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {cfg.label} Hours
          </label>
          <input
            type="number" min="0" step="0.5"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: '10px 13px', borderRadius: '8px', border: `1.5px solid ${cfg.bg}`, outline: 'none', fontSize: '15px', fontWeight: 700, color: cfg.color, boxSizing: 'border-box', background: cfg.bg }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Justification <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            value={editJustify}
            onChange={(e) => setEditJustify(e.target.value)}
            placeholder="Reason for this update…"
            rows={3}
            style={{ width: '100%', padding: '10px 13px', borderRadius: '8px', border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        {saveError && (
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5' }}>{saveError}</p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '9px 20px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: cfg.color, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Project Card ──────────────────────────────────────────────────────────────

const ProjectCard = ({ project, plans, empId, empName, palette, onEditSave }) => {
  const [expanded,  setExpanded]  = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editVal,   setEditVal]   = useState('');
  const [editJust,  setEditJust]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');
  const [localOvr,  setLocalOvr]  = useState({});

  const sorted = [...plans].sort((a, b) => a.year !== b.year ? a.year - b.year : a.weekNumber - b.weekNumber);

  const getVal = (type, plan) => {
    const k = `${plan.year}-${plan.weekNumber}`;
    if (localOvr[k]?.[type] !== undefined) return localOvr[k][type];
    return type === 'actual' ? plan.workedHours : type === 'leave' ? plan.leaveHours : plan.trainingHours;
  };

  const totalPlanned   = plans.reduce((s, p) => s + (p.plannedHours || 0), 0);
  const totalActual    = plans.reduce((s, p) => s + (getVal('actual', p) || 0), 0);
  const submittedWeeks = plans.filter((p) => p.logStatus === 'submitted').length;
  const pendingWeeks   = plans.length - submittedWeeks;

  const openEdit = (plan, type) => {
    const cur = getVal(type, plan);
    setEditModal({ plan, type, empName, weekNumber: plan.weekNumber, year: plan.year });
    setEditVal(String(cur ?? 0));
    setEditJust('');
    setSaveErr('');
  };

  const handleSave = async () => {
    if (!editJust.trim()) { setSaveErr('Justification is required.'); return; }
    const newVal = Math.max(0, Number(editVal) || 0);
    const { plan, type } = editModal;
    const k = `${plan.year}-${plan.weekNumber}`;
    const curActual   = getVal('actual',   plan) ?? 0;
    const curLeave    = getVal('leave',    plan) ?? 0;
    const curTraining = getVal('training', plan) ?? 0;

    setSaving(true); setSaveErr('');
    try {
      const res = await fetch(SummaryApi.managerUpdateWorkLog.url, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId:      project._id,
          employeeUserId: empId,
          year:           plan.year,
          weekNumber:     plan.weekNumber,
          workedHours:    type === 'actual'   ? newVal : curActual,
          leaveHours:     type === 'leave'    ? newVal : curLeave,
          trainingHours:  type === 'training' ? newVal : curTraining,
          justification:  editJust.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) { setSaveErr(data.message || 'Save failed'); setSaving(false); return; }

      setLocalOvr((prev) => ({
        ...prev,
        [k]: {
          actual:   type === 'actual'   ? newVal : curActual,
          leave:    type === 'leave'    ? newVal : curLeave,
          training: type === 'training' ? newVal : curTraining,
        },
      }));
      setEditModal(null);
      if (onEditSave) onEditSave();
    } catch { setSaveErr('Network error'); }
    finally { setSaving(false); }
  };

  const thStyle = { padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: palette.accent, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: `2px solid ${palette.border}`, background: palette.light, whiteSpace: 'nowrap', textAlign: 'left' };
  const tdStyle = { padding: '9px 12px', fontSize: '13.5px', color: '#374151', borderBottom: `1px solid ${palette.border}`, verticalAlign: 'middle' };

  const editableCell = (type, plan) => {
    const val = getVal(type, plan);
    const cfg = TYPE_CFG[type];
    return (
      <td
        title="Click to edit"
        onClick={() => openEdit(plan, type)}
        style={{
          ...tdStyle, cursor: 'pointer', color: val > 0 ? cfg.color : '#d1d5db',
          fontWeight: val > 0 ? 700 : 400, background: val > 0 ? cfg.bg : 'transparent',
          transition: 'filter 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.92)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {val > 0 ? val : '—'}
          <BsPencilSquare size={9} style={{ opacity: 0.45 }} />
        </span>
      </td>
    );
  };

  return (
    <>
      {editModal && (
        <EditModal
          modal={editModal}
          editVal={editVal}       setEditVal={setEditVal}
          editJustify={editJust}  setEditJustify={setEditJust}
          saving={saving}         saveError={saveErr}
          onSave={handleSave}
          onClose={() => setEditModal(null)}
        />
      )}

      <div style={{ background: '#fff', border: `1.5px solid ${palette.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
        {/* Card header */}
        <div style={{ padding: '14px 18px', background: palette.light }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <BsFolderFill size={14} color={palette.accent} />
              <span style={{ background: palette.badge, color: palette.accent, padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>{project?.projectCode}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0e1e3d', wordBreak: 'break-word' }}>{project?.projectName}</span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Planned (h)',  value: totalPlanned,   color: '#1d4ed8' },
                { label: 'Actual (h)',   value: totalActual,    color: '#16a34a' },
                { label: 'Weeks',        value: plans.length,   color: '#374151' },
                { label: 'Submitted',    value: submittedWeeks, color: '#16a34a' },
                { label: 'Pending',      value: pendingWeeks,   color: pendingWeeks > 0 ? '#d97706' : '#9ca3af' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center', padding: '5px 10px', background: '#fff', borderRadius: '8px', border: `1px solid ${palette.border}`, minWidth: '70px' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}

              <button
                onClick={() => setExpanded((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '7px', border: `1.5px solid ${palette.border}`, background: expanded ? palette.badge : '#fff', color: palette.accent, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                {expanded ? <BsChevronUp size={11} /> : <BsChevronDown size={11} />}
                {expanded ? 'Hide' : 'View Weeks'}
              </button>
            </div>
          </div>
        </div>

        {/* Weekly table */}
        {expanded && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
              <thead>
                <tr>
                  {['Year', 'Week No.', 'Wk Cap (h)', 'Planned (h)', 'Actual (h)', 'Leave (h)', 'Training (h)', 'Status'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((plan, i) => (
                  <tr key={`${plan.year}-${plan.weekNumber}`} style={{ background: i % 2 === 0 ? '#fff' : palette.light }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{plan.year}</td>
                    <td style={tdStyle}>
                      <span style={{ background: palette.badge, color: palette.accent, padding: '2px 9px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                        Wk {plan.weekNumber}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#0284c7', fontWeight: 600 }}>{plan.totalWeeklyHours > 0 ? plan.totalWeeklyHours : '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#7c3aed' }}>{plan.plannedHours || 0}</td>
                    {editableCell('actual',   plan)}
                    {editableCell('leave',    plan)}
                    {editableCell('training', plan)}
                    <td style={tdStyle}>{statusBadge(plan.logStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

// ── Employee Section ──────────────────────────────────────────────────────────

const EmployeeSection = ({ employee, projectGroups, palette, idx, onEditSave }) => {
  const [open, setOpen] = useState(true);

  const projectList = Object.values(projectGroups);
  const totalPlanned = projectList.reduce((s, pg) => s + pg.plans.reduce((a, p) => a + (p.plannedHours || 0), 0), 0);
  const totalWeeks   = projectList.reduce((s, pg) => s + pg.plans.length, 0);
  const submitted    = projectList.reduce((s, pg) => s + pg.plans.filter((p) => p.logStatus === 'submitted').length, 0);
  const pending      = totalWeeks - submitted;

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Employee header */}
      <div
        style={{
          background: palette.headerBg,
          border: `1.5px solid ${palette.border}`,
          borderRadius: '12px 12px 0 0', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '10px', cursor: 'pointer',
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: palette.statBg, border: `1.5px solid ${palette.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: palette.headerText, flexShrink: 0 }}>
            {(employee?.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d4ed8' }}>{employee?.name || 'Unknown'}</div>
            <div style={{ fontSize: '12px', color: palette.headerSub, fontWeight: 500 }}>
              {employee?.employeeId} · {employee?.department}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Projects',   value: projectList.length },
            { label: 'Total Wks',  value: totalWeeks         },
            { label: 'Planned (h)',value: totalPlanned        },
            { label: 'Submitted',  value: submitted           },
            { label: 'Pending',    value: pending             },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center', background: palette.statBg, borderRadius: '8px', padding: '4px 12px', minWidth: '60px' }}>
              <div style={{ fontSize: '10px', color: palette.headerSub, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: palette.headerText }}>{s.value}</div>
            </div>
          ))}
          <div style={{ color: palette.headerText, opacity: 0.9 }}>{open ? <BsChevronUp size={16} /> : <BsChevronDown size={16} />}</div>
        </div>
      </div>

      {/* Employee's projects */}
      {open && (
        <div style={{ border: `1.5px solid ${palette.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '16px 16px 4px' }}>
          {projectList.map((pg) => (
            <ProjectCard
              key={pg.project?._id}
              project={pg.project}
              plans={pg.plans}
              empId={String(employee?._id)}
              empName={employee?.name || 'Unknown'}
              palette={palette}
              onEditSave={onEditSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Section ──────────────────────────────────────────────────────────────

const WeeklyReviewSection = () => {
  const [plans,       setPlans]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [empSearch,   setEmpSearch]   = useState('');
  const [projSearch,  setProjSearch]  = useState('');
  const [inputEmp,    setInputEmp]    = useState('');
  const [inputProj,   setInputProj]   = useState('');

  const fetchPlans = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (empSearch)  params.set('employeeName', empSearch);
      if (projSearch) params.set('projectName',  projSearch);
      const res  = await fetch(`${SummaryApi.getAllWeeklyPlans.url}?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setPlans(data.data);
      else setError(data.message || 'Failed to load weekly data');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, [empSearch, projSearch]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleSearch = () => {
    setEmpSearch(inputEmp.trim());
    setProjSearch(inputProj.trim());
  };
  const handleClearSearch = () => {
    setInputEmp(''); setInputProj('');
    setEmpSearch(''); setProjSearch('');
  };

  // Group by employee → project
  const empMap = {};
  plans.forEach((plan) => {
    const empId = String(plan.employee?._id || '');
    if (!empId) return;
    if (!empMap[empId]) empMap[empId] = { employee: plan.employee, projects: {} };
    const projId = String(plan.project?._id || '');
    if (!empMap[empId].projects[projId]) {
      empMap[empId].projects[projId] = { project: plan.project, plans: [] };
    }
    empMap[empId].projects[projId].plans.push(plan);
  });

  const employees = Object.values(empMap).sort((a, b) =>
    (a.employee?.name || '').localeCompare(b.employee?.name || '')
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79,70,229,0.3)', flexShrink: 0 }}>
            <BsPeopleFill size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0e1e3d' }}>Weekly Review</h3>
            <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#6b7280' }}>
              All employees' weekly hours · click Actual / Leave / Training to edit
            </p>
          </div>
        </div>
        <button
          onClick={fetchPlans}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          <BsArrowClockwise size={14} /> Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Filter</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '280px' }}>
            <BsSearch size={12} color="#9ca3af" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Employee name…"
              value={inputEmp}
              onChange={(e) => setInputEmp(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              style={{ width: '100%', padding: '9px 12px 9px 30px', borderRadius: '8px', border: '1.5px solid #ddd6fe', outline: 'none', fontSize: '13px', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '280px' }}>
            <BsSearch size={12} color="#9ca3af" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Project name or code…"
              value={inputProj}
              onChange={(e) => setInputProj(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              style={{ width: '100%', padding: '9px 12px 9px 30px', borderRadius: '8px', border: '1.5px solid #ddd6fe', outline: 'none', fontSize: '13px', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={handleSearch}
            style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            Search
          </button>
          {(inputEmp || inputProj) && (
            <button
              onClick={handleClearSearch}
              style={{ padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Summary bar ── */}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {[
            { label: 'Employees',  value: employees.length,                                                  color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Total Weeks',value: plans.length,                                                      color: '#1d4ed8', bg: '#eff6ff' },
            { label: 'Submitted',  value: plans.filter((p) => p.logStatus === 'submitted').length,           color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Pending',    value: plans.filter((p) => p.logStatus !== 'submitted').length,           color: '#d97706', bg: '#fffbeb' },
          ].map((s) => (
            <div key={s.label} style={{ padding: '10px 18px', background: s.bg, borderRadius: '10px', textAlign: 'center', minWidth: '90px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: '130px', borderRadius: '12px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '14px 18px', borderRadius: '10px', fontSize: '14px' }}>{error}</div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 40px', background: '#f9fafb', borderRadius: '14px', border: '1.5px dashed #e5e7eb' }}>
          <BsPeopleFill size={48} color="#d1d5db" style={{ display: 'block', margin: '0 auto 16px' }} />
          <p style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: '#374151' }}>No data found</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>Try adjusting your filters or adding weekly plans.</p>
        </div>
      ) : (
        employees.map((emp, idx) => (
          <EmployeeSection
            key={String(emp.employee?._id)}
            employee={emp.employee}
            projectGroups={emp.projects}
            palette={EMP_PALETTES[idx % EMP_PALETTES.length]}
            idx={idx}
            onEditSave={fetchPlans}
          />
        ))
      )}
    </div>
  );
};

export default WeeklyReviewSection;
