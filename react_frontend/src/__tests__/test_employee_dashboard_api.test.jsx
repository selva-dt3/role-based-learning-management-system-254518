import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';

jest.setTimeout(30000);

test(
  'Employee Dashboard uses mock API and shows assigned lessons after check',
  async () => {
    process.env.REACT_APP_USE_MOCK_API = 'true';

    render(
      <MemoryRouter initialEntries={['/employee']}>
        <EmployeeDashboard />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    const input = await screen.findByLabelText(/Employee ID/i, {}, { timeout: 5000 });

    // First attempt unknown to trigger not found
    await user.clear(input);
    await user.type(input, 'employee-123');

    const checkBtn = screen.getByRole('button', { name: /Check/i });
    await user.click(checkBtn);

    await screen.findByText(/Profile not found/i, {}, { timeout: 8000 });

    // Second attempt should pass (mock toggles to exists)
    await user.click(checkBtn);

    const heading = await screen.findByRole('heading', { name: /Assigned Lessons/i }, { timeout: 8000 });

    const region =
      heading.closest('section') ||
      heading.closest('[role="region"]') ||
      heading.parentElement ||
      document.body;

    const utils = within(region);

    await waitFor(
      () => {
        expect(utils.getByText(/Workplace Safety Basics/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  },
  20000
);
