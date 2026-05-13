import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';

/**
 * Root layout for all authenticated pages.
 * Renders the sticky Navbar at the top and the active route below via <Outlet />.
 */
const App = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <main style={{ minHeight: '93vh' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default App;
