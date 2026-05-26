import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import socket from '../socket';

const SocketContext = createContext({});

// Map API URL patterns to refresh types
const URL_TYPE_MAP = [
  { pattern: /\/api\/projects/,              type: 'projects'    },
  { pattern: /\/api\/weekly-plans/,          type: 'plans'       },
  { pattern: /\/api\/weekly-project-config/, type: 'plans'       },
  { pattern: /\/api\/work-logs/,             type: 'worklogs'    },
  { pattern: /\/api\/allocations/,           type: 'allocations' },
  { pattern: /\/api\/dept-hours/,            type: 'dept'        },
  { pattern: /\/api\/weekly-cap/,            type: 'plans'       },
];

const getType = (url) => {
  for (const { pattern, type } of URL_TYPE_MAP) {
    if (pattern.test(url)) return type;
  }
  return null;
};

export const SocketProvider = ({ children }) => {
  const [keys, setKeys]    = useState({});
  const lastBump           = useRef({});

  const bump = (type) => {
    lastBump.current[type] = Date.now();
    setKeys((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
  };

  useEffect(() => {
    // ── Cross-browser: socket.io events from backend ─────────────────────────
    // Skip if the same browser already bumped via fetch interceptor < 600ms ago
    const socketHandler = ({ type }) => {
      if (!type) return;
      const age = Date.now() - (lastBump.current[type] || 0);
      if (age > 600) bump(type);
    };
    socket.on('refresh', socketHandler);

    // ── Same-browser: intercept every fetch mutation ──────────────────────────
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res    = await originalFetch(...args);
      const url    = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      const method = (args[1]?.method || 'GET').toUpperCase();
      if (res.ok && method !== 'GET' && url.includes('/api/')) {
        const type = getType(url);
        if (type) bump(type);
      }
      return res;
    };

    return () => {
      socket.off('refresh', socketHandler);
      window.fetch = originalFetch;
    };
  }, []);

  return <SocketContext.Provider value={keys}>{children}</SocketContext.Provider>;
};

// Pass one or more type strings. Returns a number that increments whenever
// any of those types receive a refresh — use as a useEffect dependency.
export const useRefreshKey = (...types) => {
  const keys = useContext(SocketContext);
  return types.reduce((sum, t) => sum + (keys[t] || 0), 0);
};
