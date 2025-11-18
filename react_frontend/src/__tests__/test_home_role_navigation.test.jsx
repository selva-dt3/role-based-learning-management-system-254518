import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

jest.setTimeout(20000);

describe('Home role selection navigation', () => {
  it('navigates to Employee, performs two-step check, then shows Workplace Safety Basics', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: /Role-Based Learning Management/i })).toBeInTheDocument();

    const employeeBtn = await screen.findByRole('button', { name: /Employee/i });
    await user.click(employeeBtn);

    const input = await screen.findByLabelText(/Employee ID/i, {}, { timeout: 5000 });
    await user.clear(input);
    await user.type(input, 'employee-123');

    const checkBtn = screen.getByRole('button', { name: /Check/i });
    await user.click(checkBtn);
    await screen.findByText(/Profile not found/i, {}, { timeout: 8000 });

    await user.click(checkBtn);

    const sectionHeading = await screen.findByText(/Assigned Lessons/i, {}, { timeout: 10000 });
    const region = sectionHeading.closest('section') || sectionHeading.parentElement;
    expect(region).toBeTruthy();

    const utils = within(region);
    const items = await utils.findAllByText(/Workplace Safety Basics/i, {}, { timeout: 10000 });
    expect(items.length).toBeGreaterThan(0);
  });
});
