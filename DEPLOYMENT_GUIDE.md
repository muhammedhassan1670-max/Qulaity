# QMS Online Deployment Guide

This project can be deployed in two stages:

1. **Frontend pilot on Vercel**: runs the offline-first QMS UI using browser storage.
2. **Supabase-backed API**: connects the Nest backend to Supabase Postgres when you are ready for shared online data.

No local defect records are uploaded automatically. Browser localStorage data stays on the user's device unless exported/imported through the app.

## 1. GitHub

The project directory is ready to become a Git repository.

```bash
git init
git add .
git commit -m "Prepare QMS platform for online deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Before pushing, confirm `.env`, login credential files, `node_modules`, and `dist` are not staged.

## 2. Vercel Frontend

Use these settings when importing the GitHub repository into Vercel:

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variables:

```bash
VITE_USE_MOCK_API=true
VITE_API_URL=
VITE_ENABLE_WEBSOCKET=false
VITE_DEFAULT_TENANT_CODE=QMS
```

`vercel.json` is included so direct links such as `/quality-home`, `/defect-log`, and `/ai/defect-prediction` load the React app correctly.

## 3. Supabase Database

Supabase is for the backend database, not direct frontend secret storage.

1. Create a Supabase project.
2. Open the project's database connection settings.
3. Copy the Postgres connection string.
4. Put it in the backend environment as `DATABASE_URL`.

For this Supabase project, replace `YOUR-PASSWORD` with the database password:

```bash
DATABASE_URL="postgresql://postgres.zopeswdcvdrekuycsxcm:YOUR-PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.zopeswdcvdrekuycsxcm:YOUR-PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="replace-with-a-long-random-secret"
ADMIN_EMAIL="admin@qms.com"
ADMIN_PASSWORD="replace-with-a-strong-production-password"
CORS_ORIGIN="https://your-vercel-app.vercel.app"
```

For serverless or auto-scaling backend hosting, use the transaction pooler string for runtime `DATABASE_URL`, usually ending with port `6543` and `pgbouncer=true`, while keeping `DIRECT_URL` on port `5432` for migrations and seed.

Do not put `DATABASE_URL`, service role keys, JWT secrets, or private provider keys in any `VITE_*` variable.

## 4. Backend Notes

The primary backend workspace is `backend-nest`.

Local build check:

```bash
cd backend-nest
npm install
npm run build
```

When deploying the backend to a server platform, set:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=your_supabase_postgres_url
DIRECT_URL=your_supabase_migration_url
JWT_SECRET=your_long_secret
ADMIN_EMAIL=admin@qms.com
ADMIN_PASSWORD=your_strong_admin_password
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

Run database migrations and seed after `DATABASE_URL` is configured:

```bash
cd backend-nest
npx prisma migrate deploy
npm run seed
```

After the backend is online, update Vercel frontend variables:

```bash
VITE_USE_MOCK_API=false
VITE_API_URL=https://your-backend-domain/api/v1
VITE_ENABLE_WEBSOCKET=true
```

## 5. Validation Before Upload

Run:

```bash
npm run lint
npm run check:routes
npm run build
npm run verify
```

Then preview production locally:

```bash
npm run preview
```

## 6. Current Login for Frontend Pilot

For the offline pilot login fallback:

- Email: `admin@qms.com`
- Password: `admin123`

For the online backend, the admin password comes from `ADMIN_PASSWORD` during the seed step. Use a strong password before production factory rollout.
