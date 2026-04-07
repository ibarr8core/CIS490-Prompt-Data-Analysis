# Prompt Marketplace Web Application

Simple AI prompt marketplace built as a student project.

- Frontend: static HTML/CSS/JS in `frontend/`
- Backend API: deployed remotely
- Database + Cloud SQL connection: only on backend deployment

## Teammate Quick Start (frontend only)

Teammates do **not** need MySQL, Cloud SQL Proxy, or local backend setup.

1. Open `PromptMarketWebApplication`
2. Set backend URL in `frontend/config.js` (default is already deployed)
3. Run:

```bash
python run_local.py
```

4. Open the URL printed by the script (usually `http://localhost:8080`)

## API Base URL Configuration

Frontend API URL is configured in one place:

- `frontend/config.js`

Example:

```js
window.PROMPTMARKET_CONFIG = {
  API_BASE_URL: 'https://your-deployed-backend-url'
};
```

All frontend API calls use this value and append `/api`.

## Backend Deployment Notes

Backend code remains in `backend/` for deployment/maintenance.  
It is expected to run remotely and keep all DB credentials private server-side.

- `backend/db.js` uses environment variables for DB credentials.
- `backend/initDatabase.js` handles table creation/seed on backend startup.
- No database credentials are required in the frontend.

## Project Structure

```text
PromptMarketWebApplication
  frontend/              - static app
    config.js            - API base URL for frontend
    app.js               - frontend logic and API calls
  backend/               - deployed API service
  run_local.py           - local static server for teammates
  package.json           - backend dependencies/scripts
```

## Troubleshooting

- **Frontend loads but API calls fail**
  - Verify `frontend/config.js` has the correct deployed backend URL.
  - Confirm backend has CORS enabled for your local origin.

- **Port 8080 already in use**
  - Stop the process using that port, or change `PORT` in `run_local.py`.

