import React, { useState, useEffect, useCallback } from 'react';
import SummaryApi from '../apis/index.jsx';
import ConfirmModal from './ConfirmModal.jsx';

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];
const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

const WeeklyPlanSection = ({ projectId }) => {
  const [allocations, setAllocations] = useState([]);
  const [plans, setPlans]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [saveError, setSaveError]     = useState('');
  const [year, setYear]               = useState(currentYear);
  const [week, setWeek]               = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  });
  const [hours, setHours]     = useState({});
  const [justifications, setJustifications] = useState({});
  const [confirm, setConfirm] = useState(null);

  const fetchAllocations = useCallback(async () => {
    try {
      const res  = await fetch(`${SummaryApi.getAllocations.url}/${projectId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setAllocations(data.data);
    } catch { /* silent */ }
  }, [projectId]);

  const fetchPlans = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${SummaryApi.getWeeklyPlans.url}/${projectId}?year=${year}&weekNumber=${week}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
        const h = {}, j = {};
        data.data.forEach((p) => { h[p.employee?._id || p.employee] = p.plannedHours; j[p.employee?._id || p.employee] = ''; });
        setHours(h); setJustifications(j);
      }
    } catch { setError('Failed to load plans'); }
    finally { setLoading(false); }
  }, [projectId, year, week]);

  useEffect(() => { fetchAllocations(); }, [fetchAllocations]);
  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleSave = (alloc) => {
    const empId = alloc.employee?._id;
    const h     = Number(hours[empId] || 0);
    const j     = justifications[empId] || '';
    if (h < 0) { setSaveError('Hours cannot be negative'); return; }
    if (h > alloc.remainingHours + (plans.find((p) => (p.employee?._id || p.employee) === empId)?.plannedHours || 0)) {
      setSaveError(`Cannot plan more than remaining allocated hours (${alloc.remainingHours}h) for ${alloc.employee?.name}`);
      return;
    }
    setConfirm({
      title: 'Set Weekly Plan',
      message: `Plan ${h}h for ${alloc.employee?.name} in Week ${week}/${year}?`,
      onConfirm: async () => {
        setSaving(true); setSaveError('');
        try {
          const res  = await fetch(SummaryApi.upsertWeeklyPlan.url, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              employeeUserId: empId,
              year, weekNumber: week,
              plannedHours: h,
              justification: j || `Planned ${h}h for week ${week}/${year}`,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) { await fetchPlans(); setConfirm(null); }
          else { setSaveError(data.message || 'Failed to save'); setConfirm(null); }
        } catch { setSaveError('Network error'); setConfirm(null); }
        finally { setSaving(false); }
      },
    });
  };

  const getPlan = (empId) => plans.find((p) => (p.employee?._id || p.employee) === empId);

  const tdStyle = { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Weekly Planning Calendar</h3>
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
        </div>
      </div>

      {saveError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
          {saveError}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(3)].map((_, i) => <div key={i} style={{ height: '56px', borderRadius: '8px', background: '#f3f4f6' }} />)}
        </div>
      ) : allocations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>Allocate employees first before planning weekly hours.</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Employee', 'Total Allocated', 'Consumed', 'Remaining', `Plan for Wk ${week}/${year}`, 'Worked', 'Status', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allocations.map((a, i) => {
                const empId   = a.employee?._id;
                const plan    = getPlan(empId);
                const planned = plan?.plannedHours ?? 0;
                const worked  = plan?.workedHours  ?? 0;
                return (
                  <tr key={a._id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#0e1e3d' }}>{a.employee?.name}</div>
                      <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{a.employeeId}</div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#1d4ed8' }}>{a.totalAllocatedHours}h</td>
                    <td style={{ ...tdStyle, color: '#374151' }}>{a.consumedHours}h</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: a.remainingHours <= 0 ? '#dc2626' : '#16a34a' }}>{a.remainingHours}h</td>
                    <td style={tdStyle}>
                      <input
                        type="number" min="0" max={a.remainingHours + planned}
                        value={hours[empId] ?? planned}
                        onChange={(e) => setHours((p) => ({ ...p, [empId]: e.target.value }))}
                        style={{ width: '80px', padding: '6px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                      />
                    </td>
                    <td style={{ ...tdStyle, color: worked > 0 ? '#16a34a' : '#9ca3af', fontWeight: worked > 0 ? 700 : 400 }}>{worked}h</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600,
                        background: plan?.logStatus === 'submitted' ? '#dcfce7' : planned > 0 ? '#eff6ff' : '#f3f4f6',
                        color: plan?.logStatus === 'submitted' ? '#16a34a' : planned > 0 ? '#1d4ed8' : '#9ca3af',
                      }}>
                        {plan?.logStatus === 'submitted' ? 'Submitted' : planned > 0 ? 'Planned' : 'Not set'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleSave(a)} disabled={saving}
                        style={{
                          padding: '6px 14px', borderRadius: '7px', border: 'none',
                          background: saving ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)',
                          color: '#fff', fontSize: '12px', fontWeight: 600,
                          cursor: saving ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                        }}
                      >Save</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirm} title={confirm?.title} message={confirm?.message}
        confirmLabel="Yes, Plan It" loading={saving}
        onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default WeeklyPlanSection;
