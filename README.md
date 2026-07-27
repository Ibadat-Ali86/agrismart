# AgriSmart

AgriSmart is a full-stack platform for managing farms and crops, viewing market prices, listing produce, and connecting agricultural buyers and sellers. It includes a responsive React PWA and a secure Express API backed by PostgreSQL.

## Highlights

- Farm, crop, listing, order, notification, and profile management.
- JWT and cookie-based authentication with email OTP flows.
- Market-price dashboards sourced from AMIS Pakistan, including trends and administrative sync controls.
- Weather forecasts, AI-assisted crop guidance, and image-based disease analysis when their providers are configured.
- Progressive web app support with English and Urdu localization.

## Architecture

```text
React + Vite PWA (frontend/)  ──HTTP──>  Express API (backend/)
                                              │
                         PostgreSQL <─────────┼─────────> Redis (optional cache)
                                              │
                         SMTP / weather / AI providers (optional)
```

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Radix UI, and PWA tooling.
- **Backend:** Node.js, Express, PostgreSQL (`pg`), Zod, JWT, Helmet, rate limiting, Swagger/OpenAPI, and Vitest.
- **Infrastructure:** Docker Compose configuration for the API and Redis; PostgreSQL is supplied through `DATABASE_URL`.

## Prerequisites

- Node.js 20.19+ and npm.
- A PostgreSQL database reachable through a connection URL.
- Optional: Redis, SMTP credentials, an OpenWeather API key, and an OpenAI or Gemini API key for their corresponding features.

## Quick start

1. Create local configuration from the checked-in examples:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Set `DATABASE_URL` and a strong `JWT_SECRET` in `backend/.env`. Update `VITE_API_URL` only if the API is not running at its default address.

3. Install dependencies and prepare the database:

   ```bash
   npm ci --prefix backend
   npm ci --prefix frontend
   npm run db:migrate --prefix backend
   ```

4. Start the API and web application in separate terminals:

   ```bash
   npm run dev --prefix backend
   npm run dev --prefix frontend
   ```

   The API runs at `http://localhost:5000`; the Vite development server reports its local URL (normally `http://localhost:5173`).

### Optional sample data

To add local development data, set `SEED_ADMIN_PASSWORD` to at least 12 characters and run:

```bash
npm run db:seed --prefix backend
```

The seed script is disabled in production and clears existing marketplace listings before recreating sample listings. Do not run it against data you need to preserve.

## Configuration

Copy the example files above; never commit the resulting `.env` files.

| File | Required variables | Purpose |
| --- | --- | --- |
| `backend/.env` | `DATABASE_URL`, `JWT_SECRET` | PostgreSQL connection and JWT signing key. |
| `backend/.env` | `CLIENT_URL`, `REDIS_URL`, `SMTP_*`, `AI_*`, `OPENWEATHER_API_KEY` | Optional CORS, caching, email, AI, and weather integrations. |
| `frontend/.env` | `VITE_API_URL` | Base URL for the API (defaults to `http://localhost:5000/api/v1`). |

`CLIENT_URL` should be restricted to the deployed frontend origin in production. Generate a unique JWT secret with at least 32 characters; never reuse the placeholder from `.env.example`.

## Available scripts

| Workspace | Command | Description |
| --- | --- | --- |
| Backend | `npm run dev --prefix backend` | Start the API with automatic reload. |
| Backend | `npm start --prefix backend` | Start the API. |
| Backend | `npm test --prefix backend` | Run the Vitest suite. |
| Backend | `npm run db:migrate --prefix backend` | Apply the database schemas. |
| Backend | `npm run db:seed --prefix backend` | Load local development data. |
| Frontend | `npm run dev --prefix frontend` | Start the Vite development server. |
| Frontend | `npm run build --prefix frontend` | Create a production bundle. |
| Frontend | `npm run preview --prefix frontend` | Preview the production bundle. |

## API and operational endpoints

With the backend running:

- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI document: `http://localhost:5000/openapi.json`
- Liveness: `http://localhost:5000/healthz`
- Readiness: `http://localhost:5000/readyz`
- API base URL: `http://localhost:5000/api/v1`

## Project structure

```text
.
├── backend/                 # Express API, PostgreSQL schema, jobs, tests, Docker files
│   ├── src/
│   └── .env.example
├── frontend/                # React PWA
│   ├── src/
│   ├── public/
│   └── .env.example
└── README.md                 # This guide
```

## Verification

```bash
npm test --prefix backend
npm run build --prefix frontend
```

## Security notes

- `.env` files, runtime logs, dependencies, and generated bundles are intentionally excluded from version control.
- Keep production secrets in the hosting provider's secret manager or environment configuration.
- Configure a specific production `CLIENT_URL` and strong, distinct credentials before deployment.
