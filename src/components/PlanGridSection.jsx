import React, { useState, useEffect, useCallback } from 'react';
import { BsTable, BsFolderFill, BsArrowClockwise, BsXCircle, BsPencilSquare } from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MONTH_PALETTE = [
  { bg: '#1e3a8a', text: '#fff', subBg: '#dbeafe', subText: '#1e40af' },
  { bg: '#065f46', text: '#fff', subBg: '#d1fae5', subText: '#065f46' },
];

function getWeekMonday(fyYear, weekNum) {
  const apr1 = new Date(fyYear, 3, 1);
  const apr1Day = apr1.getDay() || 7;
  const fyStart = new Date(fyYear, 3, 2 - apr1Day);
  const monday = new Date(fyStart);
  monday.setDate(fyStart.getDate() + (weekNum - 1) * 7);
  return monday;
}

function buildGridData(plans) {
  const weekMap = {};
  plans.forEach((p) => {
    const key = `${p.year}-${p.weekNumber}`;
    if (!weekMap[key]) weekMap[key] = { year: p.year, weekNumber: p.weekNumber, totalWeeklyHours: 0 };
    if (p.totalWeeklyHours > 0) weekMap[key].totalWeeklyHours = p.totalWeeklyHours;
  });

  const allWeeks = Object.values(weekMap).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.weekNumber - b.weekNumber
  );

  const monthGroups = [];
  let curGroup = null;
  allWeeks.forEach((w) => {
    const monday = getWeekMonday(w.year, w.weekNumber);
    const mIdx = monday.getMonth();
    const mYear = monday.getFullYear();
    const key = `${mYear}-${mIdx}`;
    if (!curGroup || curGroup.key !== key) {
      curGroup = { key, label: MONTH_SHORT[mIdx], year: mYear, colorIdx: monthGroups.length % 2, weeks: [] };
      monthGroups.push(curGroup);
    }
    curGroup.weeks.push(w);
  });

  const empMap = {};
  plans.forEach((p) => {
    const empId = String(p.employee?._id || p.employee);
    if (!empMap[empId]) empMap[empId] = { id: empId, name: p.employee?.name || 'Unknown', employeeId: p.employeeId || '' };
  });

  const planMap = {}, actualMap = {}, leaveMap = {}, trainingMap = {};
  plans.forEach((p) => {
    const empId = String(p.employee?._id || p.employee);
    const wKey = `${p.year}-${p.weekNumber}`;
    const k = `${empId}::${wKey}`;
    planMap[k] = p.plannedHours || 0;
    if (p.status != null) {
      actualMap[k]   = p.workedHours   || 0;
      leaveMap[k]    = p.leaveHours    || 0;
      trainingMap[k] = p.trainingHours || 0;
    }
  });

  const employees = Object.values(empMap).sort((a, b) => a.name.localeCompare(b.name));

  const empTotals = {};
  employees.forEach((emp) => {
    let planTotal = 0, actualTotal = 0, leaveTotal = 0, trainingTotal = 0;
    allWeeks.forEach((w) => {
      const k = `${emp.id}::${w.year}-${w.weekNumber}`;
      planTotal     += planMap[k]     || 0;
      actualTotal   += actualMap[k]   != null ? actualMap[k]   : 0;
      leaveTotal    += leaveMap[k]    != null ? leaveMap[k]    : 0;
      trainingTotal += trainingMap[k] != null ? trainingMap[k] : 0;
    });
    empTotals[emp.id] = { plan: planTotal, actual: actualTotal, leave: leaveTotal, training: trainingTotal };
  });

  return { allWeeks, monthGroups, employees, planMap, actualMap, leaveMap, trainingMap, weekMap, empTotals };
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  actual:   { label: 'Actual',   typeBg: '#4b5563', typeColor: '#fff', cellBg: '#6b7280', cellText: '#fff', totalColor: '#374151' },
  leave:    { label: 'Leave',    typeBg: '#6b7280', typeColor: '#fff', cellBg: '#9ca3af', cellText: '#fff', totalColor: '#4b5563' },
  training: { label: 'Training', typeBg: '#9ca3af', typeColor: '#fff', cellBg: '#d1d5db', cellText: '#374151', totalColor: '#6b7280' },
};

