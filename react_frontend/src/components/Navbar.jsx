import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Navbar with brand and quick links.
 * @param {{onToggleTheme: () => void, themeLabel: string}} props
 */
export default function Navbar({ onToggleTheme, themeLabel }) {
  const { pathname } = useLocation();
  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-badge" aria-hidden>RB</div>
          <span className="brand-name">Role-Based LMS</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <NavLink to="/" active={pathname === '/'}>Home</NavLink>
          <NavLink to="/admin" active={pathname === '/admin'}>Admin</NavLink>
          <NavLink to="/hr" active={pathname === '/hr'}>HR</NavLink>
          <NavLink to="/employee" active={pathname === '/employee'}>Employee</NavLink>
          <button className="theme-toggle-btn" onClick={onToggleTheme} aria-label="Toggle theme">
            {themeLabel}
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className="btn"
      style={{
        background: active ? 'var(--secondary)' : 'var(--surface)',
        color: active ? '#1f2937' : 'var(--text)',
        border: '1px solid var(--border)'
      }}
    >
      {children}
    </Link>
  );
}
