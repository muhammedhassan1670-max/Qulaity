# QMS Enterprise 4.0

Quality Management System frontend and API workspace.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Primary API: NestJS, Prisma, PostgreSQL
- Legacy API: Express, Prisma

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL for the Nest/Express APIs

## Install

Install the frontend dependencies:

```bash
npm install
```

Install the primary Nest backend dependencies:

```bash
cd backend-nest
npm install
cd ..
```

Install the legacy Express backend dependencies only if you need it:

```bash
cd backend
npm install
cd ..
```

## Environment

Copy the example files and fill in local values:

```bash
copy .env.example .env
copy backend-nest\.env.example backend-nest\env.local
copy backend\.env.example backend\.env
```

Important production notes:

- Use long random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Set `CORS_ORIGIN` to the real frontend origin. Multiple origins are comma-separated.
- Do not put private provider keys in `VITE_*` variables; browser variables are public.

## Run

Start the Nest API:

```bash
cd backend-nest
npm run start:dev
```

In another terminal, start the frontend:

```bash
npm run dev
```

The frontend defaults to Vite's local URL, usually `http://localhost:5173`.

## Verify

Run the full frontend verification:

```bash
npm run verify
```

This runs lint, verifies sidebar links against the router, and builds the frontend.

Run backend builds:

```bash
cd backend-nest
npm run build

cd ..\backend
npm run build
```

## Route Safety

The project includes a route check:

```bash
npm run check:routes
```

It verifies every sidebar leaf link in `src/components/Sidebar.tsx` has a matching route in `src/router/index.tsx`.

## Security Checks

Audit frontend dependencies:

```bash
npm audit --audit-level=high
```

Audit production dependencies for the APIs:

```bash
cd backend-nest
npm audit --omit=dev --audit-level=high

cd ..\backend
npm audit --omit=dev --audit-level=high
```

Current note: the Nest workspace may report moderate dev-only Prisma tooling advisories. Avoid `npm audit fix --force` unless you intentionally accept the Prisma version change it proposes.

## Deploy

For GitHub, Vercel, and Supabase deployment steps, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).
