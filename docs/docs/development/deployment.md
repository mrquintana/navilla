---
sidebar_position: 4
title: Deployment
---

# Deployment Guide

## Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local development | `localhost:5173` (frontend) · `localhost:8080` (backend) |
| Production | Live application | `https://www.navilla.app` (frontend) · `https://api.navilla.app` (backend) |

## Frontend Deployment (Railway)

The frontend is deployed as a Railway service running nginx. Railway builds the Vite app and serves the `dist/` output via nginx on port 80.

**Railway service name:** `navilla-frontend`
**Custom domain:** `www.navilla.app` (port 80)
**Internal Railway URL:** `navilla-production.up.railway.app`

Railway auto-detects the Vite project and runs:
```bash
npm run build   # outputs to dist/
```
Then serves `dist/` via nginx.

No environment variables are required for the frontend at build time beyond what Vite inlines via `import.meta.env`.

## Backend Deployment (Railway)

The backend is deployed as a Railway service running Spring Boot.

**Railway service name:** `navilla-backend`
**Custom domain:** `api.navilla.app`
**Internal Railway URL:** `outstanding-flexibility-production.up.railway.app`

Setup:
1. Create a Railway service from this repo.
2. Set **Root Directory** to `backend`.
3. Leave Build/Start commands empty — Railway detects `backend/start.sh` automatically.

### Required env vars (production)

Profile + JVM:
- `SPRING_PROFILES_ACTIVE=production`
- `JAVA_VERSION=25`
- `NAVILLA_DEV_MODE=false` — must be false in production; gates dev endpoints

Database (Supabase Postgres via PgBouncer transaction mode):
- `DATABASE_URL=jdbc:postgresql://<supabase-host>:5432/postgres`
- `DATABASE_USERNAME=<supabase-username>`
- `DATABASE_PASSWORD=<supabase-password>`

Auth (Supabase):
- `SUPABASE_URL=https://<project>.supabase.co`
- `SUPABASE_ANON_KEY=<anon-key>`
- `SUPABASE_SERVICE_KEY=<service-role-key>`

Crypto (REQUIRED — backend will refuse to start without it):
- `ENCRYPTION_PEPPER=<≥16 random chars, e.g. openssl rand -base64 48>`

Email (SendGrid HTTP API):
- `EMAIL_ENABLED=true`
- `SENDGRID_API_KEY=<sendgrid-key>`
- `EMAIL_FROM=no-reply@navilla.app`
- `EMAIL_FROM_NAME=Navilla`
- `EMAIL_REPLY_TO=contact@navilla.app`

Push (VAPID / RFC 8292):
- `VAPID_PUBLIC_KEY=<base64url public>`
- `VAPID_PRIVATE_KEY=<base64url private>`
- `VAPID_SUBJECT=mailto:contact@navilla.app`

Observability (Grafana Cloud Loki + OTLP):
- `LOKI_URL=<loki-push-url>`
- `LOKI_USERNAME=<loki-tenant-id>`
- `LOKI_PASSWORD=<loki-api-token>`
- `OTLP_METRICS_ENABLED=true`
- `OTLP_METRICS_URL=<otlp-endpoint>`
- `OTLP_METRICS_AUTH=<base64-basic-auth>`

Storage:
- `AVATAR_BUCKET=avatars`

Optional tuning (only set if needed):
- `HIKARI_MAX_POOL=5` — connection pool size; default 5 for soft launch
- `HIKARI_MIN_IDLE=1` — idle connections; default 1
- `LOG_LEVEL_APP=INFO` — app log verbosity
- `LOG_LEVEL_HIBERNATE=WARN`

> ⚠ Anything labeled REQUIRED must be set or the service will not start.
> Use Railway env-var groups to keep `production` and `staging` separate.

## Database (Supabase)

- Production project separate from development
- Regular backups enabled
- Point-in-time recovery configured

## Post-Deploy Validation

Run these checks after each deploy to confirm the stack is healthy.

### Backend

```bash
# Health check
curl -i https://api.navilla.app/api/health

# CORS preflight
curl -i -X OPTIONS https://api.navilla.app/api/health-status \
  -H "Origin: https://www.navilla.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expected: `200 OK`, JSON body, and `access-control-allow-origin: https://www.navilla.app` header.

### Frontend

1. `https://navilla.app` redirects to `https://www.navilla.app`
2. Homepage loads with no console errors
3. Sign in / sign up reaches the backend
4. Dashboard loads with user profile and stats
5. Notifications page loads and marks items read on focus
