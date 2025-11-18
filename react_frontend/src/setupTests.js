 /**
  * Global Jest setup for React Testing Library.
  *
  * - Adds jest-dom matchers
  * - Seeds/stubs browser APIs not present in jsdom
  * - Sets up deterministic fetch mocks for tests (includes 'Workplace Safety Basics')
  * - Silences noisy console warnings/errors to prevent CI noise
  */
import '@testing-library/jest-dom';

// Force the API client to use mock API during tests.
// Ensure env flag is set and module is mocked to the mock implementation.
// Note: We avoid circular imports by mocking the entire module before tests run.
process.env.REACT_APP_USE_MOCK_API = 'true';

// PUBLIC_INTERFACE
jest.mock('./api/client', () => {
  // Route apiFetch and apiUploadFile to mockApi functions
  // using the same public function names expected by hooks/components.
  // We dynamically import to avoid hoisting issues.
  // eslint-disable-next-line global-require
  const mockApi = require('./api/mockApi');
  return {
    getApiBaseUrl: () => '',
    apiFetch: async (path, options = {}) => {
      const method = (options.method || 'GET').toUpperCase();
      const p = path?.startsWith('/') ? path : `/${path || ''}`;
      const body = options.body;

      // Lessons
      if (method === 'GET' && p === '/lessons') return mockApi.getLessons();
      if (method === 'POST' && (p === '/lessons' || p === '/lesson')) return mockApi.createLesson?.(body) ?? Promise.resolve({});

      // Lessons by id (optional support if mockApi implements)
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

      // Quizzes (optional in mocks)
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
    apiUploadFile: async (file, optionalLessonId) => mockApi.uploadFile?.(file, optionalLessonId) ?? Promise.resolve({ url: 'mock://file' }),
  };
});

// Do not import test files here. Keep mocks as modules in src/__mocks__.
// The module at src/__mocks__/handlers.mocks.js will be executed when imported by tests if needed.

// Stub missing browser APIs commonly used by components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

// Polyfill minimal Response for custom fetch mocks (if not present)
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
      try {
        return JSON.parse(this._body);
      } catch {
        return this._body;
      }
    }
    async text() {
      return this._body;
    }
    headers = {
      get: (k) => {
        if (this.headers instanceof Map) return this.headers.get(k);
        return null;
      }
    }
  };
}

// Silence console noise during tests (treat warnings as non-fatal)
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args) => {
    const msg = (args && args[0]) || '';
    if (
      typeof msg === 'string' &&
      (msg.includes('Warning:') ||
        msg.includes('act(') ||
        msg.includes('Not wrapped in act(') ||
        msg.includes('An update to') ||
        msg.includes('React Router') ||
        msg.includes('deprecated'))
    ) {
      return;
    }
    originalError(...args);
  };
  console.warn = (...args) => {
    const msg = (args && args[0]) || '';
    if (typeof msg === 'string') {
      if (
        msg.includes('React Router') ||
        msg.includes('deprecated') ||
        msg.includes('act(') ||
        msg.includes('Not wrapped in act(')
      ) {
        return;
      }
    }
    originalWarn(...args);
  };
});

// Deterministic fetch mock setup.
// We simulate endpoints expected by the app. Ensure 'Workplace Safety Basics' is included.
const ORIGINAL_FETCH = global.fetch;
process.env.REACT_APP_USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API || 'true';

const LESSONS = [
  {
    id: 'lesson-1',
    title: 'Workplace Safety Basics',
    description: 'Core safety guidelines.',
    file_url: 'https://example.com/safety.pdf',
  },
  {
    id: 'lesson-2',
    title: 'Data Privacy Fundamentals',
    description: 'Protecting sensitive data.',
    file_url: 'https://example.com/privacy.pdf',
  },
];

// Track a single 404-then-success behavior for assignments if needed by specific tests
let firstAssignmentsCall = true;

beforeEach(() => {
  firstAssignmentsCall = true;

  global.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    // Parse pathname safely
    let path = url;
    try {
      const u = new URL(url, 'http://localhost');
      path = u.pathname;
    } catch {
      // keep relative url as-is
    }
    const method = (init?.method || 'GET').toUpperCase();

    // Lessons
    if (method === 'GET' && path.endsWith('/lessons')) {
      return new Response(JSON.stringify(LESSONS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Assignments /assignments/:employee_id
    if (method === 'GET' && /\/assignments\/[^/]+$/.test(path)) {
      if (firstAssignmentsCall) {
        firstAssignmentsCall = false;
        return new Response(JSON.stringify({ detail: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
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

    // Progress /progress/:employee_id
    if (method === 'GET' && /\/progress\/[^/]+$/.test(path)) {
      return new Response(JSON.stringify({ assigned: 2, completed: 1, percentage: 50 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Employees /employees/:employee_id - exists true for any id
    if (method === 'GET' && /\/employees\/[^/]+$/.test(path)) {
      const employee_id = path.split('/').pop();
      return new Response(JSON.stringify({ exists: true, employee: { employee_id, name: 'Test User' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Assign lesson
    if (method === 'POST' && path.endsWith('/assign')) {
      return new Response(
        JSON.stringify({ id: 'a-3', lesson_id: 'lesson-1', employee_id: 'employee-123' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Complete lesson
    if (method === 'POST' && path.endsWith('/complete')) {
      return new Response(
        JSON.stringify({ id: 'c-1', lesson_id: 'lesson-1', employee_id: 'employee-123' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Quizzes list
    if (method === 'GET' && path.endsWith('/quizzes')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fallback: not mocked
    if (typeof ORIGINAL_FETCH === 'function') {
      return ORIGINAL_FETCH(input, init);
    }
    return new Response(JSON.stringify({ error: `Not mocked: ${method} ${path}` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

afterAll(() => {
  if (ORIGINAL_FETCH) {
    global.fetch = ORIGINAL_FETCH;
  }
});
