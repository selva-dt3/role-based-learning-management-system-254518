//
// Mock handlers module
// Centralizes any additional network or module mocks shared across tests.
// Kept under src/__mocks__ to avoid being collected as tests.
//
/* eslint-disable no-undef */

// Example: mock API base env usage if any code references it directly
process.env.REACT_APP_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// If there are modules to mock globally, do it here.
// Example placeholder:
// jest.mock('../api/client', () => ({
//   getClient: () => ({ get: jest.fn(), post: jest.fn() })
// }));

export {}; // Ensure this is treated as a module
