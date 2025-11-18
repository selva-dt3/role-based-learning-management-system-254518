 /**
  * Global Jest setup for React tests.
  * - Force mock API usage before any imports
  * - Map the API client module path used by the app ('./api/client') to './api/mockApi'
  * - Do not initialize MSW or other fetch mocks that could conflict
  */
process.env.REACT_APP_USE_MOCK_API = 'true';

// Map the exact module path used by app code to the mock implementation.
jest.mock('./api/client', () => {
  const mockApi = require('./api/mockApi');
  return {
    __esModule: true,
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
      if (method === 'POST' && p === '/employees') return mockApi.upsertEmployee ? mockApi.upsertEmployee(body) : { ...body };

      throw new Error(`Mocked client: route not implemented for ${method} ${p}`);
    },
    // PUBLIC_INTERFACE
    apiUploadFile: async (file, optionalLessonId) => mockApi.uploadFile(file, optionalLessonId),
  };
});

// Testing Library jest-dom matchers
import '@testing-library/jest-dom';

// Lightweight polyfills to reduce noise in jsdom
if (typeof window !== 'undefined') {
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
}
