import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders role selector on home without adding an extra Router', async () => {
  render(<App />);
  expect(await screen.findByText(/Role-Based Learning Management/i)).toBeInTheDocument();
  expect(await screen.findByText(/Choose your role to proceed/i)).toBeInTheDocument();
});
