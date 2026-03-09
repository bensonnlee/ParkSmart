# ParkSmart Frontend

React SPA for ParkSmart — the campus parking optimizer.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI, MUI, shadcn/ui patterns (CVA + tailwind-merge)
- **Charts**: Recharts
- **Routing**: React Router v7
- **Forms**: React Hook Form
- **Animations**: Motion (Framer Motion)

## Prerequisites

- Node.js (v18+)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

   Configure the API base URL:

   ```
   VITE_API_BASE_URL=https://parksmart-api.onrender.com
   ```

   For local backend development, use `http://localhost:8000`.

3. Start the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |

## Project Structure

```
src/
├── main.tsx                  # App entry point
├── api/                      # API client modules & caching
│   ├── auth.ts               # Authentication API
│   ├── config.ts             # API base URL config
│   ├── schedule.ts           # Schedule API
│   ├── forecast.ts           # Forecast API
│   ├── maps.ts               # Maps API
│   └── prefs.ts              # User preferences API
├── app/
│   ├── App.tsx               # Root component
│   ├── routes.ts             # Route definitions
│   ├── pages/                # Page components
│   └── components/           # App-specific components
│       ├── ui/               # Reusable UI primitives (shadcn)
│       └── ...               # Feature components
├── assets/                   # Static assets
├── lib/                      # Utility functions
└── styles/                   # Global styles
```

## Key Pages

| Route                        | Page                     | Description                                |
| ---------------------------- | ------------------------ | ------------------------------------------ |
| `/`                          | Welcome                  | Landing / login page                       |
| `/signup`                    | SignUp                   | Account registration with onboarding       |
| `/dashboard`                 | Home                     | Class schedule overview with parking links  |
| `/dashboard/parking/:classId`| ParkingRecommendations   | ML-ranked parking lot recommendations      |
| `/dashboard/find-by-building`| FindByBuilding           | Search parking by building/destination      |
| `/dashboard/schedule`        | SchedulePlanner          | View and manage class schedule              |
| `/dashboard/upload`          | IcsUpload                | Upload .ics calendar file                  |
| `/dashboard/settings`        | Settings                 | User preferences (permit type, buffer time) |
| `/dashboard/feedback`        | Feedback                 | Submit beta feedback                       |

## Deployment

Deployed on Vercel with SPA rewrite rules (all routes serve `index.html`).
