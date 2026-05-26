import React, { useState, useEffect, useCallback } from 'react';
import {
  BsCalendarWeek, BsSearch, BsPencil, BsCheckCircle, BsExclamationTriangle,
  BsPlusCircle, BsChevronDown, BsChevronUp, BsArrowClockwise, BsFolderFill,
  BsXCircle, BsExclamationOctagon,
} from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Financial Year Week Helpers ───────────────────────────────────────────────

// FY starts April 1. Week 1 = Monday-Sunday week that contains April 1.
function getFYWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const month  = d.getUTCMonth();
  const fyYear = month >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  const apr1   = new Date(Date.UTC(fyYear, 3, 1));
  const apr1Day = apr1.getUTCDay() || 7;
  const fyStartMs = Date.UTC(fyYear, 3, 2 - apr1Day);
  const daysDiff  = Math.floor((d.getTime() - fyStartMs) / 86400000);
  return { weekNum: Math.floor(daysDiff / 7) + 1, fyYear };
}

// Get the Monday of a given FY week
function getWeekMonday(fyYear, weekNum) {
  const apr1    = new Date(fyYear, 3, 1);
  const apr1Day = apr1.getDay() || 7;
  const mon     = new Date(fyYear, 3, 2 - apr1Day);
  mon.setDate(mon.getDate() + (weekNum - 1) * 7);
  return mon;
}

// True if date is the 2nd or 4th Saturday of its month (non-working even Saturday)
function isEvenSaturday(date) {
  if (!date || date.getDay() !== 6) return false;
  let idx = 0;
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  while (d.getMonth() === date.getMonth()) {
    if (d.getDay() === 6) {
      idx++;
      if (d.getDate() === date.getDate()) return idx === 2 || idx === 4;
    }
    d.setDate(d.getDate() + 1);
  }
  return false;
}

// Working days = Mon-Sat (6) minus 1 if the week's Saturday is 2nd or 4th of the month,
// minus any public holidays. Sunday is always excluded.
function getWeekCapBreakdown(fyYear, weekNum, extraHolidays = 0) {
  if (!fyYear || !weekNum) return { workingDays: 0, evenSat: false };
  const monday = getWeekMonday(fyYear, weekNum);
  const sat    = new Date(monday);
  sat.setDate(monday.getDate() + 5);
  const evenSat = isEvenSaturday(sat);
  const base    = evenSat ? 5 : 6;
  return { workingDays: Math.max(0, base - Math.max(0, Number(extraHolidays))), evenSat };
}

