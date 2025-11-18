 /**
  * Global Jest setup for React tests.
  * - Force mock API usage before any imports
  * - Mock the API client with our deterministic mockApi
  */
process.env.REACT_APP_USE_MOCK_API = 'true';

// Ensure any hook that imports client will receive the mock
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
      if (method === 'GET' && p === '/lessons') return mockApi.fetchLessons();
      if (method === 'POST' && p === '/lessons') return mockApi.createLesson(body);

      // Lessons by id
      const lessonIdMatch = p.match(/^\/lessons\/([^/]+)$/);
      if (lessonIdMatch) {
        const id = lessonIdMatch[1];
        if (method === 'PUT') return mockApi.updateLesson(id, body);
        if (method === 'DELETE') return mockApi.deleteLesson(id);
      }

      // Assignments & progress
      if (method === 'POST' && p === '/assign') return mockApi.assignLesson(body);
      const assignmentsMatch = p.match(/^\/assignments\/([^/]+)$/);
      if (method === 'GET' && assignmentsMatch) return mockApi.getAssignments(assignmentsMatch[1]);

      if (method === 'POST' && p === '/complete') return mockApi.markComplete(body);
      const progressMatch = p.match(/^\/progress\/([^/]+)$/);
      if (method === 'GET' && progressMatch) return mockApi.getProgress(progressMatch[1]);

      // Employees
      const empGetMatch = p.match(/^\/employees\/([^/]+)$/);
      if (method === 'GET' && empGetMatch) return mockApi.getEmployee(empGetMatch[1]);

      // Quizzes
      if (method === 'GET' && p === '/quizzes') return mockApi.getQuizzes();
      if (method === 'POST' && p === '/quizzes') return mockApi.createQuiz(body);
      const quizIdMatch = p.match(/^\/quizzes\/([^/]+)$/);
      if (quizIdMatch) {
        const id = quizIdMatch[1];
        if (method === 'PUT') return mockApi.updateQuiz(id, body);
        if (method === 'DELETE') return mockApi.deleteQuiz(id);
      }

      throw new Error(`Mocked client: route not implemented for ${method} ${p}`);
    },
    // PUBLIC_INTERFACE
    apiUploadFile: async (file, optionalLessonId) => mockApi.uploadFile(file, optionalLessonId),
    // Provide apiClient shape minimally to satisfy imports that reference it
    apiClient: {
      fetchLessons: () => mockApi.fetchLessons(),
      createLesson: (p) => mockApi.createLesson(p),
      updateLesson: (id, p) => mockApi.updateLesson(id, p),
      deleteLesson: (id) => mockApi.deleteLesson(id),
      assignLesson: (p) => mockApi.assignLesson(p),
      getAssignments: (id) => mockApi.getAssignments(id),
      markComplete: (p) => mockApi.markComplete(p),
      getProgress: (id) => mockApi.getProgress(id),
      uploadFile: (f, id) => mockApi.uploadFile(f, id),
      getEmployee: (id) => mockApi.getEmployee(id),
    },
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
