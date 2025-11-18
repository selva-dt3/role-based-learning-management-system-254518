import { useMemo } from 'react';
import { apiClient } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useApi
 * Exposes API methods respecting environment selection.
 * When REACT_APP_USE_MOCK_API === 'true' or NODE_ENV === 'test',
 * apiClient internally uses mockApi. This hook simply returns the client.
 */
export default function useApi() {
  const client = useMemo(() => apiClient, []);
  return client;
}
