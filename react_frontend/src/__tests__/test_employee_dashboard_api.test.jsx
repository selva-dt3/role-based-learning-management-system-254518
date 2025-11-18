import React from 'react';
import { render, screen } from '@testing-library/react';
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
    // Ensure localStorage is clean for employee id persistence
    window.localStorage.clear();
  });

  it('shows error on empty ID, then handles not found (404), then success loading assignments', async () => {
    const user = userEvent.setup();

    // First call: click "Check" with empty input -> handled by component validation (no api call)
    // Next: when ID provided:
    // - GET /employees/emp-123 -> 404 (not found)
    // - GET /employees/emp-123 -> success exists true
    // - GET /assignments/emp-123 -> return assignments
    const notFound = Object.assign(new Error('Employee not found'), { status: 404 });
    apiFetch
      .mockRejectedValueOnce(notFound) // first check existing with emp-123
      .mockResolvedValueOnce({ exists: true, employee: { employee_id: 'emp-123', name: 'Name' } }) // second check
      .mockResolvedValueOnce([
        { lesson_id: 'L-101', lesson_title: 'Workplace Safety Basics', completed: false, progress: 0, files_count: 0 }
      ]); // assignments

    render(
      <MemoryRouter initialEntries={['/employee']}>
        <Routes>
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Enter id and click Check (first time: 404 -> not found panel)
    const input = screen.getByLabelText(/Employee ID/i);
    await user.clear(input);
    await user.type(input, 'emp-123');
    await user.click(screen.getByRole('button', { name: /Check/i }));

    // After 404, show "Profile not found"
    expect(await screen.findByText(/Profile not found/i)).toBeInTheDocument();

    // Click Check again should trigger success path and load assignments
    await user.click(screen.getByRole('button', { name: /Check/i }));

    // Await UI updates for the success flow
    expect(await screen.findByText(/Assigned Lessons/i)).toBeInTheDocument();

    // Verify one assignment card rendered with lesson title (await async render)
    expect(await screen.findByText(/Workplace Safety Basics/i)).toBeInTheDocument();

    // Ensure our calls happened in expected order
    expect(apiFetch).toHaveBeenNthCalledWith(1, '/employees/emp-123', { method: 'GET' });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/employees/emp-123', { method: 'GET' });
    expect(apiFetch).toHaveBeenNthCalledWith(3, '/assignments/emp-123', { method: 'GET' });
  });

  it('shows inline validation error when ID is empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <Routes>
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Check/i }));
    expect(await screen.findByText(/Please enter your Employee ID\./i)).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
