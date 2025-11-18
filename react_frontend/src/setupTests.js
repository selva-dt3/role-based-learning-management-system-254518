 /**
  * Global Jest setup for React Testing Library.
  * Ensures mock mode and mocks the exact api/client path resolving used by app code.
  */
process.env.REACT_APP_USE_MOCK_API = 'true';

// Mock the exact module path app imports: './api/client' relative to src files.
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
      if (method === 'POST' && (p === '/lessons' || p === '/lesson')) return mockApi.createLesson(body);

      // Lessons by id
      const lessonIdMatch = p.match(/^\/lessons\/([^/]+)$/) || p.match(/^\/lesson\/([^/]+)$/);
      if (lessonIdMatch) {
        const id = lessonIdMatch[1];
        if (method === 'PUT') return mockApi.updateLesson(id, body);
        if (method === 'DELETE') return mockApi.deleteLesson(id);
      }

      // Assignments & progress
      if (method === 'POST' && p === '/assign') return mockApi.assignLesson(body);
      const assignmentsMatch = p.match(/^\/assignments\/([^/]+)$/);
      if (method === 'GET' && assignmentsMatch) return mockApi.getAssignments(assignmentsMatch[1]);

      if (method === 'POST' && p === '/complete') return mockApi.completeLesson(body);
      const progressMatch = p.match(/^\/progress\/([^/]+)$/);
      if (method === 'GET' && progressMatch) return mockApi.getProgress(progressMatch[1]);

      // Quizzes
      if (method === 'GET' && p === '/quizzes') return mockApi.getQuizzes();
      if (method === 'POST' && p === '/quizzes') return mockApi.createQuiz(body);
      const quizIdMatch = p.match(/^\/quizzes\/([^/]+)$/);
      if (quizIdMatch) {
        const id = quizIdMatch[1];
        if (method === 'PUT') return mockApi.updateQuiz(id, body);
        if (method === 'DELETE') return mockApi.deleteQuiz(id);
      }

      // Employees
      const empGetMatch = p.match(/^\/employees\/([^/]+)$/);
      if (method === 'GET' && empGetMatch) return mockApi.getEmployee(empGetMatch[1]);
      if (method === 'POST' && p === '/employees') return mockApi.upsertEmployee(body);

      throw new Error(`Mocked client: route not implemented for ${method} ${p}`);
    },
    // PUBLIC_INTERFACE
    apiUploadFile: async (file, optionalLessonId) => mockApi.uploadFile(file, optionalLessonId),
  };
});

import '@testing-library/jest-dom';

// Minor polyfills to avoid test environment noise.
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

class ResizeObserverMock { observe() {} unobserve() {} disconnect() {} }
window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

if (typeof global.Response === 'undefined') {
  global.Response = class {
    constructor(body, init = {}) {
      this._body = typeof body === 'string' ? body : JSON.stringify(body ?? '');
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this._headers = new Map(Object.entries(init.headers || {}));
      this.ok = this.status >= 200 && this.status < 300;
    }
    async json() { try { return JSON.parse(this._body); } catch { return this._body; } }
    async text() { return this._body; }
    headers = { get: (k) => (this._headers instanceof Map ? this._headers.get(k) : null) };
  };
}

const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args) => {
    const msg = (args && args[0]) || '';
    if (typeof msg === 'string' && (msg.includes('Warning:') || msg.includes('act(') || msg.includes('Not wrapped in act(') || msg.includes('React Router') || msg.includes('deprecated'))) return;
    originalError(...args);
  };
  console.warn = (...args) => {
    const msg = (args && args[0]) || '';
    if (typeof msg === 'string' && (msg.includes('React Router') || msg.includes('deprecated') || msg.includes('act(') || msg.includes('Not wrapped in act('))) return;
    originalWarn(...args);
  };
});
