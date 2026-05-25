import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BsFileEarmarkSpreadsheet, BsFilePdf, BsPlusCircle, BsTrash, BsXCircle, BsCalendarMonth, BsInfoCircle, BsCheckCircle, BsExclamationTriangle } from 'react-icons/bs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SummaryApi from '../apis/index.jsx';

const currentYear = new Date().getFullYear();

// FY months in order (April = start of FY, March = end)
// yearOffset: 1 for Jan/Feb/Mar (they belong to the next calendar year)
const FY_MONTHS = [
  { name: 'April',     calMonth: 3,  yearOffset: 0 },
  { name: 'May',       calMonth: 4,  yearOffset: 0 },
  { name: 'June',      calMonth: 5,  yearOffset: 0 },
  { name: 'July',      calMonth: 6,  yearOffset: 0 },
  { name: 'August',    calMonth: 7,  yearOffset: 0 },
  { name: 'September', calMonth: 8,  yearOffset: 0 },
  { name: 'October',   calMonth: 9,  yearOffset: 0 },
  { name: 'November',  calMonth: 10, yearOffset: 0 },
  { name: 'December',  calMonth: 11, yearOffset: 0 },
  { name: 'January',   calMonth: 0,  yearOffset: 1 },
  { name: 'February',  calMonth: 1,  yearOffset: 1 },
  { name: 'March',     calMonth: 2,  yearOffset: 1 },
];

// FY week number: week 1 starts April 1 of the FY start year
const getFYWeekNum = (date) => {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const fyStartYear = month >= 3 ? year : year - 1;
  const fyStart     = new Date(fyStartYear, 3, 1); // April 1
  const daysDiff    = Math.floor((date - fyStart) / 86400000);
  return Math.floor(daysDiff / 7) + 1;
};

// Returns sorted FY week numbers that overlap with the given calendar month
const getWeeksInMonth = (year, calMonth) => {
  const weeks  = new Set();
  const lastDay = new Date(year, calMonth + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    weeks.add(getFYWeekNum(new Date(year, calMonth, day)));
  }
  return [...weeks].sort((a, b) => a - b);
};

