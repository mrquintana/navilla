---
sidebar_position: 8
title: "ADR-008: Network Graph Engine"
---

# ADR-008: Network Graph Engine — Exposure Computation, Network Size, and Temporal Relevance

**Status:** Accepted (MVP scope) / In Progress (temporal edges)

**Date:** 2026-02-05

**Supersedes:** ADR-008 Network Size Cache (original), ADR-009 Temporal Edges for Exposure Relevance

---

## 1. Context

Navilla computes exposure risk by traversing a graph of confirmed connections. Two interrelated problems need solving:

1. **Network size**: The dashboard shows how many unique people are reachable in a user's connection graph. This number must be computed efficiently and cached.
2. **Temporal relevance**: Connections are currently treated as timeless edges. This produces misleading exposure results when the graph evolves over time — a connection made in 2020 should not automatically make 2025 contacts relevant.

These problems share the same graph traversal infrastructure and caching strategy, so they are addressed together.

---

## 2. Decision

### 2.1 MVP (Ship Now)

Compute network size and exposure using breadth-first search (BFS) of the confirmed-connections graph. Cache the result alongside exposure data. Do **not** implement temporal filtering yet — but lay the groundwork by using `confirmedAt` timestamps that already exist on connections.

**Algorithm:**
1. Load all confirmed connections into an undirected adjacency map.
2. BFS from the requesting user's hash up to `max-depth` (configured, default 5).
3. Count unique nodes at each degree (1 through `max-depth`).
4. For exposure: query only POSITIVE health statuses for users in the reachable set.
5. Aggregate exposures by condition, tracking closest degree, count, timeframe, and status.
6. Persist the entire result as an encrypted JSON snapshot with a TTL.

**Response fields:**
- `connectionCount` — 1st-degree connections
- `secondDegreeCount` — 2nd-degree contacts
- `thirdDegreeCount` — 3rd-degree contacts
- `totalGraphNodes` — all unique nodes within max depth (engagement metric)
- `maxDepth` — the traversal depth used
- `exposures[]` — aggregated exposure items (condition, count, closestDegree, timeframe, status)
- `computedAt` / `nextUpdateAt` — snapshot timestamps

**Cache strategy:**
- Single encrypted snapshot per user, stored in `exposure_snapshots`.
- TTL: `navilla.exposure.snapshot-ttl-days` (default 5 days).
- Network size and exposure data share the same snapshot and TTL. This ensures consistency — users never see a network size that contradicts their exposure data.
- Snapshot is recomputed on first request after expiry, or on-demand via dev endpoint.

**Invalidation (MVP):**
- No proactive invalidation. Users see stale data for up to TTL duration after adding connections.
- This is acceptable for MVP because: (a) it prevents timing-based inference attacks, (b) users are told data refreshes periodically, (c) the "next update" timestamp is shown in the UI.

**Privacy threshold:**
- Users with fewer than 3 confirmed connections see no exposure data and no network size. They receive a generic recommendation message.

### 2.2 Post-MVP: Temporal Edges

**Problem statement:**
Without temporal filtering, the following happens:

> User A connects with Person B in 2020. Person B connects to 30 more people in 2025. Those 30 people become part of User A's exposure graph even though User A's relationship with Person B predates those contacts.

This produces phantom exposure paths — User A is shown risk from people who were never contemporaneous contacts of their connection.

**Proposed solution:**
Model time-bounded edges and restrict graph traversal to edges that are temporally compatible.

**Data model additions:**
- `last_confirmed_at` on `connections` — timestamp of most recent confirmation or renewal (already partially available as `confirmed_at`).
- `connection_ttl_days` — system-wide or per-connection TTL after which an edge is considered dormant (not deleted, just excluded from traversal). Recommended default: 730 days (2 years).

**Temporal traversal rule:**
A path A → B → C is valid only if:
- The A–B edge is active (i.e., `last_confirmed_at + TTL > now`), AND
- The B–C edge was confirmed **before** the A–B edge expired, OR was confirmed/renewed while A–B was still active.

This prevents future connections from retroactively extending old relationships.

**Renewal mechanism:**
- Users can "reconnect" with an existing confirmed connection to reset `last_confirmed_at`.
- This is a lightweight action (one tap, no approval needed since already confirmed).
- It extends the temporal window, making newer contacts of that connection relevant again.

---

## 3. Network Size as an Engagement Metric

