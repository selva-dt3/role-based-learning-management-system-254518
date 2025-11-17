import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Navbar with brand and quick links.
 * @param {{onToggleTheme: () => void, themeLabel: string}} props
 */
export default function Navbar({ onToggleTheme, themeLabel }) {
  const { pathname } = useLocation();
  const useMock = String(process.env.REACT_APP_USE_MOCK_API || '').toLowerCase() === 'true';

  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-badge" aria-hidden>RB</div>
          <span className="brand-name">Role-Based LMS</span>
          {useMock && (
            <span
              aria-label="Mock API enabled"
              style={{
                marginLeft: 8,
                padding: '4px 8px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                background: 'rgba(37,99,235,0.12)',
                color: 'var(--primary)',
                border: '1px solid var(--primary)'
              }}
            >
              Mock API
            </span>
          )}
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
