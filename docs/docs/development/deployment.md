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

Required environment variables:
- `SPRING_PROFILES_ACTIVE=prod`
- `DATABASE_URL=jdbc:postgresql://<supabase-host>:5432/postgres`
- `DATABASE_USERNAME=<supabase-username>`
- `DATABASE_PASSWORD=<supabase-password>`
- `NAVILLA_ENCRYPTION_PEPPER=<secret>`
- `NAVILLA_SUPABASE_URL=https://<project>.supabase.co`
- `NAVILLA_SUPABASE_JWT=https://<project>.supabase.co/auth/v1/.well-known/jwks.json`
- `JAVA_VERSION=25`

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
