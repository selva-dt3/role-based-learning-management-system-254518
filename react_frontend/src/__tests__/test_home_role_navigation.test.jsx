import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

jest.setTimeout(15000);

describe('Home role selection navigation', () => {
  it('navigates to Employee, performs check twice, then shows Workplace Safety Basics', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: /Role-Based Learning Management/i })).toBeInTheDocument();

    const employeeBtn = await screen.findByRole('button', { name: /Employee/i });
    await user.click(employeeBtn);

    // Fill ID and trigger two-step check
    const input = await screen.findByLabelText(/Employee ID/i, {}, { timeout: 5000 });
    await user.type(input, 'employee-123');

    const checkBtn = screen.getByRole('button', { name: /check/i });
    await user.click(checkBtn);
    await screen.findByText(/Profile not found/i, {}, { timeout: 6000 });

    await user.click(checkBtn);

    // After success, Assigned Lessons should render and include Workplace Safety Basics
    expect(await screen.findByText(/Assigned Lessons/i, {}, { timeout: 8000 })).toBeInTheDocument();
    expect(await screen.findByText(/Workplace Safety Basics/i, {}, { timeout: 8000 })).toBeInTheDocument();
  });
});
