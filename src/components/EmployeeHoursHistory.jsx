import React, { useState, useEffect } from 'react';
import SummaryApi from '../apis/index.jsx';

const EmployeeHoursHistory = ({ refreshKey = 0 }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError('');
      try {
        // 1. Get all assigned projects
        const projRes  = await fetch(SummaryApi.getEmployeeProjects.url, { credentials: 'include' });
        const projData = await projRes.json();
        if (!projData.success || !Array.isArray(projData.data)) {
          setWeeklyData([]); return;
        }

        // 2. Fetch work logs for every project in parallel
        const allLogs = [];
        await Promise.all(
          projData.data.map(async (p) => {
            try {
              const logRes  = await fetch(`${SummaryApi.getWorkLogs.url}/${p.project._id}`, { credentials: 'include' });
              const logData = await logRes.json();
              if (logData.success && Array.isArray(logData.data)) {
                logData.data.forEach((l) => allLogs.push(l));
              }
            } catch { /* skip failed project */ }
          })
        );

        // 3. Aggregate by year+week
        const weekMap = {};
        allLogs.forEach((l) => {
          const key = `${l.year}-${String(l.weekNumber).padStart(2, '0')}`;
          if (!weekMap[key]) {
            weekMap[key] = {
              year: l.year, weekNumber: l.weekNumber,
              planned: 0, worked: 0, training: 0, leave: 0,
              submittedCount: 0, totalCount: 0,
            };
          }
          weekMap[key].planned  += l.plannedHours  || 0;
          weekMap[key].worked   += l.workedHours   || 0;
          weekMap[key].training += l.trainingHours || 0;
          weekMap[key].leave    += l.leaveHours    || 0;
          weekMap[key].totalCount += 1;
          if (l.status === 'submitted') weekMap[key].submittedCount += 1;
        });

        // Sort newest first
        const sorted = Object.values(weekMap).sort((a, b) =>
          a.year !== b.year ? b.year - a.year : b.weekNumber - a.weekNumber
        );
        setWeeklyData(sorted);
      } catch { setError('Network error. Please try again.'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [refreshKey]);

  const totals = weeklyData.reduce(
    (acc, w) => ({
      planned:  acc.planned  + w.planned,
      worked:   acc.worked   + w.worked,
      training: acc.training + w.training,
      leave:    acc.leave    + w.leave,
    }),
    { planned: 0, worked: 0, training: 0, leave: 0 }
  );

  const thStyle = { padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6', background: '#fafafa' };
  const tdStyle = { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Your Weekly Hours</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
          Aggregated across all assigned projects per week
        </p>
      </div>

      {weeklyData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total Planned',  value: `${totals.planned}h`,  color: '#1d4ed8', bg: '#eff6ff' },
            { label: 'Total Worked',   value: `${totals.worked}h`,   color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Training',       value: `${totals.training}h`, color: '#d97706', bg: '#fffbeb' },
            { label: 'Leave',          value: `${totals.leave}h`,    color: '#9333ea', bg: '#faf5ff' },
          ].map((c) => (
            <div key={c.label} style={{ background: c.bg, borderRadius: '10px', padding: '14px 16px', border: `1px solid ${c.color}22` }}>
              <p style={{ margin: '0 0 4px', fontSize: '11.5px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: '48px', borderRadius: '8px', background: '#f3f4f6' }} />)}
        </div>
      ) : error ? (
        <div style={{ color: '#dc2626', fontSize: '13px', padding: '16px', textAlign: 'center' }}>{error}</div>
      ) : weeklyData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>No logs submitted yet.</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Year / Week</th>
                <th style={thStyle}>Total Planned (h)</th>
                <th style={thStyle}>Total Worked (h)</th>
                <th style={thStyle}>Training (h)</th>
                <th style={thStyle}>Leave (h)</th>
                <th style={thStyle}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((w, i) => {
                const allDone = w.submittedCount === w.totalCount && w.totalCount > 0;
                const partial  = w.submittedCount > 0 && w.submittedCount < w.totalCount;
                return (
                  <tr key={`${w.year}-${w.weekNumber}`} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#0e1e3d' }}>
                      Wk {w.weekNumber}/{w.year}
                    </td>
                    <td style={{ ...tdStyle, color: '#1d4ed8', fontWeight: 700 }}>{w.planned}h</td>
                    <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 700 }}>{w.worked}h</td>
                    <td style={{ ...tdStyle, color: '#d97706' }}>{w.training}h</td>
                    <td style={{ ...tdStyle, color: '#9333ea' }}>{w.leave}h</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600,
                        background: allDone ? '#dcfce7' : partial ? '#fffbeb' : '#f3f4f6',
                        color:      allDone ? '#16a34a' : partial ? '#d97706' : '#9ca3af',
                      }}>
                        {allDone ? '✓ All Submitted' : partial ? `${w.submittedCount}/${w.totalCount} Submitted` : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeHoursHistory;
