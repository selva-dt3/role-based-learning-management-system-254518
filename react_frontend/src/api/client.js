const DEFAULT_TIMEOUT = 15000;

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns API base URL from environment. Ensure no trailing slash. */
  const base =
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    '';
  return base.replace(/\/*$/, '');
}

// -- Mock switch --
const USE_MOCK =
  String(process.env.REACT_APP_USE_MOCK_API || '').toLowerCase() === 'true' ||
  process.env.NODE_ENV === 'test';

let mock;
if (USE_MOCK) {
  // eslint-disable-next-line global-require
  mock = require('./mockApi');
}

// PUBLIC_INTERFACE
export const apiClient = {
  /** Fetch lessons. Uses mock in test mode. */
  async fetchLessons() {
    if (USE_MOCK) return mock.fetchLessons();
    const res = await apiFetch('/lessons', { method: 'GET' });
    return res;
  },

  /** Create a lesson. */
  async createLesson(payload) {
    if (USE_MOCK) return mock.createLesson(payload);
    return apiFetch('/lessons', { method: 'POST', body: payload });
  },

  /** Update a lesson. */
  async updateLesson(lessonId, payload) {
    if (USE_MOCK) return mock.updateLesson(lessonId, payload);
    return apiFetch(`/lessons/${lessonId}`, { method: 'PUT', body: payload });
  },

  /** Delete a lesson. */
  async deleteLesson(lessonId) {
    if (USE_MOCK) return mock.deleteLesson(lessonId);
    return apiFetch(`/lessons/${lessonId}`, { method: 'DELETE' });
  },

  /** Assign a lesson. */
  async assignLesson(payload) {
    if (USE_MOCK) return mock.assignLesson(payload);
    return apiFetch('/assign', { method: 'POST', body: payload });
  },

  /** Get assignments for employee. */
  async getAssignments(employeeId) {
    if (USE_MOCK) return mock.getAssignments(employeeId);
    return apiFetch(`/assignments/${employeeId}`, { method: 'GET' });
  },

  /** Mark completion. */
  async markComplete(payload) {
    if (USE_MOCK) return mock.markComplete(payload);
    return apiFetch('/complete', { method: 'POST', body: payload });
  },

  /** Get progress for employee. */
  async getProgress(employeeId) {
    if (USE_MOCK) return mock.getProgress(employeeId);
    return apiFetch(`/progress/${employeeId}`, { method: 'GET' });
  },

  /** Upload file helper. */
  async uploadFile(file, optionalLessonId) {
    if (USE_MOCK) return mock.uploadFile(file, optionalLessonId);
    return apiUploadFile(file, optionalLessonId);
  },

  /** Employee check */
  async getEmployee(employeeId) {
    if (USE_MOCK) return mock.getEmployee(employeeId);
    return apiFetch(`/employees/${employeeId}`, { method: 'GET' });
  },
};

// PUBLIC_INTERFACE
export async function apiFetch(path, options = {}) {
  /**
   * Generic fetch wrapper for backend REST calls with JSON handling.
   */
  if (USE_MOCK) {
    // Route through apiClient methods for consistency even in test mode
    const method = (options.method || 'GET').toUpperCase();
    const p = path?.startsWith('/') ? path : `/${path || ''}`;
    const body = options.body;

    if (method === 'GET' && p === '/lessons') return mock.fetchLessons();
    if (method === 'POST' && p === '/lessons') return mock.createLesson(body);

    const lessonIdMatch = p.match(/^\/lessons\/([^/]+)$/);
    if (lessonIdMatch) {
      const id = lessonIdMatch[1];
      if (method === 'PUT') return mock.updateLesson(id, body);
      if (method === 'DELETE') return mock.deleteLesson(id);
    }

    if (method === 'POST' && p === '/assign') return mock.assignLesson(body);
    const assignmentsMatch = p.match(/^\/assignments\/([^/]+)$/);
    if (method === 'GET' && assignmentsMatch) return mock.getAssignments(assignmentsMatch[1]);

    if (method === 'POST' && p === '/complete') return mock.markComplete(body);
    const progressMatch = p.match(/^\/progress\/([^/]+)$/);
    if (method === 'GET' && progressMatch) return mock.getProgress(progressMatch[1]);

    const empMatch = p.match(/^\/employees\/([^/]+)$/);
    if (method === 'GET' && empMatch) return mock.getEmployee(empMatch[1]);

    // Fallback to not implemented
    throw new Error(`Mock API route not implemented for ${method} ${p}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

  const url = `${getApiBaseUrl()}${path?.startsWith('/') ? path : `/${path || ''}`}`;
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      credentials: 'omit',
      mode: 'cors',
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
