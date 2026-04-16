---
title: Disaster Recovery & Backups
sidebar_position: 5
---

# Disaster Recovery & Backups

This runbook covers what to do when something goes wrong in production
(Railway + Supabase). Keep it short, current, and tested.

## Targets

| Metric | Target |
|--------|--------|
| RPO (max acceptable data loss) | 24 hours |
| RTO (max acceptable downtime) | 1 hour for restore, 4 hours for full DR |

These are soft-launch targets and should be revisited once the user base grows.

## What backs up what

| System | Backup mechanism | Retention | Where |
|--------|-----------------|-----------|-------|
| PostgreSQL data | Supabase automatic Point-in-Time Recovery (PITR) | 7 days (Pro plan), 30 days (Team) | Supabase dashboard → Project → Backups |
| Database schema | Migration files in `database/migrations/` | Forever (git) | This repo |
| Backend code & configs | Git (GitHub) | Forever | This repo |
| Frontend bundles | Built on every deploy from git | N/A — rebuildable | Railway artifacts |
| Encryption pepper | Manually rotated, stored in Railway env | N/A | Railway dashboard, also write down in 1Password |
| Supabase keys | Stored in Railway env | N/A | Supabase dashboard, mirrored in Railway |

## Restore procedures

### Restore the database from PITR

1. Open Supabase dashboard → project → **Backups**
2. Pick the timestamp you want to restore to (granularity: 1 minute)
3. Click **Restore** — Supabase creates a new project with the restored data
4. Update `DATABASE_URL` in Railway to point at the new project
5. Redeploy backend (Railway → Deployments → Redeploy)
6. Verify with `GET /api/health` and a test login

> Supabase does not overwrite the original project. You must repoint
> the app at the new restored project, then later delete or archive
> the old one.

### Roll back a Railway deploy

1. Railway dashboard → service (backend or frontend) → **Deployments**
2. Find the last known-good deploy
3. Click **⋯** → **Redeploy**
4. Railway swaps to that build in ~30s

### Roll back a bad migration

Migrations are forward-only in production. If a migration breaks
something:

1. Restore the database from PITR to a point just before the migration ran
2. Fix the migration file in a follow-up PR
3. Re-run migrations against the restored database

## Failure runbook

### Symptom: backend returning 500s

1. Check `/api/health` — if down, Railway service is down
2. Check Railway dashboard logs for stack traces
3. Check Loki/Grafana for `level=ERROR` spike
4. Common causes: Supabase connection lost, env var missing, OOM

### Symptom: frontend white-screen

1. Check `https://navilla.app/health` — nginx 200
2. Check `/api/health` from the frontend host
3. Check browser console — usually a JS exception caught by the
   `ErrorBoundary` (added 2026-04-16). The fallback UI should appear
   instead of white screen
4. If users report white screen anyway, that's a bug — investigate

### Symptom: emails not sending

1. Check Loki for `EmailService` errors
2. Verify `SENDGRID_API_KEY` is set in Railway
3. Check SendGrid dashboard → Activity for delivery status
4. SendGrid HTTP API uses port 443; Railway does not block it

### Symptom: auth not working

1. Check Supabase dashboard → Auth → users — can you see signups?
2. Verify `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
   in Railway env match Supabase dashboard
3. Verify clock skew on backend host (JWT validation is time-sensitive)

### Symptom: "ENCRYPTION_PEPPER must be set" at startup

The backend now refuses to start without a valid pepper (added 2026-04-16).
1. Generate one if missing: `openssl rand -base64 48`
2. Set as `ENCRYPTION_PEPPER` in Railway env
3. Redeploy

> ⚠ Never change the pepper in production after launch. Email/username
> hashes are derived from it; rotating breaks every existing connection
> and verification card.

## Contacts

| Role | Person | Channel |
|------|--------|---------|
| Engineering | Miguel Ramos | migue1990@gmail.com |
| Supabase support | — | https://supabase.com/dashboard/support |
| Railway support | — | https://railway.app/help |
| SendGrid support | — | https://support.sendgrid.com |

## Pre-launch checklist

- [ ] Verify Supabase Pro plan is active (PITR requires Pro)
- [ ] Take a fresh snapshot in Supabase dashboard before launch day
- [ ] Test the restore procedure once on staging or a throwaway project
- [ ] Confirm `ENCRYPTION_PEPPER` is in Railway env AND backed up to 1Password
- [ ] Confirm Railway deploys are reversible (check Deployments tab has past builds)
