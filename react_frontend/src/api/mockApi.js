 /**
  * Deterministic Mock API for tests and local development.
  * Ensures seeded data exactly matches test expectations.
  *
  * Seed:
  * - fetchLessons returns [{ id: 'lesson-1', title: 'Workplace Safety Basics', description: 'Test lesson', file_url: null }]
  * - getAssignments('employee-123') returns [{ id: 'a1', employee_id: 'employee-123', lesson_id: 'lesson-1' }]
  * - getProgress('employee-123') returns { assignedCount: 1, completedCount: 0, percentage: 0 }
  */

const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory deterministic state
const MOCK_LESSONS = [
  {
    id: 'lesson-1',
    title: 'Workplace Safety Basics',
    description: 'Test lesson',
    file_url: null,
  },
];

const MOCK_ASSIGNMENTS = [
  { id: 'a1', employee_id: 'employee-123', lesson_id: 'lesson-1' },
];

const MOCK_COMPLETIONS = [];

function uuid() {
  // eslint-disable-next-line
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0; const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// PUBLIC_INTERFACE
export async function fetchLessons() {
  // Return exactly the seeded list
  await delay();
  return [...MOCK_LESSONS];
}

// PUBLIC_INTERFACE
export async function createLesson(payload) {
  await delay();
  const newLesson = {
    id: payload?.id || `lesson-${MOCK_LESSONS.length + 1}`,
    title: payload?.title || 'Untitled',
    description: payload?.description ?? null,
    file_url: payload?.file_url ?? null,
  };
  MOCK_LESSONS.push(newLesson);
  return newLesson;
}

// PUBLIC_INTERFACE
export async function updateLesson(id, payload) {
  await delay();
  const idx = MOCK_LESSONS.findIndex((l) => l.id === id);
  if (idx >= 0) {
    MOCK_LESSONS[idx] = { ...MOCK_LESSONS[idx], ...payload };
    return MOCK_LESSONS[idx];
  }
  throw new Error('Lesson not found');
}

// PUBLIC_INTERFACE
export async function deleteLesson(id) {
  await delay();
  const idx = MOCK_LESSONS.findIndex((l) => l.id === id);
  if (idx >= 0) {
    const [deleted] = MOCK_LESSONS.splice(idx, 1);
    return { success: true, deleted };
  }
  throw new Error('Lesson not found');
}

// PUBLIC_INTERFACE
export async function assignLesson({ employee_id, lesson_id }) {
  await delay();
  const assignment = {
    id: `a${MOCK_ASSIGNMENTS.length + 1}`,
    employee_id,
    lesson_id,
  };
  MOCK_ASSIGNMENTS.push(assignment);
  return assignment;
}

// PUBLIC_INTERFACE
export async function getAssignments(employee_id) {
  await delay();
  // Ensure employee-123 always has the seeded assignment
  if (employee_id === 'employee-123') {
    const hasSeed = MOCK_ASSIGNMENTS.some((a) => a.employee_id === 'employee-123' && a.lesson_id === 'lesson-1');
    if (!hasSeed) {
      MOCK_ASSIGNMENTS.push({ id: 'a1', employee_id: 'employee-123', lesson_id: 'lesson-1' });
    }
    return [{ id: 'a1', employee_id: 'employee-123', lesson_id: 'lesson-1' }];
  }
  return MOCK_ASSIGNMENTS.filter((a) => a.employee_id === employee_id);
}

// PUBLIC_INTERFACE
export async function markComplete({ employee_id, lesson_id }) {
  await delay();
  const completion = {
    id: `c${MOCK_COMPLETIONS.length + 1}`,
    employee_id,
    lesson_id,
  };
  MOCK_COMPLETIONS.push(completion);
  return completion;
}

// PUBLIC_INTERFACE
export async function getProgress(employee_id) {
  await delay();
  if (employee_id === 'employee-123') {
    return { assignedCount: 1, completedCount: 0, percentage: 0 };
  }
  const assigned = MOCK_ASSIGNMENTS.filter((a) => a.employee_id === employee_id);
  const completed = MOCK_COMPLETIONS.filter((c) => c.employee_id === employee_id);
  const assignedCount = assigned.length;
  const completedCount = completed.length;
  const percentage = assignedCount === 0 ? 0 : Math.round((completedCount / assignedCount) * 100);
  return { assignedCount, completedCount, percentage };
}

// PUBLIC_INTERFACE
export async function getEmployee(employee_id) {
  // Simulate first check 404 then success on second call by using a session flag
  await delay();
  const key = `mock:first-employee-check:${employee_id}`;
  if (!global || typeof window === 'undefined' || !window.sessionStorage) {
    return { exists: true, employee: { employee_id } };
  }
  if (window.sessionStorage.getItem(key) !== 'done') {
    window.sessionStorage.setItem(key, 'done');
    const e = new Error('Employee not found');
    e.status = 404;
    throw e;
  }
  return { exists: true, employee: { employee_id, name: 'Test User' } };
}

// PUBLIC_INTERFACE
export async function getQuizzes() {
  await delay();
  return [];
}

// PUBLIC_INTERFACE
export async function createQuiz(payload) {
  await delay();
  return { ...payload, id: uuid() };
}

// PUBLIC_INTERFACE
export async function updateQuiz(id, payload) {
  await delay();
  return { id, ...payload };
}

// PUBLIC_INTERFACE
export async function deleteQuiz(id) {
  await delay();
  return { success: true, id };
}

// PUBLIC_INTERFACE
export async function uploadFile(file, optionalLessonId) {
  await delay();
  return { url: `mock://uploads/${optionalLessonId || 'general'}/${(file && file.name) || 'file.bin'}` };
}

// Default export matching named functions for convenience
const mockApi = {
  fetchLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  assignLesson,
  getAssignments,
  markComplete,
  getProgress,
  getEmployee,
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  uploadFile,
};

export default mockApi;
