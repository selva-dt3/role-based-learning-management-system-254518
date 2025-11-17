import React, { useEffect, useMemo, useState } from 'react';
import LessonCard from '../components/LessonCard';
import Table from '../components/Table';
import useApi from '../hooks/useApi';

/**
 * EmployeeDashboard displays assigned lessons but is gated by employee profile existence.
 * Flow:
 *  - Prompt for Employee ID (persist to localStorage)
 *  - Call GET /employees/{id} (or mock) to check existence
 *  - If not found, show friendly message to contact HR/Admin
 *  - If found, load assignments/progress for that employee
 */
export default function EmployeeDashboard() {
  const LS_EMP_KEY = 'rb-lms:v1:employee_id';
  const [employeeId, setEmployeeId] = useState(() => window.localStorage.getItem(LS_EMP_KEY) || '');
  const [checked, setChecked] = useState(false);
  const [exists, setExists] = useState(false);
  const [checkingError, setCheckingError] = useState(null);

  const { get, post } = useApi();
  const { data: assignments, loading, error, refetch } = useApi(exists && employeeId ? `/assignments/${employeeId}` : null);

  useEffect(() => {
    // whenever employeeId changes, persist and recheck
    if (employeeId) {
      window.localStorage.setItem(LS_EMP_KEY, employeeId);
    }
  }, [employeeId]);

  const checkEmployee = async () => {
    setCheckingError(null);
    setChecked(false);
    setExists(false);
    if (!employeeId.trim()) {
      setCheckingError(new Error('Please enter your Employee ID.'));
      return;
    }
    try {
      const res = await get(`/employees/${employeeId.trim()}`);
      setExists(Boolean(res?.exists));
      setChecked(true);
    } catch (e) {
      // treat 404 as not found
      if (e?.status === 404) {
        setExists(false);
        setChecked(true);
      } else {
        setCheckingError(e);
      }
    }
  };

  useEffect(() => {
    // auto-check on mount if ID already present
    if (employeeId) {
      checkEmployee();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <h3 className="card-title">Your Employee ID</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            aria-label="Employee ID"
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
            placeholder="Enter your employee id"
            style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <button className="btn" onClick={checkEmployee}>Check</button>
        </div>
        {checkingError && (
          <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, color: 'var(--error)', background: 'rgba(239,68,68,0.12)', border: '1px solid var(--error)' }}>
            {checkingError.message || 'Failed to check employee.'}
          </div>
        )}
      </section>

      {!exists && checked && (
        <section className="section card" role="alert" aria-live="polite">
          <h3 className="card-title" style={{ color: 'var(--error)' }}>Profile not found</h3>
          <p className="card-desc">
            We couldn’t find an employee profile for ID “{employeeId}”. Please contact your HR or Admin to create your employee profile. 
            Once created, return here and click “Check” again.
          </p>
        </section>
      )}

      {exists && (
        <>
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
        </>
      )}
    </div>
  );
}
