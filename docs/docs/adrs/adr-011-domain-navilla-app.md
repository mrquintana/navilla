---
sidebar_position: 11
title: "ADR-011: Domain — navilla.app"
---

# ADR-011: Domain — navilla.app

**Status:** Accepted
**Date:** 2026-02-23

---

## Context

Navilla needed a production domain. Requirements:

- Clearly matches the product name
- Strong email deliverability (transactional emails are critical — confirmations, exposure alerts)
- Affordable long-term cost for a side project
- No negative trust associations (spam, phishing, etc.)

---

## Decision

**`navilla.app`** — registered on GoDaddy at ~MXN 388 first year, ~MXN 541/yr renewal (~$27 USD).

---

## Alternatives Considered

| Domain | 1st year (MXN) | Renewal/yr (MXN) | Verdict |
|--------|---------------|-----------------|---------|
| `navilla.app` | 388 | 541 | ✅ Chosen |
| `navilla.co` | 258 | 1,120 | Renewal too expensive |
| `navilla.me` | 0.01 | 616 | Promo trap; `.me` reads as personal, not product |
| `navilla.dev` | 388 | 464 | Signals dev tool, not health product |
| `navilla.xyz` | 42 | 464 | Poor email deliverability; spam association |
| `navilla.lat` | 23 | 963 | Promo trap; regional connotation |
| bundle (.xyz+.me+.store+.shop+.pro) | 303 | 4,659 | Marketing trap; five useless domains |

---

## Rationale

**`.app` is enforced HTTPS.** Google's `.app` registry requires HTTPS for all sites — the browser will refuse HTTP connections to any `.app` domain. This is a meaningful trust signal for a health product.

**Email deliverability.** `.app` has clean spam reputation. This matters significantly for Navilla since transactional email (exposure alerts, account confirmations) is a core product feature. `.xyz` was explicitly rejected on this basis.

**Long-term affordability.** The renewal price (~$27 USD/yr) is negligible for a side project. Most cheaper alternatives had misleading first-year promotions with expensive renewals.

**Brand fit.** Navilla is an app. The TLD matches the product category without explanation.

---

## Email Setup

- Sending domain: `navilla.app` authenticated in SendGrid with DKIM + SPF
- Sender address: `no-reply@navilla.app`
- DMARC policy: `p=quarantine` (provisioned by GoDaddy)
- No inbox/mailbox purchased — `no-reply@navilla.app` is sending-only

---

## DNS Architecture

Root domain (`navilla.app`) cannot hold a CNAME — DNS forbids it because NS/SOA records must exist at the root. Since Railway provides hostnames (not static IPs), a 301 forward from `navilla.app` → `https://www.navilla.app` is the correct pattern. `www.navilla.app` holds the CNAME to Railway.
