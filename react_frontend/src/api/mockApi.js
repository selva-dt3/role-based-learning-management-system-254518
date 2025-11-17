/**
 * Mock API for the Role-Based LMS frontend.
 * Provides in-memory CRUD and localStorage persistence for:
 * - Lessons
 * - Quizzes
 * - Assignments
 * - Completions
 * Also includes a stub for file upload returning a fake public URL.
 *
 * This module mirrors the real API client's surface used by the app pages:
 *  - getLessons(), createLesson(), updateLesson(), deleteLesson()
 *  - assignLesson({ lesson_id, employee_id })
 *  - getAssignments(employee_id)
 *  - completeLesson({ lesson_id, employee_id })
 *  - getProgress(employee_id)
 *  - quizzes: getQuizzes(), createQuiz(), updateQuiz(), deleteQuiz()
 *  - uploadFile(file, optionalLessonId)
 *
 * Data Model (simple):
 *  - lessons: [{ id, title, description?, file_url? }]
 *  - quizzes: [{ id, lesson_id, title, questions: [] }]
 *  - assignments: [{ id, lesson_id, employee_id, completed?: boolean, progress?: number }]
 *  - completions: [{ id, lesson_id, employee_id }]
 *
 * Persistence:
 *  - Uses localStorage keys with a versioned namespace to avoid collisions.
 *  - On first load, seeds with deterministic sample data.
 */

// Utilities
const NS = 'rb-lms';
const VERSION = 'v1';
const LS_KEYS = {
  lessons: `${NS}:${VERSION}:lessons`,
  quizzes: `${NS}:${VERSION}:quizzes`,
  assignments: `${NS}:${VERSION}:assignments`,
  completions: `${NS}:${VERSION}:completions`,
  employees: `${NS}:${VERSION}:employees`,
  seedFlag: `${NS}:${VERSION}:seeded`
};

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function load(key, fallback) {
  const raw = window.localStorage.getItem(key);
  return raw ? safeParse(raw, fallback) : fallback;
}

