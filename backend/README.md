# ParkSmart Backend

FastAPI REST API for ParkSmart — campus parking availability tracking and ML-powered predictions.

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.12
- **ORM**: SQLAlchemy 2.0 with asyncpg
- **Migrations**: Alembic
- **Auth**: Supabase Auth (JWT verification via python-jose)
- **ML**: Prophet (time-series forecasting)
- **Data Collection**: BeautifulSoup (web scraping)
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
| `/api/lots`          | parking     | Parking lot list, details, availability history |
| `/api/lots`          | forecasts   | ML availability forecasts per lot              |
| `/api/buildings`     | buildings   | Campus buildings and nearby lots               |
| `/api/classrooms`    | classrooms  | Classroom lookup and nearest lots by distance  |
| `/api/permits`       | permits     | Permit types and associated lots               |
| `/api/schedules`     | schedules   | Upload/view/delete class schedules (.ics)      |
| `/api/feedback`      | feedback    | Submit beta user feedback                      |
| `/health`            | health      | Health check and manual data collection trigger |

Full interactive API documentation is available at `/docs` when running the server.

## Database

The database schema is managed with Alembic migrations located in `alembic/`. Key models include parking lots, availability snapshots, buildings, classrooms, permits, user schedules, and forecasts.

To create a new migration after modifying models:

```bash
alembic revision --autogenerate -m "description of change"
alembic upgrade head
```

## Cron Jobs

Automated data collection and forecast generation run on Render (configured in `render.yaml`):

| Job                  | Schedule                              | Description                          |
| -------------------- | ------------------------------------- | ------------------------------------ |
| collector-rush       | Every 5 min, 6am–11am PT, weekdays   | High-frequency collection during rush|
| collector-midday     | Every 15 min, 11am–6pm PT, weekdays  | Moderate collection during midday    |
| collector-offpeak    | Every 60 min, 6pm–5am PT, weekday nights | Low-frequency overnight collection |
| collector-weekend    | Every 60 min, all day, weekends       | Baseline weekend collection          |
| forecast-generator   | Daily at ~9–10pm PT                   | Generate ML forecasts from collected data |

## Code Quality

See [CONTRIBUTING.md](CONTRIBUTING.md) for linting, formatting, and code quality guidelines (Ruff, mypy).
