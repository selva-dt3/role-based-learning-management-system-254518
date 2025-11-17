import React, { useMemo, useState } from 'react';
import LessonCard from '../components/LessonCard';
import Table from '../components/Table';
import useApi from '../hooks/useApi';
import CreateLessonForm from '../components/CreateLessonForm';

/**
 * AdminDashboard shows lesson management and tracking views for Admin role.
 * Integrates the CreateLessonForm with validation and uploads.
 */
export default function AdminDashboard() {
  const { data: lessons, loading, error, refetch, del } = useApi('/lessons');
  const [showCreate, setShowCreate] = useState(false);

  const columns = useMemo(() => ([
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'completed', label: 'Completed' }
  ]), []);

  const rows = useMemo(() => (Array.isArray(lessons) ? lessons.map(l => ({
    id: l.id ?? '-',
    title: l.title,
    assigned: l.assigned_count ?? 0,
    completed: l.completed_count ?? 0
  })) : []), [lessons]);

  const onDelete = async (id) => {
    await del(`/lessons/${id}`);
    await refetch();
  };

  // Small inline form state for creating employee profiles
  const { post } = useApi();
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };
  const createEmployee = async (e) => {
    e?.preventDefault?.();
    if (!newEmpId.trim()) { showToast('error', 'Employee ID is required.'); return; }
    try {
      await post('/employees', { employee_id: newEmpId.trim(), name: newEmpName.trim() || null });
      showToast('success', 'Employee profile created/updated.');
      setNewEmpId(''); setNewEmpName('');
    } catch (err) { showToast('error', err?.message || 'Failed to create employee.'); }
  };

  return (
    <div className="page">
      <h2 className="section-title"><span className="dot" /> Admin Dashboard</h2>

      <section className="section grid" style={{ gap: 16 }}>
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

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Manage Lessons</h3>
            <p className="card-desc" style={{ margin: '6px 0 0' }}>Create and manage lesson content, upload files, and track assignments.</p>
          </div>
          <button className="btn" onClick={() => setShowCreate(s => !s)} aria-expanded={showCreate} aria-controls="create-lesson-form">
            {showCreate ? 'Close' : 'Create Lesson'}
          </button>
        </div>
        {showCreate && (
          <div id="create-lesson-form" style={{ marginTop: 12 }}>
            <CreateLessonForm
              onCreated={async () => { await refetch(); }}
              onClose={() => setShowCreate(false)}
            />
          </div>
        )}
      </section>

      <section className="section">
        <h3 className="card-title">Lessons</h3>
        {loading && <p>Loading…</p>}
        {error && <p style={{ color: 'var(--error)' }}>{error.message}</p>}
        <div className="grid grid-3">
          {Array.isArray(lessons) && lessons.map(l => (
            <LessonCard
              key={l.id}
              title={l.title}
              description={l.description}
              files={l.files_count ?? (l.file_url ? 1 : 0)}
              progress={l.progress ?? 0}
              onOpen={() => onDelete(l.id)}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <h3 className="card-title">Tracking Overview</h3>
        <Table columns={columns} rows={rows} />
      </section>
    </div>
  );
}
