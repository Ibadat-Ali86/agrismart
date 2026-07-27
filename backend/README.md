# AgriSmart Backend — Node.js + Express + Postgres (Neon)

Real-time OTP email auth, JWT sessions, full CRUD for farms, crops, marketplace, orders, notifications, and daily AMIS Pakistan wholesale market prices.

## Stack

- Node 18+, ES Modules
- Express 4
- **PostgreSQL via [Neon](https://neon.tech)** using `pg`
- **Nodemailer** for real OTP delivery
- JWT (`jsonwebtoken`) + bcryptjs
- Zod validation, Helmet, CORS, rate-limit, compression, morgan

## Quick start

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET in .env before continuing.
npm ci
npm run db:migrate
npm run dev                # http://localhost:5000
```

To add local sample data, set `SEED_ADMIN_PASSWORD` (12+ characters) and run
`npm run db:seed`. The seed command is disabled in production and recreates
sample marketplace listings, so do not run it against data you need to retain.

Health check: `GET /health` → `{ ok: true, db: "<server time>" }`
Swagger UI: `GET /api-docs` · OpenAPI JSON: `GET /openapi.json`

The same process now serves the admin API at `/api/v1/admin`. Run only this
backend for both the farmer frontend and admin dashboard.

## AMIS crop market prices

The backend discovers commodities from AMIS, parses the printer-friendly daily price tables, normalizes FQP as the average price, and upserts snapshots without duplicates. A guarded job runs daily at **06:00 Asia/Karachi**. Configure `REDIS_URL` for a one-hour shared cache; without Redis, reads safely use PostgreSQL.

Public endpoints under `/api/v1`: `/market-prices`, `/market-prices/cities`, `/market-prices/crops`, `/market-prices/latest`, `/market-prices/trends`, and `/market-prices/dashboard`.

Admin-only endpoints: `POST /admin/market-prices/sync` and `GET /admin/market-prices/logs`. Run `npm run db:migrate` before starting the updated service. For local production parity, `docker compose up --build` starts the API and Redis; PostgreSQL remains configured through `DATABASE_URL`.

## SMTP / OTP delivery

Edit `.env` with any SMTP provider (Gmail App Password, SendGrid, Brevo, Mailtrap, etc.):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="AgriSmart <no-reply@agrismart.app>"
```

In `NODE_ENV=development`, if SMTP fails the OTP is logged to the console so you can keep testing.

## API surface (v1)

Base URL: `http://localhost:5000/api/v1`

Admin base URL: `http://localhost:5000/api/v1/admin`

### Auth
| Method | Path                  | Description                                  |
|--------|-----------------------|----------------------------------------------|
| POST   | `/auth/register`      | `{ name, email, password, role? }`           |
| POST   | `/auth/login`         | `{ email, password }`                        |
| POST   | `/auth/otp/request`   | `{ email }` — sends 6-digit code via SMTP    |
| POST   | `/auth/otp/verify`    | `{ email, code }` — verifies & issues JWT    |
| POST   | `/auth/logout`        | Clears cookie                                |
| GET    | `/auth/me`            | Current user (JWT required)                  |

### Resources (JWT required)
- `GET/PATCH /users/me`
- `GET/POST/DELETE /farms` · `GET /farms/:id`
- `GET/POST/DELETE /crops`
- `GET /market` (public search), `GET /market/:id`, `POST/DELETE /market`
- `GET/POST /orders`, `PATCH /orders/:id/status`
- `GET /notifications`, `PATCH /notifications/:id/read`
- `GET /weather?lat=&lng=`
- `GET /market-prices/*` (public AMIS snapshots and analytics)

## Auth

```
Authorization: Bearer <token>
```
Login & OTP verify also set an httpOnly `token` cookie.

## Database schema

Full schema in `src/db/schema.sql` — `users`, `otp_codes`, `farms`, `crops`, `listings`, `orders`, `notifications`. Includes indexes, check constraints, full-text search index on listings, and an `updated_at` trigger.

## Frontend wiring

In `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api/v1
```

For the canonical repository setup, configuration, and verification guide, see
the [root README](../README.md).
