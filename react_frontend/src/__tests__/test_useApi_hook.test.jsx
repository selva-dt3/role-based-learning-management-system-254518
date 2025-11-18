import { renderHook, waitFor } from '@testing-library/react';
import useApi from '../hooks/useApi';

describe('useApi hook', () => {
  beforeEach(() => {
    process.env.REACT_APP_USE_MOCK_API = 'true';
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  test('fetches lessons and includes Workplace Safety Basics', async () => {
    const { result } = renderHook(() => useApi('/lessons'));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(Array.isArray(result.current.data)).toBe(true);
      },
      { timeout: 6000 }
    );

    const hasSafety = result.current.data?.some((l) => l.title === 'Workplace Safety Basics' && l.id === 'lesson-1');
    expect(hasSafety).toBe(true);
  });

  test('returns non-empty progress object for employee-123', async () => {
    const { result } = renderHook(() => useApi());
    const progress = await result.current.get('/progress/employee-123');
    expect(progress).toBeTruthy();
    expect(progress).toHaveProperty('assignedCount');
    expect(progress.assignedCount).toBeGreaterThanOrEqual(1);
  });
});
