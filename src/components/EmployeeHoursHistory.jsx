import React, { useState, useEffect, useCallback } from 'react';
import SummaryApi from '../apis/index.jsx';

const EmployeeHoursHistory = () => {
  const [projects, setProjects]     = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res  = await fetch(SummaryApi.getEmployeeProjects.url, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setProjects(data.data);
          if (data.data.length > 0) setSelectedProject(data.data[0].project._id);
        }
      } catch { /* silent */ }
    };
    fetchProjects();
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${SummaryApi.getWorkLogs.url}/${selectedProject}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setLogs(data.data);
      else setError(data.message || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [selectedProject]);

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

  const thStyle = { padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6', background: '#fafafa' };
  const tdStyle = { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Your Weekly Hours</h3>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', cursor: 'pointer', maxWidth: '300px' }}
        >
          {projects.map((p) => <option key={p.project._id} value={p.project._id}>{p.project.projectCode} — {p.project.projectName}</option>)}
        </select>
      </div>

      {logs.length > 0 && (
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
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>No logs submitted yet.</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Year/Week</th>
                <th style={thStyle}>Planned</th>
                <th style={thStyle}>Worked</th>
                <th style={thStyle}>Training</th>
                <th style={thStyle}>Leave</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={l._id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#0e1e3d' }}>Wk {l.weekNumber}/{l.year}</td>
                  <td style={{ ...tdStyle, color: '#1d4ed8', fontWeight: 700 }}>{l.plannedHours || 0}h</td>
                  <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 700 }}>{l.workedHours}h</td>
                  <td style={{ ...tdStyle, color: '#d97706' }}>{l.trainingHours}h</td>
                  <td style={{ ...tdStyle, color: '#9333ea' }}>{l.leaveHours}h</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600, background: l.status === 'submitted' ? '#dcfce7' : '#f3f4f6', color: l.status === 'submitted' ? '#16a34a' : '#9ca3af' }}>
                      {l.status === 'submitted' ? '✓ Submitted' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: '#9ca3af' }}>
                    {l.submittedAt ? new Date(l.submittedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeHoursHistory;
