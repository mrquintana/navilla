---
sidebar_position: 6
title: Monitoring & Metrics
---

# Monitoring & Metrics

Navilla uses [Micrometer](https://micrometer.io/) for instrumentation and exports metrics via OTLP to Grafana Cloud. Six pre-built Grafana dashboards provide operational and business-level visibility.

---

## Architecture

```
Spring Boot (Micrometer)
        │
        │  OTLP (HTTP/Protobuf, 60s steps)
        ▼
  Grafana Cloud (Prometheus-compatible)
        │
        ▼
  6 Grafana Dashboards
```

Metrics are exported only when `OTLP_METRICS_ENABLED=true`. In local development the flag is `false` by default — the app runs normally with no telemetry overhead.

---

## Configuration

Controlled via environment variables — no code changes needed between environments.

| Variable | Default | Purpose |
|----------|---------|---------|
| `OTLP_METRICS_ENABLED` | `false` | Enable/disable OTLP export |
| `OTLP_METRICS_URL` | `http://localhost:4318/v1/metrics` | OTLP collector endpoint |
| `OTLP_METRICS_AUTH` | _(empty)_ | Base64-encoded `user:token` for Grafana Cloud |
| `SPRING_PROFILES_ACTIVE` | `unknown` | Sets the `environment` common tag |

Every exported metric automatically carries two common tags:

| Tag | Value |
|-----|-------|
| `application` | `navilla-backend` |
| `environment` | value of `SPRING_PROFILES_ACTIVE` |

---

## Metric Registry (`NavillaMetrics`)

All metric names and tag keys are defined as constants in `NavillaMetrics.java` — no inline string literals anywhere in instrumentation code.

### Naming Convention

```
navilla.<domain>.<action>
```

Grafana Cloud receives these as `navilla_domain_action_total` after OTLP ingestion.

### Metric Names

| Constant | Metric Name | Type | Description |
|----------|-------------|------|-------------|
| `HEALTH_STATUS_REPORTED` | `navilla.health.status.reported` | Counter | Status created or updated |
| `HEALTH_STATUS_CLEARED` | `navilla.health.status.cleared` | Counter | Status marked cleared |
| `HEALTH_STATUS_ACTIVATED` | `navilla.health.status.activated` | Counter | Cleared status reactivated |
| `HEALTH_STATUS_DELETED` | `navilla.health.status.deleted` | Counter | Status record deleted |
| `CONNECTION_CREATED` | `navilla.connection.created` | Counter | Connection request submitted |
| `CONNECTION_ACCEPTED` | `navilla.connection.accepted` | Counter | Request accepted |
| `CONNECTION_DENIED` | `navilla.connection.denied` | Counter | Request denied |
| `CONNECTION_CANCELLED` | `navilla.connection.cancelled` | Counter | Connection cancelled/removed |
| `EXPOSURE_SNAPSHOT` | `navilla.exposure.snapshot` | Counter | Cache hit or miss |
| `EXPOSURE_COMPUTATION_DURATION` | `navilla.exposure.computation.duration` | Timer | BFS + aggregation wall time |
| `EXPOSURE_GRAPH_NODES` | `navilla.exposure.graph.nodes` | DistributionSummary | Graph node count at computation |
| `EXPOSURE_INSUFFICIENT_CONNECTIONS` | `navilla.exposure.insufficient.connections` | Counter | User below minimum threshold |
| `NOTIFICATION_CREATED` | `navilla.notification.created` | Counter | Notification persisted |
| `NOTIFICATION_READ` | `navilla.notification.read` | Counter | Notification marked read |
| `NOTIFICATION_CREATION_FAILED` | `navilla.notification.creation.failed` | Counter | Persistence failure |

### Tag Keys

| Constant | Tag Key | Used On |
|----------|---------|---------|
| `CONDITION` | `condition` | Health status metrics (e.g. `hiv`, `chlamydia`) |
| `STATUS` | `status` | Health status metrics (e.g. `positive`, `negative`) |
| `OUTCOME` | `outcome` | `connection.created`, `health.status.reported` |
| `CACHE` | `cache` | `exposure.snapshot` (`hit` / `miss`) |
| `TYPE` | `type` | Notification metrics |
| `PRIOR_STATUS` | `prior_status` | `connection.cancelled` (`pending` / `confirmed`) |

---

## Instrumentation Beans

Each domain has a dedicated `@Component` that wraps `MeterRegistry`. Inject the bean into the corresponding service.

### `ConnectionMetrics`

Injected into `ConnectionService`.

| Method | Metric recorded |
|--------|----------------|
| `recordCreated()` | `connection.created` with `outcome=created` |
| `recordQueuedUnknown()` | `connection.created` with `outcome=queued_unknown_recipient` |
| `recordAccepted()` | `connection.accepted` |
| `recordDenied()` | `connection.denied` |
| `recordCancelledPending()` | `connection.cancelled` with `prior_status=pending` |
| `recordRemovedConfirmed()` | `connection.cancelled` with `prior_status=confirmed` |

### `ExposureMetrics`

Injected into `ExposureService`.

| Method | Metric recorded |
|--------|----------------|
| `recordCacheHit()` | `exposure.snapshot` with `cache=hit` |
| `recordCacheMiss()` | `exposure.snapshot` with `cache=miss` |
| `timeComputation(supplier)` | `exposure.computation.duration` Timer; returns result |
| `recordGraphNodes(n)` | `exposure.graph.nodes` DistributionSummary |
| `recordInsufficientConnections()` | `exposure.insufficient.connections` |

### `HealthStatusMetrics`

Injected into `HealthStatusService`.

| Method | Metric recorded |
|--------|----------------|
| `recordReported(condition, status, isUpdate)` | `health.status.reported` tagged by condition, status, outcome |
| `recordCleared(condition)` | `health.status.cleared` tagged by condition |
| `recordActivated(condition)` | `health.status.activated` tagged by condition |
| `recordDeleted(condition)` | `health.status.deleted` tagged by condition |

### `NotificationMetrics`

Injected into `NotificationService`.

| Method | Metric recorded |
|--------|----------------|
| `recordCreated(type)` | `notification.created` tagged by notification type |
| `recordRead()` | `notification.read` |
| `recordCreationFailed(type)` | `notification.creation.failed` tagged by type |

---

## Grafana Dashboards

Six dashboards live in `monitoring/grafana/`. Import each JSON file into your Grafana Cloud workspace.

| File | Dashboard Title | Purpose |
|------|----------------|---------|
| `golden-signals.json` | Navilla — Golden Signals (SLA Overview) | Latency, traffic, errors, saturation |
| `http-database.json` | Navilla — HTTP & Database | Endpoint-level request rates, DB pool, query times |
| `jvm-system.json` | Navilla — JVM & System | Heap, GC, threads, CPU |
| `auth-security.json` | Navilla — Auth & Security | Login rates, JWT errors, auth failures |
| `navilla-business.json` | Navilla — Business Metrics | Connection activity, health reports, exposure computations |
| `alerting.json` | Navilla — Alerting | Firing alert rules and annotation history |

### Importing a Dashboard

1. Grafana Cloud → **Dashboards** → **Import**
2. Upload the JSON file from `monitoring/grafana/`
3. Select your Prometheus/Grafana Cloud data source
4. Save

---

## Adding a New Metric

1. Add the metric name constant to `NavillaMetrics.Names`
2. Add any new tag keys to `NavillaMetrics.TagKeys` and values to `NavillaMetrics.TagValues`
3. Add a method to the relevant `*Metrics` component (or create a new one for a new domain)
4. Inject the `*Metrics` bean into the service and call it at the appropriate point
5. Update the relevant Grafana dashboard JSON if a panel should surface the metric
