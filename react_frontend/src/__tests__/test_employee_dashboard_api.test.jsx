import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import { mockLessonsFirst404ThenSuccess } from './mocks/handlers';

describe('EmployeeDashboard API integration (mocked)', () => {
  beforeEach(() => {
    // Set up deterministic mock: first lessons 404 then success
    mockLessonsFirst404ThenSuccess();
    window.localStorage.clear();
  });

  test('renders assigned lessons including "Workplace Safety Basics" after async load', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <Routes>
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Use findBy* which automatically waits for the element to appear after async updates
    const lessonTitle = await screen.findByText(/Workplace Safety Basics/i, {}, { timeout: 3000 });
    expect(lessonTitle).toBeInTheDocument();
  });

  test('does not use nested routers and can render directly under MemoryRouter', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );
    // Still should eventually show the mocked lesson title
    expect(await screen.findByText(/Workplace Safety Basics/i)).toBeInTheDocument();
  });
});
