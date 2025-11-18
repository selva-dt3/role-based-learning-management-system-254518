import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';

jest.setTimeout(10000);

describe('EmployeeDashboard API integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
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

    expect(await screen.findByRole('heading', { name: /Employee Dashboard/i })).toBeInTheDocument();

    // After initial 404 and subsequent retry/success, expect the deterministic lesson title to appear
    expect(await screen.findByText(/Workplace Safety Basics/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Progress/i)).toBeInTheDocument();
    });
  });

  test('renders under MemoryRouter without nesting BrowserRouter in test', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Workplace Safety Basics/i)).toBeInTheDocument();
  });
});
