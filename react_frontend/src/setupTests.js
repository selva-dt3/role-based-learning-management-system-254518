 /**
  * Global Jest setup for React Testing Library.
  *
  * - Adds jest-dom matchers
  * - Forces mock API usage in tests via jest.mock of ./api/client
  * - Seeds deterministic fetch mocks including 'Workplace Safety Basics'
  * - Simulates first 404 then success for /assignments/:employee_id
  * - Stubs browser APIs and silences noisy console warnings
  */
import '@testing-library/jest-dom';

// 1) Ensure mock API is used in tests
process.env.REACT_APP_USE_MOCK_API = 'true';

// 1a) Hard-mock the API client so all code importing ./api/client uses mockApi underneath
jest.mock('./api/client', () => {
  // eslint-disable-next-line global-require
  const mockApi = require('./api/mockApi');
  return {
    // PUBLIC_INTERFACE
    getApiBaseUrl: () => '',
    // PUBLIC_INTERFACE
    apiFetch: async (path, options = {}) => {
      const method = (options.method || 'GET').toUpperCase();
      const p = path?.startsWith('/') ? path : `/${path || ''}`;
      const body = options.body;

      // Lessons
      if (method === 'GET' && p === '/lessons') return mockApi.getLessons();
      if (method === 'POST' && (p === '/lessons' || p === '/lesson')) return mockApi.createLesson?.(body) ?? Promise.resolve({});

      // Lessons by id (optional support)
      const lessonIdMatch = p.match(/^\/lessons\/([^/]+)$/) || p.match(/^\/lesson\/([^/]+)$/);
      if (lessonIdMatch) {
        const id = lessonIdMatch[1];
        if (method === 'PUT') return mockApi.updateLesson?.(id, body) ?? Promise.resolve({});
        if (method === 'DELETE') return mockApi.deleteLesson?.(id) ?? Promise.resolve({});
      }

      // Assignments & progress
      if (method === 'POST' && p === '/assign') return mockApi.assignLesson(body);
      const assignmentsMatch = p.match(/^\/assignments\/([^/]+)$/);
      if (method === 'GET' && assignmentsMatch) return mockApi.getAssignments(assignmentsMatch[1]);

      if (method === 'POST' && p === '/complete') return mockApi.completeLesson(body);
      const progressMatch = p.match(/^\/progress\/([^/]+)$/);
      if (method === 'GET' && progressMatch) return mockApi.getProgress(progressMatch[1]);

      // Quizzes
      if (method === 'GET' && p === '/quizzes') return mockApi.getQuizzes?.() ?? Promise.resolve([]);
      if (method === 'POST' && p === '/quizzes') return mockApi.createQuiz?.(body) ?? Promise.resolve({});
      const quizIdMatch = p.match(/^\/quizzes\/([^/]+)$/);
      if (quizIdMatch) {
        const id = quizIdMatch[1];
        if (method === 'PUT') return mockApi.updateQuiz?.(id, body) ?? Promise.resolve({});
        if (method === 'DELETE') return mockApi.deleteQuiz?.(id) ?? Promise.resolve({});
      }

      // Employees
      const empGetMatch = p.match(/^\/employees\/([^/]+)$/);
      if (method === 'GET' && empGetMatch) return mockApi.getEmployee(empGetMatch[1]);
      if (method === 'POST' && p === '/employees') return mockApi.upsertEmployee(body);

      throw new Error(`Mocked client: route not implemented for ${method} ${p}`);
    },
    // PUBLIC_INTERFACE
    apiUploadFile: async (file, optionalLessonId) =>
      mockApi.uploadFile?.(file, optionalLessonId) ?? Promise.resolve({ url: 'mock://file' }),
  };
});

// 2) Deterministic fetch mocks (including first 404 then success for /assignments/:id)
const ORIGINAL_FETCH = global.fetch;

const LESSONS = [
  { id: 'lesson-1', title: 'Workplace Safety Basics', description: 'Core safety guidelines.', file_url: 'https://example.com/safety.pdf' },
  { id: 'lesson-2', title: 'Data Privacy Fundamentals', description: 'Protecting sensitive data.', file_url: 'https://example.com/privacy.pdf' },
];

let firstAssignmentsCall = true;

beforeEach(() => {
  firstAssignmentsCall = true;
  global.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    let path = url;
    try {
      const u = new URL(url, 'http://localhost');
      path = u.pathname;
    } catch {}

    const method = (init?.method || 'GET').toUpperCase();

    if (method === 'GET' && path.endsWith('/lessons')) {
      return new Response(JSON.stringify(LESSONS), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'GET' && /\/assignments\/[^/]+$/.test(path)) {
      if (firstAssignmentsCall) {
        firstAssignmentsCall = false;
        return new Response(JSON.stringify({ detail: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      const employee_id = path.split('/').pop() || 'employee-123';
      return new Response(
        JSON.stringify([
          { id: 'a-1', lesson_id: 'lesson-1', employee_id },
          { id: 'a-2', lesson_id: 'lesson-2', employee_id },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'GET' && /\/progress\/[^/]+$/.test(path)) {
      return new Response(JSON.stringify({ assigned: 2, completed: 1, percentage: 50 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'GET' && /\/employees\/[^/]+$/.test(path)) {
      const employee_id = path.split('/').pop();
      return new Response(JSON.stringify({ exists: true, employee: { employee_id, name: 'Test User' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST' && path.endsWith('/assign')) {
      return new Response(JSON.stringify({ id: 'a-3', lesson_id: 'lesson-1', employee_id: 'employee-123' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST' && path.endsWith('/complete')) {
      return new Response(JSON.stringify({ id: 'c-1', lesson_id: 'lesson-1', employee_id: 'employee-123' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'GET' && path.endsWith('/quizzes')) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (typeof ORIGINAL_FETCH === 'function') {
      return ORIGINAL_FETCH(input, init);
    }
    return new Response(JSON.stringify({ error: `Not mocked: ${method} ${path}` }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  };
});

afterAll(() => {
  if (ORIGINAL_FETCH) global.fetch = ORIGINAL_FETCH;
});

// 3) Browser API shims and console noise silencing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

if (typeof global.Response === 'undefined') {
  global.Response = class {
    constructor(body, init = {}) {
      this._body = typeof body === 'string' ? body : JSON.stringify(body ?? '');
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.ok = this.status >= 200 && this.status < 300;
    }
    async json() {
      try { return JSON.parse(this._body); } catch { return this._body; }
    }
    async text() { return this._body; }
    headers = { get: (k) => (this.headers instanceof Map ? this.headers.get(k) : null) };
  };
}

const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args) => {
    const msg = (args && args[0]) || '';
    if (typeof msg === 'string' && (msg.includes('Warning:') || msg.includes('act(') || msg.includes('Not wrapped in act(') || msg.includes('An update to') || msg.includes('React Router') || msg.includes('deprecated'))) {
      return;
    }
    originalError(...args);
  };
  console.warn = (...args) => {
    const msg = (args && args[0]) || '';
    if (typeof msg === 'string' && (msg.includes('React Router') || msg.includes('deprecated') || msg.includes('act(') || msg.includes('Not wrapped in act('))) {
      return;
    }
    originalWarn(...args);
  };
}
);
