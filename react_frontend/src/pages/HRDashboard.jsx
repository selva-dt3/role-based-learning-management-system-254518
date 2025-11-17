import React, { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import useApi from '../hooks/useApi';

/**
 * HRDashboard allows HR to view lessons and assign to employees.
 * Also includes a small "Create Employee Profile" form.
 */
export default function HRDashboard() {
  const { data: lessons, loading, error, refetch } = useApi('/lessons');
  const { post } = useApi(); // generic
  const [employeeId, setEmployeeId] = useState('');
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { /* ensure initial fetch */ }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

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

  const createEmployee = async (e) => {
    e?.preventDefault?.();
    if (!newEmpId.trim()) {
      showToast('error', 'Employee ID is required.');
      return;
    }
    try {
      await post('/employees', { employee_id: newEmpId.trim(), name: newEmpName.trim() || null });
      showToast('success', 'Employee profile created/updated.');
      setNewEmpId('');
      setNewEmpName('');
    } catch (err) {
      showToast('error', err?.message || 'Failed to create employee.');
    }
  };

  return (
    <div className="page">
      <h2 className="section-title"><span className="dot" /> HR Dashboard</h2>

      <section className="section grid" style={{ gap: 16 }}>
        {/* Create Employee Profile */}
        <div className="card" style={{ position: 'relative' }}>
          <h3 className="card-title">Create Employee Profile</h3>
          <form onSubmit={createEmployee}>
            <div className="grid" style={{ gap: 8 }}>
              <input
                placeholder="Employee ID"
                aria-label="New Employee ID"
                value={newEmpId}
                onChange={e => setNewEmpId(e.target.value)}
                style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
              <input
                placeholder="Name (optional)"
                aria-label="New Employee Name"
                value={newEmpName}
                onChange={e => setNewEmpName(e.target.value)}
                style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
              <div>
                <button className="btn" type="submit">Create / Update</button>
              </div>
            </div>
          </form>
          {toast && (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                padding: '8px 12px',
                borderRadius: 10,
                fontWeight: 700,
                background: toast.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: toast.type === 'success' ? 'var(--success)' : 'var(--error)',
                border: `1px solid ${toast.type === 'success' ? 'var(--success)' : 'var(--error)'}`
              }}
            >
              {toast.message}
            </div>
          )}
        </div>

        {/* Assign Lessons */}
        <div className="card">
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
