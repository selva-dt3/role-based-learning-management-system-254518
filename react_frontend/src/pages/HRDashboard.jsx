import React, { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import useApi from '../hooks/useApi';

/**
 * HRDashboard allows HR to view lessons and assign to employees.
 * Includes:
 * - Create/Update Employee Profile
 * - Assign Lesson panel with employee_id, optional name, and lesson selector
 */
export default function HRDashboard() {
  const { data: lessons, loading, error, refetch } = useApi('/lessons');
  const { post } = useApi(); // generic POST helper

  // Create employee mini-form
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');

  // Assign panel state
  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignName, setAssignName] = useState('');
  const [assignLessonId, setAssignLessonId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { /* initial fetch handled by useApi */ }, []);

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

  // Validate assign panel
  const validateAssign = () => {
    const empId = assignEmpId.trim();
    const lessonId = assignLessonId.trim();
    if (!empId) {
      showToast('error', 'Employee ID is required.');
      return false;
    }
    if (!lessonId) {
      showToast('error', 'Please select a lesson to assign.');
      return false;
    }
    return true;
  };

  // Assign action:
  // - If name provided, upsert employee via POST /employees
  // - Then POST /assign with { lesson_id, employee_id }
  const submitAssign = async (e) => {
    e?.preventDefault?.();
    if (!validateAssign()) return;

    setAssigning(true);
    try {
      const empId = assignEmpId.trim();
      const name = assignName.trim();

      // Upsert employee when name provided (both mock and real support POST /employees)
      if (name) {
        await post('/employees', { employee_id: empId, name });
      }

      // Create assignment
      await post('/assign', { lesson_id: assignLessonId, employee_id: empId, ...(name ? { name } : {}) });

      showToast('success', 'Lesson assigned successfully.');
      // Reset selection but keep employee id for faster multiple assignments
      setAssignLessonId('');
      // Refresh lessons meta counts
      await refetch();
    } catch (err) {
      showToast('error', err?.message || 'Failed to assign lesson.');
    } finally {
      setAssigning(false);
    }
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
                placeholder="Name (optional but recommended)"
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

        {/* Assign Lesson Panel */}
        <div className="card" style={{ position: 'relative' }}>
          <h3 className="card-title">Assign Lesson</h3>
          <form onSubmit={submitAssign}>
            <div className="grid" style={{ gap: 8 }}>
              <div>
                <label htmlFor="assign-emp-id" style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
                  Employee ID <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  id="assign-emp-id"
                  placeholder="Employee ID"
                  aria-required="true"
                  value={assignEmpId}
                  onChange={e => setAssignEmpId(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label htmlFor="assign-name" style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
                  Name (optional but recommended)
                </label>
                <input
                  id="assign-name"
                  placeholder="Employee Name (optional)"
                  value={assignName}
                  onChange={e => setAssignName(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                  If provided, the employee profile will be created/updated before assignment.
                </div>
              </div>
              <div>
                <label htmlFor="assign-lesson" style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
                  Select Lesson <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <select
                  id="assign-lesson"
                  value={assignLessonId}
                  onChange={(e) => setAssignLessonId(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  <option value="">-- Choose a lesson --</option>
                  {Array.isArray(lessons) && lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <button className="btn" type="submit" disabled={assigning}>
                  {assigning ? 'Assigning…' : 'Assign Lesson'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="section">
        <h3 className="card-title">Lessons Overview</h3>
        {loading && <p>Loading…</p>}
        {error && <p style={{ color: 'var(--error)' }}>{error.message}</p>}
        <Table columns={columns} rows={rows} />
      </section>
    </div>
  );
}
