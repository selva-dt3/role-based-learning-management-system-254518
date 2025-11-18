import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Smoke/component navigation test: home -> admin
describe('Home role selection navigation', () => {
  it('renders Home and navigates to Admin dashboard when clicking Admin', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Home heading
    expect(screen.getByRole('heading', { name: /Role-Based Learning Management/i })).toBeInTheDocument();

    // Click Go to Admin
    const goAdminBtn = screen.getByRole('button', { name: /Go to Admin/i });
    await user.click(goAdminBtn);

    // Verify Admin Dashboard content appears
    expect(await screen.findByText(/Admin Dashboard/i)).toBeInTheDocument();
    // Create Employee Profile card exists
    expect(screen.getByText(/Create Employee Profile/i)).toBeInTheDocument();
  });
});
