# Week 4 Design: SEO + Cost Estimator + Polish + Deploy Layer 0

**Date:** 2026-02-26
**Status:** Approved

---

## 1. Testing Cost Estimator

**Route:** `/testing-cost`
**UX:** Static reference table, no interactivity.

### Content Structure
- Hero: title + subtitle explaining "costs vary by provider type"
- Table: **STIs as rows, provider tiers as columns**
  - CAPASITS / SAI — Free (government sexual health clinics)
  - IMSS / ISSSTE — Free with coverage (social security)
  - Private lab (Chopo, Olab, Salud Digna) — $
  - Private clinic — $$
  - Specialist — $$$
- Cells show tier symbols (Free / $ / $$ / $$$), not peso amounts
- Footnotes explaining each provider tier (what CAPASITS is, where to find one, etc.)
- Bilingual (en_US + es_MX)
- Sign-up CTA at bottom (auth-gated, same pattern as guide detail)

### Mobile
- Table collapses to card-per-STI layout (each card lists provider tiers vertically)
- No horizontal scroll tables

---

## 2. SEO Infrastructure

### A. Structured Data (JSON-LD)
- Guide detail pages: `MedicalWebPage` schema (`about`, `description`, `lastReviewed`, `medicalAudience: Patient`, `specialty: Infectious Disease`)
- Calculator: `WebApplication` schema
- Cost estimator: `WebPage` schema
- Guides index: `CollectionPage` schema
- Injected as `<script type="application/ld+json">` via React 19 hoisting

### B. Sitemap
- Update `frontend/public/sitemap.xml` with all Layer 0 URLs:
  - `/calculator`, `/guides`, `/testing-cost`
  - All 10 `/guide/{slug}` routes
  - Keep existing informational pages
- Add `<lastmod>` and `<priority>` (tools > info pages)

### C. Prerender
- Add 5 missing guide slugs: HPV, Hep B, Hep C, Trichomoniasis, Mycoplasma
- Add `/testing-cost` to prerender list
- Ensure OG tags are injected during prerender (not just title/description)

### D. Open Graph
- Create one brand `og:image` (1200x630, indigo gradient + Navilla logo + tagline)
- Wire up in `index.html` as default
- Add `twitter:image` matching `og:image`
- Guide detail pages: override `og:type` to `article`

---

## 3. Conversion CTAs

### Reusable `<SignUpCTA />` Component
- Only renders when user is NOT authenticated
- Warm, non-pushy tone
- Links to `/signup`
- Bilingual

### Placement

| Page | Location | Message |
|------|----------|---------|
| Calculator | Below results table | "Track your results over time" |
| Guides Index | Below guide cards grid | "Stay informed about your sexual health" |
| Guide Detail | Already exists (keep) | — |
| Cost Estimator | Below cost table | "Log your tests and get reminders" |

### Cross-Tool Navigation
- Calculator → `/testing-cost` ("Know when to test? See what it costs")
- Cost estimator → `/calculator` ("Not sure when to test? Check your window periods")
- Guides index → `/testing-cost` (add alongside existing calculator link)

---

## 4. Deploy

- All work on `develop` branch
- Merge to `main` when complete
- Railway auto-deploys from `main`
