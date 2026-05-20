import React, { useState, useEffect, useCallback } from 'react';
import { BsTable, BsFolderFill, BsArrowClockwise, BsXCircle } from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MONTH_PALETTE = [
  { bg: '#1e3a8a', text: '#fff', subBg: '#dbeafe', subText: '#1e40af' },
  { bg: '#065f46', text: '#fff', subBg: '#d1fae5', subText: '#065f46' },
];

function getDateOfISOWeek(year, week) {
  const jan4 = new Date(year, 0, 4);
  const startDay = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - startDay + 1);
  const result = new Date(firstMonday);
  result.setDate(firstMonday.getDate() + (week - 1) * 7);
  return result;
}

function buildGridData(plans) {
  const weekMap = {};
  plans.forEach((p) => {
    const key = `${p.year}-${p.weekNumber}`;
    if (!weekMap[key]) weekMap[key] = { year: p.year, weekNumber: p.weekNumber, totalWeeklyHours: 0 };
    if (p.totalWeeklyHours > 0) weekMap[key].totalWeeklyHours = p.totalWeeklyHours;
  });

  const allWeeks = Object.values(weekMap).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.weekNumber - b.weekNumber
  );

  const monthGroups = [];
  let curGroup = null;
  allWeeks.forEach((w) => {
    const monday = getDateOfISOWeek(w.year, w.weekNumber);
    const mIdx = monday.getMonth();
    const mYear = monday.getFullYear();
    const key = `${mYear}-${mIdx}`;
    if (!curGroup || curGroup.key !== key) {
      curGroup = { key, label: MONTH_SHORT[mIdx], year: mYear, colorIdx: monthGroups.length % 2, weeks: [] };
      monthGroups.push(curGroup);
    }
    curGroup.weeks.push(w);
  });

  const empMap = {};
  plans.forEach((p) => {
    const empId = String(p.employee?._id || p.employee);
    if (!empMap[empId]) empMap[empId] = { id: empId, name: p.employee?.name || 'Unknown', employeeId: p.employeeId || '' };
  });

  const planMap = {}, actualMap = {};
  plans.forEach((p) => {
    const empId = String(p.employee?._id || p.employee);
    const wKey = `${p.year}-${p.weekNumber}`;
    const k = `${empId}::${wKey}`;
    planMap[k] = p.plannedHours || 0;
    if (p.status != null) actualMap[k] = p.workedHours || 0;
  });

  const employees = Object.values(empMap).sort((a, b) => a.name.localeCompare(b.name));

  const empTotals = {};
  employees.forEach((emp) => {
    let planTotal = 0, actualTotal = 0;
    allWeeks.forEach((w) => {
      const k = `${emp.id}::${w.year}-${w.weekNumber}`;
      planTotal   += planMap[k] || 0;
      actualTotal += actualMap[k] != null ? actualMap[k] : 0;
    });
    empTotals[emp.id] = { plan: planTotal, actual: actualTotal };
  });

  return { allWeeks, monthGroups, employees, planMap, actualMap, weekMap, empTotals };
}

// ── Grid ──────────────────────────────────────────────────────────────────────

