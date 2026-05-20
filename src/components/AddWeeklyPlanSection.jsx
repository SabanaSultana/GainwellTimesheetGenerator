import React, { useState, useEffect, useCallback } from 'react';
import {
  BsCalendarWeek, BsSearch, BsPencil, BsCheckCircle, BsExclamationTriangle,
  BsPlusCircle, BsChevronDown, BsChevronUp, BsArrowClockwise, BsFolderFill, BsXCircle,
} from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function buildYears(baseYear) {
  const cur = new Date().getFullYear();
  const set = new Set([baseYear - 1, baseYear, baseYear + 1, baseYear + 2, cur - 1, cur, cur + 1]);
  return [...set].sort((a, b) => a - b);
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getMonthDays(year, month) {
  const days = [];
  const last = new Date(year, month + 1, 0);
  for (let d = new Date(year, month, 1); d <= last; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  return days;
}

// ── CalendarWidget ─────────────────────────────────────────────────────────────
const CalendarWidget = ({ year, month, projectStartDate, selectedWeek, onSelectWeek }) => {
  const days = getMonthDays(year, month);
  const weekMap = {};
  days.forEach((d) => { const wk = getISOWeek(d); if (!weekMap[wk]) weekMap[wk] = []; weekMap[wk].push(d); });
  const projStart = projectStartDate ? new Date(projectStartDate) : null;

  return (
    <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0e1e3d', marginBottom: '10px' }}>
        {MONTHS[month]} {year} — Click a week to select
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7,1fr)', gap: '2px', fontSize: '11.5px' }}>
        <div style={{ color: '#9ca3af', fontWeight: 700, textAlign: 'center', padding: '4px' }}>Wk</div>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
          <div key={d} style={{ color: '#9ca3af', fontWeight: 700, textAlign: 'center', padding: '4px' }}>{d}</div>
        ))}
        {Object.entries(weekMap).map(([wk, wkDays]) => {
          const wkNum = Number(wk);
          const isSelected = selectedWeek === wkNum;
          const grid = Array(7).fill(null);
          wkDays.forEach((d) => { grid[(d.getDay() + 6) % 7] = d; });
          return (
            <React.Fragment key={wk}>
              <div
                onClick={() => onSelectWeek(wkNum)}
                style={{ background: isSelected ? '#1d4ed8' : '#eff6ff', color: isSelected ? '#fff' : '#1d4ed8', borderRadius: '8px', padding: '6px 4px', textAlign: 'center', fontWeight: 700, cursor: 'pointer', fontSize: '12px', border: isSelected ? '2px solid #1d4ed8' : '2px solid transparent', transition: 'all 0.15s' }}
              >
                {wkNum}
              </div>
              {grid.map((d, di) => {
                const isStart = d && projStart && d.getFullYear() === projStart.getFullYear() && d.getMonth() === projStart.getMonth() && d.getDate() === projStart.getDate();
                const isToday = d && (() => { const now = new Date(); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate(); })();
                return (
                  <div key={di} onClick={() => d && onSelectWeek(wkNum)} style={{ borderRadius: '6px', padding: '5px 4px', textAlign: 'center', cursor: d ? 'pointer' : 'default', background: isStart ? '#dcfce7' : isSelected ? '#eff6ff' : 'transparent', color: isStart ? '#16a34a' : isToday ? '#1d4ed8' : d ? '#374151' : 'transparent', fontWeight: isStart || isToday ? 700 : 400, border: isStart ? '1.5px solid #bbf7d0' : isToday ? '1.5px solid #bfdbfe' : '1.5px solid transparent', fontSize: '12px', transition: 'background 0.1s' }}>
                    {d ? d.getDate() : ''}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
      {projStart && (
        <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dcfce7', border: '1.5px solid #bbf7d0', display: 'inline-block' }} />
          Project Start: {projStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AddWeeklyPlanSection = () => {
  const [projects,          setProjects]          = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [plans,             setPlans]             = useState([]);
  const [plansLoading,      setPlansLoading]      = useState(false);
  const [showForm,          setShowForm]          = useState(true);
  const [tableSearch,       setTableSearch]       = useState('');
  const [sortBy,            setSortBy]            = useState('week');
  const [sortOrder,         setSortOrder]         = useState('asc');

  // Form state
  const [year,             setYear]             = useState(new Date().getFullYear());
  const [month,            setMonth]            = useState(new Date().getMonth());
  const [week,             setWeek]             = useState(null);
  const [existingConfig,   setExistingConfig]   = useState(null);
  const [checkingConfig,   setCheckingConfig]   = useState(false);
  const [teamMembers,      setTeamMembers]      = useState([]);
  const [loadingTeam,      setLoadingTeam]      = useState(false);
  const [teamSearch,       setTeamSearch]       = useState('');
  const [selectedEmployees,setSelectedEmployees]= useState([]);
  const [employeeHours,    setEmployeeHours]    = useState({});
  const [totalWeeklyHours, setTotalWeeklyHours] = useState('');
  const [justification,    setJustification]    = useState('');
  const [saving,           setSaving]           = useState(false);
  const [saveMsg,          setSaveMsg]          = useState(null);
  const [editTarget,       setEditTarget]       = useState(null);

  const selectedProject  = projects.find((p) => p._id === selectedProjectId);
  const projectStartYear = selectedProject?.startDate ? new Date(selectedProject.startDate).getFullYear() : new Date().getFullYear();
  const YEARS            = buildYears(projectStartYear);
  const weeklyHoursCap   = Number(totalWeeklyHours || 0);
  const overLimitIds     = selectedEmployees.filter((id) => Number(employeeHours[id] || 0) > weeklyHoursCap && weeklyHoursCap > 0);

  // Fetch projects
  useEffect(() => {
    fetch(SummaryApi.getProjects.url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.success) setProjects(data.data); });
  }, []);

  // Fetch team members once
  useEffect(() => {
    setLoadingTeam(true);
    fetch(SummaryApi.getTeamMembers.url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.success) setTeamMembers(data.data); })
      .finally(() => setLoadingTeam(false));
  }, []);

  // Fetch plan records when project changes
  const fetchPlans = useCallback(async () => {
    if (!selectedProjectId) { setPlans([]); return; }
    setPlansLoading(true);
    try {
      const res  = await fetch(`${SummaryApi.getWeeklyPlans.url}/${selectedProjectId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setPlans(data.data);
    } catch { /* silent */ }
    finally { setPlansLoading(false); }
  }, [selectedProjectId]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // Sync calendar to project start date when project changes
  useEffect(() => {
    if (!selectedProjectId || projects.length === 0) return;
    const proj = projects.find((p) => p._id === selectedProjectId);
    if (proj?.startDate) { const d = new Date(proj.startDate); setYear(d.getFullYear()); setMonth(d.getMonth()); }
    setWeek(null); setSelectedEmployees([]); setEmployeeHours({}); setSaveMsg(null);
  }, [selectedProjectId, projects]);

  // Check existing config for selected week
  const checkExistingConfig = useCallback(async () => {
    if (!selectedProjectId || !week) { setExistingConfig(null); return; }
    setCheckingConfig(true);
    try {
      const res  = await fetch(`${SummaryApi.getWeeklyProjectConfig.url}/${selectedProjectId}?year=${year}&weekNumber=${week}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setExistingConfig(data.data[0]);
        setTotalWeeklyHours(String(data.data[0].totalWeeklyHours));
      } else {
        setExistingConfig(null);
      }
    } catch { /* silent */ }
    finally { setCheckingConfig(false); }
  }, [selectedProjectId, year, week]);

  useEffect(() => { checkExistingConfig(); }, [checkExistingConfig]);

  const toggleEmployee = (empId) => setSelectedEmployees((prev) =>
    prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
  );

  const handleSave = async () => {
    if (!selectedProjectId) { setSaveMsg({ type: 'error', text: 'Select a project.' }); return; }
    if (!week)              { setSaveMsg({ type: 'error', text: 'Select a week from the calendar.' }); return; }
    if (!totalWeeklyHours)  { setSaveMsg({ type: 'error', text: 'Enter Total Weekly Hours.' }); return; }
    if (selectedEmployees.length === 0) { setSaveMsg({ type: 'error', text: 'Select at least one employee.' }); return; }
    if (overLimitIds.length > 0) {
      const names = overLimitIds.map((id) => teamMembers.find((m) => m._id === id)?.name || id).join(', ');
      setSaveMsg({ type: 'error', text: `These employees exceed the ${totalWeeklyHours}h weekly limit: ${names}.` });
      return;
    }
    setSaving(true); setSaveMsg(null);
    try {
      const res  = await fetch(SummaryApi.bulkUpsertWeeklyPlan.url, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId, year, weekNumber: week,
          totalWeeklyHours: Number(totalWeeklyHours),
          employees: selectedEmployees.map((id) => ({ employeeUserId: id, plannedHours: Number(employeeHours[id] || 0) })),
          justification: justification || `Bulk plan week ${week}/${year}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMsg({ type: data.configExists ? 'warning' : 'success', text: data.message });
        setJustification('');
        await Promise.all([checkExistingConfig(), fetchPlans()]);
      } else {
        setSaveMsg({ type: 'error', text: data.message || 'Failed to save plan' });
      }
    } catch { setSaveMsg({ type: 'error', text: 'Network error. Please try again.' }); }
    finally { setSaving(false); }
  };

  const handleInlineEdit = async (plan) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res  = await fetch(SummaryApi.bulkUpsertWeeklyPlan.url, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: plan.project?._id, year: plan.year, weekNumber: plan.weekNumber,
          totalWeeklyHours: plan.totalWeeklyHours || 0,
          employees: [{ employeeUserId: plan.employee?._id, plannedHours: Number(editTarget.plannedHours) }],
          justification: editTarget.justification || `Updated plan for week ${plan.weekNumber}/${plan.year}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMsg({ type: 'success', text: 'Planned hours updated.' });
        setEditTarget(null);
        await fetchPlans();
      } else {
        setSaveMsg({ type: 'error', text: data.message || 'Update failed' });
      }
    } catch { setSaveMsg({ type: 'error', text: 'Network error' }); }
    finally { setSaving(false); }
  };

  const handleClear = () => {
    setSelectedProjectId('');
    setPlans([]);
    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth());
    setWeek(null);
    setExistingConfig(null);
    setSelectedEmployees([]);
    setEmployeeHours({});
    setTotalWeeklyHours('');
    setJustification('');
    setSaveMsg(null);
    setEditTarget(null);
    setShowForm(true);
    setTableSearch('');
    setSortBy('week');
    setSortOrder('asc');
  };

  const SORT_OPTIONS = [
    { value: 'week',       label: 'Week (default)' },
    { value: 'employee',   label: 'Employee Name' },
    { value: 'year',       label: 'Year' },
    { value: 'plannedHrs', label: 'Planned Hours' },
    { value: 'status',     label: 'Status' },
  ];

  const sortedFilteredPlans = [...plans]
    .filter((p) => {
      if (!tableSearch) return true;
      const q = tableSearch.toLowerCase();
      return (
        p.employee?.name?.toLowerCase().includes(q) ||
        p.employeeId?.toLowerCase().includes(q) ||
        String(p.weekNumber).includes(q) ||
        String(p.year).includes(q)
      );
    })
    .sort((a, b) => {
      let va, vb;
      if (sortBy === 'week')       { va = a.year * 100 + a.weekNumber; vb = b.year * 100 + b.weekNumber; }
      else if (sortBy === 'year')  { va = a.year; vb = b.year; }
      else if (sortBy === 'employee') { va = (a.employee?.name || '').toLowerCase(); vb = (b.employee?.name || '').toLowerCase(); }
      else if (sortBy === 'plannedHrs') { va = a.plannedHours || 0; vb = b.plannedHours || 0; }
      else if (sortBy === 'status') { va = a.logStatus || ''; vb = b.logStatus || ''; }
      else { va = 0; vb = 0; }
      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder((o) => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const thStyle = { padding: '11px 15px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '11px 15px', fontSize: '13.5px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', flexShrink: 0 }}>
            <BsCalendarWeek size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0e1e3d' }}>Weekly Plan Manager</h3>
            <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Assign planned hours per employee per week · view the <strong>Plan vs Actual</strong> tab for the grid overview
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedProjectId && (
            <button onClick={fetchPlans} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
              <BsArrowClockwise size={13} /> Refresh
            </button>
          )}
          <button onClick={handleClear} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
            <BsXCircle size={13} /> Clear
          </button>
        </div>
      </div>

      {/* ── Project selector ── */}
      <div style={{ background: 'linear-gradient(135deg,#f0f7ff,#f5f3ff)', border: '1.5px solid #dde7ff', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Select Project to Plan
        </label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ flex: '1 1 320px', maxWidth: '480px', padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', outline: 'none', background: '#fff', color: '#0e1e3d', fontWeight: selectedProjectId ? 600 : 400, cursor: 'pointer' }}
          >
            <option value="">— Choose a project —</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.projectCode} — {p.projectName}</option>
            ))}
          </select>
          {selectedProject && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: 'Start', value: selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                { label: 'End',   value: selectedProject.endDate   ? new Date(selectedProject.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                { label: 'Records', value: plans.length > 0 ? `${plans.length}` : '0' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center', padding: '6px 12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0e1e3d', marginTop: '1px' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProjectId ? (
        <>
          {/* ── Add / Update Plans form (collapsible) ── */}
          <div style={{ border: '1.5px solid #dde7ff', borderRadius: '14px', marginBottom: '24px', overflow: 'hidden' }}>
            <button
              onClick={() => setShowForm((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: showForm ? 'linear-gradient(135deg,#eff6ff,#f5f3ff)' : '#f8faff', border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BsPlusCircle size={16} color="#4f46e5" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0e1e3d' }}>Add / Update Plans</span>
                <span style={{ fontSize: '12.5px', color: '#6b7280', fontWeight: 400 }}>
                  Assign planned hours to team members for a specific week
                </span>
              </div>
              {showForm ? <BsChevronUp size={14} color="#4f46e5" /> : <BsChevronDown size={14} color="#4f46e5" />}
            </button>

            {showForm && (
              <div style={{ padding: '22px 24px', borderTop: '1.5px solid #dde7ff', background: '#fff' }}>

                {saveMsg && (
                  <div style={{ background: saveMsg.type === 'success' ? '#f0fdf4' : saveMsg.type === 'warning' ? '#fffbeb' : '#fef2f2', border: `1px solid ${saveMsg.type === 'success' ? '#bbf7d0' : saveMsg.type === 'warning' ? '#fde68a' : '#fca5a5'}`, color: saveMsg.type === 'success' ? '#16a34a' : saveMsg.type === 'warning' ? '#92400e' : '#dc2626', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px', fontWeight: 500 }}>
                    {saveMsg.type === 'warning' && '⚠️ '}{saveMsg.type === 'success' && '✓ '}{saveMsg.text}
                  </div>
                )}

                {/* Year + Month */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px', maxWidth: '480px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>Step 1 — Year</label>
                    <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setWeek(null); }} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff' }}>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>Step 2 — Month</label>
                    <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setWeek(null); }} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff' }}>
                      {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {/* Calendar */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                    Step 3 — Select Week
                    {week
                      ? <span style={{ marginLeft: '8px', color: '#1d4ed8', background: '#eff6ff', padding: '2px 10px', borderRadius: '12px', fontSize: '11.5px' }}>Week {week} selected ✓</span>
                      : <span style={{ marginLeft: '8px', color: '#d97706', background: '#fffbeb', padding: '2px 10px', borderRadius: '12px', fontSize: '11.5px' }}>Click a week row to select</span>}
                  </label>
                  <CalendarWidget year={year} month={month} projectStartDate={selectedProject?.startDate} selectedWeek={week} onSelectWeek={(wk) => setWeek(wk)} />
                </div>

                {checkingConfig && <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Checking existing plan…</div>}
                {!checkingConfig && existingConfig && week && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BsExclamationTriangle size={14} />
                    Weekly plan already exists for Week {week} / {year}. Saving will update existing data.
                  </div>
                )}

                {/* Total weekly hours cap */}
                <div style={{ marginBottom: '16px', maxWidth: '300px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>
                    Step 4 — Weekly Hours Cap <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <p style={{ margin: '0 0 6px', fontSize: '11.5px', color: '#6b7280' }}>Maximum hours any single employee can be planned for this week.</p>
                  <input type="number" min="0" value={totalWeeklyHours} onChange={(e) => setTotalWeeklyHours(e.target.value)} placeholder="e.g. 40"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
                </div>

                {/* Employee list */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                      Step 5 — Select Employees &amp; Plan Hours
                      <span style={{ marginLeft: '8px', fontWeight: 400, color: '#9ca3af', fontSize: '11.5px' }}>{selectedEmployees.length > 0 ? `${selectedEmployees.length} selected` : 'Check to include'}</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <BsSearch size={12} color="#9ca3af" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} placeholder="Search employee…"
                        style={{ padding: '6px 10px 6px 28px', borderRadius: '7px', border: '1.5px solid #e5e7eb', fontSize: '12.5px', outline: 'none', width: '200px' }} />
                    </div>
                  </div>

                  {loadingTeam ? (
                    <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', fontSize: '13px', color: '#9ca3af' }}>Loading team members…</div>
                  ) : teamMembers.length === 0 ? (
                    <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', fontSize: '13px', color: '#9ca3af' }}>No team members found.</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <button type="button"
                          onClick={() => { const vis = teamMembers.filter((m) => { if (!teamSearch) return true; const q = teamSearch.toLowerCase(); return m.name?.toLowerCase().includes(q) || m.employeeId?.toLowerCase().includes(q); }); setSelectedEmployees((p) => [...new Set([...p, ...vis.map((m) => m._id)])]); }}
                          style={{ padding: '4px 12px', borderRadius: '6px', border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          Select All
                        </button>
                        <button type="button"
                          onClick={() => { setSelectedEmployees([]); setEmployeeHours({}); }}
                          style={{ padding: '4px 12px', borderRadius: '6px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          Clear
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                        {teamMembers
                          .filter((m) => { if (!teamSearch) return true; const q = teamSearch.toLowerCase(); return m.name?.toLowerCase().includes(q) || m.employeeId?.toLowerCase().includes(q) || m.department?.toLowerCase().includes(q); })
                          .map((m) => {
                            const empId = m._id, isSelected = selectedEmployees.includes(empId);
                            const empHrs = Number(employeeHours[empId] || 0);
                            const isOver = isSelected && weeklyHoursCap > 0 && empHrs > weeklyHoursCap;
                            return (
                              <div key={empId} onClick={() => toggleEmployee(empId)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', borderRadius: '10px', border: `1.5px solid ${isOver ? '#fca5a5' : isSelected ? '#bfdbfe' : '#e5e7eb'}`, background: isOver ? '#fff5f5' : isSelected ? '#f0f7ff' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                                <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ width: '16px', height: '16px', accentColor: '#1d4ed8', cursor: 'pointer', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, color: '#0e1e3d', fontSize: '13px' }}>{m.name}</div>
                                  <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>
                                    <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '1px 7px', borderRadius: '10px', fontWeight: 600, marginRight: '6px' }}>{m.employeeId}</span>
                                    {m.department}
                                  </div>
                                  {isOver && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><BsExclamationTriangle size={10} /> Exceeds {weeklyHoursCap}h weekly limit</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                                  <label style={{ fontSize: '12px', color: '#374151', whiteSpace: 'nowrap' }}>Planned Hrs:</label>
                                  <input type="number" min="0" max={weeklyHoursCap || undefined} value={employeeHours[empId] ?? ''} onChange={(e) => setEmployeeHours((p) => ({ ...p, [empId]: e.target.value }))} placeholder="0" disabled={!isSelected} onClick={(e) => e.stopPropagation()}
                                    style={{ width: '72px', padding: '6px 10px', borderRadius: '7px', border: `1.5px solid ${isOver ? '#fca5a5' : '#e2e8f0'}`, fontSize: '13px', outline: 'none', background: isSelected ? '#fff' : '#f9fafb', color: isOver ? '#dc2626' : isSelected ? '#374151' : '#9ca3af', cursor: isSelected ? 'text' : 'not-allowed', fontWeight: isOver ? 700 : 400 }} />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  )}

                  {selectedEmployees.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', background: overLimitIds.length > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${overLimitIds.length > 0 ? '#fca5a5' : '#bbf7d0'}`, color: overLimitIds.length > 0 ? '#dc2626' : '#16a34a' }}>
                      {overLimitIds.length > 0 ? <BsExclamationTriangle size={13} /> : <BsCheckCircle size={13} />}
                      {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                      {weeklyHoursCap > 0 && <span style={{ fontWeight: 400, marginLeft: '4px' }}>· max {weeklyHoursCap}h each{overLimitIds.length > 0 ? ` · ${overLimitIds.length} over limit` : ''}</span>}
                    </div>
                  )}
                </div>

                {/* Justification */}
                <div style={{ marginBottom: '18px', maxWidth: '480px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>
                    Justification / Notes <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
                  </label>
                  <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={2} placeholder="Reason for this plan…"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', resize: 'vertical', minHeight: '56px', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }} />
                </div>

                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: saving ? '#93c5fd' : 'linear-gradient(135deg,#3b82f6 80%,#60a5fa)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}>
                  {saving ? 'Saving…' : existingConfig ? '↺ Update Weekly Plan' : '✓ Save Weekly Plan'}
                </button>
              </div>
            )}
          </div>

          {/* ── Plan records table ── */}
          {plansLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...Array(4)].map((_, i) => <div key={i} style={{ height: '48px', borderRadius: '8px', background: '#f3f4f6' }} />)}
            </div>
          ) : plans.length > 0 && (
            <div>
              {/* Table header + search + sort */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto' }}>
                  <span style={{ width: '4px', height: '22px', background: 'linear-gradient(to bottom,#3b82f6,#6366f1)', borderRadius: '2px', flexShrink: 0 }} />
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>
                    Plan Records — {selectedProject?.projectCode}
                  </h4>
                  <span style={{ fontSize: '12.5px', color: '#9ca3af' }}>{plans.length} record{plans.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <BsSearch size={13} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={tableSearch} onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search records…"
                    style={{ padding: '7px 12px 7px 30px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', width: '200px' }}
                  />
                </div>

                {/* Sort controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>Sort by:</span>
                  <select
                    value={sortBy} onChange={(e) => { setSortBy(e.target.value); setSortOrder('asc'); }}
                    style={{ padding: '7px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff', cursor: 'pointer' }}
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button
                    onClick={() => setSortOrder((o) => o === 'asc' ? 'desc' : 'asc')}
                    style={{ padding: '7px 12px', borderRadius: '7px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    title="Toggle sort direction"
                  >
                    {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '920px' }}>
                  <thead>
                    <tr>
                      {['Employee','Year','Week','Planned Hrs','Actual Hrs','Leave Hrs','Training Hrs','Total Wk Cap','Status','Action'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFilteredPlans.map((plan, i) => {
                      const isEditing = editTarget?.planId === plan._id;
                      return (
                        <tr key={plan._id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#0e1e3d' }}>
                            {plan.employee?.name}
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{plan.employeeId}</div>
                          </td>
                          <td style={tdStyle}>{plan.year}</td>
                          <td style={tdStyle}>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>Wk {plan.weekNumber}</span>
                          </td>
                          <td style={tdStyle}>
                            {isEditing ? (
                              <input type="number" min="0" value={editTarget.plannedHours} onChange={(e) => setEditTarget((p) => ({ ...p, plannedHours: e.target.value }))}
                                style={{ width: '68px', padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #bfdbfe', fontSize: '13px', outline: 'none' }} />
                            ) : (
                              <span style={{ fontWeight: 700, color: '#7c3aed' }}>{plan.plannedHours}h</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 600 }}>{plan.workedHours > 0 ? `${plan.workedHours}h` : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td style={{ ...tdStyle, color: '#9333ea' }}>{plan.leaveHours > 0 ? `${plan.leaveHours}h` : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td style={{ ...tdStyle, color: '#d97706' }}>{plan.trainingHours > 0 ? `${plan.trainingHours}h` : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#0369a1' }}>{plan.totalWeeklyHours > 0 ? `${plan.totalWeeklyHours}h` : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td style={tdStyle}>
                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: plan.logStatus === 'submitted' ? '#dcfce7' : plan.plannedHours > 0 ? '#eff6ff' : '#f3f4f6', color: plan.logStatus === 'submitted' ? '#16a34a' : plan.plannedHours > 0 ? '#1d4ed8' : '#9ca3af' }}>
                              {plan.logStatus === 'submitted' ? 'Submitted' : plan.plannedHours > 0 ? 'Planned' : 'Not set'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <input value={editTarget.justification} onChange={(e) => setEditTarget((p) => ({ ...p, justification: e.target.value }))} placeholder="Reason…"
                                  style={{ width: '110px', padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #e2e8f0', fontSize: '11.5px', outline: 'none' }} />
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button onClick={() => handleInlineEdit(plan)} disabled={saving} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#1d4ed8', color: '#fff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                                  <button onClick={() => setEditTarget(null)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '11.5px', cursor: 'pointer' }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setEditTarget({ planId: plan._id, plannedHours: String(plan.plannedHours), justification: '' })}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 11px', borderRadius: '6px', border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                <BsPencil size={11} /> Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* No project selected */
        <div style={{ textAlign: 'center', padding: '64px 40px', background: '#f9fafb', borderRadius: '14px', border: '1.5px dashed #e5e7eb' }}>
          <BsFolderFill size={48} color="#d1d5db" style={{ display: 'block', margin: '0 auto 16px' }} />
          <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: '#374151' }}>Select a project to get started</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
            Choose a project above, then assign weekly hours to your team members.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddWeeklyPlanSection;
