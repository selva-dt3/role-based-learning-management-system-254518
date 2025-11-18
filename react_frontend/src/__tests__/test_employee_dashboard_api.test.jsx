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

  test('profile check shows not found first, then assignments on next check', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );

    // Enter an employee ID
    const input = await screen.findByLabelText(/Employee ID/i, {}, { timeout: 5000 });
    fireEvent.change(input, { target: { value: 'employee-123' } });

    // First check: expect profile not found message
    const checkBtn = screen.getByRole('button', { name: /check/i });
    fireEvent.click(checkBtn);

    const notFound = await screen.findByText(/Profile not found/i, {}, { timeout: 8000 });
    expect(notFound).toBeInTheDocument();

    // Second check: expect assigned lessons & specific lesson title
    fireEvent.click(checkBtn);

    await waitFor(async () => {
      expect(await screen.findByText(/Assigned Lessons/i)).toBeInTheDocument();
      expect(await screen.findByText(/Workplace Safety Basics/i)).toBeInTheDocument();
    }, { timeout: 12000 });

    // Progress section appears
    await waitFor(() => {
      expect(screen.getByText(/Progress/i)).toBeInTheDocument();
    }, { timeout: 12000 });
  });

  test('does not wrap App in another Router; renders component within MemoryRouter only', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );
    // Perform the explicit flow for determinism
    const input = await screen.findByLabelText(/Employee ID/i);
    fireEvent.change(input, { target: { value: 'employee-123' } });

    const checkBtn = screen.getByRole('button', { name: /check/i });
    fireEvent.click(checkBtn);
    await screen.findByText(/Profile not found/i);

    fireEvent.click(checkBtn);
    expect(await screen.findByText(/Workplace Safety Basics/i)).toBeInTheDocument();
  });
});
