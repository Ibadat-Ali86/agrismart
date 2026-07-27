# AgriSmart — Frontend

Plain **React + Vite** SPA (with PWA support, Tailwind v4, shadcn/ui, react-router-dom).

## Quick start

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # production bundle → /frontend/dist
npm run preview      # serve the built bundle
```

## Stack

- React 19, Vite 7
- react-router-dom v6 (file-less, declarative routes in `src/App.tsx`)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- shadcn/ui + Radix primitives
- TanStack Query (data fetching cache)
- vite-plugin-pwa (offline service worker, manifest)

## Folder layout

```
frontend/
├── index.html
├── public/                  # static assets (icons, manifest)
├── src/
│   ├── main.tsx             # entry — mounts <App /> in <BrowserRouter>
│   ├── App.tsx              # routes table
│   ├── index.css            # Tailwind + design tokens
│   ├── assets/              # images
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── site/            # SiteHeader, SiteFooter, SiteLayout
│   │   ├── app/             # AppLayout, AppHeaderBack
│   │   └── Logo.tsx
│   ├── pages/
│   │   ├── site/            # Home, About, Features, Pricing, …
│   │   ├── app/             # Dashboard, Farms, Crops, Market, …
│   │   ├── Login.tsx
│   │   └── VerifyOtp.tsx
│   ├── features/            # feature-scoped slices
│   ├── hooks/
│   ├── lib/                 # utils, mock-data
│   ├── services/            # pwa, api clients
│   ├── store/               # global state
│   ├── styles/              # additional CSS modules
│   └── utils/
```

## Backend

A standalone Node/Express + PostgreSQL backend lives in `/backend` at the
project root. Copy `.env.example` to `.env` and configure `VITE_API_URL` when
the API is not available at `http://localhost:5000/api/v1`.

For complete setup, configuration, and verification instructions, see the
[repository README](../README.md).
