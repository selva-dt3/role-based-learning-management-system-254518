export const mockLessonsFirst404ThenSuccess = () => {
  /**
   * Simple fetch mock that simulates:
   *  - First GET /lessons returns 404 (to exercise error UI)
   *  - Second and subsequent GET /lessons return success with deterministic data
   * It also stubs other endpoints used by the EmployeeDashboard if invoked.
   */
  let lessonsCallCount = 0;

  global.fetch = jest.fn(async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url || '';
    const method = (init && init.method ? init.method : 'GET').toUpperCase();

    // Normalize path extraction to work with absolute URLs
    let path = url;
    try {
      const parsed = new URL(url, 'http://localhost');
      path = parsed.pathname;
    } catch {
      // leave as-is if not a full URL
    }

    // Handle lessons list
    if (method === 'GET' && path.endsWith('/lessons')) {
      lessonsCallCount += 1;
      if (lessonsCallCount === 1) {
        return new Response(JSON.stringify({ detail: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const lessons = [
        {
          id: 'lesson-1',
          title: 'Workplace Safety Basics',
          description: 'Intro to safety essentials.',
          file_url: null,
        },
        {
          id: 'lesson-2',
          title: 'Company Policies Overview',
          description: 'Review of internal policies.',
          file_url: null,
        },
      ];
      return new Response(JSON.stringify(lessons), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Optional: stub other endpoints the UI may call to avoid network errors
    if (method === 'GET' && path.match(/^\/assignments\//)) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && path.match(/^\/progress\//)) {
      return new Response(JSON.stringify({ assigned: 2, completed: 0, percentage: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && path === '/assign') {
      return new Response(JSON.stringify({ id: 'assign-1', lesson_id: 'lesson-1', employee_id: 'emp-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && path === '/complete') {
      return new Response(JSON.stringify({ id: 'comp-1', lesson_id: 'lesson-1', employee_id: 'emp-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default fallback for unhandled requests
    return new Response(JSON.stringify({ message: 'Unhandled request in test mock', url, method }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
};