const WeeklyGrid = ({ plans, project }) => {
  if (!plans || plans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 32px', background: '#f9fafb', borderRadius: '12px', border: '1.5px dashed #e5e7eb' }}>
        <BsTable size={36} color="#d1d5db" style={{ display: 'block', margin: '0 auto 12px' }} />
        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>No weekly plans yet for this project</p>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Plans assigned in "Add Weekly Plan" will appear here.</p>
      </div>
    );
  }

  const { allWeeks, monthGroups, employees, planMap, actualMap, weekMap, empTotals } = buildGridData(plans);

  const CW_NAME = 172, CW_TYPE = 72, CW_TOTAL = 62, CW_WEEK = 56;
  const L_NAME = 0, L_TYPE = CW_NAME, L_TOTAL = CW_NAME + CW_TYPE;

  const cellBase = {
    border: '1px solid #e5e7eb', verticalAlign: 'middle', textAlign: 'center',
    whiteSpace: 'nowrap', padding: '0 4px', boxSizing: 'border-box',
  };

  const sticky = (left, bg, extra = {}) => ({
    ...cellBase, position: 'sticky', left, zIndex: 2,
    background: bg, borderRight: '2px solid #d1d5db', ...extra,
  });

  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: `${L_TOTAL + CW_TOTAL + allWeeks.length * CW_WEEK}px` }}>
        <colgroup>
          <col style={{ width: CW_NAME }} />
          <col style={{ width: CW_TYPE }} />
          <col style={{ width: CW_TOTAL }} />
          {allWeeks.map((w) => <col key={`${w.year}-${w.weekNumber}`} style={{ width: CW_WEEK }} />)}
        </colgroup>

        <thead>
          {/* Row 1: project banner + month groups */}
          <tr>
            <th colSpan={3} style={{ ...cellBase, position: 'sticky', left: 0, zIndex: 5, background: '#0f172a', color: '#fff', textAlign: 'left', padding: '0 14px', height: '40px', borderRight: '2px solid rgba(255,255,255,0.15)', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BsFolderFill size={13} color="#60a5fa" />
                <span style={{ fontSize: '12.5px' }}>{project?.projectCode}</span>
                <span style={{ fontWeight: 400, fontSize: '11.5px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project?.projectName}</span>
              </div>
            </th>
            {monthGroups.map((mg) => {
              const c = MONTH_PALETTE[mg.colorIdx];
              return (
                <th key={mg.key} colSpan={mg.weeks.length} style={{ ...cellBase, background: c.bg, color: c.text, fontWeight: 700, fontSize: '12px', height: '40px', letterSpacing: '0.5px', borderLeft: '2px solid rgba(255,255,255,0.25)' }}>
                  {mg.label} {mg.year}
                </th>
              );
            })}
          </tr>

          {/* Row 2: column labels + week numbers */}
          <tr>
            <th style={{ ...sticky(L_NAME, '#f1f5f9', { textAlign: 'left', padding: '0 12px', zIndex: 4 }), fontSize: '11px', fontWeight: 700, color: '#64748b', height: '30px' }}>Employee</th>
            <th style={{ ...sticky(L_TYPE, '#f1f5f9', { zIndex: 3 }), fontSize: '11px', fontWeight: 700, color: '#64748b', height: '30px' }}>Type</th>
            <th style={{ ...sticky(L_TOTAL, '#f1f5f9', { zIndex: 3 }), fontSize: '11px', fontWeight: 700, color: '#64748b', height: '30px' }}>Total</th>
            {allWeeks.map((w) => {
              const monday = getDateOfISOWeek(w.year, w.weekNumber);
              const mKey = `${monday.getFullYear()}-${monday.getMonth()}`;
              const mg = monthGroups.find((g) => g.key === mKey);
              const c = MONTH_PALETTE[mg?.colorIdx ?? 0];
              return (
                <th key={`${w.year}-${w.weekNumber}`} style={{ ...cellBase, background: c.subBg, color: c.subText, fontWeight: 700, fontSize: '11.5px', height: '30px', borderLeft: '1px solid #d1d5db' }}>
                  W{w.weekNumber}
                </th>
              );
            })}
          </tr>

          {/* Row 3: weekly hours cap */}
          <tr>
            <td colSpan={3} style={{ ...cellBase, position: 'sticky', left: 0, zIndex: 4, background: '#f0f9ff', borderRight: '2px solid #bae6fd', textAlign: 'left', padding: '0 12px', fontSize: '10.5px', fontWeight: 600, color: '#0284c7', height: '26px' }}>
              Wk Hours Cap
            </td>
            {allWeeks.map((w) => {
              const total = weekMap[`${w.year}-${w.weekNumber}`]?.totalWeeklyHours || 0;
              return (
                <td key={`${w.year}-${w.weekNumber}`} style={{ ...cellBase, background: '#f0f9ff', color: '#0284c7', fontWeight: 700, fontSize: '12px', height: '26px', borderLeft: '1px solid #e0f2fe' }}>
                  {total > 0 ? total : <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {employees.map((emp, ei) => {
            const rowBg = ei % 2 === 0 ? '#ffffff' : '#f8faff';
            return (
              <React.Fragment key={emp.id}>
                {/* Plan row */}
                <tr>
                  <td style={{ ...sticky(L_NAME, rowBg, { textAlign: 'left', padding: '4px 12px', borderBottom: 'none', zIndex: 3 }), height: '34px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#0e1e3d', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1 }}>{emp.employeeId}</div>
                  </td>
                  <td style={{ ...sticky(L_TYPE, '#f0fdf4', { zIndex: 3 }), color: '#16a34a', fontWeight: 700, fontSize: '11.5px', height: '34px' }}>Plan</td>
                  <td style={{ ...sticky(L_TOTAL, '#f0fdf4', { zIndex: 3 }), color: '#15803d', fontWeight: 700, fontSize: '12.5px', height: '34px' }}>
                    {empTotals[emp.id].plan > 0 ? `${empTotals[emp.id].plan}h` : <span style={{ color: '#d1d5db', fontWeight: 400 }}>0h</span>}
                  </td>
                  {allWeeks.map((w) => {
                    const k = `${emp.id}::${w.year}-${w.weekNumber}`;
                    const val = planMap[k];
                    return (
                      <td key={`${w.year}-${w.weekNumber}`} style={{ ...cellBase, background: val > 0 ? '#f0fdf4' : rowBg, color: val > 0 ? '#15803d' : '#e2e8f0', fontWeight: val > 0 ? 700 : 400, fontSize: '12.5px', height: '34px', borderLeft: '1px solid #e5e7eb' }}>
                        {val > 0 ? val : ''}
                      </td>
                    );
                  })}
                </tr>

                {/* Actual row */}
                <tr style={{ borderBottom: `2px solid ${ei % 2 === 0 ? '#e5e7eb' : '#dde7ff'}` }}>
                  <td style={{ ...sticky(L_NAME, rowBg, { borderTop: 'none', zIndex: 3 }), height: '30px' }} />
                  <td style={{ ...sticky(L_TYPE, '#fffbeb', { zIndex: 3 }), color: '#d97706', fontWeight: 700, fontSize: '11.5px', height: '30px' }}>Actual</td>
                  <td style={{ ...sticky(L_TOTAL, '#fffbeb', { zIndex: 3 }), color: '#b45309', fontWeight: 700, fontSize: '12.5px', height: '30px' }}>
                    {empTotals[emp.id].actual > 0 ? `${empTotals[emp.id].actual}h` : <span style={{ color: '#d1d5db', fontWeight: 400 }}>0h</span>}
                  </td>
                  {allWeeks.map((w) => {
                    const k = `${emp.id}::${w.year}-${w.weekNumber}`;
                    const val = actualMap[k];
                    const planned = planMap[k] || 0;
                    const isOver = val != null && planned > 0 && val > planned;
                    return (
                      <td key={`${w.year}-${w.weekNumber}`} style={{ ...cellBase, background: val != null ? (isOver ? '#fef2f2' : '#fffbeb') : rowBg, color: val != null ? (isOver ? '#dc2626' : '#b45309') : '#e2e8f0', fontWeight: val != null ? 700 : 400, fontSize: '12.5px', height: '30px', borderLeft: '1px solid #e5e7eb' }}>
                        {val != null ? val : ''}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Main Section ──────────────────────────────────────────────────────────────

const PlanGridSection = () => {
  const [projects,          setProjects]          = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [gridPlans,         setGridPlans]          = useState([]);
  const [loading,           setLoading]            = useState(false);
  const [error,             setError]              = useState('');

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  // Fetch projects on mount
  useEffect(() => {
    fetch(SummaryApi.getProjects.url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.success) setProjects(data.data); });
  }, []);

  // Fetch plans when project changes
  const fetchGrid = useCallback(async () => {
    if (!selectedProjectId) { setGridPlans([]); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${SummaryApi.getWeeklyPlans.url}/${selectedProjectId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setGridPlans(data.data);
      else setError(data.message || 'Failed to load plans');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [selectedProjectId]);

  useEffect(() => { fetchGrid(); }, [fetchGrid]);

  const handleClear = () => {
    setSelectedProjectId('');
    setGridPlans([]);
    setError('');
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const uniqueEmployees = gridPlans.length > 0
    ? [...new Set(gridPlans.map((p) => String(p.employee?._id || p.employee)))].length
    : 0;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: 'linear-gradient(135deg,#0284c7,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(2,132,199,0.3)', flexShrink: 0 }}>
            <BsTable size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0e1e3d' }}>Plan vs Actual Overview</h3>
            <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Project-wise view of planned hours against actual hours submitted by employees
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedProjectId && (
            <button
              onClick={fetchGrid}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              <BsArrowClockwise size={13} /> Refresh
            </button>
          )}
          <button
            onClick={handleClear}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            <BsXCircle size={13} /> Clear
          </button>
        </div>
      </div>

      {/* ── Project selector card ── */}
      <div style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border: '1.5px solid #bae6fd', borderRadius: '14px', padding: '18px 24px', marginBottom: '24px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Select Project to View
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ flex: '1 1 320px', maxWidth: '480px', padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #7dd3fc', fontSize: '13.5px', outline: 'none', background: '#fff', color: selectedProjectId ? '#0e1e3d' : '#94a3b8', fontWeight: selectedProjectId ? 600 : 400, cursor: 'pointer' }}
          >
            <option value="">— Select a project to view its plan vs actual grid —</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.projectCode} — {p.projectName}</option>
            ))}
          </select>

          {selectedProject && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: 'Start',     value: fmtDate(selectedProject.startDate) },
                { label: 'End',       value: fmtDate(selectedProject.endDate)   },
                { label: 'Employees', value: uniqueEmployees > 0 ? `${uniqueEmployees} with plans` : '—' },
                { label: 'Weeks',     value: gridPlans.length > 0 ? `${[...new Set(gridPlans.map((p) => `${p.year}-${p.weekNumber}`))].length} planned` : '—' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center', padding: '7px 14px', background: '#fff', borderRadius: '8px', border: '1px solid #bae6fd', minWidth: '80px' }}>
                  <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0e1e3d', marginTop: '2px' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Grid or prompt ── */}
      {!selectedProjectId ? (
        <div style={{ textAlign: 'center', padding: '72px 40px', background: '#f9fafb', borderRadius: '14px', border: '1.5px dashed #e5e7eb' }}>
          <BsFolderFill size={52} color="#d1d5db" style={{ display: 'block', margin: '0 auto 16px' }} />
          <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#374151' }}>Select a project to view the grid</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
            Choose a project from the dropdown above to see planned vs actual hours across all weeks.
          </p>
        </div>
      ) : (
        <>
          {/* Grid heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <BsTable size={15} color="#1d4ed8" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0e1e3d' }}>Plan vs Actual Grid</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>— scroll horizontally to see all weeks</span>
          </div>

          {error ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: i === 0 ? '40px' : i <= 3 ? '30px' : '34px', borderRadius: '8px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
              ))}
              <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : (
            <WeeklyGrid plans={gridPlans} project={selectedProject} />
          )}

          {/* Legend */}
          {!loading && !error && (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '12px 18px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Legend:</span>
              {[
                { bg: '#f0fdf4', border: '#16a34a', color: '#15803d', label: 'Plan — manager-assigned planned hours' },
                { bg: '#fffbeb', border: '#d97706', color: '#b45309', label: 'Actual — employee-submitted worked hours' },
                { bg: '#fef2f2', border: '#dc2626', color: '#dc2626', label: 'Over-planned (actual > planned)' },
                { bg: '#f0f9ff', border: '#0284c7', color: '#0284c7', label: 'Wk Hours Cap — max per employee' },
              ].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: l.bg, border: `1.5px solid ${l.border}`, flexShrink: 0 }} />
                  <span style={{ fontSize: '11.5px', color: l.color, fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlanGridSection;
