const DEFAULT_TIMEOUT = 15000;

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns API base URL from environment. */
  const base = process.env.REACT_APP_API_BASE_URL || '';
  return base.replace(/\/+$/, '');
}

// PUBLIC_INTERFACE
export async function apiFetch(path, options = {}) {
  /** Generic fetch wrapper for backend REST calls with JSON handling. */
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
