/**
 * Simple mock API utilities used by components when REACT_APP_USE_MOCK_API is true.
 * Deterministic data includes a lesson titled 'Workplace Safety Basics'.
 * Note: Tests may rely on first-call 404 then success for assignments.
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

function uuid() {
  // eslint-disable-next-line
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random()*16)|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

function seed() {
  const seeded = window.localStorage.getItem(LS_KEYS.seedFlag);
  if (seeded === 'true') return;

  const lessons = [
    { id: 'lesson-1', title: 'Workplace Safety Basics', description: 'Core safety procedures for all employees.', file_url: null },
    { id: 'lesson-2', title: 'Data Privacy Fundamentals', description: 'Protecting sensitive data.', file_url: null }
  ];
  const quizzes = [];
  const assignments = [
    { id: 'assign-1', lesson_id: 'lesson-1', employee_id: 'employee-123', completed: false, progress: 0 }
  ];
  const completions = [];
  const employees = [
    { employee_id: 'employee-123', name: 'Test User' }
  ];

  save(LS_KEYS.lessons, lessons);
  save(LS_KEYS.quizzes, quizzes);
  save(LS_KEYS.assignments, assignments);
  save(LS_KEYS.completions, completions);
  save(LS_KEYS.employees, employees);
  window.localStorage.setItem(LS_KEYS.seedFlag, 'true');
}

seed();

function getState() {
  return {
    lessons: load(LS_KEYS.lessons, []),
    quizzes: load(LS_KEYS.quizzes, []),
    assignments: load(LS_KEYS.assignments, []),
    completions: load(LS_KEYS.completions, []),
    employees: load(LS_KEYS.employees, []),
  };
}
function setState(partial) {
  if (partial.lessons) save(LS_KEYS.lessons, partial.lessons);
  if (partial.quizzes) save(LS_KEYS.quizzes, partial.quizzes);
  if (partial.assignments) save(LS_KEYS.assignments, partial.assignments);
  if (partial.completions) save(LS_KEYS.completions, partial.completions);
  if (partial.employees) save(LS_KEYS.employees, partial.employees);
}
function delay(ms = 50) {
  return new Promise(res => setTimeout(res, ms));
}

// PUBLIC_INTERFACE
export async function getLessons() {
  /** Return list of lessons (deterministic). */
  await delay();
  const { lessons } = getState();
  return lessons;
}

// PUBLIC_INTERFACE
export async function getAssignments(employee_id) {
  /** First call simulates 404 via throw; next calls return assignments. */
  await delay();
  const key = `${NS}:${VERSION}:assignments:first:${employee_id}`;
  const first = window.sessionStorage.getItem(key) !== 'done';
  if (first) {
    window.sessionStorage.setItem(key, 'done');
    const err = new Error('Not Found');
    err.status = 404;
    throw err;
  }
  const { assignments } = getState();
  return assignments.filter(a => a.employee_id === employee_id);
}

// PUBLIC_INTERFACE
export async function getProgress(employee_id) {
  /** Return simple progress summary. */
  await delay();
  const { assignments } = getState();
  const forEmp = assignments.filter(a => a.employee_id === employee_id);
  const assigned = forEmp.length;
  const completed = forEmp.filter(a => a.completed).length;
  const percentage = assigned ? Math.round((completed / assigned) * 100) : 0;
  return { assigned, completed, percentage };
}

// PUBLIC_INTERFACE
export async function completeLesson({ lesson_id, employee_id }) {
  /** Mark assignment complete and add completion record. */
  await delay();
  const { assignments, completions } = getState();
  const idx = assignments.findIndex(a => a.lesson_id === lesson_id && a.employee_id === employee_id);
  if (idx === -1) throw new Error('Assignment not found');
  const nextAssignments = [...assignments];
  nextAssignments[idx] = { ...nextAssignments[idx], completed: true, progress: 100 };
  setState({ assignments: nextAssignments, completions: [...completions, { id: uuid(), lesson_id, employee_id }] });
  return { ok: true };
}

// PUBLIC_INTERFACE
export async function assignLesson({ lesson_id, employee_id }) {
  /** Create assignment if none exists. */
  await delay();
  const { assignments } = getState();
  const existing = assignments.find(a => a.lesson_id === lesson_id && a.employee_id === employee_id);
  if (existing) return existing;
  const a = { id: uuid(), lesson_id, employee_id, completed: false, progress: 0 };
  setState({ assignments: [...assignments, a] });
  return a;
}

// PUBLIC_INTERFACE
export async function getEmployee(employee_id) {
  /** Return { exists, employee? } */
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
  /** Upsert employee. */
  await delay();
  const { employees } = getState();
  const idx = employees.findIndex(e => e.employee_id === employee_id);
  const rec = { employee_id, name };
  if (idx === -1) {
    setState({ employees: [...employees, rec] });
    return rec;
  }
  const next = [...employees];
  next[idx] = { ...next[idx], ...rec };
  setState({ employees: next });
  return next[idx];
}

// PUBLIC_INTERFACE
export function __resetMockData() {
  /** Reset mock data for tests. */
  Object.values(LS_KEYS).forEach(k => window.localStorage.removeItem(k));
  window.sessionStorage.clear();
  seed();
}

// PUBLIC_INTERFACE
export async function uploadFile(file, optionalLessonId) {
  /** Return a deterministic mock URL for uploaded files. */
  await delay();
  return { url: `mock://uploads/${optionalLessonId || 'general'}/${(file && file.name) || 'file.bin'}` };
}
