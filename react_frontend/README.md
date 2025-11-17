# Role-Based LMS React Frontend

Single Page Application (SPA) with role-based dashboards (Admin, HR, Employee). Users select their role on the homepage and are routed to the proper dashboard. Styled with the "Ocean Professional" theme.

## Routes

- `/` Home with role selection
- `/admin` Admin dashboard (manage lessons, view tracking)
- `/hr` HR dashboard (assign lessons, view progress)
- `/employee` Employee dashboard (view assigned lessons, mark completion)

## Tech

- React 18
- react-router-dom v6
- Vanilla CSS (Ocean Professional theme)
- Simple API client using REACT_APP_API_BASE_URL

## Setup

1. Install dependencies
   ```
   npm install
   ```

2. Configure environment
   - Copy `.env.example` to `.env` and set:
     - `REACT_APP_API_BASE_URL` (e.g., `http://localhost:8000`)

3. Start the app
   ```
   npm start
   ```
   App runs at http://localhost:3000

## API Configuration

The API base URL is read from `process.env.REACT_APP_API_BASE_URL` by `src/api/client.js`. Ensure CORS is enabled on the FastAPI backend.

## Project Structure

- `src/App.js` Router and pages wiring
- `src/components/` Reusable UI components
- `src/pages/` Role dashboards
- `src/api/client.js` Fetch wrapper
- `src/hooks/useApi.js` Hook for REST calls
- `src/App.css` Ocean Professional theme + components

## Notes

- This frontend does not implement authentication by design.
- No secrets are stored in code. Use environment variables.
- The hook and API client include minimal error handling; extend as needed.

## Scripts

- `npm start` Start dev server
- `npm test` Run tests
- `npm run build` Production build
