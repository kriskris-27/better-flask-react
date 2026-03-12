
# Job Application Tracker ✦


A full-stack application to track job applications through a 
strict state machine, with AI-powered interview preparation.

## ✦ Technical Decisions

### Why SQLite → PostgreSQL (Neon)
Started with SQLite for zero-config local dev. Migrated to Neon PostgreSQL to demonstrate production-readiness and utilize native ENUM types for rigid status enforcement at the database level.

### Why Raw SQL over ORM
Using `psycopg2` with raw SQL keeps the data layer explicit and readable. Every query is visible—no hidden JOIN generation, no complex migration framework to debug. This adheres to the "Simple > Clever" principle.

### High-Performance Connection Pooling
Implemented `ThreadedConnectionPool` to handle concurrent database requests efficiently. This eliminates the overhead of opening new connections for every API call, which is specifically optimized for serverless PostgreSQL platforms like Neon (mitigating cold starts).

### State Machine Design
Status transitions are strictly enforced in a centralized model. One location (`models.py`) dictates all flow rules. Any new transition logic requires only a single-line modification, keeping routes pure and focused on I/O.

### AI Integration — Graceful Degradation
Google Gemini is invoked when an application transitions to the `INTERVIEWING` stage. If the AI service is unavailable, the status transition still completes successfully, storing a `null` intel report. Core business functionality never depends on external AI uptime.

### Input Validation (Marshmallow)
Comprehensive input validation is performed at the API boundary using Marshmallow. Malformed or malicious data is rejected before it ever touches the database layer, ensuring data integrity.

## ✦ Stack
- **Backend:** Python 3.11, Flask 3.0
- **Database:** PostgreSQL (Neon), raw SQL via `psycopg2`
- **Performance:** `psycopg2.pool` for Connection Pooling
- **Frontend:** React (Vite) + Tailwind CSS
- **AI:** Google Gemini API
- **Validation:** Marshmallow
- **Tests:** Pytest


### Key API endpoints
- `GET /health` – health check.
- `GET /api/applications` – list all applications (optional `?status=...` filter).
- `GET /api/applications/<id>` – get a single application (with contacts and history).
- `POST /api/applications` – create a new application.
- `PATCH /api/applications/<id>/status` – change status (enforces state machine; may trigger AI).
- `POST /api/contacts` – create a contact for an application.
- `DELETE /api/contacts/<id>` – delete a contact.

## ✦ Getting Started
### Backend
1. `cd backend`
2. Create `.env` with `DATABASE_URL`, `GEMINI_API_KEY`, and `FLASK_ENV=dev`.
3. `pip install -r requirements.txt`
4. `python run.py`

### Frontend
1. `cd frontend`
2. Create `.env` (see `.env.example`).
3. `npm install`
4. `npm run dev`