Network size (`totalGraphNodes`) serves a dual purpose:

1. **Health utility**: Context for exposure data — "3 cases in a network of 847 people" is more meaningful than "3 cases."
2. **Engagement**: A growing number is inherently interesting and gives users a reason to return and add connections.

This is a deliberate product choice. While network size alone is not a health metric, it drives the user growth that makes exposure data statistically meaningful. A larger user base = better data for everyone.

**How we present it:**
- Dashboard: "Your network: X people" with a brief explanation.
- Always accompanied by the max depth and a "What does this mean?" link.
- Never framed as a health indicator — framed as reach and context.

---

## 4. Scenarios

The following scenarios define expected behavior for the current MVP algorithm and the future temporal-edge algorithm. Each scenario specifies what the user should see and why.

### Scenario 1: Simple Direct Exposure (MVP + Temporal)

```
You ←→ Ana (confirmed 2025-01)
Ana reports HIV+ (2025-02)
```

**You see:** HIV exposure at 1st degree, 1 case, recent, active.
**Why:** Ana is a direct confirmed connection with an active positive status.

### Scenario 2: Second-Degree Exposure (MVP + Temporal)

```
You ←→ Ana (confirmed 2025-01)
Ana ←→ Luis (confirmed 2025-01)
Luis reports Chlamydia+ (2025-03)
```

**You see:** Chlamydia exposure at 2nd degree, 1 case, recent, active.
**Why:** Luis is reachable through Ana within max depth. You never see Luis's name.

### Scenario 3: Below Privacy Threshold (MVP + Temporal)

```
You ←→ Ana (confirmed)
You ←→ Ben (confirmed)
(only 2 connections)
Ana reports HIV+ (2025-03)
```

**You see:** Generic message — "You need at least 3 connections for exposure data."
**Why:** With fewer than 3 connections, showing exposure data would reveal individual statuses. Privacy threshold protects against inference.

### Scenario 4: Resolved Exposure (MVP + Temporal)

```
You ←→ Ana ←→ Luis
Luis reports Gonorrhea+ (2024-06), cleared (2024-09)
```

**You see:** Gonorrhea exposure at 2nd degree, 1 case, older, resolved.
**Why:** The status was cleared but remains visible as "resolved" since historical exposure is still relevant.

### Scenario 5: Stale Snapshot (MVP)

```
You have 5 connections. Snapshot computed 2025-01-01, TTL 5 days.
You add a 6th connection on 2025-01-03.
You check dashboard on 2025-01-04.
```

**You see:** Network size and exposure data from 2025-01-01 snapshot. "Next update" shows ~2025-01-06.
**Why:** Snapshot has not expired yet. This is by design — prevents timing attacks and keeps computation stable.

### Scenario 6: Multiple Conditions, Multiple Degrees (MVP + Temporal)

```
You ←→ Ana ←→ Luis ←→ Carlos
Ana reports HSV2+ (2025-01)
Luis reports HSV2+ (2025-02)
Carlos reports HIV+ (2025-03)
```

**You see:**
- HSV2: 2 cases, closest at 1st degree, recent, active
- HIV: 1 case, closest at 3rd degree, recent, active

**Why:** HSV2 is aggregated across Ana (1st) and Luis (2nd). Closest degree shown is 1. HIV is only at Carlos (3rd degree).

### Scenario 7: Phantom Exposure — Why Temporal Edges Matter (Post-MVP)

```
You ←→ Person B (confirmed 2020, never renewed)
Person B ←→ Person C (confirmed 2025)
Person C reports Syphilis+ (2025)
```

