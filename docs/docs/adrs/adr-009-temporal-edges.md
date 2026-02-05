---
title: ADR-009 Temporal Edges (Superseded)
unlisted: true
---

# ADR-009: Temporal Edges for Exposure Relevance

**Status:** **Superseded** — merged into [ADR-008: Network Graph Engine](./adr-008-network-graph-engine)

## Context
Connections are currently treated as timeless edges. This can produce misleading exposure results.

Example:
- User connects with Person A in 2020.
- Person A connects to 10 people in 2020 → those should remain relevant.
- Person A connects to 30 more people in 2025 → those should **not** become relevant unless the user reconnects with Person A after 2025.

We need exposure calculations that respect **when** a connection was active, not just **whether** it exists.

## Proposed Direction
Model **time-bounded edges** and restrict graph traversal to edges that are active within overlapping time windows.

### Key Ideas
- Store temporal scope per edge (e.g., `connection_start_at`, `connection_end_at` or `last_confirmed_at` + TTL).
- Traversal from A → B → C is valid only if:
  - A–B edge is active, and
  - B–C edge is active within an overlapping time window.
- Reconnection should extend or renew the edge window, making newer connections relevant again.

## Open Questions
- What defines an “active edge window”? Fixed TTL vs explicit end date?
- Do both parties need to confirm a renewal, or just one?
- Should expired connections remain visible (inactive) or be hidden?
- How to handle missing timestamps for legacy connections?

## Implications
**Pros**
- More accurate exposure relevance.
- Prevents future relationships from retroactively affecting past contacts.

**Cons**
- Requires additional data model fields and more complex graph traversal.
- Will need UX for reconnection/renewal.

## User-Facing Disclosure Requirement
We must publish a detailed, plain-language explanation that covers:
- How connections and exposure graphs are built
- What “network size” means and what it includes
- The refresh cadence and why data is not live
- The privacy rationale and known limitations
- Examples that mirror real scenarios

This disclosure is required for user trust and potential legal/medical compliance.
