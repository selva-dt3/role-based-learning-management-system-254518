import React from 'react';
import { renderHook, act } from '@testing-library/react';
import useApi from '../hooks/useApi';

// Mock api client functions
jest.mock('../api/client', () => ({
  apiFetch: jest.fn(),
  apiUploadFile: jest.fn()
}));

import { apiFetch, apiUploadFile } from '../api/client';

describe('useApi hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches when initialPath is provided and sets data', async () => {
    apiFetch.mockResolvedValueOnce([{ id: 'L-1', title: 'T' }]);

    const { result } = renderHook(() => useApi('/lessons'));

    expect(result.current.loading).toBe(true);

    // wait for state updates
    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual([{ id: 'L-1', title: 'T' }]);
    expect(apiFetch).toHaveBeenCalledWith('/lessons', { method: 'GET' });
  });

  it('get() sets error when api fails', async () => {
    const err = new Error('boom');
    apiFetch.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await expect(result.current.get('/oops')).rejects.toThrow('boom');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(err);
  });

  it('post/put/del/upload proxy to api client', async () => {
    apiFetch
      .mockResolvedValueOnce({ ok: true }) // post
      .mockResolvedValueOnce({ id: '1' }) // put
      .mockResolvedValueOnce({ ok: true }); // del
    apiUploadFile.mockResolvedValueOnce({ url: 'https://example.com/f.pdf' });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      const postRes = await result.current.post('/assign', { a: 1 });
      expect(postRes).toEqual({ ok: true });

      const putRes = await result.current.put('/lessons/1', { title: 'X' });
      expect(putRes).toEqual({ id: '1' });

      const delRes = await result.current.del('/lessons/1');
      expect(delRes).toEqual({ ok: true });

      const upRes = await result.current.upload(new File(['x'], 'file.pdf'), 'L-1');
      expect(upRes).toEqual({ url: 'https://example.com/f.pdf' });
    });

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/assign', { method: 'POST', body: { a: 1 } });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/lessons/1', { method: 'PUT', body: { title: 'X' } });
    expect(apiFetch).toHaveBeenNthCalledWith(3, '/lessons/1', { method: 'DELETE' });
    expect(apiUploadFile).toHaveBeenCalled();
  });
});
