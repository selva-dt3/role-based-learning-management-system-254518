import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';

describe('EmployeeDashboard API integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    // Pre-fill employee id so dashboard immediately checks and loads data
    window.localStorage.setItem('rb-lms:v1:employee_id', 'employee-123');
  });

  test('loads and displays assigned lessons after 404 then success', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <Routes>
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the heading
    expect(await screen.findByRole('heading', { name: /Employee Dashboard/i }, { timeout: 8000 })).toBeInTheDocument();

    // After initial 404 and subsequent retry/success, expect the lesson title to be rendered
    expect(await screen.findByText(/Workplace Safety Basics/i, undefined, { timeout: 8000 })).toBeInTheDocument();

    // Wait for the Progress section to appear and table to settle
    await waitFor(() => {
      expect(screen.getByText(/Progress/i)).toBeInTheDocument();
    }, { timeout: 8000 });
  });

  test('renders under MemoryRouter without nesting BrowserRouter in test', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Workplace Safety Basics/i, undefined, { timeout: 8000 })).toBeInTheDocument();
  });
});
