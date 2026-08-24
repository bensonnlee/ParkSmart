# ParkSmart Backend

FastAPI REST API for ParkSmart — driving and walking travel times between campus parking lots and buildings.

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.12
- **ORM**: SQLAlchemy 2.0 with asyncpg
- **Migrations**: Alembic
- **Auth**: Supabase Auth (JWT verification via python-jose)
- **Routing**: Mapbox (driving and walking travel times)
- **Calendar Parsing**: icalendar

## Prerequisites

- Python 3.12+
- PostgreSQL database (e.g., Supabase)
- Supabase project (for authentication)

## Setup

1. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Set environment variables (create a `.env` file in the `backend/` directory):

   ```
   DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:<port>/<database>
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_KEY=<your-supabase-anon-key>
   SUPABASE_JWT_SECRET=<your-jwt-secret>
   ```

4. Run database migrations:

   ```bash
   alembic upgrade head
   ```

5. Start the development server:

   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## Environment Variables

| Variable             | Description                          |
| -------------------- | ------------------------------------ |
| `DATABASE_URL`       | PostgreSQL connection string (asyncpg) |
| `SUPABASE_URL`       | Supabase project URL                 |
| `SUPABASE_KEY`       | Supabase anon/public key             |
| `SUPABASE_JWT_SECRET`| JWT secret for token verification    |

## API Endpoints

| Prefix              | Tag         | Description                                    |
| -------------------- | ----------- | ---------------------------------------------- |
| `/api/auth`          | auth        | Sign up, login, logout, password reset, profile |
| `/api/buildings`     | buildings   | Campus buildings and nearby lots               |
| `/api/classrooms`    | classrooms  | Classroom lookup and nearest lots by distance  |
| `/api/permits`       | permits     | Permit types and associated lots               |
| `/api/schedules`     | schedules   | Upload/view/delete class schedules (.ics)      |
| `/api/feedback`      | feedback    | Submit beta user feedback                      |
| `/health`            | health      | Health check                                   |

Full interactive API documentation is available at `/docs` when running the server.

## Database

The database schema is managed with Alembic migrations located in `alembic/`. Key models include parking lots, buildings, classrooms, permits, lot-to-building distances, and user schedules.

To create a new migration after modifying models:

```bash
alembic revision --autogenerate -m "description of change"
alembic upgrade head
```

## Code Quality

See [CONTRIBUTING.md](CONTRIBUTING.md) for linting, formatting, and code quality guidelines (Ruff, mypy).
