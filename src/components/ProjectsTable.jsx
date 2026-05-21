import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BsSearch, BsClockHistory, BsPencil, BsTrash } from 'react-icons/bs';
import { getAuthUser } from '../utils/auth';
import SummaryApi from '../apis/index.jsx';
import EditProjectModal from './EditProjectModal.jsx';
import JustificationHistoryModal from './JustificationHistoryModal.jsx';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const countWords = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const SORT_OPTIONS = [
  { value: 'code-asc',  label: 'Code: A → Z'         },
  { value: 'code-desc', label: 'Code: Z → A'         },
  { value: 'date-desc', label: 'Start: Newest First' },
  { value: 'date-asc',  label: 'Start: Oldest First' },
];

const ProjectsTable = ({ refreshKey = 0 }) => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { user } = getAuthUser();
  const canDelete = ['Manager(COE)', 'Head of Engineering', 'Admin'].includes(user?.role);

  const [projects, setProjects]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebounced]   = useState('');
  const [sortKey, setSortKey]             = useState('code-asc');
  const [editTarget, setEditTarget]             = useState(null);
  const [justificationTarget, setJustificationTarget] = useState(null);
  const [deleteTarget, setDeleteTarget]         = useState(null);
  const [deleteJust, setDeleteJust]       = useState('');
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState('');
  const debounceRef = useRef(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(SummaryApi.getProjects.url, { method: 'GET', credentials: 'include' });
      const data = await res.json();
      if (data.success) setProjects(data.data);
      else setError(data.message || 'Failed to load projects');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects, refreshKey]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const filtered = projects.filter((p) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return p.projectCode.toLowerCase().includes(q) || p.projectName.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'code-asc')  return a.projectCode.localeCompare(b.projectCode);
    if (sortKey === 'code-desc') return b.projectCode.localeCompare(a.projectCode);
    if (sortKey === 'date-desc') return new Date(b.startDate) - new Date(a.startDate);
    if (sortKey === 'date-asc')  return new Date(a.startDate) - new Date(b.startDate);
    return 0;
  });

  const handleEditSuccess = (updated) => {
    setProjects((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)));
  };

  const openDelete = (p) => {
    setDeleteTarget(p);
    setDeleteJust('');
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!deleteJust.trim()) { setDeleteError('Justification is required'); return; }
    if (countWords(deleteJust) > 100) { setDeleteError('Maximum 100 words allowed'); return; }
    setDeleting(true); setDeleteError('');
    try {
      const res  = await fetch(`${SummaryApi.deleteProject.url}/${deleteTarget._id}`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justification: deleteJust.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProjects((prev) => prev.filter((p) => p._id !== deleteTarget._id));
        setDeleteTarget(null);
      } else {
        setDeleteError(data.message || 'Failed to delete project');
      }
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const thStyle = {
    padding: '12px 16px', textAlign: 'left', fontSize: '11.5px',
    fontWeight: 700, color: '#6b7280', textTransform: 'uppercase',
    letterSpacing: '0.5px', borderBottom: '2px solid #f3f4f6',
    background: '#fafafa', whiteSpace: 'nowrap',
  };
  const tdStyle = {
    padding: '14px 16px', fontSize: '13px', color: '#374151',
    borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle',
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '360px' }}>
          <BsSearch size={14} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or name…"
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', color: '#374151', background: '#ffffff', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={sortKey} onChange={(e) => setSortKey(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', color: '#374151', background: '#ffffff', outline: 'none', cursor: 'pointer' }}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: '#9ca3af' }}>
          {sorted.length} project{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: '52px', borderRadius: '8px', background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 40px' }}>
          <span style={{ fontSize: '36px' }}>📁</span>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '14px 0 6px' }}>No projects found</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            {debouncedSearch ? 'Try a different search term' : 'Create your first project using the tab above'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>Project Name</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>End Date</th>
                <th style={{ ...thStyle, textAlign: 'center' }} title="Total planned hours across all employees, all weeks">Total Project Hrs (h)</th>
                <th style={{ ...thStyle, textAlign: 'center' }} title="Planned hours for employees in your department up to today">Dept Till Now (h)</th>
                <th style={thStyle}>Created By</th>
                <th style={thStyle}>Last Updated</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => (
                <tr
                  key={p._id}
                  style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa', transition: 'background 0.12s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafafa')}
                >
                  <td style={tdStyle}>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                      {p.projectCode}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#0e1e3d', maxWidth: '180px' }}>{p.projectName}</td>
                  <td style={{ ...tdStyle, color: '#6b7280', maxWidth: '160px', overflow: 'hidden' }}>
                    <span title={p.projectDescription} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', wordBreak: 'break-all' }}>
                      {p.projectDescription || '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>{fmt(p.startDate)}</td>
                  <td style={tdStyle}>{fmt(p.endDate)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: p.totalPlannedHrs > 0 ? '#7c3aed' : '#9ca3af' }}>
                      {p.totalPlannedHrs > 0 ? p.totalPlannedHrs : '—'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: p.deptTillNowHrs > 0 ? '#1d4ed8' : '#9ca3af' }}>
                      {p.deptTillNowHrs > 0 ? p.deptTillNowHrs : '—'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12.5px' }}>
                    {p.createdBy ? (
                      <div>
                        <div style={{ fontWeight: 600, color: '#374151' }}>{p.createdBy.name}</div>
                        <div style={{ color: '#9ca3af' }}>{p.createdBy.employeeId}</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: '#9ca3af' }}>
                    {p.lastModifiedBy
                      ? <div><div style={{ color: '#374151', fontWeight: 600 }}>{p.lastModifiedBy.name}</div><div>{fmt(p.updatedAt)}</div></div>
                      : fmt(p.createdAt)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        title="View justification history"
                        onClick={() => setJustificationTarget(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                      >
                        <BsClockHistory size={13} /> See Justification
                      </button>
                      <button
                        title="Edit project"
                        onClick={() => setEditTarget(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '7px', border: '1.5px solid #e5e7eb', background: '#ffffff', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <BsPencil size={12} /> Edit
                      </button>
                      {canDelete && (
                        <button
                          title="Delete project"
                          onClick={() => openDelete(p)}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '7px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <BsTrash size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditProjectModal project={editTarget} onClose={() => setEditTarget(null)} onSuccess={handleEditSuccess} />
      <JustificationHistoryModal project={justificationTarget} onClose={() => setJustificationTarget(null)} />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(14,30,61,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', padding: '32px', width: '100%', maxWidth: '480px', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', border: '1.5px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BsTrash size={18} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0e1e3d' }}>Delete Project</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#9ca3af' }}>{deleteTarget.projectCode} — {deleteTarget.projectName}</p>
              </div>
            </div>

            {/* Warning */}
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px', fontSize: '13px', color: '#92400e', lineHeight: 1.6 }}>
              ⚠️ This action is permanent and will remove all associated allocations, departmental hours, weekly plans, and work logs. This cannot be undone.
            </div>

            {deleteError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
                {deleteError}
              </div>
            )}

            {/* Justification */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
                Justification <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={deleteJust}
                onChange={(e) => { setDeleteJust(e.target.value); setDeleteError(''); }}
                rows={2}
                placeholder="Reason for deleting this project…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1.5px solid ${deleteError ? '#f87171' : '#e2e8f0'}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px', fontFamily: 'Arial, sans-serif', overflowY: 'auto', overflowX: 'hidden' }}
              />
              <p style={{ textAlign: 'right', fontSize: '11px', margin: '3px 0 0', color: countWords(deleteJust) > 100 ? '#ef4444' : '#9ca3af' }}>
                {countWords(deleteJust)}/100 words
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteTarget(null)} disabled={deleting}
                style={{ padding: '10px 22px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete} disabled={deleting || !deleteJust.trim()}
                style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: deleting || !deleteJust.trim() ? '#fca5a5' : '#dc2626', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: deleting || !deleteJust.trim() ? 'not-allowed' : 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsTable;
