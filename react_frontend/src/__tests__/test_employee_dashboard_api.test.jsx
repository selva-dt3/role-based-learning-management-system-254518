import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';

describe('EmployeeDashboard API integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('rb-lms:v1:employee_id', 'employee-123');
  });

  test('loads and displays assigned lessons after 404 then success', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/employee']}>
          <Routes>
            <Route path="/employee" element={<EmployeeDashboard />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Heading should appear
    const header = await screen.findByRole('heading', { name: /Employee Dashboard/i }, { timeout: 5000 });
    expect(header).toBeInTheDocument();

    // After initial 404 and subsequent retry/success, expect 'Workplace Safety Basics'
    const lessonTitle = await screen.findByText(/Workplace Safety Basics/i, {}, { timeout: 5000 });
    expect(lessonTitle).toBeInTheDocument();

    // Progress section visible
    await waitFor(async () => {
      expect(await screen.findByText(/Progress/i)).toBeInTheDocument();
    });
  });

  test('renders under MemoryRouter without nesting BrowserRouter in test', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );
    const lesson = await screen.findByText(/Workplace Safety Basics/i, {}, { timeout: 5000 });
    expect(lesson).toBeInTheDocument();
  });
});
