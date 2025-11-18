import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';

jest.setTimeout(20000);

describe('EmployeeDashboard API integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  test('enter employee-123: first Check shows Profile not found (404), second shows Assigned Lessons and Workplace Safety Basics', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );

    const input = await screen.findByLabelText(/Employee ID/i, {}, { timeout: 5000 });
    fireEvent.change(input, { target: { value: 'employee-123' } });

    const checkBtn = screen.getByRole('button', { name: /check/i });
    fireEvent.click(checkBtn);

    const notFound = await screen.findByText(/Profile not found/i, {}, { timeout: 10000 });
    expect(notFound).toBeInTheDocument();

    fireEvent.click(checkBtn);

    await waitFor(
      async () => {
        expect(await screen.findByText(/Assigned Lessons/i)).toBeInTheDocument();
        expect(await screen.findByText(/Workplace Safety Basics/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  test('component works in MemoryRouter wrapper without extra Router nesting', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );

    const input = await screen.findByLabelText(/Employee ID/i);
    fireEvent.change(input, { target: { value: 'employee-123' } });

    const checkBtn = screen.getByRole('button', { name: /check/i });
    fireEvent.click(checkBtn);
    await screen.findByText(/Profile not found/i);

    fireEvent.click(checkBtn);
    expect(await screen.findByText(/Workplace Safety Basics/i)).toBeInTheDocument();
  });
});
