import React, { useState, useEffect, useCallback } from 'react';
import { BsBarChartLine, BsArrowClockwise, BsXCircle } from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

const currentYear = new Date().getFullYear();
const now         = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 1);
const currentWeek = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);

const StatCard = ({ label, value, color, bg, sub }) => (
  <div style={{ background: bg, borderRadius: '12px', padding: '18px 20px', border: `1px solid ${color}22`, flex: '1 1 160px', minWidth: '140px' }}>
    <p style={{ margin: '0 0 6px', fontSize: '11.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</p>
    <p style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 700, color }}>{value}</p>
    {sub && <p style={{ margin: 0, fontSize: '11.5px', color: '#9ca3af' }}>{sub}</p>}
  </div>
);

const BarMetric = ({ label, value, max, color, pct }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '12.5px', fontWeight: 700, color }}>{value}h {pct !== undefined ? `(${pct}%)` : ''}</span>
    </div>
    <div style={{ height: '8px', borderRadius: '4px', background: '#e5e7eb', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s' }} />
    </div>
  </div>
);

const WeeklySummarySection = () => {
  const [year, setYear]         = useState(currentYear);
  const [week, setWeek]         = useState(currentWeek);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const YEARS = [currentYear - 1, currentYear, currentYear + 1];
  const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

  const fetchSummary = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${SummaryApi.getWeeklySummary.url}?year=${year}&weekNumber=${week}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setSummary(data.data);
      else setError(data.message || 'Failed to load summary');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, [year, week]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const utilizationColor = summary?.utilization >= 85 ? '#16a34a' : summary?.utilization >= 50 ? '#d97706' : '#dc2626';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BsBarChartLine size={18} color="#4f46e5" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Weekly Data Summary</h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={year} onChange={(e) => setYear(Number(e.target.value))}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={week} onChange={(e) => setWeek(Number(e.target.value))}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
          >
            {WEEKS.map((w) => <option key={w} value={w}>Week {w}</option>)}
          </select>
          <button
            onClick={fetchSummary}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BsArrowClockwise size={13} /> Refresh
          </button>
          <button
            onClick={() => { setYear(currentYear); setWeek(currentWeek); setSummary(null); setError(''); }}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BsXCircle size={13} /> Clear
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '14px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: '90px', borderRadius: '12px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : !summary ? null : (
        <>
          {/* Context label */}
          <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', fontSize: '13px', color: '#374151' }}>
            Showing data for <strong>Week {summary.weekNumber}, {summary.year}</strong>
            &nbsp;·&nbsp; <span style={{ color: '#6b7280' }}>{summary.employeeCount} employee{summary.employeeCount !== 1 ? 's' : ''} · {summary.projectCount} project{summary.projectCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
            <StatCard label="Allocated Weekly Hrs"  value={`${summary.totalAllocatedWeeklyHours}h`} color="#1d4ed8" bg="#eff6ff" sub="Sum of all project budgets" />
            <StatCard label="Total Planned Hrs"     value={`${summary.totalPlannedHours}h`}          color="#7c3aed" bg="#f5f3ff" sub="Manager-set plan for week" />
            <StatCard label="Total Actual Hrs"      value={`${summary.totalActualHours}h`}           color="#16a34a" bg="#f0fdf4" sub="Hours submitted by employees" />
            <StatCard label="Total Leave Hrs"       value={`${summary.totalLeaveHours}h`}            color="#9333ea" bg="#faf5ff" />
            <StatCard label="Total Training Hrs"    value={`${summary.totalTrainingHours}h`}         color="#d97706" bg="#fffbeb" />
            <StatCard
              label="Utilization"
              value={`${summary.utilization}%`}
              color={utilizationColor}
              bg={summary.utilization >= 85 ? '#f0fdf4' : summary.utilization >= 50 ? '#fffbeb' : '#fef2f2'}
              sub="Actual / Planned × 100"
            />
          </div>

          {/* Bar chart */}
          <div style={{ background: '#f8faff', border: '1.5px solid #dde7ff', borderRadius: '12px', padding: '20px 24px' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: '#0e1e3d' }}>Hours Breakdown</h4>
            <BarMetric label="Planned Hours"   value={summary.totalPlannedHours}          max={summary.totalAllocatedWeeklyHours || summary.totalPlannedHours}  color="#7c3aed" />
            <BarMetric label="Actual Hours"    value={summary.totalActualHours}           max={summary.totalPlannedHours || 1}    color="#16a34a" pct={summary.utilization} />
            <BarMetric label="Leave Hours"     value={summary.totalLeaveHours}            max={summary.totalAllocatedWeeklyHours || 1} color="#9333ea" />
            <BarMetric label="Training Hours"  value={summary.totalTrainingHours}         max={summary.totalAllocatedWeeklyHours || 1} color="#d97706" />

            {/* Utilization gauge */}
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 600 }}>Utilization</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: utilizationColor }}>{summary.utilization}%</span>
                </div>
                <div style={{ height: '12px', borderRadius: '6px', background: '#e5e7eb', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${Math.min(100, summary.utilization)}%`, height: '100%', background: `linear-gradient(90deg, ${utilizationColor}, ${utilizationColor}cc)`, borderRadius: '6px', transition: 'width 0.5s' }} />
                  {/* 85% target marker */}
                  <div style={{ position: 'absolute', left: '85%', top: 0, bottom: 0, width: '2px', background: '#1d4ed8', opacity: 0.5 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ fontSize: '10.5px', color: '#9ca3af' }}>0%</span>
                  <span style={{ fontSize: '10.5px', color: '#1d4ed8' }}>Target: 85%</span>
                  <span style={{ fontSize: '10.5px', color: '#9ca3af' }}>100%</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', minWidth: '100px' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto',
                  background: `conic-gradient(${utilizationColor} ${summary.utilization}%, #e5e7eb ${summary.utilization}%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f8faff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: utilizationColor }}>{summary.utilization}%</span>
                  </div>
                </div>
                <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#9ca3af' }}>Utilization</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeeklySummarySection;
