import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders role selector on home without adding an extra Router', () => {
  render(<App />);
  expect(screen.getByText(/Role-Based Learning Management/i)).toBeInTheDocument();
  expect(screen.getByText(/Choose your role to proceed/i)).toBeInTheDocument();
});
