import React, { useState, useEffect, useCallback } from 'react';
import { BsX, BsClockHistory } from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const clamp = (s, n = 60) => s && s.length > n ? s.slice(0, n) + '…' : s;

const JustificationHistoryModal = ({ project, onClose }) => {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [textPopup, setTextPopup] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!project) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch(
        `${SummaryApi.getAuditLogs.url}?projectId=${project._id}&entityType=Project`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) setLogs(data.data);
      else setError(data.message || 'Failed to load history');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [project]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  if (!project) return null;

  const getChangedFields = (prev, next) => {
    if (!prev || !next) return [];
    const fields = [];
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    allKeys.forEach((k) => {
      const oldVal = prev[k];
      const newVal = next[k];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        fields.push({
          field:    k,
          oldValue: oldVal != null ? String(oldVal).slice(0, 80) : '—',
          newValue: newVal != null ? String(newVal).slice(0, 80) : '—',
        });
      }
    });
    return fields;
  };

  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '11px 14px', fontSize: '12.5px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' };

  const openPopup = (text) => { if (text && text !== '—') setTextPopup(text); };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(14,30,61,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      {/* Inner text popup */}
      {textPopup && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(14,30,61,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 12px 48px rgba(0,0,0,0.28)', padding: '28px 32px', maxWidth: '520px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setTextPopup('')}
              style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', lineHeight: 1 }}
            >✕</button>
            <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{textPopup}</p>
          </div>
        </div>
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 12px 48px rgba(0,0,0,0.22)', width: '100%', maxWidth: '860px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1.5px solid #f3f4f6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BsClockHistory size={18} color="#1d4ed8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0e1e3d' }}>Justification History</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                {project.projectCode} — {project.projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <BsX size={18} color="#6b7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...Array(3)].map((_, i) => <div key={i} style={{ height: '52px', borderRadius: '8px', background: '#f3f4f6' }} />)}
            </div>
          ) : error ? (
            <div style={{ color: '#dc2626', fontSize: '13px', padding: '20px', textAlign: 'center' }}>{error}</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: '14px' }}>
              No edit history found for this project.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Changed By</th>
                    <th style={thStyle}>Date & Time</th>
                    <th style={thStyle}>Field Changed</th>
                    <th style={thStyle}>Old Value</th>
                    <th style={thStyle}>New Value</th>
                    <th style={thStyle}>Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => {
                    const changes = getChangedFields(log.previousData, log.newData);
                    const rows    = changes.length > 0 ? changes : [{ field: log.action, oldValue: '—', newValue: '—' }];
                    return rows.map((ch, ci) => (
                      <tr key={`${log._id}-${ci}`} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        {ci === 0 && (
                          <>
                            <td style={{ ...tdStyle, fontWeight: 600, color: '#0e1e3d' }} rowSpan={rows.length}>
                              {log.editedBy?.name || '—'}
                              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>{log.editedBy?.employeeId}</div>
                            </td>
                            <td style={{ ...tdStyle, fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }} rowSpan={rows.length}>
                              {fmt(log.editedAt)}
                            </td>
                          </>
                        )}
                        <td style={{ ...tdStyle, fontSize: '12px', color: '#374151', fontWeight: 600 }}>
                          {ch.field.replace(/([A-Z])/g, ' $1').trim()}
                        </td>
                        <td
                          style={{ ...tdStyle, color: '#dc2626', fontSize: '12px', maxWidth: '140px', cursor: ch.oldValue && ch.oldValue !== '—' ? 'pointer' : 'default' }}
                          onClick={() => openPopup(ch.oldValue)}
                          title={ch.oldValue !== '—' ? 'Click to view full text' : ''}
                        >
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: ch.oldValue && ch.oldValue !== '—' ? 'underline dotted #fca5a5' : 'none' }}>{clamp(ch.oldValue)}</span>
                        </td>
                        <td
                          style={{ ...tdStyle, color: '#16a34a', fontSize: '12px', maxWidth: '140px', cursor: ch.newValue && ch.newValue !== '—' ? 'pointer' : 'default' }}
                          onClick={() => openPopup(ch.newValue)}
                          title={ch.newValue !== '—' ? 'Click to view full text' : ''}
                        >
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: ch.newValue && ch.newValue !== '—' ? 'underline dotted #86efac' : 'none' }}>{clamp(ch.newValue)}</span>
                        </td>
                        {ci === 0 && (
                          <td
                            style={{ ...tdStyle, maxWidth: '200px', fontSize: '12px', color: '#374151', cursor: log.justification ? 'pointer' : 'default' }}
                            rowSpan={rows.length}
                            onClick={() => openPopup(log.justification)}
                            title={log.justification ? 'Click to view full text' : ''}
                          >
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: log.justification ? 'underline dotted #9ca3af' : 'none' }}>{clamp(log.justification)}</span>
                          </td>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JustificationHistoryModal;
