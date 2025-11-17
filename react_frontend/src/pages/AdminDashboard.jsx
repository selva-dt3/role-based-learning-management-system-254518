import React, { useMemo, useState } from 'react';
import LessonCard from '../components/LessonCard';
import Table from '../components/Table';
import useApi from '../hooks/useApi';

/**
 * AdminDashboard shows lesson management and tracking views for Admin role.
 */
export default function AdminDashboard() {
  const { data: lessons, loading, error, refetch, post, del } = useApi('/lessons');
  const [title, setTitle] = useState('');

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

  const onCreate = async () => {
    if (!title.trim()) return;
    await post('/lesson', { title });
    setTitle('');
    await refetch();
  };

  const onDelete = async (id) => {
    await del(`/lesson/${id}`);
    await refetch();
  };

  return (
    <div className="page">
      <h2 className="section-title"><span className="dot" /> Admin Dashboard</h2>

      <section className="section">
        <div className="card">
          <h3 className="card-title">Create Lesson</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              aria-label="Lesson title"
              placeholder="Lesson title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
            <button className="btn" onClick={onCreate}>Add</button>
          </div>
        </div>
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
              files={l.files_count ?? 0}
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
