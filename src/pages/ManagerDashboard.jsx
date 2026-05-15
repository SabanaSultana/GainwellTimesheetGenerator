import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuthUser } from '../utils/auth';
import tabs from '../static_data/manager_navs';
import CreateProject from '../components/CreateProject.jsx';
import city_image from '../assets/City-skyline-doodle-580x386-removebg-preview.png';
import {
  BsGridFill,
  BsPlusCircle,
  BsListUl,
  BsPeopleFill,
  BsCalendarWeek,
  BsBarChartLine,
  BsFileEarmarkText,
} from 'react-icons/bs';



const TAB_ICONS = {
  createProject: <BsPlusCircle      size={15} />,
  showProjects:  <BsListUl          size={15} />,
  team:          <BsPeopleFill      size={15} />,
  addPlan:       <BsCalendarWeek    size={15} />,
  report:        <BsBarChartLine    size={15} />,
  reportReview:  <BsFileEarmarkText size={15} />,
};

const ManagerDashboard = () => {
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
            <BsGridFill size={24} color="#4f46e5" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0e1e3d', lineHeight: 1.2 }}>
              Manager Dashboard
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
            <img src={city_image} className='h-[10vh] w-[90vw]'></img>
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
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 20px',
                borderRadius: '9px',
                border: isActive ? 'none' : '1.5px solid #e5e7eb',
                background: isActive ? '#1d4ed8' : '#ffffff',
                color: isActive ? '#ffffff' : '#374151',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 14px rgba(29,78,216,0.28)' : '0 1px 4px rgba(0,0,0,0.06)',
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
      {activeKey === 'createProject' ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
            overflow: 'hidden',
          }}
        >
          <CreateProject embedded />
        </div>
      ) : (
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
                background: '#eff6ff', border: '2px solid #bfdbfe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px',
              }}
            >
              <span style={{ fontSize: '30px' }}>📋</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', margin: '0 0 8px' }}>
              {tabs.find((t) => t.key === activeKey)?.label}
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              This section is under development.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
