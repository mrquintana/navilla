---
sidebar_position: 10
title: "ADR-010: Railway Memory Optimization"
---

# ADR-010: Railway Memory Optimization

## Status

Accepted

## Date

2026-02-05

## Context

Navilla runs on Railway with the backend (Java/Spring Boot) and frontend (Nginx) as separate services. Railway charges based on resource usage, and the default JVM configuration was consuming more memory than necessary for a staging/early-production workload with low traffic.

Key observations:
- The JVM defaulted to G1GC with 75% max RAM and 50% initial RAM — appropriate for production under load, but over-provisioned for single-digit RPS.
- HikariCP connection pool was set to 10 max / 2 min idle — each idle PostgreSQL connection uses ~1-2MB on the JVM side.
- Hibernate logging was at DEBUG/TRACE, generating heavy string allocations on every query.
- The metrics actuator endpoint ran Micrometer collection in the background, consuming memory with no consumer.
- The frontend Nginx image included `curl` as a dependency solely for healthchecks, adding ~5MB to the image. Alpine's built-in `wget` does the same job.
- Nginx was configured with `worker_processes auto` and `worker_connections 1024` — suited for hundreds of concurrent users, not a staging environment.

## Decision

### Backend: Dual JVM Configuration

Two JVM presets are defined in the Dockerfile:

**Default (production under load):**
```
-XX:+UseContainerSupport
-XX:MaxRAMPercentage=75.0
-XX:InitialRAMPercentage=50.0
-XX:+UseG1GC
-XX:+UseStringDeduplication
```

**Lean (Railway / memory-constrained, 256-512MB):**
```
-XX:+UseContainerSupport
-XX:MaxRAMPercentage=70.0
-XX:InitialRAMPercentage=30.0
-XX:+UseSerialGC
-XX:MaxMetaspaceSize=96m
-XX:+TieredCompilation
-XX:TieredStopAtLevel=1
-Xss256k
```

The lean preset is activated by overriding `JAVA_OPTS` in Railway's environment variables.

### Why Each Flag Matters

| Flag | Default | Lean | Savings | Trade-off |
|------|---------|------|---------|-----------|
| GC algorithm | G1GC | SerialGC | ~50MB (G1 remembered sets) | Stop-the-world pauses, but imperceptible at low RPS |
| InitialRAMPercentage | 50% | 30% | Starts smaller, grows on demand | Slightly slower first few requests |
| TieredStopAtLevel | 4 (full C2) | 1 (C1 only) | ~20-30MB code cache | ~15% throughput reduction under sustained load |
| MaxMetaspaceSize | Unbounded | 96MB | Caps class metadata growth | Could hit limit if adding many libraries |
| Thread stack size (Xss) | 1MB | 256KB | ~768KB per thread (x10 threads = ~7.5MB) | Limits deep recursion (not an issue for web handlers) |

### Backend: Connection Pool and Logging

| Setting | Before | After | Reason |
|---------|--------|-------|--------|
| HikariCP max pool | 10 | 5 (configurable via `HIKARI_MAX_POOL`) | 10 connections for low traffic wastes memory and Supabase connection slots |
| HikariCP min idle | 2 | 1 (configurable via `HIKARI_MIN_IDLE`) | 1 idle connection is enough to avoid cold-start latency |
| HikariCP idle timeout | 10 min | 5 min | Release idle connections faster |
| Hibernate SQL log level | DEBUG | WARN (configurable via `LOG_LEVEL_HIBERNATE`) | DEBUG/TRACE log levels generate string allocations on every query |
| App log level | DEBUG | INFO (configurable via `LOG_LEVEL_APP`) | Reduces log volume and string allocation |
| Actuator endpoints | health, info, metrics | health, info | Micrometer metrics collection runs in background with no consumer |

### Frontend: Nginx Optimization

| Change | Before | After | Reason |
|--------|--------|-------|--------|
| Healthcheck tool | `curl` (requires `apk add`) | `wget` (built into Alpine) | Smaller image, one fewer dependency |
| Worker processes | `auto` (= CPU count) | `1` | Single worker handles a staging SPA fine |
| Worker connections | `1024` | `256` | Each connection struct uses memory; 256 handles plenty |

## Configuration Reference

### Railway Environment Variables (Backend)

To activate the lean JVM preset, set this in Railway's environment variables UI.

**Important:** Railway does not expand shell variable references. You must paste the full flags string — not a reference like `$JAVA_OPTS_LEAN`.

```
JAVA_OPTS=-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0 -XX:InitialRAMPercentage=30.0 -XX:+UseSerialGC -XX:MaxMetaspaceSize=96m -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Xss256k -Djava.security.egd=file:/dev/./urandom -Dspring.profiles.active=production
```

Optional fine-tuning:

| Variable | Default | Lean suggestion | Description |
|----------|---------|-----------------|-------------|
| `JAVA_OPTS` | G1GC preset | Lean preset above | Full JVM flags |
| `HIKARI_MAX_POOL` | 5 | 3 | Max DB connections |
| `HIKARI_MIN_IDLE` | 1 | 1 | Min idle DB connections |
| `LOG_LEVEL_APP` | INFO | INFO | App log level (DEBUG for troubleshooting) |
| `LOG_LEVEL_HIBERNATE` | WARN | WARN | Hibernate SQL log level (DEBUG to see queries) |

### When to Switch Back to Default

Switch from lean to default JVM when:
- Sustained traffic exceeds ~50 RPS
- P99 latency increases noticeably due to GC pauses
- Railway container is upgraded to 1GB+ RAM

The switch is a single environment variable change — no code or image rebuild needed.

## Consequences

### Pros
- Backend fits comfortably in a 256-512MB Railway container
- Faster cold starts (less initial heap, C1-only compilation)
- Lower Railway costs (less memory = less billing)
- All settings are environment-configurable — no rebuild to tune
- Frontend image is smaller (no curl dependency)

### Cons
- SerialGC has stop-the-world pauses (irrelevant at low RPS, noticeable at ~50+ RPS)
- TieredStopAtLevel=1 reduces peak throughput by ~15% (C1 is less optimized than C2)
- MaxMetaspaceSize=96m could be hit if many Spring components are added (monitor via actuator health endpoint)
- Reduced connection pool (5 max) could cause contention under concurrent load (increase `HIKARI_MAX_POOL` if needed)

## Related

- **ADR-002 (Technology Stack):** Java + Spring Boot choice informs JVM tuning options
- Dockerfile: `backend/Dockerfile` (JAVA_OPTS and JAVA_OPTS_LEAN definitions)
- Application config: `backend/src/main/resources/application.yaml` (HikariCP and logging defaults)
- Nginx config: `frontend/nginx.conf` (worker settings)
