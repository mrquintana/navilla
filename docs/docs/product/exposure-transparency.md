---
title: Exposure & Network Transparency
---

# Exposure & Network Transparency

This page explains exactly how Navilla computes exposures, connections, and network size.
It is written for users who want clarity and for legal/compliance review.

## 1) Definitions

**Connection (1st‑degree)**  
A confirmed relationship between two users. These are the only direct edges in your network.

**Indirect contact (2nd+ degree)**  
Users who are connected to your connections (2nd degree), or to their connections (3rd+), up to the configured depth.

**Exposure**  
An exposure is a **signal** that at least one user in your indirect network has reported a positive condition.
We never show identities—only counts and the closest degree.

**Network size**  
The total number of unique people in your graph up to the configured depth.
This **includes direct connections**.

## 2) How connections are used

Navilla builds a graph using **confirmed connections only**.
Pending or denied requests are never included.

If you have zero confirmed connections, you will see no exposure or network size data.

## 3) How exposure is computed

1. Navilla builds a graph of confirmed connections.
2. It traverses the graph outward from you up to a configured depth (currently 5).
3. It checks only **positive** statuses reported by users in that reachable set.
4. It aggregates results by condition and shows:
   - **Closest degree** where a case appears
   - **Count of cases** (unique users)
   - **Timeframe** (recent vs older)
   - **Status** (active vs resolved)

We do **not** show any names or identities.

## 4) Why data is not live

Exposure and network size are **cached snapshots** that refresh every few days.
This is intentional:

- It reduces the risk of identifying individuals
- It prevents inference attacks from real‑time changes
- It keeps computations stable for large graphs

## 5) What “network size” means

Network size is the **unique count** of people reachable from you **within the configured depth**.
It includes your direct connections and indirect contacts up to that depth.

## 6) What exposure does NOT mean

- Exposure does **not** mean infection
- Exposure does **not** identify a person
- Exposure does **not** imply immediate risk without context

Use exposure as a signal to consider testing and care.

## 7) Example (simple)

You are connected to Ana. Ana is connected to Luis. Luis reports a positive result.
You will see an exposure at **2nd degree**, with **no names**.

## 8) Example (time relevance)

If you connected with Person A in 2020 and never reconnect:
- People A connected to in 2020 can still be relevant.
- People A connected to in 2025 should **not** affect you unless you reconnect with A.

This is a future enhancement (temporal edges) currently being designed. See [ADR-008: Network Graph Engine](../adrs/adr-008-network-graph-engine) for full details.

## 9) Configuration (subject to change)

- Max exposure depth: 5
- Snapshot refresh window: ~5 days

These values may change as the product evolves.

## 10) How exposures are prioritized

When you view your exposure overview, items are sorted so the most relevant ones appear first. The ranking considers four factors:

1. **Status** — Active conditions rank higher than resolved ones. An active case in your network is more actionable than one that has been cleared.

2. **Closeness** — 1st-degree exposures (your direct connections) rank higher than 2nd or 3rd degree. The closer the exposure, the more relevant it is to you.

3. **Recency** — Exposures reported in the last 30 days rank higher than older ones. Recent reports are more likely to require your attention.

4. **Case count** — More cases of the same condition rank slightly higher than fewer cases.

Each exposure card also shows a subtle colored accent on the left edge:
- **Amber** — High priority: recent, close, and active. Consider testing soon.
- **Indigo** — Medium priority: still relevant but less immediate.
- **Gray** — Low priority: older, more distant, or resolved exposures.

This system helps you quickly scan your exposure overview and identify what matters most, without needing to read every detail.

