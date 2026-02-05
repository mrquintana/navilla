---
title: ADR-008 Network Size Cache (Superseded)
unlisted: true
---

# ADR-008: Network Size Cache

## Status
**Superseded** by [ADR-008: Network Graph Engine](./adr-008-network-graph-engine)

## Context
The dashboard needs to show the total number of unique nodes reachable in a user’s connection graph.
We want this “network size” to include direct connections and indirect connections, and to refresh on a
cadence that avoids expensive recomputation on every request. We also want the depth to be configurable
and support increasing it (MVP target: 5).

## Decision
We compute network size using a breadth‑first traversal (BFS) of the confirmed‑connections graph and
count unique nodes with degree >= 1 up to the configured `navilla.exposure.max-depth`.

We cache the computed snapshot alongside exposure data using the existing exposure snapshot cache, and
add two fields to the snapshot response:
- `totalGraphNodes`: total unique nodes within max depth (includes direct connections)
- `maxDepth`: the max depth used for traversal

Cache TTL is set via `navilla.exposure.snapshot-ttl-days` (configured to 5 days for MVP).

## Algorithm
1. Build undirected graph from confirmed connections.
2. BFS from the requesting user’s hash up to `maxDepth`.
3. Count unique nodes at degrees 1..maxDepth.
4. Persist snapshot with TTL for reuse.

## Consequences
**Pros**
- Stable request latency (cached snapshots).
- Clear, explainable count for users.
- Depth is configurable (MVP uses 5).

**Cons**
- Snapshot TTL applies to exposure data and network size together.
- Larger max depth can increase compute time on recompute requests.

## Tests
- `ExposureControllerTest` now asserts `totalGraphNodes` and `maxDepth` are present in the response.
