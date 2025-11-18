import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

jest.setTimeout(30000);

test('Navigate to each role dashboard from home', async () => {
  render(<App />);
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: /Admin/i }));
  await screen.findByRole('heading', { name: /Admin Dashboard/i }, { timeout: 5000 });

  await user.click(screen.getByRole('button', { name: /Home/i }));
  await user.click(screen.getByRole('button', { name: /HR/i }));
  await screen.findByRole('heading', { name: /HR Dashboard/i }, { timeout: 5000 });

  await user.click(screen.getByRole('button', { name: /Home/i }));
  await user.click(screen.getByRole('button', { name: /Employee/i }));
  await screen.findByRole('heading', { name: /Employee Dashboard/i }, { timeout: 5000 });

  // Interact to ensure page is ready and suppress act warnings
  const input = await screen.findByLabelText(/Employee ID/i, {}, { timeout: 5000 });
  await user.clear(input);
  await user.type(input, 'employee-123');
  await user.click(screen.getByRole('button', { name: /Check/i }));
  await screen.findByText(/Profile not found/i, {}, { timeout: 8000 });

  await user.click(screen.getByRole('button', { name: /Check/i }));

  const assignedHeading = await screen.findByRole('heading', { name: /Assigned Lessons/i }, { timeout: 8000 });
  const region = assignedHeading.closest('section') || assignedHeading.parentElement || document.body;
  const utils = within(region);
  await waitFor(() => {
    expect(utils.getByText(/Workplace Safety Basics/i)).toBeInTheDocument();
  }, { timeout: 8000 });
});
