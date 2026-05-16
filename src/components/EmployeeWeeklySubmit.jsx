import React, { useState, useEffect, useCallback } from 'react';
import SummaryApi from '../apis/index.jsx';
import ConfirmModal from './ConfirmModal.jsx';

const countWords = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];
const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

const EmployeeWeeklySubmit = () => {
  const [projects, setProjects]       = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject]= useState('');
  const [year, setYear]               = useState(currentYear);
  const [week, setWeek]               = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  });
  const [weekPlan, setWeekPlan]       = useState(null);
  const [existingLog, setExistingLog] = useState(null);
  const [form, setForm]               = useState({ workedHours: '', trainingHours: '', leaveHours: '', justification: '' });
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [confirm, setConfirm]         = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res  = await fetch(SummaryApi.getEmployeeProjects.url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
        if (data.data.length > 0) setSelectedProject(data.data[0].project._id);
      }
    } catch { /* silent */ }
    finally { setLoadingProjects(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Fetch plan and existing log when project/year/week changes
  const fetchPlanAndLog = useCallback(async () => {
    if (!selectedProject) return;
    setWeekPlan(null); setExistingLog(null);
    try {
      const [planRes, logRes] = await Promise.all([
        fetch(`${SummaryApi.getWeeklyPlans.url}/${selectedProject}?year=${year}&weekNumber=${week}`, { credentials: 'include' }),
        fetch(`${SummaryApi.getWorkLogs.url}/${selectedProject}?year=${year}&weekNumber=${week}`, { credentials: 'include' }),
      ]);
      const [planData, logData] = await Promise.all([planRes.json(), logRes.json()]);
      if (planData.success && planData.data.length > 0) setWeekPlan(planData.data[0]);
      if (logData.success && logData.data.length > 0) {
        const log = logData.data[0];
        setExistingLog(log);
        setForm({ workedHours: String(log.workedHours || ''), trainingHours: String(log.trainingHours || ''), leaveHours: String(log.leaveHours || ''), justification: '' });
      } else {
        setForm({ workedHours: '', trainingHours: '', leaveHours: '', justification: '' });
      }
    } catch { /* silent */ }
  }, [selectedProject, year, week]);

  useEffect(() => { fetchPlanAndLog(); }, [fetchPlanAndLog]);

  const validate = () => {
    const e = {};
    const worked   = Number(form.workedHours   || 0);
    const training = Number(form.trainingHours || 0);
    const leave    = Number(form.leaveHours    || 0);
    if (worked < 0 || training < 0 || leave < 0) e.workedHours = 'Hours cannot be negative';
    if (weekPlan && worked > weekPlan.plannedHours) e.workedHours = `Cannot exceed planned hours (${weekPlan.plannedHours}h)`;
    if (existingLog && existingLog.status === 'submitted' && !form.justification.trim()) {
      e.justification = 'Justification required to edit a submitted log';
    } else if (form.justification && countWords(form.justification) > 100) {
      e.justification = 'Maximum 100 words allowed';
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const alreadySubmitted = existingLog?.status === 'submitted';
    setConfirm({
      title:   alreadySubmitted ? 'Update Work Log' : 'Submit Work Log',
      message: `Submit ${form.workedHours || 0}h worked + ${form.trainingHours || 0}h training + ${form.leaveHours || 0}h leave for Week ${week}/${year}?`,
      onConfirm: async () => {
        setSaving(true); setSaveError(''); setSaveSuccess('');
        try {
          const res  = await fetch(SummaryApi.submitWorkLog.url, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId:     selectedProject,
              year, weekNumber: week,
              workedHours:   Number(form.workedHours   || 0),
              trainingHours: Number(form.trainingHours || 0),
              leaveHours:    Number(form.leaveHours    || 0),
              justification: form.justification || undefined,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setSaveSuccess('Work log submitted successfully!');
            setConfirm(null);
            setTimeout(() => setSaveSuccess(''), 5000);
            await fetchPlanAndLog();
          } else {
            setSaveError(data.message || 'Failed to submit');
            setConfirm(null);
          }
        } catch { setSaveError('Network error'); setConfirm(null); }
        finally { setSaving(false); }
      },
    });
  };

  const proj = projects.find((p) => p.project._id === selectedProject);
  const plannedHours = weekPlan?.plannedHours || 0;

  const inp = (field) => ({
    width: '100%', padding: '10px 13px', borderRadius: '8px', fontSize: '14px',
    border: `1.5px solid ${formErrors[field] ? '#f87171' : '#e2e8f0'}`,
    background: formErrors[field] ? '#fff5f5' : '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '720px' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Add Weekly Details</h3>

      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ ...inp('project'), padding: '10px 12px' }}
          >
            {loadingProjects ? <option>Loading…</option> : projects.map((p) => (
              <option key={p.project._id} value={p.project._id}>{p.project.projectCode} — {p.project.projectName}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ ...inp('year'), padding: '10px 12px' }}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Week</label>
          <select value={week} onChange={(e) => setWeek(Number(e.target.value))} style={{ ...inp('week'), padding: '10px 12px' }}>
            {WEEKS.map((w) => <option key={w} value={w}>Week {w}</option>)}
          </select>
        </div>
      </div>

      {/* Plan info */}
      {proj && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Allocated', value: `${proj.totalAllocatedHours}h`, color: '#1d4ed8', bg: '#eff6ff',  border: '#bfdbfe' },
            { label: 'Consumed',  value: `${proj.consumedHours}h`,       color: '#16a34a', bg: '#f0fdf4',  border: '#bbf7d0' },
            { label: 'Remaining', value: `${proj.remainingHours}h`,      color: proj.remainingHours <= 0 ? '#dc2626' : '#0891b2', bg: proj.remainingHours <= 0 ? '#fef2f2' : '#ecfeff', border: proj.remainingHours <= 0 ? '#fca5a5' : '#a5f3fc' },
            { label: 'Wk Plan',   value: plannedHours > 0 ? `${plannedHours}h` : 'No plan', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: '8px', padding: '12px 14px', border: `1px solid ${s.border}`, textAlign: 'center' }}>
              <p style={{ margin: '0 0 3px', fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {plannedHours === 0 && proj && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          ⚠️ No weekly plan has been set by your manager for Week {week}/{year}. You can still log training and leave hours.
        </div>
      )}

      {saveSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
          ✓ {saveSuccess}
        </div>
      )}
      {saveError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {saveError}
        </div>
      )}

      {existingLog?.status === 'submitted' && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          ℹ️ You already submitted a log for this week. You can update it — justification will be required.
        </div>
      )}

      {/* Form */}
      <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          {[
            { name: 'workedHours',   label: 'Worked Hours',   max: plannedHours || undefined },
            { name: 'trainingHours', label: 'Training Hours', max: undefined },
            { name: 'leaveHours',    label: 'Leave Hours',    max: undefined },
          ].map(({ name, label, max }) => (
            <div key={name}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{label}</label>
              <input
                type="number" min="0" max={max}
                value={form[name]}
                onChange={(e) => { setForm((p) => ({ ...p, [name]: e.target.value })); setFormErrors((p) => ({ ...p, [name]: '' })); }}
                placeholder="0"
                style={inp(name)}
              />
              {name === 'workedHours' && formErrors.workedHours && (
                <p style={{ color: '#ef4444', fontSize: '11.5px', margin: '3px 0 0' }}>{formErrors.workedHours}</p>
              )}
            </div>
          ))}
        </div>

        {(existingLog?.status === 'submitted') && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
              Justification <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={form.justification} rows={2} placeholder="Reason for updating this log…"
              onChange={(e) => { setForm((p) => ({ ...p, justification: e.target.value })); setFormErrors((p) => ({ ...p, justification: '' })); }}
              style={{ ...inp('justification'), resize: 'vertical', minHeight: '56px', overflowY: 'auto', overflowX: 'hidden' }}
            />
            <p style={{ textAlign: 'right', fontSize: '11px', margin: '3px 0 0', color: countWords(form.justification) > 100 ? '#ef4444' : '#9ca3af' }}>
              {countWords(form.justification)}/100 words
            </p>
            {formErrors.justification && <p style={{ color: '#ef4444', fontSize: '11.5px', margin: '3px 0 0' }}>{formErrors.justification}</p>}
          </div>
        )}

        <button
          onClick={handleSubmit} disabled={saving || !selectedProject}
          style={{
            padding: '10px 28px', borderRadius: '8px', border: 'none',
            background: saving || !selectedProject ? '#7aa0bc' : 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)',
            color: '#fff', fontSize: '14px', fontWeight: 600,
            cursor: saving || !selectedProject ? 'not-allowed' : 'pointer',
            boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
          }}
        >
          {saving ? 'Submitting…' : existingLog?.status === 'submitted' ? 'Update Log' : 'Submit Log'}
        </button>
      </div>

      <ConfirmModal
        isOpen={!!confirm} title={confirm?.title} message={confirm?.message}
        confirmLabel="Yes, Submit" loading={saving}
        onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default EmployeeWeeklySubmit;
