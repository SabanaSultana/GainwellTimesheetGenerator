import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BsFileEarmarkSpreadsheet, BsFilePdf, BsPlusCircle, BsTrash, BsXCircle } from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

const currentYear = new Date().getFullYear();

const ReportGenerationSection = () => {
  const [allUsers, setAllUsers]             = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  // yearWeekGroups: [{ year: number, selectedWeeks: number[] }]
  const [yearWeekGroups, setYearWeekGroups] = useState([{ year: currentYear, selectedWeeks: [] }]);
  const [reportData, setReportData]         = useState(null);
  const [overrides, setOverrides]           = useState({});
  const [generating, setGenerating]         = useState(false);
  const [error, setError]                   = useState('');
  const [empSearch, setEmpSearch]           = useState('');
  const printRef = useRef(null);

  // Flat list sent to the API
  const weekSelections = yearWeekGroups.flatMap((g) =>
    [...g.selectedWeeks].sort((a, b) => a - b).map((w) => ({ year: g.year, weekNumber: w }))
  );

  const fetchUsers = useCallback(async () => {
    try {
      const res  = await fetch(SummaryApi.getTeamMembers.url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setAllUsers(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = allUsers.filter((u) => {
    if (!empSearch) return true;
    const q = empSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.employeeId?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
  });

  const toggleEmp = (id) => {
    setSelectedEmpIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const addYearGroup = () =>
    setYearWeekGroups((p) => [...p, { year: currentYear, selectedWeeks: [] }]);

  const removeYearGroup = (i) =>
    setYearWeekGroups((p) => p.filter((_, idx) => idx !== i));

  const setGroupYear = (i, yr) =>
    setYearWeekGroups((p) => p.map((g, idx) => idx === i ? { ...g, year: yr } : g));

  const toggleWeekInGroup = (groupIdx, wk) =>
    setYearWeekGroups((p) => p.map((g, idx) => {
      if (idx !== groupIdx) return g;
      const has = g.selectedWeeks.includes(wk);
      return { ...g, selectedWeeks: has ? g.selectedWeeks.filter((w) => w !== wk) : [...g.selectedWeeks, wk] };
    }));

  const selectAllWeeksInGroup = (groupIdx) =>
    setYearWeekGroups((p) => p.map((g, idx) =>
      idx === groupIdx ? { ...g, selectedWeeks: Array.from({ length: 52 }, (_, i) => i + 1) } : g
    ));

  const clearWeeksInGroup = (groupIdx) =>
    setYearWeekGroups((p) => p.map((g, idx) =>
      idx === groupIdx ? { ...g, selectedWeeks: [] } : g
    ));

  const handleGenerate = async () => {
    if (!selectedEmpIds.length) { setError('Select at least one employee.'); return; }
    if (!weekSelections.length) { setError('Select at least one week from the year groups below.'); return; }

    // Planned & Actual are required for every selected employee
    const missing = selectedEmpIds.filter(
      (id) => overrides[id]?.planned === undefined || overrides[id]?.planned === '' ||
               overrides[id]?.actual  === undefined || overrides[id]?.actual  === ''
    );
    if (missing.length > 0) {
      const names = missing.map((id) => allUsers.find((u) => u._id === id)?.name || id).join(', ');
      setError(`Enter Planned & Actual project hours for: ${names}`);
      return;
    }

    setGenerating(true); setError(''); setReportData(null);

    const plannedProjectsOverrides = {};
    const actualProjectsOverrides  = {};
    selectedEmpIds.forEach((id) => {
      plannedProjectsOverrides[id] = Number(overrides[id].planned);
      actualProjectsOverrides[id]  = Number(overrides[id].actual);
    });

    try {
      const res  = await fetch(SummaryApi.generateReport.url, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds: selectedEmpIds, weekSelections, plannedProjectsOverrides, actualProjectsOverrides }),
      });
      const data = await res.json();
      if (data.success) setReportData(data.data);
      else setError(data.message || 'Report generation failed');
    } catch { setError('Network error. Please try again.'); }
    finally { setGenerating(false); }
  };

  const exportToExcel = () => {
    if (!reportData) return;
    const headers = ['Name','Plan','Planned Projects (No.)','Actual','Actual Projects (No.)','Availability','Abs. Availability','Leave','Training','Ind. Efficiency %','Engagement %','Planning Eff. %','Leave %','Training %','Total %'];
    const rows    = reportData.map((r) => [
      r.name, r.plan, r.plannedProjects, r.actual, r.actualProjects,
      r.availability, r.absoluteAvailability, r.leave, r.training,
      r.individualEfficiency, r.engagement, r.planningEfficiency,
      r.leavePercent, r.trainingPercent, r.total,
    ]);

    const table = `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const blob  = new Blob(['﻿' + table], { type: 'application/vnd.ms-excel' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href = url; a.download = `Utilization_Report_${new Date().toISOString().slice(0,10)}.xls`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Utilization Report</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 16px; }
        h2   { font-size: 15px; color: #0e1e3d; margin-bottom: 8px; }
        table{ border-collapse: collapse; width: 100%; }
        th   { background: #1d4ed8; color: #fff; padding: 6px 8px; font-size: 10px; text-align: center; }
        td   { border: 1px solid #e5e7eb; padding: 5px 8px; text-align: center; }
        tr:nth-child(even) td { background: #f8faff; }
      </style>
      </head><body>${printContents}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const YEARS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const thStyle = { padding: '11px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', background: '#1d4ed8', whiteSpace: 'nowrap', border: '1px solid #1e3a8a' };
  const tdStyle = { padding: '10px 12px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6', textAlign: 'center', verticalAlign: 'middle' };

  const pctCell = (val, target) => {
    const good = target ? val >= target : val >= 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <span style={{ fontWeight: 700, color: good ? '#16a34a' : '#dc2626' }}>{val}%</span>
        {target && <span style={{ fontSize: '10px', color: '#9ca3af' }}>/{target}%</span>}
      </div>
    );
  };

  const handleClear = () => {
    setSelectedEmpIds([]);
    setYearWeekGroups([{ year: currentYear, selectedWeeks: [] }]);
    setReportData(null);
    setOverrides({});
    setError('');
    setEmpSearch('');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BsFileEarmarkSpreadsheet size={18} color="#4f46e5" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Generate Utilization Report</h3>
        </div>
        <button onClick={handleClear} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
          <BsXCircle size={13} /> Clear
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Employee Selection */}
        <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0e1e3d', marginBottom: '12px' }}>
            1. Select Employees ({selectedEmpIds.length} selected)
          </div>
          <input
            value={empSearch} onChange={(e) => setEmpSearch(e.target.value)}
            placeholder="Search employees…"
            style={{ width: '100%', padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13.5px', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {filteredUsers.map((u) => {
              const isSelected = selectedEmpIds.includes(u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => toggleEmp(u._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: isSelected ? '#eff6ff' : '#fff', border: `1.5px solid ${isSelected ? '#bfdbfe' : '#e5e7eb'}`, transition: 'all 0.12s' }}
                >
                  <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ accentColor: '#1d4ed8', cursor: 'pointer', width: '16px', height: '16px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0e1e3d' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{u.employeeId} · {u.department}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Week Selection — multi-chip per year */}
        <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0e1e3d' }}>
              2. Select Year &amp; Weeks
              {weekSelections.length > 0 && (
                <span style={{ marginLeft: '10px', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '12px' }}>
                  {weekSelections.length} week{weekSelections.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <button
              onClick={addYearGroup}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              <BsPlusCircle size={12} /> Add Year
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {yearWeekGroups.map((group, gi) => (
              <div key={gi} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
                {/* Year row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <select
                    value={group.year}
                    onChange={(e) => setGroupYear(gi, Number(e.target.value))}
                    style={{ padding: '6px 12px', borderRadius: '7px', border: '1.5px solid #bfdbfe', fontSize: '13.5px', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', outline: 'none', cursor: 'pointer' }}
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
                    {group.selectedWeeks.length > 0
                      ? `${group.selectedWeeks.length} week${group.selectedWeeks.length !== 1 ? 's' : ''} selected`
                      : 'Click weeks below to select'}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => selectAllWeeksInGroup(gi)}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                    >All</button>
                    <button
                      onClick={() => clearWeeksInGroup(gi)}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                    >Clear</button>
                    {yearWeekGroups.length > 1 && (
                      <button
                        onClick={() => removeYearGroup(gi)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '11.5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <BsTrash size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quarter labels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '4px', marginBottom: '2px' }}>
                  {['Q1', '', '', '', 'Q2', '', '', '', 'Q3', '', '', '', 'Q4'].map((q, qi) => (
                    <div key={qi} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: q ? '#94a3b8' : 'transparent' }}>{q || '·'}</div>
                  ))}
                </div>

                {/* Week chips — 13 per row (one quarter per row) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '4px' }}>
                  {Array.from({ length: 52 }, (_, i) => i + 1).map((wk) => {
                    const isSelected = group.selectedWeeks.includes(wk);
                    return (
                      <button
                        key={wk}
                        onClick={() => toggleWeekInGroup(gi, wk)}
                        style={{
                          padding: '5px 2px', borderRadius: '5px', border: 'none',
                          background: isSelected ? '#1d4ed8' : '#f1f5f9',
                          color: isSelected ? '#fff' : '#475569',
                          fontSize: '11px', fontWeight: isSelected ? 700 : 400,
                          cursor: 'pointer', textAlign: 'center',
                          transition: 'all 0.1s',
                          boxShadow: isSelected ? '0 1px 4px rgba(29,78,216,0.3)' : 'none',
                        }}
                      >
                        {wk}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Planned/Actual Projects Overrides */}
      {selectedEmpIds.length > 0 && (
        <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0e1e3d', marginBottom: '4px' }}>3. Planned &amp; Actual Projects <span style={{ color: '#ef4444', fontSize: '13px' }}>* Required</span></div>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280' }}>Enter planned and actual project hours for each selected employee.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {selectedEmpIds.map((id) => {
              const u = allUsers.find((x) => x._id === id);
              return (
                <div key={id} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', minWidth: '220px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0e1e3d', marginBottom: '8px' }}>{u?.name}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>Planned Projects (No.)</label>
                      <input
                        type="number" min="0"
                        value={overrides[id]?.planned ?? ''}
                        onChange={(e) => setOverrides((p) => ({ ...p, [id]: { ...p[id], planned: e.target.value } }))}
                        placeholder="0"
                        style={{ width: '90px', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #e2e8f0', fontSize: '13.5px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>Actual Projects (No.)</label>
                      <input
                        type="number" min="0"
                        value={overrides[id]?.actual ?? ''}
                        onChange={(e) => setOverrides((p) => ({ ...p, [id]: { ...p[id], actual: e.target.value } }))}
                        placeholder="0"
                        style={{ width: '90px', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #e2e8f0', fontSize: '13.5px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate} disabled={generating || !selectedEmpIds.length}
        style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: generating || !selectedEmpIds.length ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: generating || !selectedEmpIds.length ? 'not-allowed' : 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.12)', marginBottom: '24px' }}
      >
        {generating ? 'Generating…' : 'Generate Report'}
      </button>

      {/* Report Table */}
      {reportData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0e1e3d' }}>Utilization Report</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={exportToExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                <BsFileEarmarkSpreadsheet size={14} /> Export Excel
              </button>
              <button
                onClick={exportToPdf}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                <BsFilePdf size={14} /> Export PDF
              </button>
            </div>
          </div>

          <div ref={printRef}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0e1e3d', marginBottom: '8px' }}>
              Utilization Report — {weekSelections.map((w) => `${w.year} Wk${w.weekNumber}`).join(', ')}
            </h2>
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                <thead>
                  <tr>
                    {['Name','Plan','Planned Projects (No.)','Actual','Actual Projects (No.)','Availability','Abs. Avail.','Leave','Training','Ind. Eff.','Engagement\n(85%)','Planning Eff.\n(98%)','Leave %','Training %','Total %'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={r.employeeId} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#0e1e3d' }}>
                        {r.name}
                        <div style={{ fontSize: '10.5px', color: '#9ca3af', fontWeight: 400 }}>{r.employeeId}</div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#7c3aed' }}>{r.plan}h</td>
                      <td style={tdStyle}>{r.plannedProjects}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#16a34a' }}>{r.actual}h</td>
                      <td style={tdStyle}>{r.actualProjects}</td>
                      <td style={tdStyle}>{r.availability}h</td>
                      <td style={tdStyle}>{r.absoluteAvailability}h</td>
                      <td style={{ ...tdStyle, color: '#9333ea' }}>{r.leave}h</td>
                      <td style={{ ...tdStyle, color: '#d97706' }}>{r.training}h</td>
                      <td style={tdStyle}>{pctCell(r.individualEfficiency)}</td>
                      <td style={tdStyle}>{pctCell(r.engagement, 85)}</td>
                      <td style={tdStyle}>{pctCell(r.planningEfficiency, 98)}</td>
                      <td style={tdStyle}>{r.leavePercent}%</td>
                      <td style={tdStyle}>{r.trainingPercent}%</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: r.total >= 100 ? '#16a34a' : '#d97706' }}>{r.total}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '10.5px', color: '#9ca3af', marginTop: '8px' }}>
              * Engagement target: 85% | Planning Efficiency target: 98% | All % values use ceiling
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerationSection;
