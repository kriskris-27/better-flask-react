## Job Application Tracker

A small Flask API that lets you track job applications, their statuses, and related contacts, and optionally prepares you for interviews using AI.

### Features
- **Strict state machine**: Applications move through a defined path (APPLIED → SCREENING → INTERVIEWING → OFFERED → ACCEPTED, or REJECTED).
- **AI interview prep**: When an application moves to `INTERVIEWING`, the backend calls Google Gemini to generate interview prep intel.
- **Audit trail**: Every status change is logged in a `status_history` table.
- **Contact management**: Store contacts (recruiters, hiring managers, etc.) for each application.

### Tech stack
- **Backend**: Python (Flask), PostgreSQL (Neon), psycopg2, Marshmallow.
- **Frontend**: React + Vite (planned; not included in this repo).
- **AI**: Google Gemini via `google-generativeai`.

### Backend setup (local)
1. **Create and configure a PostgreSQL database** (e.g., Neon or local Postgres) and note the connection URL.
2. **Set environment variables**:
   - `DATABASE_URL` – PostgreSQL connection string.
   - `GEMINI_API_KEY` – Google Gemini API key (optional, but required for AI prep).
   - `FLASK_ENV=dev` – use `dev` for local development.
3. **Install dependencies and run the server**:
   - `cd backend`
   - `pip install -r requirements.txt`
   - `python run.py`

On startup, the backend will apply `schema.sql` to initialize tables if `DATABASE_URL` is set.

### Key API endpoints
- `GET /health` – health check.
- `GET /api/applications` – list all applications (optional `?status=...` filter).
- `GET /api/applications/<id>` – get a single application (with contacts and history).
- `POST /api/applications` – create a new application.
- `PATCH /api/applications/<id>/status` – change status (enforces state machine; may trigger AI).
- `POST /api/contacts` – create a contact for an application.
- `DELETE /api/contacts/<id>` – delete a contact.
