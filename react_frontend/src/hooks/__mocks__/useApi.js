//
// Mock implementation of useApi for Jest tests.
// Always returns a stable object with get/post/put/del methods and static mock responses.
//

// PUBLIC_INTERFACE
export default function useApi() {
  /** Returns a mocked API client with stable methods for tests. */
  const mockResponses = {
    '/lessons': [
      {
        id: 'lesson-1',
        title: 'Workplace Safety Basics',
        description: 'Test lesson',
        file_url: null,
      },
    ],
    '/assignments/employee-123': [
      { id: 'a1', employee_id: 'employee-123', lesson_id: 'lesson-1' },
    ],
    '/progress/employee-123': {
      assignedCount: 1,
      completedCount: 0,
      percentage: 0,
    },
  };

  const get = jest.fn(async (path) => mockResponses[path]);
  const post = jest.fn(async () => ({ status: 201 }));
  const put = jest.fn();
  const del = jest.fn();

  return {
    get,
    post,
    put,
    del,
    data: null,
    error: null,
    loading: false,
  };
}
