# Role-Based LMS

This repository contains the React frontend for a Role-Based Learning Management System (LMS). The frontend connects to a FastAPI backend (in sibling container) via environment-configured base URL.

- Frontend path: `react_frontend`
- Start: `cd react_frontend && npm install && npm start`
- Env: copy `.env.example` to `.env` and set `REACT_APP_API_BASE_URL` (and `REACT_APP_USE_MOCK_API=true` to use the in-browser mock API)