import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';
import Navbar from './components/Navbar';
import RoleSelector from './components/RoleSelector';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

// PUBLIC_INTERFACE
function App() {
  /** Main App component wires up routes and global theme.
   * Uses Ocean Professional theme and exposes role-based dashboards.
   */
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const themeLabel = useMemo(() => (theme === 'light' ? '🌙 Dark' : '☀️ Light'), [theme]);

  return (
    <div className="App">
      <Router>
        <Navbar onToggleTheme={toggleTheme} themeLabel={themeLabel} />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/employee" element={<EmployeeDashboard />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

// PUBLIC_INTERFACE
function Home() {
  /** Home page allows user to select role and navigate to dashboards. */
  return (
    <div className="page">
      <section className="hero">
        <h1 className="title">Role-Based Learning Management</h1>
        <p className="subtitle">Choose your role to proceed</p>
      </section>
      <RoleSelector />
    </div>
  );
}

export default App;
