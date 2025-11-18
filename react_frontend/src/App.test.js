import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from './App';

test('renders home page heading and subtitle for role selection', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </MemoryRouter>
  );

  // These strings are from Home() in App.js and should remain stable.
  expect(screen.getByText(/Role-Based Learning Management/i)).toBeInTheDocument();
  expect(screen.getByText(/Choose your role to proceed/i)).toBeInTheDocument();
});
