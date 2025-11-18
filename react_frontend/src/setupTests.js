 /**
  * Global Jest setup for React Testing Library.
  *
  * - Adds jest-dom matchers
  * - Seeds/stubs browser APIs not present in jsdom
  * - Sets up deterministic fetch mocks for tests (includes 'Workplace Safety Basics')
  * - Silences noisy console warnings/errors to prevent CI noise
  */
import '@testing-library/jest-dom';

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
