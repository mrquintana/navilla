---
sidebar_position: 6
title: Infrastructure
---

# Infrastructure

This document covers Navilla's production infrastructure: domain, DNS, hosting, and email.

---

## Domain

| Property | Value |
|----------|-------|
| Domain | `navilla.app` |
| Registrar | GoDaddy |
| First year cost | MXN ~388 |
| Renewal cost | MXN ~541/yr (~$27 USD) |

The `.app` TLD was chosen because it enforces HTTPS at the registry level, has strong email deliverability, and fits the product identity. See [ADR-011](../adrs/adr-011-domain-navilla-app) for the full decision rationale.

---

## DNS Records

All DNS is managed through GoDaddy.

| Type | Name | Points To | Purpose |
|------|------|-----------|---------|
| CNAME | `www` | `gbw4tw4m.up.railway.app` | Frontend → Railway |
| CNAME | `api` | Railway backend verification host | Backend → Railway |
| CNAME | `em307` | `u59496887.wl138.sendgrid.net` | SendGrid email routing |
| CNAME | `s1._domainkey` | `s1.domainkey.u59496887.wl138.sendgrid.net` | SendGrid DKIM |
| CNAME | `s2._domainkey` | `s2.domainkey.u59496887.wl138.sendgrid.net` | SendGrid DKIM |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; ...` | Email anti-spoofing |
| Forward | `navilla.app` → `https://www.navilla.app` | 301 redirect | Root domain → www |

> **Why no A record at root?** DNS forbids a CNAME at the root (`@`) because it conflicts with NS and SOA records. Railway provides hostnames, not static IPs, so a 301 forward to `www` is the correct solution. GoDaddy does not support CNAME flattening (ALIAS records).

---

## Hosting (Railway)

Both services are deployed on Railway.

### Frontend

| Property | Value |
|----------|-------|
| Service | `navilla-frontend` |
| Runtime | nginx (Docker) |
| Port | 80 |
| Custom domain | `www.navilla.app` |
| Internal URL | `navilla-production.up.railway.app` |

The Vite app is built at deploy time (`npm run build`) and served as static files via nginx on port 80. The nginx port must be set to `80` when configuring the custom domain in Railway — not `5173` (which is the local dev server only).

### Backend

| Property | Value |
|----------|-------|
| Service | `navilla-backend` |
| Runtime | Spring Boot (Java 25) |
| Custom domain | `api.navilla.app` |
| Internal URL | `outstanding-flexibility-production.up.railway.app` |

---

## Email

Navilla uses SendGrid for all transactional email, authenticated through the `navilla.app` domain.

### Email types

| Type | Description | Sent By |
|------|-------------|---------|
| Auth emails | Confirmations, password resets | Supabase Auth (via SendGrid SMTP) |
| Weekly digest | PrEP adherence, testing status, upcoming reminders, vaccine due dates | `EmailDigestJob` (`@Scheduled`) |

### Sender address

```
no-reply@navilla.app
```

Auth emails configured in **Supabase → Authentication → SMTP Settings**.
Digest emails configured via `navilla.email.*` properties in `application.yaml`.

### Email infrastructure

| Component | Description |
|-----------|-------------|
| `EmailService` | Fire-and-forget sending via `JavaMailSender`. Skips when `navilla.email.enabled=false` |
| `EmailTemplateService` | Thymeleaf rendering with locale fallback (es → en) |
| `EmailDigestJob` | `@Scheduled` daily at batch-hour. Checks day-of-week per user settings, gathers digest data, sends |
| Templates | `templates/email/digest_en.html`, `digest_es.html`, `layout.html` (shared brand header/footer) |

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.sendgrid.net` | SMTP server |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USERNAME` | `apikey` | SendGrid uses literal "apikey" as username |
| `SMTP_PASSWORD` | — | Your SendGrid API key (`SG.xxx`) |
| `EMAIL_ENABLED` | `false` | Set to `true` to enable digest sending |
| `EMAIL_FROM` | `no-reply@navilla.app` | Sender address |

### SendGrid domain authentication

The `navilla.app` domain is authenticated in SendGrid with DKIM and SPF via the three CNAME records listed in the DNS table above. DMARC (`p=quarantine`) was already provisioned by GoDaddy and covers the policy layer.

> **No mailbox needed.** `no-reply@navilla.app` is a sending-only address. No inbox, no Titan/Google Workspace subscription required.

---

## SEO

| File | Purpose |
|------|---------|
| `frontend/public/robots.txt` | Blocks private routes (`/dashboard`, `/connections`, etc.) from crawlers |
| `frontend/public/sitemap.xml` | Lists all 9 public URLs; submitted to Google Search Console |
| `frontend/public/favicon.svg` | Navilla `N` mark favicon |
| `frontend/index.html` | Base meta tags: description, Open Graph, Twitter card, theme-color |
| Per-page `<title>` / `<meta>` | React 19 metadata hoisting — no library required |
| `ProtectedRoute.tsx` | Injects `noindex, nofollow` on all authenticated pages |

The sitemap was submitted to **Google Search Console** on 2026-02-23.
