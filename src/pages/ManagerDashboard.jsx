
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuthUser } from '../utils/auth';
import tabs from '../static_data/manager_navs';

const ManagerDashboard = () => {
  const { employeeId } = useParams();
  const session = getAuthUser();
  const user = session?.user;

  const [activeKey, setActiveKey] = useState(tabs[0].key);
  const activeLabel = tabs.find((t) => t.key === activeKey)?.label ?? '';

  return (
    <div
      style={{
        minHeight: '93vh',
        background: '#f0f4f8',
        padding: '2.5vh 2.5vw',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header card ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '2.5vh 2.5vw',
          marginBottom: '2.5vh',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5vh',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(18px, 2.8vh, 28px)',
              fontWeight: 700,
              color: '#0e1e3d',
            }}
          >
            Manager Dashboard
          </h1>
          <p
            style={{
              margin: '0.5vh 0 0',
              fontSize: 'clamp(12px, 1.6vh, 16px)',
              color: '#6b7280',
            }}
          >
            {user?.role}&nbsp;·&nbsp;{employeeId}
          </p>
        </div>

        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '1.2vh 1.5vw',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(11px, 1.4vh, 14px)',
              color: '#1d4ed8',
              fontWeight: 600,
            }}
          >
            Welcome back, {user?.name?.split(' ')[0]}
          </p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        style={{
          display: 'flex',
          gap: '1vw',
          flexWrap: 'wrap',
          marginBottom: '2.5vh',
        }}
      >
        {tabs.map(({ key, label }) => {
          const isActive = activeKey === key;
          return (
            <button
              key={key}
              onClick={() => setActiveKey(key)}
              style={{
                padding: '1.2vh 1.8vw',
                borderRadius: '8px',
                border: isActive ? '2px solid #1d4ed8' : '2px solid #e5e7eb',
                background: isActive ? '#1d4ed8' : '#ffffff',
                color: isActive ? '#ffffff' : '#374151',
                fontSize: 'clamp(11px, 1.5vh, 14px)',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Content panel ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '5vh 3vw',
          minHeight: '55vh',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 'clamp(60px, 8vw, 90px)',
              height: 'clamp(60px, 8vw, 90px)',
              borderRadius: '50%',
              background: '#eff6ff',
              border: '2px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2.5vh',
            }}
          >
            <span style={{ fontSize: 'clamp(24px, 3.5vh, 36px)', color: '#3b82f6' }}>📋</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(14px, 2.2vh, 22px)',
              fontWeight: 700,
              color: '#1f2937',
              margin: '0 0 1vh',
            }}
          >
            {activeLabel}
          </h2>
          <p style={{ fontSize: 'clamp(12px, 1.6vh, 16px)', color: '#9ca3af', margin: 0 }}>
            This section is under development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