// All days in a calendar month
function getMonthDays(year, month) {
  const days = [], last = new Date(year, month + 1, 0);
  for (let d = new Date(year, month, 1); d <= last; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  return days;
}

// Calendar years within project date range
function getValidYears(startDate, endDate) {
  if (!startDate || !endDate) {
    const cur = new Date().getFullYear();
    return [cur - 1, cur, cur + 1, cur + 2];
  }
  const sy = new Date(startDate).getFullYear();
  const ey = new Date(endDate).getFullYear();
  const years = [];
  for (let y = sy; y <= ey; y++) years.push(y);
  return years;
}

// Calendar months within project date range for a given year
function getValidMonths(year, startDate, endDate) {
  const valid = [];
  for (let m = 0; m < 12; m++) {
    const ms = new Date(year, m, 1), me = new Date(year, m + 1, 0);
    const s  = startDate ? new Date(startDate) : null;
    const e  = endDate   ? new Date(endDate)   : null;
    if (s && me < s) continue;
    if (e && ms > e) continue;
    valid.push(m);
  }
  return valid;
}

// ── CalendarWidget ─────────────────────────────────────────────────────────────
const CalendarWidget = ({ year, month, projectStartDate, projectEndDate, selectedWeek, selectedFYYear, onSelectWeek }) => {
  const days     = getMonthDays(year, month);
  const projStart = projectStartDate ? new Date(projectStartDate) : null;
  const projEnd   = projectEndDate   ? new Date(projectEndDate)   : null;

  // Group days by FY week
  const weekMap = {};
  days.forEach((d) => {
    const { weekNum, fyYear } = getFYWeek(d);
    const key = `${fyYear}-${weekNum}`;
    if (!weekMap[key]) weekMap[key] = { weekNum, fyYear, wkDays: [] };
    weekMap[key].wkDays.push(d);
  });
  const sortedWeeks = Object.values(weekMap).sort((a, b) =>
    a.fyYear !== b.fyYear ? a.fyYear - b.fyYear : a.weekNum - b.weekNum
  );

  const isInProject = (d) => {
    if (!d) return false;
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (projStart && dt < new Date(projStart.getFullYear(), projStart.getMonth(), projStart.getDate())) return false;
    if (projEnd   && dt > new Date(projEnd.getFullYear(),   projEnd.getMonth(),   projEnd.getDate()))   return false;
    return true;
  };

  return (
    <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0e1e3d', marginBottom: '10px' }}>
        {MONTHS[month]} {year} — Click a week to select
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7,1fr)', gap: '2px', fontSize: '11.5px' }}>
        <div style={{ color: '#9ca3af', fontWeight: 700, textAlign: 'center', padding: '4px' }}>Wk</div>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((lbl) => (
          <div key={lbl} style={{ color: lbl === 'Sun' ? '#dc2626' : lbl === 'Sat' ? '#d97706' : '#9ca3af', fontWeight: 700, textAlign: 'center', padding: '4px' }}>{lbl}</div>
        ))}
        {sortedWeeks.map(({ weekNum, fyYear, wkDays }) => {
          const isSelected      = selectedWeek === weekNum && selectedFYYear === fyYear;
          const weekHasProject  = wkDays.some(isInProject);
          const grid = Array(7).fill(null);
          wkDays.forEach((d) => { grid[(d.getDay() + 6) % 7] = d; });
          return (
            <React.Fragment key={`${fyYear}-${weekNum}`}>
              {/* Week number cell */}
              <div
                onClick={() => weekHasProject && onSelectWeek(weekNum, fyYear)}
                title={`FY Week ${weekNum}  ·  FY ${fyYear}`}
                style={{
                  background: isSelected ? '#1d4ed8' : weekHasProject ? '#eff6ff' : '#f3f4f6',
                  color: isSelected ? '#fff' : weekHasProject ? '#1d4ed8' : '#c4c4c4',
                  borderRadius: '8px', padding: '6px 4px', textAlign: 'center',
                  fontWeight: 700, cursor: weekHasProject ? 'pointer' : 'default',
                  fontSize: '12px', border: isSelected ? '2px solid #1d4ed8' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {weekNum}
              </div>
              {/* Day cells */}
              {grid.map((d, di) => {
                const inProj      = isInProject(d);
                const isStart     = d && projStart && d.getFullYear() === projStart.getFullYear() && d.getMonth() === projStart.getMonth() && d.getDate() === projStart.getDate();
                const isToday     = d && (() => { const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); })();
                const isSun        = d && d.getDay() === 0;
                const isEvenSat    = d && isEvenSaturday(d); // 2nd & 4th Saturday = non-working
                const isNonWorking = isSun || isEvenSat;
                return (
                  <div
                    key={di}
                    onClick={() => d && inProj && !isNonWorking && onSelectWeek(weekNum, fyYear)}
                    style={{
                      borderRadius: '6px', padding: '5px 4px', textAlign: 'center',
                      cursor: d && inProj && !isNonWorking ? 'pointer' : 'default',
                      background: isStart       ? '#dcfce7'
                                : isNonWorking  ? '#fef2f2'
                                : isSelected && inProj ? '#eff6ff'
                                : 'transparent',
                      color: isSun         ? '#dc2626'
                           : isEvenSat     ? '#d97706'
                           : isStart       ? '#16a34a'
                           : isToday       ? '#1d4ed8'
                           : !inProj && d  ? '#d1d5db'
                           : d             ? '#374151'
                           : 'transparent',
                      fontWeight: isStart || isToday || isNonWorking ? 700 : 400,
                      border: isStart      ? '1.5px solid #bbf7d0'
                            : isToday      ? '1.5px solid #bfdbfe'
                            : isSun        ? '1.5px solid #fca5a5'
                            : isEvenSat    ? '1.5px solid #fed7aa'
                            : '1.5px solid transparent',
                      fontSize: '12px', opacity: !inProj && d ? 0.35 : 1,
                      transition: 'background 0.1s',
                    }}
                  >
                    {d ? d.getDate() : ''}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px' }}>
        {projStart && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#dcfce7', border: '1.5px solid #bbf7d0', display: 'inline-block' }} />
            Project Start: {projStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#fef2f2', border: '1px solid #fca5a5', display: 'inline-block' }} />
          Sunday (Non-working)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#fef2f2', border: '1px solid #fed7aa', display: 'inline-block' }} />
          2nd &amp; 4th Saturday (Non-working)
        </div>
      </div>
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
  const [sortBy,            setSortBy]            = useState('employee');
  const [sortOrder,         setSortOrder]         = useState('asc');

  // Calendar navigation (calendar year + month)
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [month,   setMonth]   = useState(new Date().getMonth());

  // Selected week
  const [week,   setWeek]   = useState(null); // FY week number
  const [fyYear, setFYYear] = useState(null); // FY year

  // Holiday / capacity
  const [hasHolidays,  setHasHolidays]  = useState(false);
  const [holidayCount, setHolidayCount] = useState(0);

  // Plan form state
  const [existingConfig,    setExistingConfig]    = useState(null);
  const [checkingConfig,    setCheckingConfig]    = useState(false);
  const [teamMembers,       setTeamMembers]       = useState([]);
  const [loadingTeam,       setLoadingTeam]       = useState(false);
  const [teamSearch,        setTeamSearch]        = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeHours,     setEmployeeHours]     = useState({});
  const [totalWeeklyHours,  setTotalWeeklyHours]  = useState('');
  const [justification,     setJustification]     = useState('');
  const [saving,            setSaving]            = useState(false);
  const [saveMsg,           setSaveMsg]           = useState(null);

  // Remaining weekly capacity per employee (hours already planned across OTHER projects this week)
  const [empCapacity, setEmpCapacity] = useState({});

  // Inline edit
  const [editTarget,    setEditTarget]    = useState(null);
  const [editWarningFor, setEditWarningFor] = useState(null);

  const selectedProject  = projects.find((p) => p._id === selectedProjectId);
  const VALID_YEARS      = selectedProject
    ? getValidYears(selectedProject.startDate, selectedProject.endDate)
    : [new Date().getFullYear()];
  const VALID_MONTHS     = getValidMonths(calYear, selectedProject?.startDate, selectedProject?.endDate);

  const weeklyHoursCap = Number(totalWeeklyHours || 0);
  const overLimitIds   = selectedEmployees.filter((id) => Number(employeeHours[id] || 0) > weeklyHoursCap && weeklyHoursCap > 0);

  // Breakdown for selected week: Mon-Sat minus odd Saturday (if any) minus holidays
  const extraHolidayCount = hasHolidays ? Math.max(0, Number(holidayCount || 0)) : 0;
  const breakdown    = (week && fyYear) ? getWeekCapBreakdown(fyYear, week, extraHolidayCount) : null;
  const { workingDays = null, evenSat = false } = breakdown ?? {};
  const autoCapacity = workingDays != null ? workingDays * 8 : null;

  // Fetch projects
  useEffect(() => {
    fetch(SummaryApi.getProjects.url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.success) setProjects(data.data); });
  }, []);

  // Fetch team members
  useEffect(() => {
    setLoadingTeam(true);
    fetch(SummaryApi.getTeamMembers.url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.success) setTeamMembers(data.data); })
      .finally(() => setLoadingTeam(false));
  }, []);

  // Fetch plan records for selected project
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

  // When project changes, navigate calendar to project start
  useEffect(() => {
    if (!selectedProjectId || projects.length === 0) return;
    const proj = projects.find((p) => p._id === selectedProjectId);
    if (proj?.startDate) {
      const d = new Date(proj.startDate);
      setCalYear(d.getFullYear());
      const vMonths = getValidMonths(d.getFullYear(), proj.startDate, proj.endDate);
      setMonth(vMonths.includes(d.getMonth()) ? d.getMonth() : vMonths[0] ?? 0);
    }
    setWeek(null); setFYYear(null);
    setSelectedEmployees([]); setEmployeeHours({});
    setEmpCapacity({});
    setSaveMsg(null); setHasHolidays(false); setHolidayCount(0);
  }, [selectedProjectId, projects]);

  // Clamp month to valid range when year changes
  useEffect(() => {
    if (!selectedProject) return;
    const vMonths = getValidMonths(calYear, selectedProject.startDate, selectedProject.endDate);
    if (vMonths.length > 0 && !vMonths.includes(month)) setMonth(vMonths[0]);
  }, [calYear, selectedProject]);

  // Auto-fill weekly cap from working-days calculation (even Sat + holidays deducted)
  useEffect(() => {
    if (!week || !fyYear) return;
    const extra = hasHolidays ? Math.max(0, Number(holidayCount || 0)) : 0;
    const { workingDays: wd } = getWeekCapBreakdown(fyYear, week, extra);
    setTotalWeeklyHours(String(wd * 8));
  }, [week, fyYear, hasHolidays, holidayCount]);

  // Check existing config for selected week (only for the "plan exists" warning)
  const checkExistingConfig = useCallback(async () => {
    if (!selectedProjectId || !week || !fyYear) { setExistingConfig(null); return; }
    setCheckingConfig(true);
    try {
      const res  = await fetch(
        `${SummaryApi.getWeeklyProjectConfig.url}/${selectedProjectId}?year=${fyYear}&weekNumber=${week}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      setExistingConfig(data.success && data.data.length > 0 ? data.data[0] : null);
    } catch { /* silent */ }
    finally { setCheckingConfig(false); }
  }, [selectedProjectId, fyYear, week]);

  useEffect(() => { checkExistingConfig(); }, [checkExistingConfig]);

  // Fetch how many hours each employee already has planned (other projects) for the selected week.
  // The response also carries the saved global weekCap so the remaining calculation is consistent.
  const [savedWeekCap, setSavedWeekCap] = useState(null);
  const [showCapHint, setShowCapHint] = useState(true);
  useEffect(() => {
    if (!week || !fyYear) { setEmpCapacity({}); setSavedWeekCap(null); return; }
    const params = new URLSearchParams({ year: fyYear, weekNumber: week });
    if (selectedProjectId) params.append('excludeProjectId', selectedProjectId);
    fetch(`${SummaryApi.getEmployeeWeekCapacity.url}?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setEmpCapacity(data.data);
          setSavedWeekCap(data.weekCap ?? null);
        }
      })
      .catch(() => {});
  }, [week, fyYear, selectedProjectId]);

  const handleSelectWeek = (weekNum, fy) => {
    setWeek(weekNum);
    setFYYear(fy);
    setShowCapHint(true);
  };

  const toggleEmployee = (empId) => setSelectedEmployees((prev) =>
    prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
  );

  const handleSave = async () => {
    if (!selectedProjectId) { setSaveMsg({ type: 'error', text: 'Select a project.' }); return; }
    if (!week || !fyYear)   { setSaveMsg({ type: 'error', text: 'Select a week from the calendar.' }); return; }
    if (!totalWeeklyHours)  { setSaveMsg({ type: 'error', text: 'Enter Total Weekly Hours Cap.' }); return; }
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
          projectId: selectedProjectId,
          year: fyYear,
          weekNumber: week,
          totalWeeklyHours: Number(totalWeeklyHours),
          employees: selectedEmployees.map((id) => ({ employeeUserId: id, plannedHours: Number(employeeHours[id] || 0) })),
          justification: justification || `Bulk plan FY week ${week}/${fyYear}`,
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

  const onClickEditPlan = (plan) => {
    if (plan.workedHours > 0 || plan.leaveHours > 0 || plan.trainingHours > 0) {
      setEditWarningFor(plan);
    } else {
      setEditTarget({ planId: plan._id, plannedHours: String(plan.plannedHours), justification: '' });
    }
  };

  const handleInlineEdit = async (plan) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res  = await fetch(SummaryApi.bulkUpsertWeeklyPlan.url, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: plan.project?._id,
          year: plan.year,
          weekNumber: plan.weekNumber,
          totalWeeklyHours: plan.totalWeeklyHours || 0,
          employees: [{ employeeUserId: plan.employee?._id, plannedHours: Number(editTarget.plannedHours) }],
          justification: editTarget.justification || `Updated plan for FY week ${plan.weekNumber}/${plan.year}`,
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

  // Real-time project stats derived from plans
  const projectStats = {
    totalPlanned:  plans.reduce((s, p) => s + (p.plannedHours  || 0), 0),
    totalConsumed: plans.reduce((s, p) => s + (p.workedHours   || 0), 0),
    totalWeeks:    new Set(plans.map((p) => `${p.year}-${p.weekNumber}`)).size,
    submitted:     plans.filter((p) => p.logStatus === 'submitted').length,
    pending:       plans.filter((p) => p.logStatus !== 'submitted').length,
    latestProgress: (() => {
      const withPct = plans.filter((p) => p.progressPercent > 0).sort((a, b) =>
        a.year !== b.year ? b.year - a.year : b.weekNumber - a.weekNumber
      );
      return withPct.length > 0 ? withPct[0].progressPercent : 0;
    })(),
  };

  const handleClear = () => {
    setSelectedProjectId('');
    setPlans([]);
    setCalYear(new Date().getFullYear());
    setMonth(new Date().getMonth());
    setWeek(null); setFYYear(null);
    setExistingConfig(null);
    setSelectedEmployees([]); setEmployeeHours({});
    setEmpCapacity({}); setSavedWeekCap(null); setShowCapHint(true);
    setTotalWeeklyHours(''); setJustification('');
    setSaveMsg(null); setEditTarget(null); setEditWarningFor(null);
    setShowForm(true); setTableSearch('');
    setSortBy('week'); setSortOrder('asc');
    setHasHolidays(false); setHolidayCount(0);
  };

  // Plan records sort / filter
  const SORT_OPTIONS = [
    { value: 'week',       label: 'Week (default)' },
    { value: 'employee',   label: 'Employee Name'  },
    { value: 'year',       label: 'Year'           },
    { value: 'plannedHrs', label: 'Planned Hours'  },
    { value: 'status',     label: 'Status'         },
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
      if (sortBy === 'employee') {
        const na = (a.employee?.name || '').toLowerCase();
        const nb = (b.employee?.name || '').toLowerCase();
        const cmp = sortOrder === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
        if (cmp !== 0) return cmp;
        return (a.year * 100 + a.weekNumber) - (b.year * 100 + b.weekNumber);
      }
      let va, vb;
      if (sortBy === 'week')            { va = a.year * 100 + a.weekNumber; vb = b.year * 100 + b.weekNumber; }
      else if (sortBy === 'year')       { va = a.year; vb = b.year; }
      else if (sortBy === 'plannedHrs') { va = a.plannedHours || 0; vb = b.plannedHours || 0; }
      else if (sortBy === 'status')     { va = a.logStatus || ''; vb = b.logStatus || ''; }
      else { va = 0; vb = 0; }
      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const thStyle = { padding: '11px 15px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '11px 15px', fontSize: '13.5px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Edit warning modal ── */}
      {editWarningFor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(14,30,61,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', padding: '28px 32px', width: '100%', maxWidth: '460px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BsExclamationOctagon size={20} color="#d97706" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0e1e3d' }}>Employee Data Already Submitted</h4>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                  {editWarningFor.employee?.name} · FY Week {editWarningFor.weekNumber}/{editWarningFor.year}
                </p>
              </div>
            </div>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#92400e', lineHeight: 1.65, marginBottom: '20px' }}>
              Employee has already filled <strong>Actual / Training / Leave</strong> hours for this week.
              Please verify properly before editing because updating this plan may affect employee submitted data.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setEditWarningFor(null)}
                style={{ padding: '9px 20px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEditTarget({ planId: editWarningFor._id, plannedHours: String(editWarningFor.plannedHours), justification: '' });
                  setEditWarningFor(null);
                }}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}
              >
                Proceed &amp; Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', flexShrink: 0 }}>
            <BsCalendarWeek size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0e1e3d' }}>Weekly Plan Manager</h3>
            <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Assign planned hours per employee per week · FY weeks start April 1
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
                { label: 'Start',   value: selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                { label: 'End',     value: selectedProject.endDate   ? new Date(selectedProject.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                { label: 'Records', value: String(plans.length) },
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
          {/* ── Real-time project stats ── */}
          {plans.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px', padding: '14px 18px', background: 'linear-gradient(135deg,#f0f7ff,#f5f3ff)', border: '1.5px solid #dde7ff', borderRadius: '12px', alignItems: 'center' }}>
              {[
                { label: 'Total Planned (h)', value: projectStats.totalPlanned,  color: '#7c3aed' },
                { label: 'Total Consumed (h)', value: projectStats.totalConsumed, color: '#16a34a' },
                { label: 'Total Weeks',        value: projectStats.totalWeeks,    color: '#1d4ed8' },
                { label: 'Submitted',          value: projectStats.submitted,     color: '#16a34a' },
                { label: 'Pending',            value: projectStats.pending,       color: projectStats.pending > 0 ? '#d97706' : '#9ca3af' },
                { label: '% Progress',         value: `${projectStats.latestProgress}%`, color: '#4f46e5' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center', padding: '8px 16px', background: '#fff', borderRadius: '9px', border: '1px solid #e5e7eb', minWidth: '90px' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: s.color, marginTop: '2px' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Add / Update Plans form (collapsible) ── */}
          <div style={{ border: '1.5px solid #dde7ff', borderRadius: '14px', marginBottom: '24px', overflow: 'hidden' }}>
            <button
              onClick={() => setShowForm((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: showForm ? 'linear-gradient(135deg,#eff6ff,#f5f3ff)' : '#f8faff', border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BsPlusCircle size={16} color="#4f46e5" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0e1e3d' }}>Add / Update Plans</span>
                <span style={{ fontSize: '12.5px', color: '#6b7280', fontWeight: 400 }}>Assign planned hours to team members for a specific week</span>
              </div>
              {showForm ? <BsChevronUp size={14} color="#4f46e5" /> : <BsChevronDown size={14} color="#4f46e5" />}
            </button>

            {showForm && (
              <div style={{ padding: '22px 24px', borderTop: '1.5px solid #dde7ff', background: '#fff' }}>

                {/* Step 1 — Calendar Year + Month navigation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px', maxWidth: '480px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>Step 1 — Navigate Year</label>
                    <select value={calYear} onChange={(e) => { setCalYear(Number(e.target.value)); setWeek(null); setFYYear(null); }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff' }}>
                      {VALID_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>Step 2 — Navigate Month</label>
                    <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setWeek(null); setFYYear(null); }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff' }}>
                      {VALID_MONTHS.map((i) => <option key={i} value={i}>{MONTHS[i]}</option>)}
                    </select>
                  </div>
                </div>

                {/* Step 3 — Calendar */}
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                    Step 3 — Select Week (FY Week Number)
                    {week
                      ? <span style={{ marginLeft: '8px', color: '#1d4ed8', background: '#eff6ff', padding: '2px 10px', borderRadius: '12px', fontSize: '11.5px' }}>
                          FY Wk {week} · FY {fyYear} ✓
                        </span>
                      : <span style={{ marginLeft: '8px', color: '#d97706', background: '#fffbeb', padding: '2px 10px', borderRadius: '12px', fontSize: '11.5px' }}>
                          Click a week row to select
                        </span>}
                  </label>
                  <CalendarWidget
                    year={calYear} month={month}
                    projectStartDate={selectedProject?.startDate}
                    projectEndDate={selectedProject?.endDate}
                    selectedWeek={week} selectedFYYear={fyYear}
                    onSelectWeek={handleSelectWeek}
                  />
                </div>

                {/* Holiday input + auto capacity (shown after week selected) */}
                {week && fyYear && (
                  <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', marginBottom: '10px' }}>
                      Step 3b — Holidays &amp; Weekly Capacity
                    </div>

                    {/* Auto-deduction breakdown (always visible) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12px', marginBottom: '10px', padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                      <span style={{ color: '#374151', fontWeight: 600 }}>7 days</span>
                      <span style={{ color: '#6b7280' }}>−</span>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>1 Sun</span>
                      {evenSat && (
                        <>
                          <span style={{ color: '#6b7280' }}>−</span>
                          <span style={{ color: '#d97706', fontWeight: 600 }}>1 Even Sat</span>
                        </>
                      )}
                      {extraHolidayCount > 0 && (
                        <>
                          <span style={{ color: '#6b7280' }}>−</span>
                          <span style={{ color: '#d97706', fontWeight: 600 }}>{extraHolidayCount} holiday{extraHolidayCount !== 1 ? 's' : ''}</span>
                        </>
                      )}
                      <span style={{ color: '#6b7280' }}>=</span>
                      <span style={{ color: '#0369a1', fontWeight: 700 }}>{workingDays} working day{workingDays !== 1 ? 's' : ''}</span>
                      <span style={{ color: '#6b7280' }}>→</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>{autoCapacity}h cap</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>Any public holidays this week?</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>(Sunday &amp; 2nd/4th Saturday already excluded above)</span>
                      {[{ val: false, label: 'No' }, { val: true, label: 'Yes' }].map(({ val, label }) => (
                        <button
                          key={label} type="button"
                          onClick={() => { setHasHolidays(val); if (!val) setHolidayCount(0); }}
                          style={{ padding: '5px 16px', borderRadius: '7px', border: `1.5px solid ${hasHolidays === val ? '#0284c7' : '#e5e7eb'}`, background: hasHolidays === val ? '#e0f2fe' : '#fff', color: hasHolidays === val ? '#0284c7' : '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {label}
                        </button>
                      ))}
                      {hasHolidays && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>Count:</label>
                          <input
                            type="number" min="0" max="5" value={holidayCount}
                            onChange={(e) => setHolidayCount(Math.max(0, Math.min(5, Number(e.target.value))))}
                            style={{ width: '64px', padding: '5px 8px', borderRadius: '7px', border: '1.5px solid #7dd3fc', fontSize: '13px', outline: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {checkingConfig && <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Checking existing plan…</div>}
                {!checkingConfig && existingConfig && week && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BsExclamationTriangle size={14} />
                    Weekly plan already exists for FY Wk {week} / FY {fyYear}. Saving will update existing data.
                  </div>
                )}

                {/* Step 4 — Weekly Hours Cap */}
                <div style={{ marginBottom: '16px', maxWidth: '260px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>
                    Step 4 — Weekly Hours Cap (h) <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '5px' }}>(auto-filled)</span>
                  </label>
                  <p style={{ margin: '0 0 6px', fontSize: '11.5px', color: '#6b7280' }}>
                    Global cap for all employees this week across all projects.
                  </p>
                  <input
                    type="number" min="0" value={totalWeeklyHours}
                    onChange={(e) => setTotalWeeklyHours(e.target.value)}
                    placeholder="e.g. 40"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Step 5 — Employees */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                      Step 5 — Select Employees &amp; Plan Hours
                      <span style={{ marginLeft: '8px', fontWeight: 400, color: '#9ca3af', fontSize: '11.5px' }}>
                        {selectedEmployees.length > 0 ? `${selectedEmployees.length} selected` : 'Check to include'}
                      </span>
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
                          onClick={() => {
                            const vis = teamMembers.filter((m) => {
                              if (!teamSearch) return true;
                              const q = teamSearch.toLowerCase();
                              return m.name?.toLowerCase().includes(q) || m.employeeId?.toLowerCase().includes(q);
                            });
                            setSelectedEmployees((p) => [...new Set([...p, ...vis.map((m) => m._id)])]);
                          }}
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
                          .filter((m) => {
                            if (!teamSearch) return true;
                            const q = teamSearch.toLowerCase();
                            return m.name?.toLowerCase().includes(q) || m.employeeId?.toLowerCase().includes(q) || m.department?.toLowerCase().includes(q);
                          })
                          .map((m) => {
                            const empId      = m._id;
                            const isSelected = selectedEmployees.includes(empId);
                            const empHrs     = Number(employeeHours[empId] || 0);
                            const isOver     = isSelected && weeklyHoursCap > 0 && empHrs > weeklyHoursCap;

                            // Use the globally saved cap (consistent across projects); fall back to form value
                            const effectiveCap   = savedWeekCap ?? weeklyHoursCap;
                            const alreadyPlanned = empCapacity[empId] || 0;
                            const remaining      = effectiveCap > 0 ? Math.max(0, effectiveCap - alreadyPlanned) : null;
                            const capKnown       = week && fyYear && effectiveCap > 0;
                            const remainColor    = remaining === null ? '#6b7280'
                                                 : remaining === 0   ? '#dc2626'
                                                 : remaining < effectiveCap * 0.3 ? '#d97706'
                                                 : '#16a34a';

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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                                  <label style={{ fontSize: '12px', color: '#374151', whiteSpace: 'nowrap' }}>Planned Hrs:</label>
                                  <input
                                    type="number" min="0" max={remaining ?? (effectiveCap || undefined)}
                                    value={employeeHours[empId] ?? ''} onChange={(e) => setEmployeeHours((p) => ({ ...p, [empId]: e.target.value }))}
                                    placeholder="0" disabled={!isSelected} onClick={(e) => e.stopPropagation()}
                                    style={{ width: '72px', padding: '6px 10px', borderRadius: '7px', border: `1.5px solid ${isOver ? '#fca5a5' : '#e2e8f0'}`, fontSize: '13px', outline: 'none', background: isSelected ? '#fff' : '#f9fafb', color: isOver ? '#dc2626' : isSelected ? '#374151' : '#9ca3af', cursor: isSelected ? 'text' : 'not-allowed', fontWeight: isOver ? 700 : 400 }}
                                  />
                                  {capKnown && showCapHint && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: remainColor, background: remaining === 0 ? '#fef2f2' : remaining !== null && remaining < effectiveCap * 0.3 ? '#fffbeb' : '#f0fdf4', border: `1px solid ${remaining === 0 ? '#fca5a5' : remaining !== null && remaining < effectiveCap * 0.3 ? '#fde68a' : '#bbf7d0'}`, padding: '2px 6px 2px 8px', borderRadius: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      {alreadyPlanned > 0 ? `${alreadyPlanned}h used · ` : ''}{remaining === 0 ? 'Full' : `${remaining}h left`}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setShowCapHint(false); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: remainColor, fontWeight: 700, fontSize: '13px', lineHeight: 1, padding: '0 1px', marginLeft: '1px', opacity: 0.7 }}
                                        title="Dismiss"
                                      >×</button>
                                    </span>
                                  )}
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

                {/* Save message — shown right above Justification */}
                {saveMsg && (
                  <div style={{ background: saveMsg.type === 'success' ? '#f0fdf4' : saveMsg.type === 'warning' ? '#fffbeb' : '#fef2f2', border: `1px solid ${saveMsg.type === 'success' ? '#bbf7d0' : saveMsg.type === 'warning' ? '#fde68a' : '#fca5a5'}`, color: saveMsg.type === 'success' ? '#16a34a' : saveMsg.type === 'warning' ? '#92400e' : '#dc2626', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ flexShrink: 0, marginTop: '1px' }}>
                      {saveMsg.type === 'warning' ? <BsExclamationTriangle size={14} /> : saveMsg.type === 'success' ? <BsCheckCircle size={14} /> : <BsExclamationOctagon size={14} />}
                    </span>
                    <span>{saveMsg.text}</span>
                  </div>
                )}

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
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto' }}>
                  <span style={{ width: '4px', height: '22px', background: 'linear-gradient(to bottom,#3b82f6,#6366f1)', borderRadius: '2px', flexShrink: 0 }} />
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>
                    Plan Records — {selectedProject?.projectCode}
                  </h4>
                  <span style={{ fontSize: '12.5px', color: '#9ca3af' }}>{plans.length} record{plans.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <BsSearch size={13} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Search records…"
                    style={{ padding: '7px 12px 7px 30px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', width: '200px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>Sort by:</span>
                  <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setSortOrder('asc'); }}
                    style={{ padding: '7px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button onClick={() => setSortOrder((o) => o === 'asc' ? 'desc' : 'asc')}
                    style={{ padding: '7px 12px', borderRadius: '7px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1020px' }}>
                  <thead>
                    <tr>
                      {['Employee','Year','Week','Planned Hrs (H)','Actual Hrs','Leave Hrs','Training Hrs','% Progress','Total Wk Cap','Status','Action'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const planRow = (plan, rowBg) => {
                        const isEditing = editTarget?.planId === plan._id;
                        return (
                          <tr key={plan._id} style={{ background: rowBg }}>
                            <td style={{ ...tdStyle, fontWeight: 600, color: '#0e1e3d' }}>
                              {plan.employee?.name}
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{plan.employeeId}</div>
                            </td>
                            <td style={tdStyle}>{plan.year}</td>
                            <td style={tdStyle}>
                              <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                                Wk {plan.weekNumber}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              {isEditing ? (
                                <input type="number" min="0" value={editTarget.plannedHours}
                                  onChange={(e) => setEditTarget((p) => ({ ...p, plannedHours: e.target.value }))}
                                  style={{ width: '68px', padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #bfdbfe', fontSize: '13px', outline: 'none' }} />
                              ) : (
                                <span style={{ fontWeight: 700, color: '#7c3aed' }}>{plan.plannedHours}</span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 600 }}>
                              {plan.workedHours > 0 ? plan.workedHours : <span style={{ color: '#d1d5db' }}>—</span>}
                            </td>
                            <td style={{ ...tdStyle, color: plan.leaveHours > 0 ? '#9333ea' : '#6b7280' }}>
                              {plan.leaveHours != null ? plan.leaveHours : <span style={{ color: '#d1d5db' }}>—</span>}
                            </td>
                            <td style={{ ...tdStyle, color: plan.trainingHours > 0 ? '#d97706' : '#6b7280' }}>
                              {plan.trainingHours != null ? plan.trainingHours : <span style={{ color: '#d1d5db' }}>—</span>}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: '#7c3aed', fontSize: '15px' }}>
                              {plan.progressPercent != null ? `${plan.progressPercent}%` : <span style={{ color: '#d1d5db', fontWeight: 400 }}>—</span>}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: '#0369a1' }}>
                              {plan.totalWeeklyHours > 0 ? plan.totalWeeklyHours : <span style={{ color: '#d1d5db' }}>—</span>}
                            </td>
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
                                    <button onClick={() => handleInlineEdit(plan)} disabled={saving}
                                      style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#1d4ed8', color: '#fff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                                    <button onClick={() => setEditTarget(null)}
                                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '11.5px', cursor: 'pointer' }}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => onClickEditPlan(plan)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 11px', borderRadius: '6px', border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                  <BsPencil size={11} /> Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      };

                      if (sortBy !== 'employee') {
                        return sortedFilteredPlans.map((plan, i) => planRow(plan, i % 2 === 0 ? '#fff' : '#fafafa'));
                      }

                      // Employee-grouped rendering with per-employee summary rows
                      const output = [];
                      let i = 0;
                      while (i < sortedFilteredPlans.length) {
                        const first   = sortedFilteredPlans[i];
                        const empKey  = first.employee?._id || first.employeeId;
                        const gStart  = i;
                        while (i < sortedFilteredPlans.length &&
                          (sortedFilteredPlans[i].employee?._id || sortedFilteredPlans[i].employeeId) === empKey) {
                          i++;
                        }
                        const group = sortedFilteredPlans.slice(gStart, i);
                        group.forEach((plan, ri) => output.push(planRow(plan, ri % 2 === 0 ? '#fff' : '#fafafa')));

                        // Sum of all reported progress values for this employee
                        const pctRows  = group.filter((r) => r.progressPercent != null);
                        const totalPct = pctRows.length > 0 ? pctRows.reduce((s, r) => s + r.progressPercent, 0) : null;

                        output.push(
                          <tr key={`emp-summary-${empKey}`} style={{ background: 'linear-gradient(90deg,#eff6ff,#f5f3ff)', borderTop: '2px solid #bfdbfe', borderBottom: '2px solid #ddd6fe' }}>
                            <td colSpan={7} style={{ ...tdStyle, fontWeight: 700, color: '#4f46e5', fontSize: '12.5px' }}>
                              {first.employee?.name}
                              <span style={{ marginLeft: '8px', fontWeight: 400, color: '#9ca3af', fontSize: '11px' }}>Total Progress</span>
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 800, color: '#7c3aed', fontSize: '16px' }}>
                              {totalPct != null
                                ? <span style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', padding: '3px 10px', borderRadius: '12px' }}>{totalPct}%</span>
                                : <span style={{ color: '#d1d5db', fontWeight: 400, fontSize: '13px' }}>—</span>}
                            </td>
                            <td colSpan={3} style={tdStyle} />
                          </tr>
                        );
                      }
                      return output;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
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
