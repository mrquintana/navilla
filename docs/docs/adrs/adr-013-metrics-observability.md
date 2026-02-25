---
sidebar_position: 13
title: "ADR-013: Metrics & Observability — Micrometer + OTLP + Grafana Cloud"
---

# ADR-013: Metrics & Observability — Micrometer + OTLP + Grafana Cloud

**Status:** Accepted
**Date:** 2026-02-25

---

## Context

As Navilla moves toward MVP launch, we need production observability:

- Detect regressions (latency spikes, error rate increases) before users do
- Understand business activity (connection rates, health reports, exposure computations)
- Monitor JVM health and database pool saturation on Railway

We needed an instrumentation approach that:
- Fits the Spring Boot / Java stack without heavy integration work
- Has a free tier sufficient for a small-scale launch
- Does not require self-hosting a metrics backend

---

## Decision

**Micrometer** for in-process instrumentation, exporting via **OTLP** to **Grafana Cloud**.

- All metric names and tag keys are defined as constants in `NavillaMetrics.java`
- Domain-specific `@Component` beans (`ConnectionMetrics`, `ExposureMetrics`, etc.) wrap `MeterRegistry` — services never call `MeterRegistry` directly
- Export is opt-in via `OTLP_METRICS_ENABLED=true` — zero overhead in local dev
- Six Grafana dashboards in `monitoring/grafana/` cover golden signals, HTTP/DB, JVM, auth/security, business metrics, and alerting

---

## Alternatives Considered

| Option | Reason Not Chosen |
|--------|------------------|
| Prometheus scrape | Requires exposing a `/actuator/prometheus` endpoint publicly or a sidecar scraper — adds infra complexity on Railway |
| Datadog | Paid, overkill for current scale |
| New Relic free tier | Agent-based, heavier footprint, less control over metric naming |
| Custom logging + log-based metrics | Fragile, hard to query; metrics are the right primitive for this |

---

## Consequences

**Positive:**
- Micrometer is Spring Boot's native instrumentation API — minimal boilerplate
- OTLP is vendor-neutral; we can switch backends (e.g. to a self-hosted Grafana stack) by changing one URL
- Grafana Cloud free tier is sufficient for current traffic volumes
- Centralizing metric names in `NavillaMetrics` prevents naming drift across the codebase

**Negative:**
- Grafana Cloud free tier has retention limits (13 months for metrics)
- Metric cardinality must be managed carefully — avoid high-cardinality tag values (e.g. user IDs, UUIDs) or Grafana costs will scale unexpectedly
- Dashboards are maintained as JSON files in the repo; schema drift between Grafana versions is possible
