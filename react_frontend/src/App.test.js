import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home page heading and subtitle for role selection', () => {
  // App already includes a Router; render directly to avoid nested routers
  render(<App />);

  // Assert home content is present (at least one assertion required)
  expect(screen.getByText(/Role-Based Learning Management/i)).toBeInTheDocument();
  expect(screen.getByText(/Choose your role to proceed/i)).toBeInTheDocument();
});
