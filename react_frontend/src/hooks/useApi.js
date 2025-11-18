import { useEffect, useMemo, useState } from 'react';
import { apiClient, apiFetch } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useApi
 * Two modes supported via a single, hooks-safe implementation:
 *  - Client mode: call useApi() to get a stable client with methods {get, post, put, del, ...domain helpers}
 *  - Data mode: call useApi(path) to also get { data, error, loading, refetch } for the given path
 *
 * Hooks are always called in the same order; data mode simply activates fetching when `path` is truthy.
 */
export default function useApi(path) {
  // Stable client object returned for client mode and included in data mode
  const client = useMemo(() => {
    return {
      // generic HTTP helpers via apiFetch
      get: (p) => apiFetch(p, { method: 'GET' }),
      post: (p, body) => apiFetch(p, { method: 'POST', body }),
      put: (p, body) => apiFetch(p, { method: 'PUT', body }),
      del: (p) => apiFetch(p, { method: 'DELETE' }),
      // domain helpers
      fetchLessons: () => apiClient.fetchLessons(),
      createLesson: (payload) => apiClient.createLesson(payload),
      updateLesson: (id, payload) => apiClient.updateLesson(id, payload),
      deleteLesson: (id) => apiClient.deleteLesson(id),
      assignLesson: (payload) => apiClient.assignLesson(payload),
      getAssignments: (employeeId) => apiClient.getAssignments(employeeId),
      markComplete: (payload) => apiClient.markComplete(payload),
      getProgress: (employeeId) => apiClient.getProgress(employeeId),
      uploadFile: (file, lessonId) => apiClient.uploadFile(file, lessonId),
      getEmployee: (employeeId) => apiClient.getEmployee(employeeId),
    };
  }, []);

  // Data mode state; these are always declared (to satisfy hooks rules)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  // Fetcher respects current path; if no path, it's a no-op and keeps state stable
  const fetcher = useMemo(() => {
    return async () => {
      if (!path) {
        setData(null);
        setLoading(false);
        setError(null);
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch(path, { method: 'GET' });
        setData(result);
        return result;
      } catch (e) {
        setError(e);
        return null;
      } finally {
        setLoading(false);
      }
    };
  }, [path]);

  useEffect(() => {
    if (path) {
      // only fetch when path is provided
      fetcher();
    } else {
      // reset when no path is provided
      setData(null);
      setLoading(false);
      setError(null);
    }
  }, [path, fetcher]);

  // Always return the same shape to maintain stability
  return {
    data,
    loading,
    error,
    refetch: fetcher,
    ...client,
  };
}
