import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';

describe('EmployeeDashboard API integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // seed employee id expected by deterministic mocks
    window.localStorage.setItem('rb-lms:v1:employee_id', 'employee-123');
  });

  test('loads and displays assigned lessons and progress', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <Routes>
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    const header = await screen.findByRole('heading', { name: /Employee Dashboard/i }, { timeout: 5000 });
    expect(header).toBeInTheDocument();

    const assignedHeading = await screen.findByText(/Assigned Lessons/i, {}, { timeout: 5000 });
    expect(assignedHeading).toBeInTheDocument();

    // Expect deterministic lesson present
    const lessonTitle = await screen.findByText(/Workplace Safety Basics/i, {}, { timeout: 5000 });
    expect(lessonTitle).toBeInTheDocument();

    const progressLabel = await screen.findByText(/Progress/i, {}, { timeout: 5000 });
    expect(progressLabel).toBeInTheDocument();
  });

  test('renders directly under MemoryRouter without nested BrowserRouter', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );
    const lesson = await screen.findByText(/Workplace Safety Basics/i, {}, { timeout: 5000 });
    expect(lesson).toBeInTheDocument();
  });
});
