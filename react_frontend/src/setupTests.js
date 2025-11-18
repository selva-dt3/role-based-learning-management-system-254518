 /* Setup for Jest + React Testing Library in jsdom environment */
import '@testing-library/jest-dom';

// Optional: stub features that may not exist in jsdom to avoid noisy logs
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

// Provide a minimal Response polyfill for custom fetch mocks if not present
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

// Deterministic global fetch mock for tests, including 'Workplace Safety Basics'
const ORIGINAL_FETCH = global.fetch;
process.env.REACT_APP_USE_MOCK_API = 'true';

beforeAll(() => {
  global.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    // Parse pathname safely
    let path = url;
    try {
      const u = new URL(url, 'http://localhost');
      path = u.pathname;
    } catch {
      // keep as-is for relative urls
    }

    const method = (init?.method || 'GET').toUpperCase();

    // Lessons
    if (method === 'GET' && path.endsWith('/lessons')) {
      return new Response(
        JSON.stringify([
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
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Assignments /assignments/:employee_id
    if (method === 'GET' && /\/assignments\/[^/]+$/.test(path)) {
      return new Response(
        JSON.stringify([
          { id: 'a-1', lesson_id: 'lesson-1', employee_id: 'employee-123' },
          { id: 'a-2', lesson_id: 'lesson-2', employee_id: 'employee-123' },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Progress /progress/:employee_id
    if (method === 'GET' && /\/progress\/[^/]+$/.test(path)) {
      return new Response(
        JSON.stringify({ assigned: 2, completed: 1, percentage: 50 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Employees
    if (method === 'GET' && /\/employees\/[^/]+$/.test(path)) {
      // Return exists true for any id to allow EmployeeDashboard gate to pass
      const employee_id = path.split('/').pop();
      return new Response(
        JSON.stringify({ exists: true, employee: { employee_id, name: 'Test User' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Assign and Complete
    if (method === 'POST' && path.endsWith('/assign')) {
      return new Response(
        JSON.stringify({ id: 'a-3', lesson_id: 'lesson-1', employee_id: 'employee-123' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
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

    // Fallback to original fetch if any
    if (typeof ORIGINAL_FETCH === 'function') {
      return ORIGINAL_FETCH(input, init);
    }
    return new Response(JSON.stringify({ error: `Not mocked: ${method} ${path}` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

afterEach(() => {
  if (global.fetch && 'mockClear' in global.fetch) {
    try {
      global.fetch.mockClear();
    } catch {
      // ignore if replaced
    }
  }
});

afterAll(() => {
  if (ORIGINAL_FETCH) {
    global.fetch = ORIGINAL_FETCH;
  }
});
