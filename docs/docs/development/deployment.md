---
sidebar_position: 4
title: Deployment
---

# Deployment Guide

## Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local development | localhost |
| Staging | Pre-production testing | staging.navilla.app <!-- TODO: Update with actual staging URL --> |
| Production | Live application | navilla.app <!-- TODO: Update with actual production URL --> |

## Frontend Deployment (Vercel)

```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## Backend Deployment (Railway)

Recommended setup: deploy the backend as a Railway service with `backend/` as the root.

1. Create a new Railway service from this repo.
2. Set **Root Directory** to `backend`.
3. Leave Build/Start commands empty.
4. Railway will detect `backend/start.sh` and run it automatically.

Environment variables (minimum):
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

### Backend (API)

1. Health check:

```bash
curl -i https://<backend-domain>/api/health
```

Expected: `200 OK` and JSON body.

2. CORS preflight:

```bash
curl -i -X OPTIONS https://<backend-domain>/api/health-status \
  -H "Origin: https://<frontend-domain>" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expected headers:
- `access-control-allow-origin: https://<frontend-domain>`
- `access-control-allow-methods` includes `GET`

### Frontend (UI Smoke)

1. Load homepage (no console errors).
2. Sign in / sign up should reach the backend.
3. Dashboard loads with user profile and stats.
4. Notifications page loads and marks items read on focus.

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: ./mvnw test # Changed from gradlew to mvnw

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: # deployment steps
```
