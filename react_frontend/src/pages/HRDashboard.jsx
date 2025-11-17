import React, { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import useApi from '../hooks/useApi';

/**
 * HRDashboard allows HR to view lessons and assign to employees.
 */
export default function HRDashboard() {
  const { data: lessons, loading, error, refetch } = useApi('/lessons');
  const { post } = useApi(); // generic
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => { /* ensure initial fetch */ }, []);

  const columns = useMemo(() => ([
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'assigned', label: 'Assigned' }
  ]), []);

  const rows = useMemo(() => (Array.isArray(lessons) ? lessons.map(l => ({
    id: l.id ?? '-',
    title: l.title,
    assigned: l.assigned_count ?? 0
  })) : []), [lessons]);

  const onAssign = async (lessonId) => {
    if (!employeeId.trim()) return;
    await post('/assign', { lesson_id: lessonId, employee_id: employeeId });
    await refetch();
  };

  return (
    <div className="page">
      <h2 className="section-title"><span className="dot" /> HR Dashboard</h2>

      <section className="section card">
        <h3 className="card-title">Assign Lessons</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Employee ID"
            aria-label="Employee ID"
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>
      </section>

      <section className="section">
        {loading && <p>Loading…</p>}
        {error && <p style={{ color: 'var(--error)' }}>{error.message}</p>}
        <Table columns={columns} rows={rows} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {Array.isArray(lessons) && lessons.map(l => (
            <button key={l.id} className="btn" onClick={() => onAssign(l.id)}>
              Assign "{l.title}"
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
