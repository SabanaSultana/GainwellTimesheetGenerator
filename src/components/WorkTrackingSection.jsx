import React, { useState, useEffect, useCallback } from 'react';
import SummaryApi from '../apis/index.jsx';

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];
const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

const fmt = (n) => `${n}h`;

const WorkTrackingSection = ({ projectId }) => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [year, setYear]       = useState(currentYear);
  const [week, setWeek]       = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  });
  const [showAll, setShowAll] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = showAll ? `?year=${year}` : `?year=${year}&weekNumber=${week}`;
      const res  = await fetch(`${SummaryApi.getWorkLogs.url}/${projectId}${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setLogs(data.data);
      else setError(data.message || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [projectId, year, week, showAll]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totals = logs.reduce(
    (acc, l) => ({
      planned:  acc.planned  + (l.plannedHours  || 0),
      worked:   acc.worked   + (l.workedHours   || 0),
      training: acc.training + (l.trainingHours || 0),
      leave:    acc.leave    + (l.leaveHours    || 0),
    }),
    { planned: 0, worked: 0, training: 0, leave: 0 }
  );

  const thStyle = { padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Weekly Work Tracking</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {!showAll && (
            <select value={week} onChange={(e) => setWeek(Number(e.target.value))} style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              {WEEKS.map((w) => <option key={w} value={w}>Week {w}</option>)}
            </select>
          )}
          <button
            onClick={() => setShowAll((v) => !v)}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: showAll ? 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)' : '#fff', color: showAll ? '#fff' : '#374151', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
          >{showAll ? 'Week View' : 'Full Year'}</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Planned', value: fmt(totals.planned), color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Total Worked',  value: fmt(totals.worked),  color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Training',      value: fmt(totals.training),color: '#d97706', bg: '#fffbeb' },
          { label: 'Leave',         value: fmt(totals.leave),   color: '#9333ea', bg: '#faf5ff' },
        ].map((c) => (
          <div key={c.label} style={{ background: c.bg, borderRadius: '10px', padding: '14px 16px', border: `1px solid ${c.color}22` }}>
            <p style={{ margin: '0 0 4px', fontSize: '11.5px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{c.label}</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: '52px', borderRadius: '8px', background: '#f3f4f6' }} />)}
        </div>
      ) : error ? (
        <div style={{ color: '#dc2626', fontSize: '13px', padding: '16px', textAlign: 'center' }}>{error}</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>
          No work logs found for the selected period.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Department</th>
                {showAll && <th style={thStyle}>Week</th>}
                <th style={thStyle}>Planned</th>
                <th style={thStyle}>Worked</th>
                <th style={thStyle}>Training</th>
                <th style={thStyle}>Leave</th>
                <th style={thStyle}>Remaining</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => {
                const remaining = Math.max(0, (l.plannedHours || 0) - (l.workedHours || 0));
                return (
                  <tr key={l._id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#0e1e3d' }}>{l.employee?.name || l.employeeId}</div>
                      <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{l.employeeId}</div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px' }}>{l.department}</td>
                    {showAll && <td style={tdStyle}>Wk {l.weekNumber}/{l.year}</td>}
                    <td style={{ ...tdStyle, color: '#1d4ed8', fontWeight: 700 }}>{fmt(l.plannedHours || 0)}</td>
                    <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 700 }}>{fmt(l.workedHours)}</td>
                    <td style={{ ...tdStyle, color: '#d97706' }}>{fmt(l.trainingHours)}</td>
                    <td style={{ ...tdStyle, color: '#9333ea' }}>{fmt(l.leaveHours)}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: remaining === 0 ? '#dc2626' : '#374151' }}>{fmt(remaining)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600,
                        background: l.status === 'submitted' ? '#dcfce7' : '#f3f4f6',
                        color: l.status === 'submitted' ? '#16a34a' : '#9ca3af',
                      }}>
                        {l.status === 'submitted' ? 'Submitted' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#9ca3af' }}>
                      {l.submittedAt ? new Date(l.submittedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8faff', borderTop: '2px solid #dde7ff' }}>
                <td colSpan={showAll ? 3 : 2} style={{ ...tdStyle, fontWeight: 700, color: '#0e1e3d', fontSize: '12.5px' }}>TOTALS</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#1d4ed8' }}>{fmt(totals.planned)}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#16a34a' }}>{fmt(totals.worked)}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#d97706' }}>{fmt(totals.training)}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#9333ea' }}>{fmt(totals.leave)}</td>
                <td colSpan={3} style={tdStyle}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkTrackingSection;