function save(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Simple UUIDv4-ish generator (not crypto-strong; ok for mock)
function uuid() {
  // eslint-disable-next-line
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random()*16)|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

// Seed data once per browser
function seed() {
  const seeded = window.localStorage.getItem(LS_KEYS.seedFlag);
  if (seeded === 'true') return;

  const lessons = [
    { id: 'L-101', title: 'Workplace Safety Basics', description: 'Intro to safety procedures.', file_url: null },
    { id: 'L-102', title: 'Data Privacy 101', description: 'Handling PII and privacy laws.', file_url: null },
    { id: 'L-103', title: 'Code of Conduct', description: 'Company behavior guidelines.', file_url: null }
  ];
  const quizzes = [
    { id: 'Q-201', lesson_id: 'L-101', title: 'Safety Quiz', questions: [{ q: 'What is PPE?', a: 'Personal Protective Equipment' }] }
  ];
  const assignments = [
    { id: 'A-301', lesson_id: 'L-101', employee_id: 'emp-001', completed: false, progress: 0 },
    { id: 'A-302', lesson_id: 'L-102', employee_id: 'emp-001', completed: false, progress: 0 }
  ];
  const completions = [];
  const employees = [
    { employee_id: 'emp-001', name: 'Sample Employee' }
  ];

  save(LS_KEYS.lessons, lessons);
  save(LS_KEYS.quizzes, quizzes);
  save(LS_KEYS.assignments, assignments);
  save(LS_KEYS.completions, completions);
  save(LS_KEYS.employees, employees);
  window.localStorage.setItem(LS_KEYS.seedFlag, 'true');
}

seed();

// Helpers to compute counts and enrichers
function getState() {
  return {
    lessons: load(LS_KEYS.lessons, []),
    quizzes: load(LS_KEYS.quizzes, []),
    assignments: load(LS_KEYS.assignments, []),
    completions: load(LS_KEYS.completions, []),
    employees: load(LS_KEYS.employees, [])
  };
}

function setState(partial) {
  if (partial.lessons) save(LS_KEYS.lessons, partial.lessons);
  if (partial.quizzes) save(LS_KEYS.quizzes, partial.quizzes);
  if (partial.assignments) save(LS_KEYS.assignments, partial.assignments);
  if (partial.completions) save(LS_KEYS.completions, partial.completions);
  if (partial.employees) save(LS_KEYS.employees, partial.employees);
}

// Simulate network latency to mimic API feel
function delay(ms = 150) {
  return new Promise(res => setTimeout(res, ms));
}

// PUBLIC_INTERFACE
export async function getLessons() {
  /** Return lessons with derived counts for assigned/completed and simple progress/files_count. */
  await delay();
  const { lessons, assignments } = getState();
  const byLesson = assignments.reduce((acc, a) => {
    const m = acc[a.lesson_id] || { assigned: 0, completed: 0 };
    m.assigned += 1;
    if (a.completed) m.completed += 1;
    acc[a.lesson_id] = m;
    return acc;
  }, {});
  return lessons.map(l => {
    const meta = byLesson[l.id] || { assigned: 0, completed: 0 };
    const progress = meta.assigned ? Math.round((meta.completed / meta.assigned) * 100) : 0;
    return {
      ...l,
      assigned_count: meta.assigned,
      completed_count: meta.completed,
      progress,
      files_count: l.file_url ? 1 : 0
    };
  });
}

// PUBLIC_INTERFACE
export async function createLesson(data) {
  /** Create a new lesson (id auto). */
  await delay();
  const { lessons } = getState();
  const id = data.id || uuid();
  const lesson = {
    id,
    title: data.title || 'Untitled Lesson',
    description: data.description || null,
    file_url: data.file_url || null
  };
  const next = [...lessons, lesson];
  setState({ lessons: next });
  return lesson;
}

// PUBLIC_INTERFACE
export async function updateLesson(id, data) {
  /** Update lesson by ID. */
  await delay();
  const { lessons } = getState();
  const idx = lessons.findIndex(l => l.id === id);
  if (idx === -1) throw new Error('Lesson not found');
  const updated = { ...lessons[idx], ...data };
  const next = [...lessons];
  next[idx] = updated;
  setState({ lessons: next });
  return updated;
}

// PUBLIC_INTERFACE
export async function deleteLesson(id) {
  /** Delete lesson by ID, removing related quizzes and assignments. */
  await delay();
  const { lessons, quizzes, assignments, completions } = getState();
  setState({
    lessons: lessons.filter(l => l.id !== id),
    quizzes: quizzes.filter(q => q.lesson_id !== id),
    assignments: assignments.filter(a => a.lesson_id !== id),
    completions: completions.filter(c => c.lesson_id !== id)
  });
  return { ok: true };
}

// PUBLIC_INTERFACE
export async function uploadFile(file, optionalLessonId) {
  /** Return a fake public URL for the uploaded file. */
  await delay(200);
  const ext = (file?.name && file.name.includes('.')) ? file.name.split('.').pop() : 'pdf';
  const url = `https://example.com/files/${uuid()}.${ext}`;
  if (optionalLessonId) {
    try {
      await updateLesson(optionalLessonId, { file_url: url });
    } catch {
      // ignore
    }
  }
  return { url };
}

// PUBLIC_INTERFACE
export async function assignLesson({ lesson_id, employee_id }) {
  /** Create an assignment for an employee to a lesson if not already assigned. */
  await delay();
  const { assignments } = getState();
  const exists = assignments.find(a => a.lesson_id === lesson_id && a.employee_id === employee_id);
  if (exists) return exists;
  const assignment = { id: uuid(), lesson_id, employee_id, completed: false, progress: 0 };
  setState({ assignments: [...assignments, assignment] });
  return assignment;
}

// PUBLIC_INTERFACE
export async function getAssignments(employee_id) {
  /** List assignments for an employee, enriched with lesson titles. */
  await delay();
  const { assignments, lessons } = getState();
  return assignments
    .filter(a => a.employee_id === employee_id)
    .map(a => ({
      ...a,
      lesson_title: lessons.find(l => l.id === a.lesson_id)?.title || a.lesson_id,
      files_count: lessons.find(l => l.id === a.lesson_id)?.file_url ? 1 : 0
    }));
}

// PUBLIC_INTERFACE
export async function completeLesson({ lesson_id, employee_id }) {
  /** Mark an assignment complete and create a completion record. */
  await delay();
  const { assignments, completions } = getState();
  const idx = assignments.findIndex(a => a.lesson_id === lesson_id && a.employee_id === employee_id);
  if (idx === -1) throw new Error('Assignment not found');
  const nextAssignments = [...assignments];
  nextAssignments[idx] = { ...nextAssignments[idx], completed: true, progress: 100 };
  const completion = { id: uuid(), lesson_id, employee_id };
  setState({ assignments: nextAssignments, completions: [...completions, completion] });
  return completion;
}

// PUBLIC_INTERFACE
export async function getProgress(employee_id) {
  /** Return simple counts of assigned vs completed for employee. */
  await delay();
  const { assignments } = getState();
  const forEmp = assignments.filter(a => a.employee_id === employee_id);
  const assigned = forEmp.length;
  const completed = forEmp.filter(a => a.completed).length;
  const percentage = assigned ? Math.round((completed / assigned) * 100) : 0;
  return { assigned, completed, percentage };
}

// Quizzes CRUD
// PUBLIC_INTERFACE
export async function getQuizzes() {
  /** List all quizzes. */
  await delay();
  const { quizzes } = getState();
  return quizzes;
}

// PUBLIC_INTERFACE
export async function createQuiz(body) {
  /** Create a quiz. */
  await delay();
  const { quizzes } = getState();
  const quiz = { id: uuid(), lesson_id: body.lesson_id, title: body.title || 'New Quiz', questions: body.questions || [] };
  setState({ quizzes: [...quizzes, quiz] });
  return quiz;
}

// PUBLIC_INTERFACE
export async function updateQuiz(id, body) {
  /** Update a quiz by ID. */
  await delay();
  const { quizzes } = getState();
  const idx = quizzes.findIndex(q => q.id === id);
  if (idx === -1) throw new Error('Quiz not found');
  const updated = { ...quizzes[idx], ...body };
  const next = [...quizzes];
  next[idx] = updated;
  setState({ quizzes: next });
  return updated;
}

// PUBLIC_INTERFACE
export async function deleteQuiz(id) {
  /** Delete a quiz by ID. */
  await delay();
  const { quizzes } = getState();
  setState({ quizzes: quizzes.filter(q => q.id !== id) });
  return { ok: true };
}

// PUBLIC_INTERFACE
export function __resetMockData() {
  /** Testing/helper: clear seed flag to reseed next load. */
  Object.values(LS_KEYS).forEach(k => window.localStorage.removeItem(k));
  seed();
}

// PUBLIC_INTERFACE
export async function getEmployee(employee_id) {
  /** Return {exists, employee?} for an employee_id. */
  await delay();
  const { employees } = getState();
  const found = employees.find(e => e.employee_id === employee_id);
  if (!found) {
    const err = new Error('Employee not found');
    err.status = 404;
    throw err;
  }
  return { exists: true, employee: found };
}

// PUBLIC_INTERFACE
export async function upsertEmployee({ employee_id, name }) {
  /** Create or update an employee by employee_id. */
  await delay();
  const { employees } = getState();
  const idx = employees.findIndex(e => e.employee_id === employee_id);
  const rec = { employee_id, name: name || null };
  if (idx === -1) {
    setState({ employees: [...employees, rec] });
    return rec;
  }
  const next = [...employees];
  next[idx] = { ...next[idx], ...rec };
  setState({ employees: next });
  return next[idx];
}
