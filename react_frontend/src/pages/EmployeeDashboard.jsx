import React, { useMemo, useState } from 'react';
import LessonCard from '../components/LessonCard';
import Table from '../components/Table';
import useApi from '../hooks/useApi';

/**
 * EmployeeDashboard displays assigned lessons and allows marking completion.
 */
export default function EmployeeDashboard() {
  const [employeeId, setEmployeeId] = useState('emp-001');
  const { data: assignments, loading, error, refetch } = useApi(employeeId ? `/assignments/${employeeId}` : null);
  const { post } = useApi();

  const columns = useMemo(() => ([
    { key: 'lesson_id', label: 'Lesson' },
    { key: 'status', label: 'Status' },
    { key: 'progress', label: 'Progress' }
  ]), []);

  const rows = useMemo(() => (Array.isArray(assignments) ? assignments.map(a => ({
    lesson_id: a.lesson_title ?? a.lesson_id,
    status: a.completed ? 'Completed' : 'Pending',
    progress: `${a.progress ?? 0}%`
  })) : []), [assignments]);

  const markComplete = async (lessonId) => {
    if (!employeeId) return;
    await post('/complete', { lesson_id: lessonId, employee_id: employeeId });
    await refetch();
  };

  return (
    <div className="page">
      <h2 className="section-title"><span className="dot" /> Employee Dashboard</h2>

      <section className="section card">
        <h3 className="card-title">Your ID</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            aria-label="Employee ID"
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
            placeholder="Enter your employee id"
            style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <button className="btn" onClick={() => refetch()}>Refresh</button>
        </div>
      </section>

      <section className="section">
        <h3 className="card-title">Assigned Lessons</h3>
        {loading && <p>Loading…</p>}
        {error && <p style={{ color: 'var(--error)' }}>{error.message}</p>}
        <div className="grid grid-3">
          {Array.isArray(assignments) && assignments.map(a => (
            <LessonCard
              key={a.lesson_id}
              title={a.lesson_title ?? a.lesson_id}
              description={a.description}
              files={a.files_count ?? 0}
              progress={a.progress ?? 0}
              onOpen={() => markComplete(a.lesson_id)}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <h3 className="card-title">Progress</h3>
        <Table columns={columns} rows={rows} />
      </section>
    </div>
  );
}
