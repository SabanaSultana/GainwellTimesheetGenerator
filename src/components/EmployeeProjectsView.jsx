import React, { useState, useEffect, useCallback } from 'react';
import SummaryApi from '../apis/index.jsx';
import { BsFolderFill, BsChevronDown, BsChevronUp } from 'react-icons/bs';

const PROJECT_PALETTES = [
  { accent: '#1d4ed8', light: '#eff6ff', border: '#bfdbfe', badge: '#dbeafe', text: '#1e40af', bar: '#3b82f6' },
  { accent: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe', badge: '#ede9fe', text: '#6d28d9', bar: '#8b5cf6' },
];

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
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '3px 11px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const WeeklyBreakdown = ({ projectId, palette }) => {
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

  if (loading) return <div style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>Loading weekly data…</div>;
  if (error)   return <div style={{ padding: '16px', color: '#dc2626', fontSize: '14px' }}>{error}</div>;
  if (logs.length === 0) return <div style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>No weekly entries found for this project.</div>;

  const thStyle = {
    padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700,
    color: palette.text, textTransform: 'uppercase', letterSpacing: '0.4px',
    borderBottom: `2px solid ${palette.border}`, background: palette.light, whiteSpace: 'nowrap',
  };
  const tdStyle = {
    padding: '11px 14px', fontSize: '14px', color: '#374151',
    borderBottom: `1px solid ${palette.border}`, verticalAlign: 'middle',
  };

  const cols = [
    { label: 'Year' },
    { label: 'Week No.' },
    { label: 'Planned (h)' },
    { label: 'Actual (h)' },
    { label: 'Leave (h)' },
    { label: 'Training (h)' },
    { label: 'Status' },
  ];

  return (
    <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1.5px solid ${palette.border}`, marginTop: '4px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
        <thead>
          <tr>
            {cols.map((c) => <th key={c.label} style={thStyle}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => {
            const planned  = log.plannedHours  || 0;
            const actual   = log.workedHours   || 0;
            const leave    = log.leaveHours    || 0;
            const training = log.trainingHours || 0;
            return (
              <tr key={log._id} style={{ background: i % 2 === 0 ? '#fff' : palette.light }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{log.year}</td>
                <td style={tdStyle}>
                  <span style={{ background: palette.badge, color: palette.accent, padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                    Wk {log.weekNumber}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#7c3aed' }}>{planned}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#1d4ed8' }}>{actual}</td>
                <td style={{ ...tdStyle, color: '#6d28d9' }}>{leave}</td>
                <td style={{ ...tdStyle, color: '#2563eb' }}>{training}</td>
                <td style={tdStyle}>{statusBadge(log.status)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const StatChip = ({ label, value, color, bg }) => (
  <div style={{ textAlign: 'center', padding: '10px 16px', background: bg, borderRadius: '10px', minWidth: '90px' }}>
    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</div>
  </div>
);

const EmployeeProjectsView = ({ refreshKey = 0 }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(null);

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

  useEffect(() => { fetchProjects(); }, [fetchProjects, refreshKey]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: '160px', borderRadius: '12px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
        ))}
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }

  if (error) {
    return <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '14px 18px', borderRadius: '10px', fontSize: '14px' }}>{error}</div>;
  }

  if (projects.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '70px 40px' }}>
        <BsFolderFill size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
        <p style={{ fontSize: '17px', fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>No projects assigned</p>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Your manager will allocate you to projects.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {projects.map((p, idx) => {
        const palette  = PROJECT_PALETTES[idx % PROJECT_PALETTES.length];
        const isExp    = expanded === p.allocationId;

        return (
          <div
            key={p.allocationId}
            style={{
              background: '#fff',
              border: `1.5px solid ${palette.border}`,
              borderRadius: '14px',
              boxShadow: `0 2px 12px ${palette.border}88`,
              overflow: 'hidden',
            }}
          >
            {/* Colored top accent strip */}
            <div style={{ height: '5px', background: `linear-gradient(90deg, ${palette.accent}, ${palette.bar})` }} />

            <div style={{ padding: '22px 26px' }}>
              {/* Project identity */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ background: palette.badge, color: palette.accent, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.3px' }}>
                      {p.project?.projectCode}
                    </span>
                    {p.department && (
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>{p.department}</span>
                    )}
                  </div>
                  <h3 style={{ margin: '0 0 5px', fontSize: '17px', fontWeight: 800, color: '#0e1e3d', wordBreak: 'break-word' }}>
                    {p.project?.projectName}
                  </h3>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#6b7280' }}>
                    {fmt(p.project?.startDate)} — {fmt(p.project?.endDate)}
                  </p>
                  {p.project?.projectDescription && (
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {p.project.projectDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats chips */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <StatChip label="Total Weeks"    value={p.totalWeeks ?? 0}     color="#1e40af"         bg="#e0e7ff"        />
                <StatChip label="Submitted"      value={p.submittedWeeks ?? 0} color="#16a34a"         bg="#f0fdf4"        />
                <StatChip label="Pending"        value={p.pendingWeeks ?? 0}   color={p.pendingWeeks > 0 ? '#d97706' : '#9ca3af'} bg={p.pendingWeeks > 0 ? '#fffbeb' : '#f9fafb'} />
              </div>

              {/* Toggle button */}
              <button
                onClick={() => setExpanded(isExp ? null : p.allocationId)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 16px', borderRadius: '8px',
                  border: `1.5px solid ${palette.border}`,
                  background: isExp ? palette.badge : '#fff',
                  color: isExp ? palette.accent : '#374151',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {isExp ? <BsChevronUp size={13} /> : <BsChevronDown size={13} />}
                {isExp ? 'Hide Weekly Details' : 'View Weekly Details'}
              </button>
            </div>

            {/* Weekly breakdown */}
            {isExp && (
              <div style={{ borderTop: `1.5px solid ${palette.border}`, padding: '0 26px 22px' }}>
                <p style={{ margin: '14px 0 10px', fontSize: '14px', fontWeight: 700, color: palette.accent }}>Weekly Breakdown</p>
                <WeeklyBreakdown projectId={p.project._id} palette={palette} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeProjectsView;
