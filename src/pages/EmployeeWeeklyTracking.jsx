import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BsArrowLeft, BsPersonFill, BsCalendarWeek } from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

const EmployeeWeeklyTracking = () => {
  const { employeeId: managerEmpId, targetEmpId } = useParams();
  const navigate = useNavigate();

  const [employee,      setEmployee]      = useState(null);
  const [weeklyData,    setWeeklyData]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [projectPopup,  setProjectPopup]  = useState(null); // { code, name }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError('');
      try {
        // 1. Fetch employee info
        const empRes  = await fetch(`${SummaryApi.getUserByEmployeeId.url}/${targetEmpId}`, { credentials: 'include' });
        const empData = await empRes.json();
        if (empData.success) setEmployee(empData.data);

        // 2. Fetch all projects visible to manager
        const projRes  = await fetch(SummaryApi.getProjects.url, { credentials: 'include' });
        const projData = await projRes.json();
        if (!projData.success || !Array.isArray(projData.data)) {
          setWeeklyData([]); return;
        }

        // 3. Fetch work logs for each project filtered by this employee
        const allLogs = [];
        await Promise.all(
          projData.data.map(async (p) => {
            try {
              const url     = `${SummaryApi.getWorkLogs.url}/${p._id}?employeeId=${targetEmpId}`;
              const logRes  = await fetch(url, { credentials: 'include' });
              const logData = await logRes.json();
              if (logData.success && Array.isArray(logData.data)) {
                logData.data.forEach((l) => allLogs.push({ ...l, projectCode: p.projectCode, projectName: p.projectName }));
              }
            } catch { /* skip failed project */ }
          })
        );

        // 4. Aggregate by year + weekNumber
        const weekMap = {};
        allLogs.forEach((l) => {
          const key = `${l.year}-${String(l.weekNumber).padStart(2, '0')}`;
          if (!weekMap[key]) {
            weekMap[key] = {
              year: l.year, weekNumber: l.weekNumber,
              planned: 0, worked: 0, training: 0, leave: 0,
              submittedCount: 0, totalCount: 0,
              projects: [],
            };
          }
          weekMap[key].planned   += l.plannedHours  || 0;
          weekMap[key].worked    += l.workedHours   || 0;
          weekMap[key].training  += l.trainingHours || 0;
          weekMap[key].leave     += l.leaveHours    || 0;
          weekMap[key].totalCount += 1;
          if (l.status === 'submitted') weekMap[key].submittedCount += 1;
          weekMap[key].projects.push({ code: l.projectCode, name: l.projectName, status: l.status });
        });

        const sorted = Object.values(weekMap).sort((a, b) =>
          a.year !== b.year ? b.year - a.year : b.weekNumber - a.weekNumber
        );
        setWeeklyData(sorted);
      } catch { setError('Network error. Please try again.'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [targetEmpId]);

  const totals = weeklyData.reduce(
    (acc, w) => ({
      planned:  acc.planned  + w.planned,
      worked:   acc.worked   + w.worked,
      training: acc.training + w.training,
      leave:    acc.leave    + w.leave,
    }),
    { planned: 0, worked: 0, training: 0, leave: 0 }
  );

  const thStyle = {
    padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700,
    color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '2px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap',
  };
  const tdStyle = { padding: '13px 16px', fontSize: '13.5px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(`/dashboard/manager/${managerEmpId}`)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '9px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
      >
        <BsArrowLeft size={16} /> Back to Team
      </button>

      {/* ── Employee header ── */}
      <div style={{ background: 'linear-gradient(135deg,#f0f7ff,#f5f3ff)', border: '1.5px solid #dde7ff', borderRadius: '16px', padding: '24px 28px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
          {employee?.name
            ? <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{employee.name.charAt(0).toUpperCase()}</span>
            : <BsPersonFill size={28} color="#fff" />}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0e1e3d' }}>
              {employee?.name || targetEmpId}
            </h2>
            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              {targetEmpId}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            {employee?.department && <span>{employee.department} · </span>}
            {employee?.role && <span>{employee.role}</span>}
            {employee?.email && <span> · {employee.email}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5' }}>
          <BsCalendarWeek size={18} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Weekly Hours Overview</span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {weeklyData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total Planned',  value: `${totals.planned}h`,  color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Total Worked',   value: `${totals.worked}h`,   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Training',       value: `${totals.training}h`, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Leave',          value: `${totals.leave}h`,    color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
          ].map((c) => (
            <div key={c.label} style={{ background: c.bg, borderRadius: '12px', padding: '16px 20px', border: `1.5px solid ${c.border}` }}>
              <p style={{ margin: '0 0 5px', fontSize: '11.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Weekly table ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: '52px', borderRadius: '8px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '14px 18px', borderRadius: '10px', fontSize: '14px' }}>{error}</div>
      ) : weeklyData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 40px', background: '#f9fafb', borderRadius: '14px', border: '1.5px dashed #e5e7eb' }}>
          <BsCalendarWeek size={44} color="#d1d5db" style={{ marginBottom: '14px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No logs found</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>This employee hasn't submitted any work logs yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
            <thead>
              <tr>
                {['Year / Week', 'Total Planned (h)', 'Total Worked (h)', 'Training (h)', 'Leave (h)', 'Projects', 'Submitted'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((w, i) => {
                const allDone = w.submittedCount === w.totalCount && w.totalCount > 0;
                const partial  = w.submittedCount > 0 && w.submittedCount < w.totalCount;
                return (
                  <tr key={`${w.year}-${w.weekNumber}`} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.1s' }}>
                    <td style={{ ...tdStyle, fontWeight: 800, fontSize: '15px', color: '#0e1e3d' }}>
                      <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                        Wk {w.weekNumber}
                      </span>
                      <span style={{ marginLeft: '8px', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>{w.year}</span>
                    </td>
                    <td style={{ ...tdStyle, color: '#1d4ed8', fontWeight: 700 }}>{w.planned}h</td>
                    <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 700 }}>{w.worked}h</td>
                    <td style={{ ...tdStyle, color: '#d97706', fontWeight: 600 }}>{w.training}h</td>
                    <td style={{ ...tdStyle, color: '#9333ea', fontWeight: 600 }}>{w.leave}h</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {w.projects.map((p, pi) => (
                          <span
                            key={pi}
                            title={p.name || p.code}
                            onClick={() => setProjectPopup({ code: p.code, name: p.name })}
                            style={{ background: p.status === 'submitted' ? '#f0fdf4' : '#f3f4f6', color: p.status === 'submitted' ? '#16a34a' : '#6b7280', border: `1px solid ${p.status === 'submitted' ? '#bbf7d0' : '#e5e7eb'}`, padding: '2px 8px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline dotted' }}
                          >
                            {p.code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: allDone ? '#dcfce7' : partial ? '#fffbeb' : '#f3f4f6',
                        color:      allDone ? '#16a34a' : partial ? '#d97706' : '#9ca3af',
                      }}>
                        {allDone ? '✓ All Submitted' : partial ? `${w.submittedCount}/${w.totalCount}` : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* ── Project popup ── */}
      {projectPopup && (
        <div
          onClick={() => setProjectPopup(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '14px', padding: '28px 36px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', border: '1.5px solid #dde7ff', minWidth: '280px', textAlign: 'center' }}
          >
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Project Details</p>
            <span style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>
              {projectPopup.code}
            </span>
            <p style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#0e1e3d', wordBreak: 'break-word' }}>
              {projectPopup.name || '—'}
            </p>
            <button
              onClick={() => setProjectPopup(null)}
              style={{ padding: '8px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeWeeklyTracking;
