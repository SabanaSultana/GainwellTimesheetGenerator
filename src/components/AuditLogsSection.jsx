import React, { useState, useEffect, useCallback } from 'react';
import SummaryApi from '../apis/index.jsx';

const ACTION_COLOR = {
  create: { bg: '#dcfce7', color: '#16a34a' },
  update: { bg: '#eff6ff', color: '#1d4ed8' },
  delete: { bg: '#fef2f2', color: '#dc2626' },
};

const AuditLogsSection = ({ projectId }) => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = entityFilter
        ? `?projectId=${projectId}&entityType=${entityFilter}`
        : `?projectId=${projectId}`;
      const res  = await fetch(`${SummaryApi.getAuditLogs.url}${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setLogs(data.data);
      else setError(data.message || 'Failed to load audit logs');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [projectId, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const thStyle = { padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Audit Logs</h3>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Changes</option>
          <option value="Project">Project</option>
          <option value="DepartmentHours">Dept Hours</option>
          <option value="Allocation">Allocations</option>
          <option value="WeeklyPlan">Weekly Plans</option>
          <option value="WorkLog">Work Logs</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: '52px', borderRadius: '8px', background: '#f3f4f6' }} />)}
        </div>
      ) : error ? (
        <div style={{ color: '#dc2626', fontSize: '13px', padding: '16px', textAlign: 'center' }}>{error}</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>No audit logs found.</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Edited By</th>
                <th style={thStyle}>Date & Time</th>
                <th style={thStyle}>Justification</th>
                <th style={thStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const ac = ACTION_COLOR[log.action] || { bg: '#f3f4f6', color: '#374151' };
                const isExp = expanded === log._id;
                return (
                  <React.Fragment key={log._id}>
                    <tr style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={tdStyle}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, background: ac.bg, color: ac.color, textTransform: 'capitalize' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#6b7280' }}>{log.entityType}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#0e1e3d', fontSize: '13px' }}>{log.editedBy?.name || '—'}</div>
                        <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{log.editedBy?.employeeId} · {log.editedBy?.role}</div>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#6b7280' }}>
                        {log.editedAt ? new Date(log.editedAt).toLocaleString() : '—'}
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '200px' }}>
                        <span title={log.justification} style={{ display: 'block', fontSize: '12.5px', overflowY: 'auto', overflowX: 'hidden', maxHeight: '60px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {log.justification}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {(log.previousData || log.newData) && (
                          <button
                            onClick={() => setExpanded(isExp ? null : log._id)}
                            style={{ padding: '4px 12px', borderRadius: '6px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {isExp ? 'Hide' : 'View'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExp && (
                      <tr style={{ background: '#f8faff' }}>
                        <td colSpan={6} style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {log.previousData && (
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Previous</p>
                                <pre style={{ margin: 0, fontSize: '12px', color: '#374151', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', overflowX: 'hidden', overflowY: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                  {JSON.stringify(log.previousData, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newData && (
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>New</p>
                                <pre style={{ margin: 0, fontSize: '12px', color: '#374151', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', overflowX: 'hidden', overflowY: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                  {JSON.stringify(log.newData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogsSection;
