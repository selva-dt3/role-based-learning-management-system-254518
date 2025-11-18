import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, apiUploadFile } from '../api/client';

// PUBLIC_INTERFACE
export default function useApi(initialPath = '') {
  /**
   * React hook to call REST endpoints.
   * - Pass initialPath to auto-fetch (string). Pass null/'' to disable auto-fetch.
   * - Provides get, post, put, del helpers and upload.
   * In tests, setupTests.js mocks ../api/client to route to ./api/mockApi.
   */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(initialPath));
  const [error, setError] = useState(null);
  const pathRef = useRef(initialPath);

  const get = useCallback(async (path) => {
    setLoading(true); setError(null);
    try {
      const result = await apiFetch(path, { method: 'GET' });
      setData(result);
      return result;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async (path, body) => apiFetch(path, { method: 'POST', body }), []);
  const put = useCallback(async (path, body) => apiFetch(path, { method: 'PUT', body }), []);
  const del = useCallback(async (path) => apiFetch(path, { method: 'DELETE' }), []);
  const upload = useCallback(async (file, optionalLessonId) => apiUploadFile(file, optionalLessonId), []);

  const refetch = useCallback(async () => {
    const p = pathRef.current;
    if (!p) return;
    return get(p);
  }, [get]);

  useEffect(() => {
    pathRef.current = initialPath;
    if (initialPath) {
      get(initialPath).catch(() => {});
    } else {
      setLoading(false);
    }
  }, [initialPath, get]);

  return { data, loading, error, get, post, put, del, refetch, upload };
}
