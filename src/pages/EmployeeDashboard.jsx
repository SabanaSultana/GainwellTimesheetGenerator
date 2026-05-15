import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuthUser } from '../utils/auth';
import tabs from '../static_data/employee_navs';
import {
  BsPerson,
  BsCalendarPlus,
  BsFolderFill,
  BsClockHistory,
} from 'react-icons/bs';

const CityAndPlane = () => (
  <>
    <style>{`
      .emp-city-svg {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        top: 0;
        width: 30%;
        height: 100%;
        pointer-events: none;
      }
      @media (max-width: 1400px) { .emp-city-svg { width: 24%; } }
      @media (max-width: 1100px) { .emp-city-svg { width: 18%; } }
      @media (max-width: 860px)  { .emp-city-svg { display: none; } }
    `}</style>
    <svg
      aria-hidden="true"
      className="emp-city-svg"
      viewBox="0 0 520 90"
      fill="none"
      preserveAspectRatio="xMidYMax meet"
    >
      <g opacity="0.55" transform="translate(370, 10)">
        <ellipse cx="28" cy="8" rx="28" ry="5.5" fill="#86c8a0"/>
        <polygon points="28,2 56,8 28,14" fill="#86c8a0"/>
        <polygon points="10,6 0,0 4,8" fill="#86c8a0"/>
        <polygon points="10,10 2,16 4,8" fill="#86c8a0"/>
        <polygon points="48,7 60,4 56,8" fill="#86c8a0"/>
      </g>
      <rect x="20"  y="55" width="16" height="35" fill="#86c8a0" opacity="0.34" rx="1"/>
      <rect x="40"  y="38" width="18" height="52" fill="#86c8a0" opacity="0.42" rx="1"/>
      <rect x="62"  y="20" width="16" height="70" fill="#86c8a0" opacity="0.54" rx="1"/>
      <rect x="65"  y="12" width="8"  height="10" fill="#86c8a0" opacity="0.54" rx="1"/>
      <rect x="82"  y="45" width="20" height="45" fill="#86c8a0" opacity="0.36" rx="1"/>
      <rect x="106" y="15" width="16" height="75" fill="#86c8a0" opacity="0.58" rx="1"/>
      <rect x="109" y="6"  width="8"  height="11" fill="#86c8a0" opacity="0.58" rx="1"/>
      <rect x="126" y="38" width="20" height="52" fill="#86c8a0" opacity="0.42" rx="1"/>
      <rect x="150" y="28" width="16" height="62" fill="#86c8a0" opacity="0.48" rx="1"/>
      <rect x="170" y="50" width="20" height="40" fill="#86c8a0" opacity="0.34" rx="1"/>
      <rect x="194" y="18" width="18" height="72" fill="#86c8a0" opacity="0.54" rx="1"/>
      <rect x="197" y="10" width="9"  height="10" fill="#86c8a0" opacity="0.54" rx="1"/>
      <rect x="216" y="42" width="16" height="48" fill="#86c8a0" opacity="0.38" rx="1"/>
      <rect x="236" y="30" width="20" height="60" fill="#86c8a0" opacity="0.46" rx="1"/>
      <rect x="260" y="55" width="14" height="35" fill="#86c8a0" opacity="0.32" rx="1"/>
      <rect x="278" y="22" width="18" height="68" fill="#86c8a0" opacity="0.50" rx="1"/>
      <rect x="281" y="14" width="9"  height="10" fill="#86c8a0" opacity="0.50" rx="1"/>
      <rect x="300" y="48" width="16" height="42" fill="#86c8a0" opacity="0.36" rx="1"/>
      <rect x="320" y="35" width="20" height="55" fill="#86c8a0" opacity="0.42" rx="1"/>
      <rect x="344" y="58" width="14" height="32" fill="#86c8a0" opacity="0.30" rx="1"/>
      <rect x="362" y="25" width="18" height="65" fill="#86c8a0" opacity="0.48" rx="1"/>
      <rect x="384" y="42" width="16" height="48" fill="#86c8a0" opacity="0.36" rx="1"/>
      <rect x="404" y="18" width="20" height="72" fill="#86c8a0" opacity="0.52" rx="1"/>
      <rect x="407" y="10" width="9"  height="10" fill="#86c8a0" opacity="0.52" rx="1"/>
      <rect x="428" y="50" width="14" height="40" fill="#86c8a0" opacity="0.30" rx="1"/>
      <rect x="446" y="32" width="18" height="58" fill="#86c8a0" opacity="0.44" rx="1"/>
      <rect x="468" y="55" width="14" height="35" fill="#86c8a0" opacity="0.30" rx="1"/>
      <rect x="486" y="22" width="16" height="68" fill="#86c8a0" opacity="0.46" rx="1"/>
    </svg>
  </>
);

const TAB_ICONS = {
  addWeekly: <BsCalendarPlus size={15} />,
  projects:  <BsFolderFill   size={15} />,
  hours:     <BsClockHistory size={15} />,
};

const EmployeeDashboard = () => {
  const { employeeId } = useParams();
  const session   = getAuthUser();
  const user      = session?.user;
  const firstName = user?.name?.split(' ')[0] ?? '';

  const [activeKey, setActiveKey] = useState(tabs[0].key);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 68px)',
        background: '#f4f6fb',
        padding: '32px 48px',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(to right, #ffffff 0%, #f3fdf7 25%, #e8faf1 55%, #d9f5e6 100%)',
          borderRadius: '14px',
          marginBottom: '22px',
          boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          flexWrap: 'wrap',
          position: 'relative',
          minHeight: '88px',
        }}
      >
        <CityAndPlane />

        {/* Left: icon + title */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            padding: '24px 36px', flex: '1 1 260px',
            position: 'relative', zIndex: 1,
          }}
        >
          <div
            style={{
              width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
              background: '#edfaf3', border: '1.5px solid #a7e3c0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <BsPerson size={26} color="#16a34a" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0e1e3d', lineHeight: 1.2 }}>
              Employee Dashboard
            </h1>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af', fontWeight: 400 }}>
              {user?.role}&nbsp;&nbsp;•&nbsp;&nbsp;{employeeId}
            </p>
          </div>
        </div>

        {/* Right: welcome text */}
        <div
          style={{
            padding: '20px 40px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flex: '0 1 340px',
            minWidth: '260px',
            position: 'relative', zIndex: 1,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>
              Welcome back,
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '22px', fontWeight: 700, color: '#0e1e3d', lineHeight: 1.2 }}>
              {firstName}
            </p>
          </div>
          <div
            style={{
              marginLeft: '8px', flexShrink: 0,
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(22,163,74,0.12)', border: '1.5px solid rgba(22,163,74,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px',
            }}
          >
            👋
          </div>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {tabs.map(({ key, label }) => {
          const isActive = activeKey === key;
          return (
            <button
              key={key}
              onClick={() => setActiveKey(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 20px',
                borderRadius: '9px',
                border: isActive ? 'none' : '1.5px solid #e5e7eb',
                background: isActive ? '#16a34a' : '#ffffff',
                color: isActive ? '#ffffff' : '#374151',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 14px rgba(22,163,74,0.28)' : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {TAB_ICONS[key]}
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Content panel ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#ffffff', borderRadius: '14px',
          padding: '64px 40px', minHeight: '52vh',
          boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#f0fdf4', border: '2px solid #bbf7d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <span style={{ fontSize: '30px' }}>🕐</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', margin: '0 0 8px' }}>
            {tabs.find((t) => t.key === activeKey)?.label}
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            This section is under development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
