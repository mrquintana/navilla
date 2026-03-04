---
sidebar_position: 7
title: Caching
---

# Caching Strategy

Navilla uses a two-layer caching strategy: server-side Caffeine caches and client-side service worker caching.

---

## Server-Side (Caffeine)

Configured in `CacheConfig.java` using Spring's `@EnableCaching` with individual `CaffeineCache` instances.

### Named Caches

| Cache | TTL | Max Size | Key | Used By |
|-------|-----|----------|-----|---------|
| `catalog` | 1 hour | 1 | Global (no key) | `CatalogController.getCatalog()` |
| `healthLogSummary` | 5 min | 500 | `jwt.subject` (user) | `HealthLogService.getSummary()` |
| `insights` | 5 min | 500 | `jwt.subject` (user) | `InsightsService.getInsights()` |
| `prepStreak` | 10 min | 500 | `jwt.subject` (user) | `MedicationService.getPrepStreak()` |

### Cache Eviction

Caches are evicted on write operations to ensure consistency:

| Write Operation | Evicts |
|----------------|--------|
| `HealthLogService.createVisit()` | `healthLogSummary`, `insights` |
| `HealthLogService.updateVisit()` | `healthLogSummary`, `insights` |
| `HealthLogService.deleteVisit()` | `healthLogSummary`, `insights` |
| `MedicationService.logDose()` | `prepStreak`, `insights` |

### Why Caffeine (not Redis)?

- **Single instance deployment** — Railway runs one backend container, no distributed cache needed
- **Zero infrastructure** — no Redis service to manage or pay for
- **Sub-microsecond reads** — in-process cache, no network hop
- **Good enough** — health data changes infrequently, 5-minute staleness is acceptable

---

## Client-Side (Service Worker)

The custom service worker (`frontend/src/sw.ts`) uses Workbox for runtime caching.

### Caching Strategies

| Route Pattern | Strategy | Cache TTL | Max Entries |
|---------------|----------|-----------|-------------|
| `/api/*` (except catalog) | NetworkFirst (10s timeout) | 5 min | 100 |
| `/api/catalog` | StaleWhileRevalidate | 1 hour | 10 |
| Google Fonts CSS | StaleWhileRevalidate | — | — |
| Google Fonts files | CacheFirst | 1 year | 30 |
| Images | CacheFirst | 30 days | 60 |

### Precaching

Workbox precaches all build output (66 entries) using `self.__WB_MANIFEST` injection. This enables offline access to the app shell.

### No-Cache Files

`nginx.conf` ensures these are always fetched fresh:
- `index.html` — always latest app version
- `sw.js` — always latest service worker
- `manifest.webmanifest` — always latest PWA manifest
