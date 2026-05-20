import React, { useState, useEffect, useCallback } from 'react';
import SummaryApi from '../apis/index.jsx';
import { BsFolderFill, BsChevronDown, BsChevronUp } from 'react-icons/bs';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusBadge = (status) => {
  const map = {
    submitted: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Submitted' },
    pending:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Pending'   },
    draft:     { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb', label: 'Draft'     },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '2px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 600 }}>
      {s.label}
    </span>
  );
};

const WeeklyBreakdown = ({ projectId }) => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    fetch(`${SummaryApi.getWorkLogs.url}/${projectId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) setLogs(data.data);
        else setError(data.message || 'Failed to load logs');
      })
      .catch(() => { if (!cancelled) setError('Network error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) return <div style={{ padding: '12px', color: '#9ca3af', fontSize: '13px' }}>Loading weekly data…</div>;
  if (error)   return <div style={{ padding: '12px', color: '#dc2626', fontSize: '13px' }}>{error}</div>;
  if (logs.length === 0) return <div style={{ padding: '12px', color: '#9ca3af', fontSize: '13px' }}>No weekly entries found for this project.</div>;

  const thStyle = { padding: '9px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '2px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '10px 12px', fontSize: '12.5px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '4px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
        <thead>
          <tr>
            {['Year', 'Week No.', 'Planned Hrs', 'Actual Hrs', 'Leave Hrs', 'Training Hrs', 'Total Wk Hrs', 'Remaining Hrs', 'Remarks', 'Status'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => {
            const planned   = log.plannedHours    || 0;
            const actual    = log.workedHours     || 0;
            const leave     = log.leaveHours      || 0;
            const training  = log.trainingHours   || 0;
            const totalWk   = log.totalWeeklyHours || 0;
            const remaining = Math.max(0, planned - actual);
            return (
              <tr key={log._id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{log.year}</td>
                <td style={{ ...tdStyle }}>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                    Wk {log.weekNumber}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#7c3aed' }}>{planned}h</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#16a34a' }}>{actual}h</td>
                <td style={{ ...tdStyle, color: '#9333ea' }}>{leave}h</td>
                <td style={{ ...tdStyle, color: '#d97706' }}>{training}h</td>
                <td style={{ ...tdStyle, color: '#1d4ed8', fontWeight: 600 }}>{totalWk > 0 ? `${totalWk}h` : '—'}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: remaining <= 0 ? '#dc2626' : '#0891b2' }}>{remaining}h</td>
                <td style={{ ...tdStyle, color: '#6b7280', maxWidth: '160px' }}>
                  <span title={log.remarks}>{log.remarks ? (log.remarks.length > 40 ? log.remarks.slice(0, 40) + '…' : log.remarks) : '—'}</span>
                </td>
                <td style={tdStyle}>{statusBadge(log.status)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const EmployeeProjectsView = () => {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(SummaryApi.getEmployeeProjects.url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setProjects(data.data);
      else setError(data.message || 'Failed to load projects');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: '100px', borderRadius: '10px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
        ))}
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }

  if (error) {
    return <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>;
  }

  if (projects.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 40px' }}>
        <BsFolderFill size={40} color="#d1d5db" style={{ marginBottom: '14px' }} />
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No projects assigned</p>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Your manager will allocate you to projects.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {projects.map((p) => {
        const pct    = p.totalAllocatedHours > 0 ? Math.min(100, Math.round((p.consumedHours / p.totalAllocatedHours) * 100)) : 0;
        const isExp  = expanded === p.allocationId;

        return (
          <div
            key={p.allocationId}
            style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
          >
            {/* Header row */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                      {p.project?.projectCode}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#9ca3af' }}>{p.department}</span>
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0e1e3d' }}>{p.project?.projectName}</h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#6b7280' }}>
                    {fmt(p.project?.startDate)} — {fmt(p.project?.endDate)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {[
                    { label: 'Allocated',  value: `${p.totalAllocatedHours}h`, color: '#1d4ed8' },
                    { label: 'Consumed',   value: `${p.consumedHours}h`,       color: '#16a34a' },
                    { label: 'Remaining',  value: `${p.remainingHours}h`,      color: p.remainingHours <= 0 ? '#dc2626' : '#0891b2' },
                    { label: 'This Week',  value: p.currentWeekPlan > 0 ? `${p.currentWeekPlan}h` : '—', color: '#d97706' },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Overall Progress</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: pct >= 100 ? '#dc2626' : '#1d4ed8' }}>{pct}%</span>
                </div>
                <div style={{ height: '7px', borderRadius: '4px', background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#dc2626' : '#1d4ed8', borderRadius: '4px', transition: 'width 0.4s' }} />
                </div>
              </div>

              {/* Expand / collapse toggle */}
              <button
                onClick={() => setExpanded(isExp ? null : p.allocationId)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '7px', border: '1.5px solid #e5e7eb', background: isExp ? '#eff6ff' : '#fff', color: isExp ? '#1d4ed8' : '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                {isExp ? <BsChevronUp size={12} /> : <BsChevronDown size={12} />}
                {isExp ? 'Hide Weekly Details' : 'View Weekly Details'}
              </button>
            </div>

            {/* Weekly breakdown */}
            {isExp && (
              <div style={{ borderTop: '1px solid #f3f4f6', padding: '0 24px 20px' }}>
                <WeeklyBreakdown projectId={p.project._id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeProjectsView;
