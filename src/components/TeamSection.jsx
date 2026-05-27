import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BsPeopleFill, BsFolderFill, BsSearch, BsChevronDown, BsChevronUp, BsEnvelope, BsGraphUp } from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';

const TeamSection = ({ refreshKey = 0 }) => {
  const navigate              = useNavigate();
  const { employeeId }        = useParams(); // manager's employeeId from URL
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(SummaryApi.getTeamMembers.url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setMembers(data.data);
      else setError(data.message || 'Failed to load team');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam, refreshKey]);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.employeeId?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q)
    );
  });

  const totalActiveProjects = new Set(
    members.flatMap((m) => (m.assignedProjects || []).map((p) => p.projectCode).filter(Boolean))
  ).size;

  const thStyle = {
    padding: '12px 18px', textAlign: 'left', fontSize: '12.5px',
    fontWeight: 700, color: '#6b7280', textTransform: 'uppercase',
    letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6',
    background: '#fafafa', whiteSpace: 'nowrap',
  };
  const tdStyle = {
    padding: '14px 18px', fontSize: '14px', color: '#374151',
    borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle',
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: '58px', borderRadius: '8px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BsPeopleFill size={20} color="#4f46e5" />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0e1e3d' }}>Your Team</h3>
          <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
            {filtered.length} member{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <BsSearch size={14} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, email, dept…"
            style={{ padding: '9px 14px 9px 34px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', width: '280px' }}
          />
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {members.length === 0 && !loading && !error ? (
        <div style={{ textAlign: 'center', padding: '64px 40px' }}>
          <BsPeopleFill size={44} color="#d1d5db" style={{ marginBottom: '14px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No team members found</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Employees with your Employee ID set as their manager will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '22px' }}>
            {[
              { label: 'Total Members',   value: members.length,       color: '#1d4ed8', bg: '#eff6ff' },
              { label: 'Active Projects', value: totalActiveProjects,   color: '#d97706', bg: '#fffbeb' },
            ].map((c) => (
              <div key={c.label} style={{ background: c.bg, borderRadius: '12px', padding: '16px 24px', border: `1px solid ${c.color}22`, minWidth: '160px' }}>
                <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
              <thead>
                <tr>
                  {['Employee', 'Email', 'Employee ID', 'Department', 'Assigned Projects', 'Actions'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const isExp    = expanded === m._id;
                  const projCount = (m.assignedProjects || []).length;
                  return (
                    <React.Fragment key={m._id}>
                      <tr
                        style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                        onClick={() => setExpanded(isExp ? null : m._id)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa')}
                      >
                        {/* Employee name */}
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#0e1e3d' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{m.name?.charAt(0)?.toUpperCase()}</span>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0e1e3d' }}>{m.name}</div>
                              <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{m.role}</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={tdStyle}>
                          {m.email ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <BsEnvelope size={13} color="#6b7280" />
                              <span style={{ fontSize: '13.5px', color: '#374151' }}>{m.email}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: '13px' }}>—</span>
                          )}
                        </td>

                        {/* Employee ID */}
                        <td style={tdStyle}>
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                            {m.employeeId}
                          </span>
                        </td>

                        {/* Department */}
                        <td style={{ ...tdStyle, fontSize: '13.5px' }}>{m.department}</td>

                        {/* Assigned Projects */}
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {projCount === 0 ? (
                              <span style={{ color: '#9ca3af', fontSize: '13.5px' }}>None assigned</span>
                            ) : (
                              <>
                                <span style={{ background: projCount > 0 ? '#f0fdf4' : '#f3f4f6', color: projCount > 0 ? '#16a34a' : '#9ca3af', border: `1.5px solid ${projCount > 0 ? '#bbf7d0' : '#e5e7eb'}`, padding: '4px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: 700 }}>
                                  {projCount} project{projCount !== 1 ? 's' : ''}
                                </span>
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                  {(m.assignedProjects || []).slice(0, 2).map((p) => p.projectCode).join(', ')}
                                  {projCount > 2 ? ` +${projCount - 2} more` : ''}
                                </span>
                              </>
                            )}
                            <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
                              {isExp ? <BsChevronUp size={13} /> : <BsChevronDown size={13} />}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/dashboard/manager/${employeeId}/track-employee/${m.employeeId}`)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#3b82f6 80%,#6366f1)', color: '#fff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.3)', whiteSpace: 'nowrap' }}
                          >
                            <BsGraphUp size={13} /> Track Weekly Details
                          </button>
                        </td>
                      </tr>

                      {/* Expanded project details */}
                      {isExp && (
                        <tr style={{ background: '#f8faff' }}>
                          <td colSpan={6} style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6' }}>
                            <strong style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '10px' }}>
                              Assigned Projects Detail for {m.name}:
                            </strong>
                            {projCount === 0 ? (
                              <span style={{ color: '#9ca3af', fontSize: '13px' }}>No projects assigned.</span>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {(m.assignedProjects || []).map((p) => (
                                  <div key={p.projectCode} style={{ background: '#fff', border: '1.5px solid #dde7ff', borderRadius: '10px', padding: '10px 16px', fontSize: '13.5px' }}>
                                    <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{p.projectCode}</span>
                                    <span style={{ color: '#374151', marginLeft: '8px' }}>{p.projectName}</span>
                                    {p.fromPlan ? (
                                      <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '8px', marginLeft: '8px' }}>Plan-based</span>
                                    ) : (
                                      <span style={{ color: '#9ca3af', marginLeft: '8px', fontSize: '12px' }}>{p.allocatedHours}h allocated</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamSection;
