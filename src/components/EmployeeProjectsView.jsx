import React, { useState, useEffect, useCallback } from 'react';
import SummaryApi from '../apis/index.jsx';
import { BsFolderFill } from 'react-icons/bs';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const EmployeeProjectsView = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

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
          <div key={i} style={{ height: '80px', borderRadius: '10px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
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
        const pct = p.totalAllocatedHours > 0 ? Math.min(100, Math.round((p.consumedHours / p.totalAllocatedHours) * 100)) : 0;
        return (
          <div
            key={p.allocationId}
            style={{
              background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '12px',
              padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}
          >
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
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Progress</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: pct >= 100 ? '#dc2626' : '#1d4ed8' }}>{pct}%</span>
              </div>
              <div style={{ height: '7px', borderRadius: '4px', background: '#e5e7eb', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#dc2626' : '#1d4ed8', borderRadius: '4px', transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeProjectsView;
