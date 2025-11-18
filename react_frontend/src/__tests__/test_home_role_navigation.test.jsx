import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Home role selection navigation', () => {
  it('navigates to Employee dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Home title present
    expect(screen.getByRole('heading', { name: /Role-Based Learning Management/i })).toBeInTheDocument();

    const employeeBtn = await screen.findByRole('button', { name: /Employee/i }, { timeout: 5000 });
    await user.click(employeeBtn);

    const header = await screen.findByRole('heading', { name: /Employee Dashboard/i }, { timeout: 5000 });
    expect(header).toBeInTheDocument();

    // our deterministic lesson title eventually appears
    const lesson = await screen.findByText(/Workplace Safety Basics/i, {}, { timeout: 5000 });
    expect(lesson).toBeInTheDocument();
  });
});
