# Role-Based LMS React Frontend

Single Page Application (SPA) with role-based dashboards (Admin, HR, Employee). Users select their role on the homepage and are routed to the proper dashboard. Styled with the "Ocean Professional" theme.

## Routes

- `/` Home with role selection
- `/admin` Admin dashboard (manage lessons, create with uploads, view tracking)
- `/hr` HR dashboard (assign lessons, view progress)
- `/employee` Employee dashboard (view assigned lessons, mark completion)

## Tech

- React 18
- react-router-dom v6
- Vanilla CSS (Ocean Professional theme)
- API client with toggleable Mock API mode

## Setup

1. Install dependencies
   ```
   npm install
   ```

2. Configure environment
   - Copy `.env.example` to `.env` and set one of the following modes:

   - Mock mode (no backend required):
     ```
     REACT_APP_USE_MOCK_API=true
     ```
     The UI uses an in-memory mock API with localStorage persistence. A "Mock API" badge appears in the navbar. File uploads are emulated and return a fake public URL.

   - Real backend mode:
     ```
     REACT_APP_USE_MOCK_API=false
     REACT_APP_API_BASE_URL=http://localhost:8000
     ```
     Ensure the FastAPI backend is running and CORS is enabled. The frontend will:
     - POST `/lesson` with JSON body `{ title, description? }`
     - POST `/upload` with multipart `FormData(file=<File>)` to receive `{ url: "https://..." }`
     - If the created lesson did not include `file_url`, it will attempt `PUT /lesson/{id}` with `{ file_url }`.

3. Start the app
   ```
   npm start
   ```
   App runs at http://localhost:3000

## Admin "Create Lesson" Form

- Open the Admin dashboard and click "Create Lesson".
- Fields:
  - Title (required)
  - Description (optional, multiline)
  - External Links (optional, up to 5)
  - File Upload (optional): accepts .mp4, .mov, .webm, .pdf up to 100MB
- In Mock mode, upload progress is simulated; in Backend mode, the browser shows "Creating…" and completes when server responds.
- After success, the lessons list refreshes.

## API Configuration

- When `REACT_APP_USE_MOCK_API=true`, all calls are routed to `src/api/mockApi.js` which mimics CRUD for lessons, assignments, completions, and quizzes, and stubs file uploads. Data persists in `localStorage` during the browser session.
- When `REACT_APP_USE_MOCK_API=false`, the base URL is read from `process.env.REACT_APP_API_BASE_URL` by `src/api/client.js`.

## Project Structure

- `src/App.js` Router and pages wiring
- `src/components/` Reusable UI components (includes `CreateLessonForm`)
- `src/pages/` Role dashboards
- `src/api/client.js` Fetch wrapper + mock switch
- `src/api/mockApi.js` In-memory Mock API
- `src/hooks/useApi.js` Hook for REST calls and upload helper
- `src/App.css` Ocean Professional theme + components

## Notes

- This frontend does not implement authentication by design.
- No secrets are stored in code. Use environment variables.
- The mock API seeds deterministic sample data on first load and persists changes in `localStorage`.

## Scripts

- `npm start` Start dev server
- `npm test` Run tests
- `npm run build` Production build
