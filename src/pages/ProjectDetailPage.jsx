import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BsArrowLeft, BsFileEarmarkText, BsBuilding, BsPeopleFill,
  BsCalendarWeek, BsShieldCheck,
} from 'react-icons/bs';
import SummaryApi from '../apis/index.jsx';
import DeptHoursSection  from '../components/DeptHoursSection.jsx';
import AllocationSection from '../components/AllocationSection.jsx';
import WeeklyPlanSection from '../components/WeeklyPlanSection.jsx';
import AuditLogsSection  from '../components/AuditLogsSection.jsx';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const TABS = [
  { key: 'overview',   label: 'Overview',    icon: <BsFileEarmarkText size={14} /> },
  { key: 'dept',       label: 'Dept Hours',  icon: <BsBuilding        size={14} /> },
  { key: 'allocation', label: 'Allocation',  icon: <BsPeopleFill      size={14} /> },
  { key: 'weekly',     label: 'Weekly Plan', icon: <BsCalendarWeek    size={14} /> },
  { key: 'audit',      label: 'Audit Logs',  icon: <BsShieldCheck     size={14} /> },
];

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate      = useNavigate();
  const [project, setProject]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchProject = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${SummaryApi.getProjectById.url}/${projectId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
      else setError(data.message || 'Failed to load project');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 68px)', background: '#f4f6fb', padding: '32px 48px', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading project…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: 'calc(100vh - 68px)', background: '#f4f6fb', padding: '32px 48px', fontFamily: 'Arial, sans-serif' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '24px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <BsArrowLeft /> Back
        </button>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '16px', borderRadius: '10px', fontSize: '14px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: '#f4f6fb', padding: '32px 48px', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}>

      {/* ── Back button ────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '20px',
          padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
          background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <BsArrowLeft size={14} /> Back to Projects
      </button>

      {/* ── Header card ────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(to right, #ffffff 0%, #f5f7ff 30%, #eaefff 60%, #dde7ff 100%)',
          borderRadius: '14px', marginBottom: '22px',
          boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
          padding: '28px 36px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <span style={{ background: '#1d4ed8', color: '#fff', padding: '4px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                {project?.projectCode}
              </span>
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#0e1e3d', lineHeight: 1.2 }}>
              {project?.projectName}
            </h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#6b7280', maxWidth: '600px', lineHeight: 1.6, overflowY: 'auto', overflowX: 'hidden', maxHeight: '80px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {project?.projectDescription || 'No description provided.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Start Date', value: fmt(project?.startDate) },
              { label: 'End Date',   value: fmt(project?.endDate)   },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 3px', fontSize: '11.5px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0e1e3d' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
            Created by <strong style={{ color: '#374151' }}>{project?.createdBy?.name || '—'}</strong> ({project?.createdBy?.employeeId})
          </span>
          {project?.lastModifiedBy && (
            <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
              Last modified by <strong style={{ color: '#374151' }}>{project.lastModifiedBy.name}</strong>
            </span>
          )}
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {TABS.map(({ key, label, icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '9px 18px', borderRadius: '9px',
                border: isActive ? 'none' : '1.5px solid #e5e7eb',
                background: isActive ? 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)' : '#ffffff',
                color: isActive ? '#ffffff' : '#374151',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.18s ease', whiteSpace: 'nowrap',
              }}
            >
              {icon}{label}
            </button>
          );
        })}
      </div>

      {/* ── Content panel ──────────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px 32px', boxShadow: '0 2px 14px rgba(0,0,0,0.07)', minHeight: '420px' }}>

        {activeTab === 'overview' && (
          <div>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#0e1e3d' }}>Project Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Project Code',  value: project?.projectCode },
                { label: 'Project Name',  value: project?.projectName },
                { label: 'Start Date',    value: fmt(project?.startDate) },
                { label: 'End Date',      value: fmt(project?.endDate)   },
                { label: 'Created By',    value: `${project?.createdBy?.name || '—'} (${project?.createdBy?.employeeId || ''})` },
                { label: 'Last Modified', value: project?.lastModifiedBy ? project.lastModifiedBy.name : '—' },
                { label: 'Created On',    value: fmt(project?.createdAt) },
                { label: 'Updated At',    value: fmt(project?.updatedAt) },
              ].map((item) => (
                <div key={item.label} style={{ background: '#f8faff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e8eeff' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11.5px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0e1e3d' }}>{item.value || '—'}</p>
                </div>
              ))}
            </div>
            {project?.projectDescription && (
              <div style={{ marginTop: '20px', background: '#f8faff', borderRadius: '10px', padding: '16px', border: '1px solid #e8eeff' }}>
                <p style={{ margin: '0 0 6px', fontSize: '11.5px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Description</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.7, overflowY: 'auto', overflowX: 'hidden', maxHeight: '120px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{project.projectDescription}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dept'       && <DeptHoursSection  projectId={projectId} />}
        {activeTab === 'allocation' && <AllocationSection projectId={projectId} />}
        {activeTab === 'weekly'     && <WeeklyPlanSection projectId={projectId} />}
        {activeTab === 'audit'      && <AuditLogsSection  projectId={projectId} />}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
