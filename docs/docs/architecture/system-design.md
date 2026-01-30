---
sidebar_position: 2
title: System Design
---

# System Design

Detailed system design for Navilla's core functionality.

## Core Subsystems

```mermaid
flowchart TB
    subgraph UserManagement[User Management]
        Auth[Authentication]
        Profile[Profile Service]
    end

    subgraph ConnectionGraph[Connection Graph]
        Conn[Connection Service]
        Graph[Graph Engine]
    end

    subgraph HealthTracking[Health Tracking]
        Health[Health Status Service]
        Exposure[Exposure Calculator]
    end

    subgraph Notifications[Notifications]
        Queue[Notification Queue]
        Batch[Batch Processor]
    end

    Auth --> Profile
    Profile --> Conn
    Conn --> Graph
    Graph --> Exposure
    Health --> Exposure
    Exposure --> Queue
    Queue --> Batch
```

## Connection System

### Connection States

```mermaid
stateDiagram-v2
    [*] --> Pending: User A requests
    Pending --> Confirmed: User B accepts
    Pending --> Denied: User B denies
    Pending --> Expired: 30 days timeout
    Confirmed --> [*]
    Denied --> [*]
    Expired --> [*]
```

### Connection Request Flow

1. User A submits connection request with User B's email
2. System hashes email to check if User B exists
3. If exists: In-app notification sent to User B
4. If not exists: Invitation email sent (no details about who/why)
5. User B can confirm, deny, or ignore
6. User A never learns outcome details (only "not confirmed")

## Exposure Calculation

### Graph Traversal Algorithm

```mermaid
flowchart TD
    Start[Start: User X] --> Init[Initialize visited set, queue]
    Init --> Loop{Queue empty?}
    Loop -->|No| Pop[Pop user, degree from queue]
    Pop --> Visited{Already visited?}
    Visited -->|Yes| Loop
    Visited -->|No| Mark[Mark as visited]
    Mark --> Degree{Degree > 0?}
    Degree -->|Yes| Check[Check health status]
    Check --> HasPositive{Has positive STI?}
    HasPositive -->|Yes| Add[Add to exposures]
    HasPositive -->|No| Next
    Add --> Next
    Degree -->|No| Next[Get connections]
    Next --> MaxDegree{Degree < max?}
    MaxDegree -->|Yes| Enqueue[Add connections to queue]
    MaxDegree -->|No| Loop
    Enqueue --> Loop
    Loop -->|Yes| Aggregate[Aggregate & anonymize]
    Aggregate --> Return[Return exposure snapshot]
```

### Exposure Aggregation

Raw exposure data is aggregated to prevent identification:

```
Input:
  - Degree 1: Chlamydia (reported 2026-01-15)
  - Degree 2: Chlamydia (reported 2026-01-10)
  - Degree 2: HIV (reported 2025-12-01)

Output (user sees):
  - Chlamydia: 2 potential exposures (closest: 1st degree, recent)
  - HIV: 1 potential exposure (2nd degree, older)
```

## Notification System

### Batching Strategy

```mermaid
gantt
    title Weekly Notification Batch
    dateFormat  YYYY-MM-DD
    section Collection
    Collect reports    :a1, 2026-01-20, 7d
    section Processing
    Calculate exposures :a2, after a1, 1d
    section Delivery
    Send notifications  :a3, after a2, 1d
```

- **Daily**: Connection requests, confirmations (immediate)
- **Weekly**: Exposure alerts (Sunday evening batch)
- **Randomized**: Notifications within batch window have random delay (±6 hours)

### Why Batching?

1. **Privacy**: Makes timing attacks harder
2. **Performance**: Batch graph calculations are more efficient
3. **User experience**: Weekly digest vs constant alerts

## Encryption Strategy

### Data at Rest

| Data | Encryption | Key Management |
|------|------------|----------------|
| Email (for lookup) | SHA-256 + salt | Static application salt |
| Email (for recovery) | AES-256-GCM | Per-user derived key |
| Health records | AES-256-GCM | Per-user derived key |
| Connection graph | Hashed IDs only | N/A |

### Key Derivation

```
User Master Key = HKDF(
    input_key_material = user_password_hash,
    salt = user_id,
    info = "navilla-user-encryption"
)
```

Note: Since we use Supabase Auth, we don't have direct access to passwords. Alternative approaches:
1. Derive from Supabase user ID + application secret
2. Generate random key stored encrypted by Supabase
3. Use Supabase Vault (if available)