const EditModal = ({ modal, editVal, setEditVal, editJustify, setEditJustify, saving, saveError, onSave, onClose }) => {
  const cfg = TYPE_CONFIG[modal.type];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px 32px', width: '390px', boxShadow: '0 24px 72px rgba(0,0,0,0.35)', border: '2px solid #e5e7eb' }}>
        {/* Modal header bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cfg.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BsPencilSquare size={15} color="#fff" />
          </div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111827' }}>Edit {cfg.label} Hours</h3>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280' }}>
          <strong style={{ color: '#111827' }}>{modal.empName}</strong> · Week {modal.weekNumber} ({modal.year})
        </p>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {cfg.label} Hours
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: '11px 13px', borderRadius: '8px', border: `2px solid ${cfg.typeBg}`, outline: 'none', fontSize: '16px', fontWeight: 800, color: cfg.typeBg, boxSizing: 'border-box', background: '#f9fafb' }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Justification <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            value={editJustify}
            onChange={(e) => setEditJustify(e.target.value)}
            placeholder="Reason for this update…"
            rows={3}
            style={{ width: '100%', padding: '10px 13px', borderRadius: '8px', border: '1.5px solid #d1d5db', outline: 'none', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151' }}
          />
        </div>

        {saveError && (
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5' }}>{saveError}</p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '9px 22px', borderRadius: '8px', border: '1.5px solid #d1d5db', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: cfg.typeBg, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Grid ──────────────────────────────────────────────────────────────────────

const WeeklyGrid = ({ plans, project, onRefresh }) => {
  const [editModal,    setEditModal]    = useState(null);
  const [editVal,      setEditVal]      = useState('');
  const [editJustify,  setEditJustify]  = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [localOvr,     setLocalOvr]     = useState({});

  if (!plans || plans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 32px', background: '#f9fafb', borderRadius: '12px', border: '1.5px dashed #d1d5db' }}>
        <BsTable size={36} color="#9ca3af" style={{ display: 'block', margin: '0 auto 12px' }} />
        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>No weekly plans yet for this project</p>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Plans assigned in "Add Weekly Plan" will appear here.</p>
      </div>
    );
  }

  const { allWeeks, monthGroups, employees, planMap, actualMap, leaveMap, trainingMap, weekMap, empTotals } = buildGridData(plans);

  const getDisplayVal = (type, k) => {
    if (localOvr[k]?.[type] !== undefined) return localOvr[k][type];
    const map = type === 'actual' ? actualMap : type === 'leave' ? leaveMap : trainingMap;
    return map[k];
  };

  const openEdit = (empId, empName, year, weekNumber, type) => {
    const k   = `${empId}::${year}-${weekNumber}`;
    const cur = getDisplayVal(type, k);
    setEditModal({ empId, empName, year, weekNumber, type });
    setEditVal(cur != null ? String(cur) : '0');
    setEditJustify('');
    setSaveError('');
  };

  const handleSave = async () => {
    if (!editJustify.trim()) { setSaveError('Please provide a justification.'); return; }
    const newVal = Math.max(0, Number(editVal) || 0);
    const k = `${editModal.empId}::${editModal.year}-${editModal.weekNumber}`;
    const curActual   = getDisplayVal('actual',   k) ?? 0;
    const curLeave    = getDisplayVal('leave',    k) ?? 0;
    const curTraining = getDisplayVal('training', k) ?? 0;

    setSaving(true); setSaveError('');
    try {
      const res = await fetch(SummaryApi.managerUpdateWorkLog.url, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId:      project?._id,
          employeeUserId: editModal.empId,
          year:           editModal.year,
          weekNumber:     editModal.weekNumber,
          workedHours:    editModal.type === 'actual'   ? newVal : curActual,
          leaveHours:     editModal.type === 'leave'    ? newVal : curLeave,
          trainingHours:  editModal.type === 'training' ? newVal : curTraining,
          justification:  editJustify.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) { setSaveError(data.message || 'Save failed'); setSaving(false); return; }

      setLocalOvr((prev) => ({
        ...prev,
        [k]: {
          actual:   editModal.type === 'actual'   ? newVal : curActual,
          leave:    editModal.type === 'leave'    ? newVal : curLeave,
          training: editModal.type === 'training' ? newVal : curTraining,
        },
      }));
      setEditModal(null);
      if (onRefresh) onRefresh();
    } catch { setSaveError('Network error'); }
    finally { setSaving(false); }
  };

  const CW_NAME = 172, CW_TYPE = 72, CW_TOTAL = 62, CW_WEEK = 56;
  const L_NAME = 0, L_TYPE = CW_NAME, L_TOTAL = CW_NAME + CW_TYPE;

  const cellBase = {
    border: '1px solid #e5e7eb', verticalAlign: 'middle', textAlign: 'center',
    whiteSpace: 'nowrap', padding: '0 4px', boxSizing: 'border-box',
  };

  const sticky = (left, bg, extra = {}) => ({
    ...cellBase, position: 'sticky', left, zIndex: 2,
    background: bg, borderRight: '2px solid #d1d5db', ...extra,
  });

  const editableCell = (type, empId, empName, w, val, rowBg) => {
    const cfg    = TYPE_CONFIG[type];
    const hasVal = val != null;
    const planned = planMap[`${empId}::${w.year}-${w.weekNumber}`] || 0;
    const isOver  = type === 'actual' && hasVal && planned > 0 && val > planned;

    const bg    = isOver ? '#dc2626' : hasVal ? cfg.cellBg : rowBg;
    const color = hasVal ? cfg.cellText : '#d1d5db';

    return (
      <td
        key={`${w.year}-${w.weekNumber}`}
        title="Click to edit"
        onClick={() => openEdit(empId, empName, w.year, w.weekNumber, type)}
        style={{
          ...cellBase,
          background: bg,
          color,
          fontWeight: hasVal ? 700 : 400,
          fontSize: '12.5px',
          height: '30px',
          borderLeft: hasVal ? `1px solid rgba(255,255,255,0.12)` : '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'filter 0.12s, box-shadow 0.12s',
          outline: (!hasVal) ? '1px dashed #d1d5db' : 'none',
          outlineOffset: '-2px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(0.85)';
          e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${cfg.typeBg}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {hasVal ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            {val}
            <BsPencilSquare size={9} style={{ opacity: 0.75, flexShrink: 0 }} />
          </span>
        ) : (
          <span style={{ color: '#d1d5db', fontSize: '13px' }}>—</span>
        )}
      </td>
    );
  };

  return (
    <>
      {editModal && (
        <EditModal
          modal={editModal}
          editVal={editVal}         setEditVal={setEditVal}
          editJustify={editJustify} setEditJustify={setEditJustify}
          saving={saving}           saveError={saveError}
          onSave={handleSave}
          onClose={() => setEditModal(null)}
        />
      )}

      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1.5px solid #d1d5db', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
        <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: `${L_TOTAL + CW_TOTAL + allWeeks.length * CW_WEEK}px` }}>
          <colgroup>
            <col style={{ width: CW_NAME }} />
            <col style={{ width: CW_TYPE }} />
            <col style={{ width: CW_TOTAL }} />
            {allWeeks.map((w) => <col key={`${w.year}-${w.weekNumber}`} style={{ width: CW_WEEK }} />)}
          </colgroup>

          <thead>
            {/* Row 1: project banner + month groups */}
            <tr>
              <th colSpan={3} style={{ ...cellBase, position: 'sticky', left: 0, zIndex: 5, background: '#0f172a', color: '#fff', textAlign: 'left', padding: '0 14px', height: '40px', borderRight: '2px solid rgba(255,255,255,0.15)', fontWeight: 700 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BsFolderFill size={13} color="#9ca3af" />
                  <span style={{ fontSize: '12.5px' }}>{project?.projectCode}</span>
                  <span style={{ fontWeight: 400, fontSize: '11.5px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project?.projectName}</span>
                </div>
              </th>
              {monthGroups.map((mg) => {
                const c = MONTH_PALETTE[mg.colorIdx];
                return (
                  <th key={mg.key} colSpan={mg.weeks.length} style={{ ...cellBase, background: c.bg, color: c.text, fontWeight: 700, fontSize: '12px', height: '40px', letterSpacing: '0.5px', borderLeft: '2px solid rgba(255,255,255,0.15)' }}>
                    {mg.label} {mg.year}
                  </th>
                );
              })}
            </tr>

            {/* Row 2: column labels + week numbers */}
            <tr>
              <th style={{ ...sticky(L_NAME, '#f1f5f9', { textAlign: 'left', padding: '0 12px', zIndex: 4 }), fontSize: '11px', fontWeight: 700, color: '#64748b', height: '30px' }}>Employee</th>
              <th style={{ ...sticky(L_TYPE, '#f1f5f9', { zIndex: 3 }), fontSize: '11px', fontWeight: 700, color: '#64748b', height: '30px' }}>Type</th>
              <th style={{ ...sticky(L_TOTAL, '#f1f5f9', { zIndex: 3 }), fontSize: '11px', fontWeight: 700, color: '#64748b', height: '30px' }}>Total</th>
              {allWeeks.map((w) => {
                const monday = getWeekMonday(w.year, w.weekNumber);
                const mKey = `${monday.getFullYear()}-${monday.getMonth()}`;
                const mg = monthGroups.find((g) => g.key === mKey);
                const c = MONTH_PALETTE[mg?.colorIdx ?? 0];
                return (
                  <th key={`${w.year}-${w.weekNumber}`} style={{ ...cellBase, background: c.subBg, color: c.subText, fontWeight: 700, fontSize: '11.5px', height: '30px', borderLeft: '1px solid #d1d5db' }}>
                    W{w.weekNumber}
                  </th>
                );
              })}
            </tr>

            {/* Row 3: weekly hours cap */}
            <tr>
              <td colSpan={3} style={{ ...cellBase, position: 'sticky', left: 0, zIndex: 4, background: '#f0f9ff', borderRight: '2px solid #bae6fd', textAlign: 'left', padding: '0 12px', fontSize: '10.5px', fontWeight: 600, color: '#0284c7', height: '26px' }}>
                Wk Hours Cap
              </td>
              {allWeeks.map((w) => {
                const total = weekMap[`${w.year}-${w.weekNumber}`]?.totalWeeklyHours || 0;
                return (
                  <td key={`${w.year}-${w.weekNumber}`} style={{ ...cellBase, background: '#f0f9ff', color: '#0284c7', fontWeight: 700, fontSize: '12px', height: '26px', borderLeft: '1px solid #e0f2fe' }}>
                    {total > 0 ? total : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {employees.map((emp, ei) => {
              const rowBg = ei % 2 === 0 ? '#ffffff' : '#f9fafb';

              let ovrActual = 0, ovrLeave = 0, ovrTraining = 0;
              allWeeks.forEach((w) => {
                const k = `${emp.id}::${w.year}-${w.weekNumber}`;
                ovrActual   += getDisplayVal('actual',   k) ?? 0;
                ovrLeave    += getDisplayVal('leave',    k) ?? 0;
                ovrTraining += getDisplayVal('training', k) ?? 0;
              });

              return (
                <React.Fragment key={emp.id}>
                  {/* Plan row (read-only) */}
                  <tr>
                    <td style={{ ...sticky(L_NAME, rowBg, { textAlign: 'left', padding: '4px 12px', borderBottom: 'none', zIndex: 3 }), height: '34px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#0e1e3d', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1 }}>{emp.employeeId}</div>
                    </td>
                    <td style={{ ...sticky(L_TYPE, '#f0fdf4', { zIndex: 3 }), color: '#16a34a', fontWeight: 700, fontSize: '11.5px', height: '34px' }}>Plan</td>
                    <td style={{ ...sticky(L_TOTAL, '#f0fdf4', { zIndex: 3 }), color: '#15803d', fontWeight: 700, fontSize: '12.5px', height: '34px' }}>
                      {empTotals[emp.id].plan > 0 ? `${empTotals[emp.id].plan}h` : <span style={{ color: '#d1d5db', fontWeight: 400 }}>0h</span>}
                    </td>
                    {allWeeks.map((w) => {
                      const k   = `${emp.id}::${w.year}-${w.weekNumber}`;
                      const val = planMap[k];
                      return (
                        <td key={`${w.year}-${w.weekNumber}`} style={{ ...cellBase, background: val > 0 ? '#f0fdf4' : rowBg, color: val > 0 ? '#15803d' : '#e2e8f0', fontWeight: val > 0 ? 700 : 400, fontSize: '12.5px', height: '34px', borderLeft: '1px solid #e5e7eb' }}>
                          {val > 0 ? val : ''}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Actual row (editable) */}
                  <tr>
                    <td style={{ ...sticky(L_NAME, rowBg, { borderTop: 'none', zIndex: 3 }), height: '30px' }} />
                    <td style={{ ...sticky(L_TYPE, TYPE_CONFIG.actual.typeBg, { zIndex: 3, borderRight: '2px solid rgba(255,255,255,0.15)' }), color: TYPE_CONFIG.actual.typeColor, fontWeight: 700, fontSize: '11.5px', height: '30px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        Actual <BsPencilSquare size={9} style={{ opacity: 0.8 }} />
                      </span>
                    </td>
                    <td style={{ ...sticky(L_TOTAL, '#f3f4f6', { zIndex: 3 }), color: TYPE_CONFIG.actual.totalColor, fontWeight: 700, fontSize: '12.5px', height: '30px' }}>
                      {ovrActual > 0 ? `${ovrActual}h` : <span style={{ color: '#d1d5db', fontWeight: 400 }}>0h</span>}
                    </td>
                    {allWeeks.map((w) => {
                      const k   = `${emp.id}::${w.year}-${w.weekNumber}`;
                      const val = getDisplayVal('actual', k);
                      return editableCell('actual', emp.id, emp.name, w, val, rowBg);
                    })}
                  </tr>

                  {/* Leave row (editable) */}
                  <tr>
                    <td style={{ ...sticky(L_NAME, rowBg, { borderTop: 'none', zIndex: 3 }), height: '28px' }} />
                    <td style={{ ...sticky(L_TYPE, TYPE_CONFIG.leave.typeBg, { zIndex: 3, borderRight: '2px solid rgba(255,255,255,0.15)' }), color: TYPE_CONFIG.leave.typeColor, fontWeight: 700, fontSize: '11.5px', height: '28px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        Leave <BsPencilSquare size={9} style={{ opacity: 0.8 }} />
                      </span>
                    </td>
                    <td style={{ ...sticky(L_TOTAL, '#f3f4f6', { zIndex: 3 }), color: TYPE_CONFIG.leave.totalColor, fontWeight: 700, fontSize: '12.5px', height: '28px' }}>
                      {ovrLeave > 0 ? `${ovrLeave}h` : <span style={{ color: '#d1d5db', fontWeight: 400 }}>0h</span>}
                    </td>
                    {allWeeks.map((w) => {
                      const k   = `${emp.id}::${w.year}-${w.weekNumber}`;
                      const val = getDisplayVal('leave', k);
                      return editableCell('leave', emp.id, emp.name, w, val, rowBg);
                    })}
                  </tr>

                  {/* Training row (editable) */}
                  <tr style={{ borderBottom: `2px solid ${ei % 2 === 0 ? '#e5e7eb' : '#dde7ff'}` }}>
                    <td style={{ ...sticky(L_NAME, rowBg, { borderTop: 'none', zIndex: 3 }), height: '28px' }} />
                    <td style={{ ...sticky(L_TYPE, TYPE_CONFIG.training.typeBg, { zIndex: 3, borderRight: '2px solid rgba(255,255,255,0.15)' }), color: TYPE_CONFIG.training.typeColor, fontWeight: 700, fontSize: '11.5px', height: '28px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        Train <BsPencilSquare size={9} style={{ opacity: 0.8 }} />
                      </span>
                    </td>
                    <td style={{ ...sticky(L_TOTAL, '#f3f4f6', { zIndex: 3 }), color: TYPE_CONFIG.training.totalColor, fontWeight: 700, fontSize: '12.5px', height: '28px' }}>
                      {ovrTraining > 0 ? `${ovrTraining}h` : <span style={{ color: '#d1d5db', fontWeight: 400 }}>0h</span>}
                    </td>
                    {allWeeks.map((w) => {
                      const k   = `${emp.id}::${w.year}-${w.weekNumber}`;
                      const val = getDisplayVal('training', k);
                      return editableCell('training', emp.id, emp.name, w, val, rowBg);
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ── Main Section ──────────────────────────────────────────────────────────────

const PlanGridSection = ({ refreshKey = 0 }) => {
  const [projects,          setProjects]          = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [gridPlans,         setGridPlans]          = useState([]);
  const [loading,           setLoading]            = useState(false);
  const [error,             setError]              = useState('');

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  useEffect(() => {
    fetch(SummaryApi.getProjects.url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.success) setProjects(data.data); });
  }, [refreshKey]);

  const fetchGrid = useCallback(async () => {
    if (!selectedProjectId) { setGridPlans([]); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${SummaryApi.getWeeklyPlans.url}/${selectedProjectId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setGridPlans(data.data);
      else setError(data.message || 'Failed to load plans');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [selectedProjectId]);

  useEffect(() => { fetchGrid(); }, [fetchGrid]);

  // Silent background refresh — updates grid data without showing the loading spinner.
  const fetchGridSilent = useCallback(() => {
    if (!selectedProjectId) return;
    fetch(`${SummaryApi.getWeeklyPlans.url}/${selectedProjectId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.success) setGridPlans(data.data); })
      .catch(() => {});
  }, [selectedProjectId]);

  // Auto-refresh every 30 s when a project is selected.
  useEffect(() => {
    if (!selectedProjectId) return;
    const id = setInterval(fetchGridSilent, 30000);
    return () => clearInterval(id);
  }, [selectedProjectId, fetchGridSilent]);

  // Re-fetch instantly when the manager returns to the browser tab.
  useEffect(() => {
    if (!selectedProjectId) return;
    const onVisible = () => { if (document.visibilityState === 'visible') fetchGridSilent(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [selectedProjectId, fetchGridSilent]);

  const handleClear = () => {
    setSelectedProjectId('');
    setGridPlans([]);
    setError('');
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const uniqueEmployees = gridPlans.length > 0
    ? [...new Set(gridPlans.map((p) => String(p.employee?._id || p.employee)))].length
    : 0;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: 'linear-gradient(135deg,#0284c7,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.18)', flexShrink: 0 }}>
            <BsTable size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0e1e3d' }}>Plan vs Actual Overview</h3>
            <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Click any Actual / Leave / Training cell to edit it directly
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedProjectId && (
            <button
              onClick={fetchGrid}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #d1d5db', background: '#f3f4f6', color: '#374151', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              <BsArrowClockwise size={13} /> Refresh
            </button>
          )}
          <button
            onClick={handleClear}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            <BsXCircle size={13} /> Clear
          </button>
        </div>
      </div>

      {/* ── Project selector card ── */}
      <div style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border: '1.5px solid #bae6fd', borderRadius: '14px', padding: '18px 24px', marginBottom: '24px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Select Project to View
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ flex: '1 1 320px', maxWidth: '480px', padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #7dd3fc', fontSize: '13.5px', outline: 'none', background: '#fff', color: selectedProjectId ? '#0e1e3d' : '#94a3b8', fontWeight: selectedProjectId ? 600 : 400, cursor: 'pointer' }}
          >
            <option value="">— Select a project to view its plan vs actual grid —</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.projectCode} — {p.projectName}</option>
            ))}
          </select>

          {selectedProject && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: 'Start',     value: fmtDate(selectedProject.startDate) },
                { label: 'End',       value: fmtDate(selectedProject.endDate)   },
                { label: 'Employees', value: uniqueEmployees > 0 ? `${uniqueEmployees} with plans` : '—' },
                { label: 'Weeks',     value: gridPlans.length > 0 ? `${[...new Set(gridPlans.map((p) => `${p.year}-${p.weekNumber}`))].length} planned` : '—' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center', padding: '7px 14px', background: '#fff', borderRadius: '8px', border: '1px solid #bae6fd', minWidth: '80px' }}>
                  <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0e1e3d', marginTop: '2px' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Grid or prompt ── */}
      {!selectedProjectId ? (
        <div style={{ textAlign: 'center', padding: '72px 40px', background: '#f9fafb', borderRadius: '14px', border: '1.5px dashed #e5e7eb' }}>
          <BsFolderFill size={52} color="#d1d5db" style={{ display: 'block', margin: '0 auto 16px' }} />
          <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#374151' }}>Select a project to view the grid</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
            Choose a project from the dropdown above to see planned vs actual hours across all weeks.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <BsTable size={15} color="#1d4ed8" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0e1e3d' }}>Plan vs Actual Grid</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>— scroll horizontally for all weeks · click Actual / Leave / Training cells to edit</span>
          </div>

          {error ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: i === 0 ? '40px' : i <= 3 ? '30px' : '34px', borderRadius: '8px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
              ))}
              <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : (
            <WeeklyGrid plans={gridPlans} project={selectedProject} onRefresh={fetchGrid} />
          )}

          {!loading && !error && (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '12px 18px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Legend:</span>
              {[
                { bg: '#f0fdf4', border: '#16a34a', color: '#15803d', label: 'Plan — manager-assigned planned hours' },
                { bg: '#6b7280', border: '#4b5563', color: '#fff',    label: 'Actual — click to edit (editable)' },
                { bg: '#9ca3af', border: '#6b7280', color: '#fff',    label: 'Leave — click to edit (editable)' },
                { bg: '#d1d5db', border: '#9ca3af', color: '#374151', label: 'Training — click to edit (editable)' },
                { bg: '#fef2f2', border: '#dc2626', color: '#dc2626', label: 'Over-planned (actual > planned)' },
                { bg: '#f0f9ff', border: '#0284c7', color: '#0284c7', label: 'Wk Hours Cap' },
              ].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: l.bg, border: `1.5px solid ${l.border}`, flexShrink: 0 }} />
                  <span style={{ fontSize: '11.5px', color: l.color, fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlanGridSection;
