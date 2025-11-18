 /**
  * Mock API with deterministic, stateful behavior for tests.
  *
  * Guarantees:
  * - lessons include { id: 'lesson-1', title: 'Workplace Safety Basics' }
  * - assignments for 'employee-123' include lesson-1
  * - progress for any employee returns a non-empty object
  *
  * Additional behavior:
  * - getEmployee: first call per employee returns 404; second returns profile
  * - getAssignments: for non-employee-123, first call 404 then returns list with lesson-1
  */
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
  try { return JSON.parse(json); } catch { return fallback; }
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
    const r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** Seed deterministic lessons including the required Workplace Safety Basics. */
function seed() {
  const seeded = window.localStorage.getItem(LS_KEYS.seedFlag);
  if (seeded === 'true') return;

  const lessons = [
    { id: 'lesson-1', title: 'Workplace Safety Basics', description: 'Intro to safety basics.', file_url: null },
    { id: 'lesson-2', title: 'Data Privacy Fundamentals', description: 'Protecting sensitive data.', file_url: null }
  ];
  save(LS_KEYS.lessons, lessons);
  save(LS_KEYS.quizzes, []);
  save(LS_KEYS.assignments, [
    // Pre-seed employee-123 with lesson-1 assignment
    { id: 'assign-1', lesson_id: 'lesson-1', employee_id: 'employee-123', completed: false, progress: 0, lesson_title: 'Workplace Safety Basics' }
  ]);
  save(LS_KEYS.completions, []);
  save(LS_KEYS.employees, []);
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
function delay(ms = 20) { return new Promise(r => setTimeout(r, ms)); }

// PUBLIC_INTERFACE
export async function getLessons() {
  await delay();
  return getState().lessons;
}

// PUBLIC_INTERFACE
export async function createLesson(payload) {
  await delay();
  const { lessons } = getState();
  const rec = {
    id: payload?.id || `lesson-${lessons.length + 1}`,
    title: payload?.title || 'Untitled',
    description: payload?.description ?? null,
    file_url: payload?.file_url ?? null
  };
  setState({ lessons: [...lessons, rec] });
  return rec;
}

// PUBLIC_INTERFACE
export async function updateLesson(id, updates) {
  await delay();
  const { lessons } = getState();
  const idx = lessons.findIndex(l => l.id === id);
  if (idx === -1) throw new Error('Lesson not found');
  const next = [...lessons];
  next[idx] = { ...next[idx], ...updates };
  setState({ lessons: next });
  return next[idx];
}

// PUBLIC_INTERFACE
export async function deleteLesson(id) {
  await delay();
  const { lessons, assignments } = getState();
  setState({
    lessons: lessons.filter(l => l.id !== id),
    assignments: assignments.filter(a => a.lesson_id !== id)
  });
  return { ok: true };
}

// PUBLIC_INTERFACE
export async function getQuizzes() {
  await delay();
  return getState().quizzes;
}

// PUBLIC_INTERFACE
export async function createQuiz(payload) {
  await delay();
  const { quizzes } = getState();
  const rec = { id: payload?.id || uuid(), lesson_id: payload?.lesson_id, title: payload?.title || 'Quiz', questions: payload?.questions || [] };
  setState({ quizzes: [...quizzes, rec] });
  return rec;
}

// PUBLIC_INTERFACE
export async function updateQuiz(id, updates) {
  await delay();
  const { quizzes } = getState();
  const idx = quizzes.findIndex(q => q.id === id);
  if (idx === -1) throw new Error('Quiz not found');
  const next = [...quizzes];
  next[idx] = { ...next[idx], ...updates };
  setState({ quizzes: next });
  return next[idx];
}

// PUBLIC_INTERFACE
export async function deleteQuiz(id) {
  await delay();
  const { quizzes } = getState();
  setState({ quizzes: quizzes.filter(q => q.id !== id) });
  return { ok: true };
}

/**
 * Assignments:
 * - employee-123 always has lesson-1
 * - other employees: first call 404, then ensure lesson-1 present
 */
// PUBLIC_INTERFACE
export async function getAssignments(employee_id) {
  await delay();
  const { assignments, lessons } = getState();
  const safety =
    lessons.find(l => l.id === 'lesson-1') ||
    lessons.find(l => l.title === 'Workplace Safety Basics') ||
    lessons[0];

  if (employee_id === 'employee-123') {
    let list = assignments.filter(a => a.employee_id === employee_id);
    if (safety && !list.some(a => a.lesson_id === safety.id)) {
      const a = {
        id: 'assign-fixed-1',
        lesson_id: safety.id,
        employee_id,
        completed: false,
        progress: 0,
        lesson_title: safety.title
      };
      setState({ assignments: [...assignments, a] });
      list = [...list, a];
    }
    return list;
  }

  const firstKey = `${NS}:${VERSION}:first-assign:${employee_id}`;
  if (window.sessionStorage.getItem(firstKey) !== 'done') {
    window.sessionStorage.setItem(firstKey, 'done');
    const e = new Error('Not Found');
    e.status = 404;
    throw e;
  }

  let list = assignments.filter(a => a.employee_id === employee_id);
  if (safety && !list.some(a => a.lesson_id === safety.id)) {
    const a = {
      id: uuid(),
      lesson_id: safety.id,
      employee_id,
      completed: false,
      progress: 0,
      lesson_title: safety.title
    };
    setState({ assignments: [...assignments, a] });
    list = [...list, a];
  }
  return list;
}

// PUBLIC_INTERFACE
export async function assignLesson({ lesson_id, employee_id }) {
  await delay();
  const { assignments, lessons } = getState();
  const exists = assignments.find(a => a.lesson_id === lesson_id && a.employee_id === employee_id);
  if (exists) return exists;
  const lesson = lessons.find(l => l.id === lesson_id);
  const a = { id: uuid(), lesson_id, employee_id, completed: false, progress: 0, lesson_title: lesson?.title };
  setState({ assignments: [...assignments, a] });
  return a;
}

// PUBLIC_INTERFACE
export async function completeLesson({ lesson_id, employee_id }) {
  await delay();
  const { assignments, completions } = getState();
  const idx = assignments.findIndex(a => a.lesson_id === lesson_id && a.employee_id === employee_id);
  if (idx === -1) throw new Error('Assignment not found');
  const next = [...assignments];
  next[idx] = { ...next[idx], completed: true, progress: 100 };
  setState({ assignments: next, completions: [...completions, { id: uuid(), lesson_id, employee_id }] });
  return { ok: true };
}

// PUBLIC_INTERFACE
export async function getProgress(employee_id) {
  await delay();
  const { assignments } = getState();
  const arr = assignments.filter(a => a.employee_id === employee_id);
  const assignedCount = arr.length;
  const completedCount = arr.filter(a => a.completed).length;
  const percentage = assignedCount ? Math.round((completedCount / assignedCount) * 100) : 0;
  return { assignedCount, completedCount, percentage };
}

/** Employee profile: first call 404, second returns profile and ensures assignment of lesson-1. */
// PUBLIC_INTERFACE
export async function getEmployee(employee_id) {
  await delay();
  const firstKey = `${NS}:${VERSION}:first-emp:${employee_id}`;
  if (window.sessionStorage.getItem(firstKey) !== 'done') {
    window.sessionStorage.setItem(firstKey, 'done');
    const e = new Error('Employee not found');
    e.status = 404;
    throw e;
  }
  const { employees, lessons, assignments } = getState();
  let emp = employees.find(e => e.employee_id === employee_id);
  if (!emp) {
    emp = { employee_id, name: 'Test User' };
    setState({ employees: [...employees, emp] });
  }
  const safety = lessons.find(l => l.id === 'lesson-1') || lessons.find(l => l.title === 'Workplace Safety Basics') || lessons[0];
  if (safety && !assignments.some(a => a.employee_id === employee_id && a.lesson_id === safety.id)) {
    setState({ assignments: [...assignments, { id: uuid(), lesson_id: safety.id, employee_id, completed: false, progress: 0, lesson_title: safety.title }] });
  }
  return { exists: true, employee: emp };
}

// PUBLIC_INTERFACE
export async function upsertEmployee({ employee_id, name }) {
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
  Object.values(LS_KEYS).forEach(k => window.localStorage.removeItem(k));
  window.sessionStorage.clear();
  seed();
}

// PUBLIC_INTERFACE
export async function uploadFile(file, optionalLessonId) {
  await delay();
  return { url: `mock://uploads/${optionalLessonId || 'general'}/${(file && file.name) || 'file.bin'}` };
}