const ReportGenerationSection = () => {
  const [allUsers, setAllUsers]             = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  // yearWeekGroups: [{ year: number, selectedWeeks: number[] }]
  const [yearWeekGroups, setYearWeekGroups] = useState([{ year: currentYear, selectedWeeks: [] }]);
  const [reportData, setReportData]         = useState(null);
  const [overrides, setOverrides]           = useState({});
  const [generating, setGenerating]         = useState(false);
  const [error, setError]                   = useState('');
  const [missingData, setMissingData]       = useState([]);
  const [empSearch, setEmpSearch]           = useState('');
  const [weekMode,      setWeekMode]        = useState('week'); // 'week' | 'month'
  const [monthSelYear,  setMonthSelYear]    = useState(currentYear);
  const [monthMsg,      setMonthMsg]        = useState(null); // { type, text, weeks }
  const [addingMonth,   setAddingMonth]     = useState(false);
  const printRef = useRef(null); // kept for Export Excel reference div

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
      idx === groupIdx ? { ...g, selectedWeeks: Array.from({ length: 53 }, (_, i) => i + 1) } : g
    ));

  const clearWeeksInGroup = (groupIdx) =>
    setYearWeekGroups((p) => p.map((g, idx) =>
      idx === groupIdx ? { ...g, selectedWeeks: [] } : g
    ));

  const addWeeksToGroup = (year, weeks) => {
    setYearWeekGroups((prev) => {
      const idx = prev.findIndex((g) => g.year === year);
      if (idx >= 0) {
        return prev.map((g, i) => i !== idx ? g : {
          ...g,
          selectedWeeks: [...new Set([...g.selectedWeeks, ...weeks])].sort((a, b) => a - b),
        });
      }
      return [...prev, { year, selectedWeeks: [...weeks].sort((a, b) => a - b) }];
    });
  };

  const handleAddMonthWeeks = async (fi) => {
    const { name: monthName, calMonth, yearOffset } = FY_MONTHS[fi];
    const calYear         = monthSelYear + yearOffset;
    const allWeeksInMonth = getWeeksInMonth(calYear, calMonth);

    if (!selectedEmpIds.length) {
      addWeeksToGroup(monthSelYear, allWeeksInMonth);
      setMonthMsg({ type: 'info', monthIdx: fi, text: `Wk ${allWeeksInMonth.join(', ')} added for ${monthName} ${calYear}.`, weeks: allWeeksInMonth, note: 'Select employees first to filter by data availability.' });
      return;
    }

    setAddingMonth(fi); setMonthMsg(null);
    try {
      const params = new URLSearchParams({ year: monthSelYear });
      const res  = await fetch(`${SummaryApi.getAllWeeklyPlans.url}?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (!data.success) throw new Error();

      const plans = data.data;
      const validWeeks   = [];
      const skippedWeeks = [];

      allWeeksInMonth.forEach((wk) => {
        const weekPlans = plans.filter((p) =>
          p.weekNumber === wk && selectedEmpIds.includes(String(p.employee?._id))
        );
        const hasPlanned = weekPlans.some((p) => (p.plannedHours || 0) > 0);
        const hasActual  = weekPlans.some((p) => (p.workedHours  || 0) > 0);
        if (hasPlanned && hasActual) validWeeks.push(wk);
        else skippedWeeks.push(wk);
      });

      if (validWeeks.length > 0) {
        addWeeksToGroup(monthSelYear, validWeeks);
        setMonthMsg({ type: 'success', monthIdx: fi, weeks: validWeeks, skipped: skippedWeeks,
          text: `${monthName} ${calYear} — Wk ${validWeeks.join(', ')} added (have both planned & actual hours)${skippedWeeks.length ? `. Wk ${skippedWeeks.join(', ')} skipped — no complete data.` : '.'}` });
      } else {
        setMonthMsg({ type: 'warning', monthIdx: fi, weeks: [], text: `No weeks in ${monthName} ${calYear} have both planned and actual hours. Weeks in this month: Wk ${allWeeksInMonth.join(', ')}.` });
      }
    } catch {
      setMonthMsg({ type: 'error', monthIdx: fi, weeks: [], text: 'Failed to check data. Please try again.' });
    } finally {
      setAddingMonth(false);
    }
  };

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

    setGenerating(true); setError(''); setReportData(null); setMissingData([]);

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
      else if (data.code === 'MISSING_DATA') {
        setMissingData(data.missing || []);
        setError('Report not generated — some employees have not filled their data for the selected weeks.');
      }
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
    if (!reportData) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    const weekLabel = weekSelections.map((w) => `${w.year} Wk${w.weekNumber}`).join(', ');
    const dateStr   = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Header
    doc.setFontSize(14);
    doc.setTextColor(14, 30, 61);
    doc.setFont('helvetica', 'bold');
    doc.text('GAINWELL ENGINEERING — Utilization Report', 14, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`${weekLabel}   |   Generated: ${dateStr}`, 14, 23);

    const dotColor = (value, type) => {
      if (type === 'indEff')   return value >= 90 ? [34,197,94] : value >= 85 ? [245,158,11] : [239,68,68];
      if (type === 'planEff')  return value > 110 ? [245,158,11] : value >= 100 ? [34,197,94] : [239,68,68];
      if (type === 'leave')    return value >= 13  ? [239,68,68]  : [34,197,94];
      if (type === 'training') return value >= 7   ? [34,197,94]  : [239,68,68];
      if (type === 'total')    return value >= 80  ? [34,197,94]  : [239,68,68];
      return [156,163,175];
    };

    const body = reportData.map((r) => [
      `${r.name}\n${r.employeeId}`,
      `${r.plan}h`,
      r.plannedProjects,
      `${r.actual}h`,
      r.actualProjects,
      `${r.availability}h`,
      `${r.absoluteAvailability}h`,
      `${r.leave}h`,
      `${r.training}h`,
      `${r.individualEfficiency}%`,
      `${r.engagement}%`,
      `${r.planningEfficiency}%`,
      `${r.leavePercent}%`,
      `${r.trainingPercent}%`,
      `${r.total}%`,
    ]);

    autoTable(doc, {
      startY: 28,
      head: [[
        'Name', 'Plan', 'Planned\nProjects', 'Actual', 'Actual\nProjects',
        'Availability', 'Abs.\nAvail.', 'Leave', 'Training',
        'Ind. Eff.', 'Engagement\n(85%)', 'Planning Eff.\n(98%)',
        'Leave %', 'Training %', 'Total %',
      ]],
      body,
      styles:     { fontSize: 8, cellPadding: 3, halign: 'center', valign: 'middle', overflow: 'linebreak' },
      headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: { 0: { halign: 'left', cellWidth: 28 } },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      didDrawCell: (data) => {
        if (data.section !== 'body') return;
        const colsWithDots = { 9: 'indEff', 11: 'planEff', 12: 'leave', 13: 'training', 14: 'total' };
        const type = colsWithDots[data.column.index];
        if (!type) return;
        const r   = reportData[data.row.index];
        const val = [r.individualEfficiency, r.engagement, r.planningEfficiency, r.leavePercent, r.trainingPercent, r.total];
        const valMap = { indEff: r.individualEfficiency, planEff: r.planningEfficiency, leave: r.leavePercent, training: r.trainingPercent, total: r.total };
        const [cr, cg, cb] = dotColor(valMap[type], type);
        const cx = data.cell.x + 3;
        const cy = data.cell.y + data.cell.height / 2;
        doc.setFillColor(cr, cg, cb);
        doc.circle(cx, cy, 1.4, 'F');
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Utilization_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
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

  const getDotColor = (value, type) => {
    if (type === 'indEff')   return value >= 90 ? '#22c55e' : value >= 85 ? '#f59e0b' : '#ef4444';
    if (type === 'planEff')  return value > 110 ? '#f59e0b' : value >= 100 ? '#22c55e' : '#ef4444';
    if (type === 'leave')    return value >= 13  ? '#ef4444' : '#22c55e';
    if (type === 'training') return value >= 7   ? '#22c55e' : '#ef4444';
    if (type === 'total')    return value >= 80  ? '#22c55e' : '#ef4444';
    return '#9ca3af';
  };

  const dotCell = (value, type) => {
    const color = getDotColor(value, type);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 0 2px ${color}33` }} />
        <span style={{ fontWeight: 700 }}>{value}%</span>
      </div>
    );
  };

  const handleClear = () => {
    setSelectedEmpIds([]);
    setYearWeekGroups([{ year: currentYear, selectedWeeks: [] }]);
    setReportData(null);
    setOverrides({});
    setError('');
    setMissingData([]);
    setEmpSearch('');
    setMonthMsg(null);
    setWeekMode('week');
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

      {missingData.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#b45309', marginBottom: '10px' }}>
            Missing weekly data — fill these before generating the report:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto', overflowX: 'hidden' }}>
            {missingData.map((m, i) => (
              <div key={i} style={{ fontSize: '13px', color: '#92400e', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <strong>{m.name}</strong> ({m.employeeId}) hasn't filled the data for{' '}
                <strong>{m.projectCode}</strong>
                {m.projectName ? ` · ${m.projectName}` : ''} — Week {m.weekNumber}, {m.year}
              </div>
            ))}
          </div>
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

        {/* Week Selection */}
        <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '12px', padding: '18px' }}>

          {/* Header + week count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0e1e3d' }}>
              2. Select Year &amp; Weeks
              {weekSelections.length > 0 && (
                <span style={{ marginLeft: '10px', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '12px' }}>
                  {weekSelections.length} week{weekSelections.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            {/* Mode toggle */}
            <div style={{ display: 'flex', background: '#e0e7ff', borderRadius: '8px', padding: '3px', gap: '2px' }}>
              {[{ key: 'week', label: 'By Week' }, { key: 'month', label: 'By Month' }].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setWeekMode(key); setMonthMsg(null); }}
                  style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    background: weekMode === key ? '#1d4ed8' : 'transparent',
                    color:      weekMode === key ? '#fff'    : '#4f46e5',
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* ── BY WEEK mode ── */}
          {weekMode === 'week' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <select
                        value={group.year}
                        onChange={(e) => setGroupYear(gi, Number(e.target.value))}
                        style={{ padding: '6px 12px', borderRadius: '7px', border: '1.5px solid #bfdbfe', fontSize: '13.5px', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', outline: 'none', cursor: 'pointer' }}
                      >
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
                        {group.selectedWeeks.length > 0 ? `${group.selectedWeeks.length} week${group.selectedWeeks.length !== 1 ? 's' : ''} selected` : 'Click weeks to select'}
                      </span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                        <button onClick={() => selectAllWeeksInGroup(gi)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>All</button>
                        <button onClick={() => clearWeeksInGroup(gi)}     style={{ padding: '4px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', background: '#fff',    color: '#6b7280', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>Clear</button>
                        {yearWeekGroups.length > 1 && (
                          <button onClick={() => removeYearGroup(gi)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '11.5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <BsTrash size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '4px', marginBottom: '2px' }}>
                      {['Q1','','','','Q2','','','','Q3','','','','Q4'].map((q, qi) => (
                        <div key={qi} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: q ? '#94a3b8' : 'transparent' }}>{q || '·'}</div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '4px' }}>
                      {Array.from({ length: 53 }, (_, i) => i + 1).map((wk) => {
                        const isSel = group.selectedWeeks.includes(wk);
                        return (
                          <button key={wk} onClick={() => toggleWeekInGroup(gi, wk)}
                            style={{ padding: '5px 2px', borderRadius: '5px', border: 'none', background: isSel ? '#1d4ed8' : '#f1f5f9', color: isSel ? '#fff' : '#475569', fontSize: '11px', fontWeight: isSel ? 700 : 400, cursor: 'pointer', textAlign: 'center', transition: 'all 0.1s', boxShadow: isSel ? '0 1px 4px rgba(29,78,216,0.3)' : 'none' }}
                          >{wk}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── BY MONTH mode ── */}
          {weekMode === 'month' && (
            <div>
              {/* Year selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Year</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {YEARS.map((y) => (
                    <button key={y} onClick={() => { setMonthSelYear(y); setMonthMsg(null); }}
                      style={{ padding: '6px 16px', borderRadius: '7px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        background: monthSelYear === y ? '#1d4ed8' : '#e0e7ff',
                        color:      monthSelYear === y ? '#fff'    : '#3730a3',
                      }}>{y}</button>
                  ))}
                </div>
                {weekSelections.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>
                    Total selected: <strong style={{ color: '#1d4ed8' }}>{weekSelections.length} weeks</strong>
                  </span>
                )}
              </div>

              {/* Month grid 4×3 — April to March (FY order) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {FY_MONTHS.map(({ name, calMonth, yearOffset }, fi) => {
                  const calYear   = monthSelYear + yearOffset;
                  const weeksInM  = getWeeksInMonth(calYear, calMonth);
                  const isAdding  = addingMonth === fi;
                  const isAdded   = monthMsg?.monthIdx === fi && monthMsg?.weeks?.length > 0;
                  const isWarning = monthMsg?.monthIdx === fi && monthMsg?.type === 'warning';
                  return (
                    <div key={fi} style={{ background: isAdded ? '#f0fdf4' : isWarning ? '#fffbeb' : '#fff', border: `1.5px solid ${isAdded ? '#bbf7d0' : isWarning ? '#fde68a' : '#e2e8f0'}`, borderRadius: '10px', padding: '12px 14px', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0e1e3d' }}>
                          {name}
                          {yearOffset === 1 && <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '4px', fontWeight: 400 }}>{calYear}</span>}
                        </span>
                        {isAdded   && <BsCheckCircle         size={14} color="#16a34a" />}
                        {isWarning && <BsExclamationTriangle size={13} color="#d97706" />}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>
                        Wk {weeksInM.join(', ')}
                      </div>
                      <button
                        onClick={() => handleAddMonthWeeks(fi)}
                        disabled={isAdding}
                        style={{ width: '100%', padding: '6px 0', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: isAdding ? 'not-allowed' : 'pointer',
                          background: isAdding ? '#a5b4fc' : isAdded ? '#dcfce7' : 'linear-gradient(135deg,#4f46e5,#6366f1)',
                          color:      isAdding ? '#fff'    : isAdded ? '#15803d' : '#fff',
                        }}
                      >
                        {isAdding ? 'Checking…' : isAdded ? '✓ Added' : 'Add Weeks'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Result message */}
              {monthMsg && (() => {
                const cfg = {
                  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', Icon: BsCheckCircle },
                  warning: { bg: '#fffbeb', border: '#fde68a', color: '#b45309', Icon: BsExclamationTriangle },
                  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', Icon: BsInfoCircle },
                  error:   { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', Icon: BsExclamationTriangle },
                }[monthMsg.type];
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '14px', padding: '11px 14px', borderRadius: '9px', background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: '12.5px', lineHeight: 1.6 }}>
                    <cfg.Icon size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{monthMsg.text}{monthMsg.note ? <em style={{ marginLeft: '6px', opacity: 0.8 }}>{monthMsg.note}</em> : null}</span>
                  </div>
                );
              })()}
            </div>
          )}
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

      {/* Generate + Download buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={handleGenerate} disabled={generating || !selectedEmpIds.length}
          style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: generating || !selectedEmpIds.length ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: generating || !selectedEmpIds.length ? 'not-allowed' : 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}
        >
          {generating ? 'Generating…' : 'Generate Report'}
        </button>
        {reportData && (
          <button
            onClick={exportToPdf}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 22px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#dc2626 80%,#ef4444 100%)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 10px rgba(220,38,38,0.35)' }}
          >
            <BsFilePdf size={15} /> Download PDF
          </button>
        )}
      </div>

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
                      <td style={tdStyle}>{dotCell(r.individualEfficiency, 'indEff')}</td>
                      <td style={tdStyle}>{pctCell(r.engagement, 85)}</td>
                      <td style={tdStyle}>{dotCell(r.planningEfficiency, 'planEff')}</td>
                      <td style={tdStyle}>{dotCell(r.leavePercent, 'leave')}</td>
                      <td style={tdStyle}>{dotCell(r.trainingPercent, 'training')}</td>
                      <td style={tdStyle}>{dotCell(r.total, 'total')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerationSection;