**MVP behavior (current):** Syphilis exposure at 2nd degree. (Incorrect — B's 2025 contacts should not affect you without renewal.)

**Temporal behavior (future):** No exposure. The B–C edge was created after the A–B edge's temporal window expired. You would need to reconnect with B to make their newer contacts relevant.

### Scenario 8: Reconnection Renews Relevance (Post-MVP)

```
You ←→ Person B (confirmed 2020, renewed 2025-06)
Person B ←→ Person C (confirmed 2025-03)
Person C reports HPV+ (2025-07)
```

**Temporal behavior:** HPV exposure at 2nd degree, 1 case. The renewal in 2025-06 opened a new temporal window, and B–C was confirmed within that window.

### Scenario 9: Expired Edge in Chain (Post-MVP)

```
You ←→ A (confirmed 2024, active)
A ←→ B (confirmed 2020, expired — no renewal)
B ←→ C (confirmed 2024)
C reports HIV+ (2025)
```

**Temporal behavior:** No exposure from C. Even though You–A is active and B–C is active, the A–B edge is expired, breaking the chain. The traversal stops at B.

### Scenario 10: Large Network, Depth Limit (MVP + Temporal)

```
You have 15 direct connections.
Your 5th-degree network contains 12,000 people.
3 people at 4th degree report positive statuses.
2 people at 5th degree report positive statuses.
```

**You see:** Only the 3 cases at 4th degree are shown. 5th degree cases are excluded because `max-exposure-degree` is set to 3 by default — wait, clarification: exposure is computed up to `max-depth` (5) for network size, but only `max-exposure-degree` (3) is shown to users for exposure items.

**Correction/clarification:** The current code filters exposure users from the full BFS (up to `max-depth` = 5), but the frontend only displays exposure items up to 3rd degree. The `totalGraphNodes` count includes all nodes up to depth 5.

### Scenario 11: Self-Reported Positive (MVP + Temporal)

```
You report Chlamydia+ yourself.
You have 10 connections.
```

**You see:** Your own status in "My confirmed results." In the exposure overview, you may see Chlamydia at various degrees from *other* people's reports. Your own report does not appear in your own exposure view — exposure only shows others' statuses that reach you through the graph.

### Scenario 12: Connection Removed (MVP + Temporal)

```
You ←→ Ana ←→ Luis (Luis has HIV+)
You remove your connection with Ana.
```

**After next snapshot:** Luis is no longer reachable from you. HIV exposure disappears from your view. Ana's view is unaffected — she still sees her connection history.

---

## 5. User-Facing Disclosure

The following must be published in a user-accessible location (in-app "How It Works" page and/or Terms of Service). This is required for user trust and for legal/medical compliance.

### 5.1 How Your Network Is Built

When you connect with someone on Navilla and they accept, a confirmed connection is created between you. This connection is stored using cryptographic hashes — we never store "User A is connected to User B" using real names or emails. Instead, we store "Hash-1 is connected to Hash-2."

Your network extends beyond your direct connections. If you are connected to Ana, and Ana is connected to Luis, then Luis is part of your 2nd-degree network. This extends outward up to a maximum depth (currently 5 degrees).

Only **confirmed** connections are included. Pending or denied requests are never part of the graph.

### 5.2 How Exposure Is Calculated

When you or anyone in your network reports a positive health status, Navilla computes exposure signals for affected users:

1. We build a graph of all confirmed connections.
2. Starting from you, we traverse outward up to the configured depth.
3. We check which users in your reachable network have reported a positive condition.
4. We aggregate the results: for each condition, we show the **number of cases** and the **closest degree** (how many connections away the nearest case is).

**We never show names, usernames, or any identifying information about who reported what.**

You will see:
- The condition name (e.g., "Chlamydia")
- How many unique people in your network reported it
- The closest degree (1st, 2nd, 3rd)
- Whether the report is recent (last 30 days) or older
- Whether the condition is still active or has been cleared ("resolved")

### 5.3 What "Network Size" Means

Your network size is the total number of unique people reachable from you within the configured depth. This includes your direct connections and all indirect contacts through chains of connections.

This number gives context to exposure data. For example, "2 cases of Chlamydia in a network of 500 people" tells a different story than "2 cases in a network of 10 people."

Network size is **not** a health metric. It reflects the reach of your connection graph.

### 5.4 Why Your Data Is Not Real-Time

Exposure data and network size are computed periodically (currently every ~5 days) and cached. When you view your dashboard, you are seeing a **snapshot** — not a live calculation.

This is intentional for three reasons:

1. **Privacy protection**: If data updated in real-time, you could add a new connection and immediately see if they had reported a condition. Delayed updates prevent this kind of inference.
2. **Performance**: Computing graph traversals for every request would be expensive and slow.
3. **Stability**: Your exposure data doesn't change unexpectedly during a session.

Your dashboard shows when the snapshot was last computed and approximately when the next update will occur.

### 5.5 Privacy Threshold

If you have fewer than 3 confirmed connections, Navilla will **not** show you exposure data. With only 1 or 2 connections, exposure alerts could reveal a specific person's health status. The 3-connection minimum creates plausible deniability — you cannot determine which connection triggered an alert.

### 5.6 What Exposure Does NOT Mean

- **Exposure does not mean you are infected.** It means someone in your extended network has reported a condition. The further away (higher degree), the less direct the relevance.
- **Exposure does not identify anyone.** You will never see who reported what.
- **Exposure does not replace medical advice.** Use it as a signal to consider testing. Consult a healthcare provider for diagnosis and treatment.
- **Exposure is based on self-reported data.** Navilla does not verify test results (in MVP). Reports may be inaccurate, delayed, or incomplete.
- **Exposure is not exhaustive.** People in your real-world network who are not on Navilla, or who have not reported their status, are not reflected in your data.

### 5.7 Data Accuracy and Limitations

- All health status data is **self-reported** by users. Navilla does not currently verify results with laboratories or healthcare providers.
- Users may report inaccurately, forget to update cleared conditions, or not report at all.
- The graph only includes Navilla users. Your real-world exposure may be larger or smaller than what Navilla shows.
- Snapshot caching means your data may be up to several days old.
- Network size can grow or shrink as users add or remove connections, or as accounts are deleted.
- Future updates may introduce verified test results and temporal filtering for more accurate exposure calculations.

### 5.8 Your Rights and Controls

- **View**: You can view your network size and exposure data at any time.
- **Report**: You can report, clear, or delete your own health statuses.
- **Connect/Disconnect**: You can add or remove connections. Removing a connection removes that person (and their downstream network) from your graph on the next snapshot refresh.
- **Delete Account**: You can permanently delete your account and all associated data.
- **Export**: You can request an export of all your personal data (GDPR right to portability).
- **Opt Out of Exposure**: You cannot opt out of appearing in others' exposure calculations while maintaining active connections. If you have confirmed connections and report a positive status, anonymized statistics derived from your report may appear in others' exposure views. However, your identity is never revealed.

---

## 6. Legal and Compliance Considerations

### 6.1 Not a Medical Device

Navilla is an informational tool. It does not diagnose, treat, prevent, or cure any disease. Exposure data is derived from self-reported, unverified user input and should not be used as a substitute for professional medical advice, testing, or treatment.

This classification means Navilla does not currently require FDA clearance (US), CE marking (EU), or equivalent medical device approvals. However, this status must be re-evaluated if:
- Lab verification is integrated (data becomes clinically derived)
- The platform provides specific treatment recommendations
- Marketing language implies diagnostic capability

### 6.2 Data Protection (GDPR / CCPA)

- **Lawful basis**: Consent (user creates account and adds connections voluntarily).
- **Data minimization**: Only data necessary for exposure computation is stored. PII is encrypted or hashed.
- **Right to access**: Users can view all their data in-app.
- **Right to erasure**: Account deletion removes all user data.
- **Right to portability**: Data export in machine-readable format.
- **Data retention**: Health statuses retained until cleared by user + 1 year. Snapshots retained for TTL duration only. Connections retained for account lifetime.
- **Cross-border transfers**: If applicable, documented via standard contractual clauses.

### 6.3 Health Data Classification

In many jurisdictions, STI status is classified as **sensitive health data** or **special category data** (GDPR Article 9). This requires:
- Explicit consent for processing (obtained at signup)
- Enhanced security measures (encryption at rest and in transit — implemented)
- Data Protection Impact Assessment (DPIA) — recommended before public launch
- Designated Data Protection Officer (DPO) — recommended at scale

### 6.4 Liability Limitations

The Terms of Service must clearly state:
- Navilla provides **informational signals**, not medical diagnoses.
- Users are responsible for the accuracy of their self-reported data.
- Navilla is not liable for decisions made based on exposure data.
- Navilla does not guarantee completeness of exposure information.
- The privacy threshold (3 connections) reduces but does not eliminate all inference risk.

### 6.5 Mandatory Disclosures

Depending on jurisdiction, some STI conditions (notably HIV in certain US states) have mandatory reporting requirements to public health authorities. Navilla must:
- Not interfere with or substitute for mandatory reporting obligations.
- Clearly state that the platform does not report to public health authorities.
- Advise users to comply with local laws regarding disclosure.

---

## 7. Algorithm Details

### 7.1 Current Implementation (MVP)

```
function computeExposure(userHash):
    graph = loadAllConfirmedConnections()       // undirected adjacency map
    degrees = BFS(graph, userHash, maxDepth=5)  // {hash → degree}

    connectionCount = count(degrees where degree == 1)
    secondDegree    = count(degrees where degree == 2)
    thirdDegree     = count(degrees where degree == 3)
    totalGraphNodes = count(degrees where 1 <= degree <= maxDepth)

    if connectionCount < 3:
        return insufficientConnectionsResponse(totalGraphNodes)

    reachableUsers = keys(degrees where 1 <= degree <= maxDepth)
    positiveStatuses = queryPositiveStatuses(reachableUsers)

    exposures = aggregate(positiveStatuses, degrees):
        group by condition
        for each group:
            count = unique users
            closestDegree = min(degree)
            timeframe = "recent" if any reportedAt > (now - 30 days) else "older"
            status = "active" if any clearedAt is null else "resolved"

    return ExposureResponse(counts, totalGraphNodes, maxDepth, exposures)
```

### 7.2 Future Implementation (Temporal)

```
function computeTemporalExposure(userHash):
    graph = loadAllConfirmedConnections()  // includes confirmedAt per edge

    degrees = temporalBFS(graph, userHash, maxDepth=5):
        for each edge A→B at degree d:
            if edge.lastConfirmedAt + TTL < now:
                skip (edge expired)
            for each neighbor C of B:
                edgeBC = graph.edge(B, C)
                if edgeBC.confirmedAt > edge.lastConfirmedAt + TTL:
                    skip (C connected after A-B window closed)
                // C is temporally valid — add to queue

    // rest is identical to MVP algorithm
```

### 7.3 Complexity and Scaling

**Current:** `O(V + E)` where V = total users, E = total confirmed connections. The entire graph is loaded into memory for each computation. This is acceptable for early-stage (< 100K users, < 1M connections).

**At scale (> 100K users):**
- Consider computing BFS in the database using recursive CTEs (PostgreSQL supports this natively — noted in ADR-002).
- Consider per-user graph materialization: store each user's reachable set as a precomputed table, refreshed on a schedule.
- Consider a max-nodes cap on BFS (e.g., stop after 50K nodes regardless of depth) to prevent runaway traversals in dense graphs.

---

## 8. Consequences

### Pros
- Stable request latency via cached snapshots.
- Clear, explainable counts for users.
- Depth is configurable and can be tuned per deployment.
- Network size drives engagement without compromising privacy.
- Temporal edges (post-MVP) will make exposure significantly more accurate.
- User-facing disclosure builds trust and satisfies compliance requirements.

### Cons
- Snapshot TTL means data can be up to 5 days stale.
- No proactive invalidation — new connections don't immediately update exposure.
- BFS loads the entire graph into memory (MVP limitation).
- Temporal edges add complexity to traversal and require UX for connection renewal.
- Self-reported data has inherent accuracy limitations that no algorithm can fix.

---

## 9. Open Questions (Post-MVP)

| Question | Options | Recommendation |
|----------|---------|----------------|
| What defines an "active edge window"? | Fixed TTL vs explicit end date | `last_confirmed_at` + system TTL (simpler, no user action to end) |
| Do both parties need to confirm renewal? | Mutual vs unilateral | Unilateral for MVP (one tap from either side extends the window) |
| Should expired connections be visible? | Hidden vs shown as "dormant" | Shown as dormant — users should see their full history |
| How to handle legacy connections with no `last_confirmed_at`? | Synthetic date vs exclude | Use `confirmed_at` as `last_confirmed_at` for existing connections |
| Should temporal edges affect network size? | Yes vs no | Yes — network size should reflect temporally valid network |
| What is the default edge TTL? | 1 year / 2 years / 5 years | 2 years — balances relevance with not requiring constant renewal |

---

## 10. Tests

- `ExposureControllerTest` asserts `totalGraphNodes` and `maxDepth` are present in the response.
- `ExposureService` unit tests should cover: BFS correctness, degree counting, privacy threshold, aggregation logic, snapshot caching.
- Post-MVP: temporal BFS tests for expired edges, renewal, chain validity.

---

## 11. Related ADRs

- **ADR-002 (Technology Stack)**: PostgreSQL chosen partly for recursive CTE support for graph queries.
- **ADR-005 (Design System)**: Dashboard presentation of network size and exposure data.
- **ADR-006 (Email Confirmation)**: Users must have confirmed email before being part of the connection graph.
