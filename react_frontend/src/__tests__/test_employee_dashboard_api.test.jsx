import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';

// Mock the REST layer used by useApi
jest.mock('../api/client', () => ({
  apiFetch: jest.fn(),
  apiUploadFile: jest.fn()
}));
import { apiFetch } from '../api/client';

describe('EmployeeDashboard API interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows error on empty ID, then handles not found (404), then success loading assignments', async () => {
    const user = userEvent.setup();

    // API mocks to simulate:
    // - first "Check" after typing emp-123 -> 404 not found (profile not found panel)
    // - second "Check" -> profile exists
    // - then assignments load
    const notFound = Object.assign(new Error('Employee not found'), { status: 404 });
    apiFetch
      .mockRejectedValueOnce(notFound) // GET /employees/emp-123 -> 404
      .mockResolvedValueOnce({ exists: true, employee: { employee_id: 'emp-123', name: 'Name' } }) // GET /employees/emp-123 -> exists
      .mockResolvedValueOnce([
        { lesson_id: 'L-101', lesson_title: 'Workplace Safety Basics', completed: false, progress: 0, files_count: 0 }
      ]); // GET /assignments/emp-123

    render(
      <MemoryRouter initialEntries={['/employee']}>
        <Routes>
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/Employee ID/i);
    const checkBtn = screen.getByRole('button', { name: /Check/i });

    // 1) Empty ID submit should show validation error (component-level validation, no API call)
    await act(async () => {
      await user.clear(input);
      await user.click(checkBtn);
    });
    expect(await screen.findByText(/Please enter your Employee ID\./i)).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();

    // 2) Enter non-existing ID -> 404 not found -> shows "Profile not found"
    await act(async () => {
      await user.type(input, 'emp-123');
      await user.click(checkBtn);
    });
    expect(await screen.findByText(/Profile not found/i)).toBeInTheDocument();
    expect(apiFetch).toHaveBeenNthCalledWith(1, '/employees/emp-123', { method: 'GET' });

    // 3) Click Check again -> success path; then assignments load
    await act(async () => {
      await user.click(checkBtn);
    });

    // Await UI updates for success flow
    expect(await screen.findByText(/Assigned Lessons/i)).toBeInTheDocument();
    expect(await screen.findByText(/Workplace Safety Basics/i)).toBeInTheDocument();

    // Verify expected calls sequence
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/employees/emp-123', { method: 'GET' });
    expect(apiFetch).toHaveBeenNthCalledWith(3, '/assignments/emp-123', { method: 'GET' });
  });

  it('shows inline validation error when ID is empty (no network calls)', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/employee']}>
        <Routes>
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    const checkBtn = screen.getByRole('button', { name: /Check/i });

    await act(async () => {
      await user.click(checkBtn);
    });

    expect(await screen.findByText(/Please enter your Employee ID\./i)).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
