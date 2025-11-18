import { renderHook, waitFor } from '@testing-library/react';
import useApi from '../hooks/useApi';

describe('useApi hook', () => {
  beforeEach(() => {
    // ensure deterministic mock mode
    process.env.REACT_APP_USE_MOCK_API = 'true';
  });

  test('fetches lessons and includes Workplace Safety Basics', async () => {
    const { result } = renderHook(() => useApi('/lessons'));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(Array.isArray(result.current.data)).toBe(true);
      },
      { timeout: 5000 }
    );

    const hasSafety = result.current.data?.some((l) => l.title === 'Workplace Safety Basics');
    expect(hasSafety).toBe(true);
  });
});
