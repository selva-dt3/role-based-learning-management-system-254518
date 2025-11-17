import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * RoleSelector shows cards for Admin, HR, Employee roles and routes on select.
 */
export default function RoleSelector() {
  const navigate = useNavigate();
  const roles = [
    {
      key: 'admin',
      title: 'Admin',
      desc: 'Manage lessons, files, quizzes; track completion.',
      to: '/admin'
    },
    {
      key: 'hr',
      title: 'HR',
      desc: 'Assign lessons and track employee progress.',
      to: '/hr'
    },
    {
      key: 'employee',
      title: 'Employee',
      desc: 'View your assigned lessons and mark completion.',
      to: '/employee'
    }
  ];
  return (
    <div className="role-grid">
      {roles.map(r => (
        <article className="card" key={r.key} aria-label={`${r.title} role`}>
          <h3 className="card-title">{r.title}</h3>
          <p className="card-desc">{r.desc}</p>
          <button className="btn" onClick={() => navigate(r.to)} aria-label={`Go to ${r.title} dashboard`}>
            Go to {r.title}
          </button>
        </article>
      ))}
    </div>
  );
}
