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

## Backend Deployment (TBD)

Options under consideration:
- Railway
- Fly.io
- Render

## Database (Supabase)

- Production project separate from development
- Regular backups enabled
- Point-in-time recovery configured

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
