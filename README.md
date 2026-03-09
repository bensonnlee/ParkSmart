# ParkSmart

Campus parking optimizer combining ML predictions with walking distance analysis.

## Overview

Students face two major challenges when commuting to campus: not knowing which parking lots are closest to their classrooms, and not knowing if lots will be full when they arrive. ParkSmart solves both by combining intelligent routing with machine learning predictions.

Users upload their class schedule (via .ics file), and the app identifies which parking lots they're permitted to use, ranks them by walking distance to their classroom, predicts availability using historical patterns, and recommends the best parking options along with an optimal departure time.

## Tech Stack

| Layer      | Technologies                                                    |
| ---------- | --------------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS v4, Radix UI, MUI     |
| Backend    | Python 3.12, FastAPI, SQLAlchemy, asyncpg, Alembic              |
| ML         | Prophet (time-series forecasting)                               |
| Auth       | Supabase Auth                                                   |
| Deployment | Vercel (frontend), Render (backend API + cron jobs)             |
| Database   | PostgreSQL (via Supabase)                                       |

## Project Structure

```
ParkSmart/
├── frontend/          # React SPA (Vite + TypeScript)
├── backend/           # FastAPI REST API
├── data/              # Data files and datasets
├── docs/              # Project documentation
├── guidelines/        # Development guidelines
└── render.yaml        # Render deployment config
```

## Getting Started

See the individual setup guides:

- **[Frontend README](frontend/README.md)** — React app setup and development
- **[Backend README](backend/README.md)** — API server, database, and cron jobs

## Deployment

- **Frontend**: Deployed on [Vercel](https://vercel.com) with SPA rewrites
- **Backend**: Deployed on [Render](https://render.com) as a web service with scheduled cron jobs for data collection and forecast generation (see `render.yaml`)

## Design

[Figma Design](https://www.figma.com/design/XF4Fg7fbmOWiiP4rMAuOiQ/Parking-Availability-Map)
