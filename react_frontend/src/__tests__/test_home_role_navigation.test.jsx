import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

jest.setTimeout(10000);

describe('Home role selection navigation', () => {
  it('navigates to Employee dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: /Role-Based Learning Management/i })).toBeInTheDocument();

    const employeeBtn = await screen.findByRole('button', { name: /Employee/i });
    await user.click(employeeBtn);

    const header = await screen.findByRole('heading', { name: /Employee Dashboard/i });
    expect(header).toBeInTheDocument();

    const lesson = await screen.findByText(/Workplace Safety Basics/i);
    expect(lesson).toBeInTheDocument();
  });
});
