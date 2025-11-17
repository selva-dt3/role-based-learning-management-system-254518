const DEFAULT_TIMEOUT = 15000;

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns API base URL from environment. */
  const base = process.env.REACT_APP_API_BASE_URL || '';
  return base.replace(/\/*$/, '');
}

// -- Mock switch --
const USE_MOCK = String(process.env.REACT_APP_USE_MOCK_API || '').toLowerCase() === 'true';

let mock;
// Lazy import to avoid bundling when not used by tree-shaking
if (USE_MOCK) {
  // eslint-disable-next-line global-require
  mock = require('./mockApi');
}

// PUBLIC_INTERFACE
export async function apiFetch(path, options = {}) {
  /**
   * Generic fetch wrapper for backend REST calls with JSON handling.
   * When mock mode is enabled, it routes specific paths to mock functions.
   */
  if (USE_MOCK) {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body || {};
    const p = path?.startsWith('/') ? path : `/${path || ''}`;

    // Lessons
    if (method === 'GET' && p === '/lessons') return mock.getLessons();
    if (method === 'POST' && (p === '/lesson' || p === '/lessons')) return mock.createLesson(body);

    // PUT/DELETE with id for /lesson/:id or /lessons/:id
    const lessonIdMatch = p.match(/^\/lesson[s]?\/([^/]+)$/);
    if (lessonIdMatch) {
      const id = lessonIdMatch[1];
      if (method === 'PUT') return mock.updateLesson(id, body);
      if (method === 'DELETE') return mock.deleteLesson(id);
    }

    // Assignments & progress
    if (method === 'POST' && p === '/assign') return mock.assignLesson(body);
    const assignmentsMatch = p.match(/^\/assignments\/([^/]+)$/);
    if (method === 'GET' && assignmentsMatch) return mock.getAssignments(assignmentsMatch[1]);

    if (method === 'POST' && p === '/complete') return mock.completeLesson(body);
    const progressMatch = p.match(/^\/progress\/([^/]+)$/);
    if (method === 'GET' && progressMatch) return mock.getProgress(progressMatch[1]);

    // Quizzes
    if (method === 'GET' && p === '/quizzes') return mock.getQuizzes();
    if (method === 'POST' && p === '/quizzes') return mock.createQuiz(body);
    const quizIdMatch = p.match(/^\/quizzes\/([^/]+)$/);
    if (quizIdMatch) {
      const id = quizIdMatch[1];
      if (method === 'PUT') return mock.updateQuiz(id, body);
      if (method === 'DELETE') return mock.deleteQuiz(id);
    }

    throw new Error(`Mock API route not implemented for ${method} ${p}`);
  }

  // Real backend mode
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

  const url = `${getApiBaseUrl()}${path?.startsWith('/') ? path : `/${path || ''}`}`;
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      credentials: 'omit',
      mode: 'cors'
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
      const message = typeof data === 'string' ? data : (data?.detail || data?.error || 'Request failed');
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// PUBLIC_INTERFACE
export async function apiUploadFile(file, optionalLessonId) {
  /**
   * Upload helper.
   * - In mock mode, returns a fake URL.
   * - In real mode, attempts multipart upload to /upload.
   */
  if (USE_MOCK) {
    return mock.uploadFile(file, optionalLessonId);
  }
  const form = new FormData();
  form.append('file', file);

  const url = `${getApiBaseUrl()}/upload`;
  const res = await fetch(url, { method: 'POST', body: form });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof data === 'string' ? data : (data?.detail || data?.error || 'Upload failed');
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
