import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuthUser } from '../utils/auth';
import tabs from '../static_data/employee_navs';
import EmployeeProjectsView from '../components/EmployeeProjectsView.jsx';
import EmployeeWeeklySubmit  from '../components/EmployeeWeeklySubmit.jsx';
import EmployeeHoursHistory  from '../components/EmployeeHoursHistory.jsx';
import city_image from '../assets/City-skyline-doodle-580x386-removebg-preview.png';
import {
  BsPerson,
  BsCalendarPlus,
  BsFolderFill,
  BsClockHistory,
} from 'react-icons/bs';

const TAB_ICONS = {
  addWeekly: <BsCalendarPlus size={18} />,
  projects:  <BsFolderFill   size={18} />,
  hours:     <BsClockHistory size={18} />,
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
          background: 'linear-gradient(to right, #ffffff 0%, #f5f7ff 25%, #eaefff 55%, #dde7ff 100%)',
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
              background: '#eeefff', border: '1.5px solid #c7d0f8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <BsPerson size={24} color="#4f46e5" />
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
            minWidth: '300px',
            position: 'relative', zIndex: 1,
          }}
        >
          <div>
            <img src={city_image} className='h-[10vh] w-[90vw]' />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#4f63d2', fontWeight: 500 }}>
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
              background: 'rgba(79,99,210,0.12)', border: '1.5px solid rgba(79,99,210,0.2)',
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
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '13px 28px',
                borderRadius: '10px',
                border: isActive ? 'none' : '1.5px solid #e5e7eb',
                background: isActive ? 'linear-gradient(135deg, #3b82f6 80%, #60a5fa 100%)' : '#ffffff',
                color: isActive ? '#ffffff' : '#374151',
                fontSize: '15px', fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 16px rgba(59,130,246,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
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
          padding: '28px 32px', minHeight: '52vh',
          boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
        }}
      >
        {activeKey === 'addWeekly' && <EmployeeWeeklySubmit />}
        {activeKey === 'projects'  && <EmployeeProjectsView />}
        {activeKey === 'hours'     && <EmployeeHoursHistory />}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
