# ParkSmart

Driving and walking distance calculator for UCR parking lots.

## Overview

Students commuting to campus often don't know which parking lots are closest to their classrooms, or how long the trip actually takes once they factor in the walk from the lot. ParkSmart answers that with travel-time math.

Users upload their class schedule (via .ics file), and the app identifies which parking lots they're permitted to use, lists them by combined driving and walking time to their classroom, and works out when they need to leave to arrive on time. For live lot availability, the app links out to [UCR OpenSpaces](https://openspaces.ucr.edu/home).

## Tech Stack

| Layer      | Technologies                                                    |
| ---------- | --------------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS v4, Radix UI, MUI     |
| Backend    | Python 3.12, FastAPI, SQLAlchemy, asyncpg, Alembic              |
| Routing    | Mapbox (driving and walking travel times)                       |
| Auth       | Supabase Auth                                                   |
| Deployment | Vercel (frontend), Render (backend API)                         |
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
- **[Backend README](backend/README.md)** — API server and database

## Deployment

- **Frontend**: Deployed on [Vercel](https://vercel.com) with SPA rewrites
- **Backend**: Deployed on [Render](https://render.com) as a web service (see `render.yaml`)

## Design

[Figma Design](https://www.figma.com/design/XF4Fg7fbmOWiiP4rMAuOiQ/Parking-Availability-Map)
