# Phase 3 Redesign — Connections, Verified Badges, Network Constellation

> **Date:** 2026-03-04
> **Status:** Approved
> **Scope:** Redesign of Layer 2 (Connection Network) with new connection paths, verified test badges, network constellation visualization, cold start strategy, and reciprocity model

---

## Context & Motivation

The original Phase 3 roadmap assumed connections form via share links and email/username — mechanisms that work for tech-savvy, open users but miss the mainstream reality of casual sexual encounters. Most people exchange phone numbers, not emails. Many encounters are anonymous.

Additionally, the product needs stronger engagement hooks beyond health alerts. Curiosity ("how big is my network?"), ego ("I'm a Galaxy"), and trust signaling ("here's my verified panel") are powerful motivators that drive both retention and organic growth.

This redesign reimagines Phase 3 around how sex actually happens in the real world, and introduces two shareable assets (verification cards + network constellation cards) as organic growth engines.

---

## 1. Connection System

### Core Principle

**Connection = Encounter. Always.** Every edge in the Navilla network represents a sexual encounter. No social follows, no friend connections. If two people are connected on Navilla, it means they had a sexual encounter.

### Connection Paths

#### Path 1: Phone Auto-Match (Mainstream)

The primary path for regular people. Both parties independently log an encounter with each other's phone number.

- User logs a journal encounter and optionally includes a phone number
- Phone is hashed (SHA-256 + pepper, same pattern as email hashing)
- System checks: does anyone with that phone hash have an encounter logged with THIS user's phone hash within a configurable date window (default ±2 days)?
- If mutual match found → connection forms automatically
- No confirmation step — mutual logging IS consent
- Rate limit on journal entries containing phone numbers

**Why ±2 days:** Alcohol, late nights, "was it Saturday or Sunday?" — real-world memory is fuzzy. The window is configurable.

#### Path 2: Phone Notification Match (Opt-In)

For people who want to be findable but don't always log encounters themselves.

- User A logs an encounter with User B's phone number
- User B has opted into "receive match notifications" (off by default)
- User B receives a notification: "Someone in [City/State], phone 614235*****, ~[date]"
- User B confirms with "Yes, I remember" → connection forms

**Anti-abuse protections:**

| Protection | Details |
|-----------|---------|
| Rate limit per sender | Max 3-5 outbound phone-match attempts per week (configurable) |
| Block phone | Recipient can block a phone hash permanently |
| Block + report | Same as block, flags sender for review. Repeat offenders get phone-match disabled |
| Cooldown on denials | 3+ denials across different recipients → throttle or suspend sender's phone-match |
| Zero feedback to sender | Sender NEVER learns if recipient is on Navilla, received notification, or denied. Either a connection forms or nothing happens |

#### Path 3: Explicit Request

For sex workers, adult industry, regular partners already on Navilla.

- Connection request via share link (one-time URL), email, or @username
- One person sends, other accepts or denies
- Standard request/accept/deny flow (extends existing system)

#### Path 4: Journal-Only

For anonymous encounters where nothing identifiable was exchanged.

- Log encounter for personal tracking only
- No connection formed
- Still contributes to personal stats and estimated network calculation

### Database Changes (Connections)

- Extend `connections` table with `connection_type` enum: `PHONE_MATCH`, `NOTIFICATION_MATCH`, `EXPLICIT`, `LINK`
- New table `connection_phone_entries`: stores phone hash + encounter date + user hash for matching
- Journal `encounter_journal` gets optional `phone_hash` column
- New user preference: `receive_match_notifications` (boolean, default false)
- Phone matching engine: background scheduled job (like reminder scheduler)
- New tables for block/report: `phone_blocks`, `phone_reports`

---

## 2. Verified Test Badges

### Verification Levels

| Level | How | Badge | Trust |
|-------|-----|-------|-------|
| Self-reported | User logs results manually | No badge | Low |
| Document-verified | User uploads lab PDF/photo, stored encrypted | "Document on file" badge | Medium |
| Lab-verified | Direct from lab API (Chopo, Salud Digna, etc.) | Gold verified badge | High (future — requires partnerships) |

### Verification Card Builder

Users have full control over what appears on their verification card:

| Setting | Options |
|---------|---------|
| Data shown | Toggle each: conditions tested, results, test date, lab name, display name |
| Privacy mode | Public or Private |
| View limit | Unlimited, or 1/2/3/5 views (configurable options in DB) |
| Expiration | 24h, 72h, 7 days, 30 days, 90 days (configurable options in DB) |
| Name | Anonymous (default), display name, or custom text (e.g., stage name) |

**Public cards:** Unlimited views, long expiry, no watermark. For social media, dating profiles, industry use.

**Private cards:** Limited views (link dies after limit), short expiry, viewer IP/timestamp watermark to deter forwarding.

### Sharing Methods

- **Shareable link:** `navilla.app/verify/{token}` — public page, no account needed to view. Shows selected data + verification badge level + Navilla branding
- **In-app screen + QR:** Displays verified panel with a live QR code. QR contains a short-lived token (configurable, default 5 min). Other person scans → opens verification page in browser. Proves data is real-time, not a screenshot

### Saved Card Preferences

- User saves default card configuration once (data toggles, privacy mode, defaults)
- Generating a new card after new test results = one tap using saved preferences
- Can override any setting per individual card

### Database Changes (Verification Cards)

- New table `verification_cards`: user_hash, token, settings JSON, privacy_mode, view_limit, views_used, expires_at, created_at
- New table `verification_card_views`: card_id, viewer_ip_hash, viewer_timestamp
- Existing `test_visits.verified` and `verified_at` remain as source of truth for badge level

---

## 3. Network Constellation Visualization

### Pluggable Architecture

The visualization is a swappable component behind a standard contract:

```
NetworkVisualization interface:
  Input:  {
    directCount: number,
    degree2Count: number,
    degree3Count: number,
    totalNodes: number,
    stageName: string,
    constellationName: string
  }
  Output: {
    renderToCanvas(): void,
    renderToShareableImage(): Promise<Blob>,
    getStageLabel(): string
  }
```

Any visualization skin (Constellation, Bioluminescent, Ripple, Fingerprint) implements this contract. The data layer, API, shareable card generator, and all other code are skin-agnostic. Swapping the visual requires changing one component, nothing else.

### Constellation Theme (Default Skin)

**Background:**
- Deep space — near-black with subtle indigo-to-navy gradient
- Faint stardust/nebula texture that fills in as network grows

**Stars (nodes):**
- Center node (you): brightest star, warm white core with indigo glow halo, subtle pulse
- 1st degree connections: bright, vivid stars close to center, connected by thin constellation lines
- 2nd degree: medium brightness, further out, fainter connecting threads
- 3rd degree: distant, faint points — the deep background of your sky

**Quality details:**
- Soft lens-flare on brightest nodes
- Anti-aliased glow, proper light diffusion
- Subtle twinkle animation (alive, not distracting)
- Optional gyroscope parallax on mobile (tilt phone → stars shift)
- Star positions unique per user — generated from network metrics, no two look alike

**Technology:** Canvas/WebGL (tsParticles or Three.js). Static PNG export for shareable cards. Must run smooth on mobile.

### Network Stages

All thresholds stored in DB (`network_stages` table), fully configurable:

| Stage | Default Total Nodes | Visual Progression |
|-------|--------------------|--------------------|
| Empty Sky | 0 | Single star, dark empty space |
| Spark | 1–50 | Small cluster forming, few faint stars |
| Cluster | 50–500 | Clear pattern, nebula hint appearing |
| Constellation | 500–2,000 | Rich star field, visible structure |
| Galaxy | 2,000–10,000 | Dense, layered, nebula glowing bright |
| Supercluster | 10,000+ | Overwhelming, brilliant, celestial |

Stage badge name is displayed on the visualization itself — part of the user's identity.

### Constellation Name

- Algorithm generates a unique name from the user's network hash
- Latin/celestial naming convention: "Nexus Auris", "Rete Magna", "Stellae Centum"
- Changes when network evolves significantly (not on every small change)
- Displayed on visualization and shareable card

### Shareable Network Card

- Dark background card with constellation rendered
- Constellation name in Fraunces (brand display font)
- Stats in clean white: "127 nodes · 3 degrees · Top 15%"
- Stage badge
- Navilla branding
- No identifying information — completely anonymous

### No Gamification (Non-Negotiable)

- Badges are observational and humorous, not aspirational
- No "unlock next level" language, no achievements, no progress bars, no "X more to reach..."
- Navilla is a mirror, not a coach — it shows your data beautifully and lets you draw conclusions
- If people treat stages as a personal challenge, that's their prerogative — the app never suggests it

---

## 4. Cold Start Strategy

### Problem

When the app launches, no one has connections. The network constellation shows empty sky. The most exciting features feel dead.

### Solutions

**Estimated network (primary cold start mechanism):**
- Based on user's encounter count + CDC/WHO epidemiological data on average sexual network size
- Display: "Based on your 8 logged encounters, you're statistically connected to approximately 60–180 people"
- Rendered as a ghost/outline constellation — "what your sky could look like"
- Real science, not fake data. Sources cited
- As real connections form, the estimate is gradually replaced by actual confirmed data

**Stage awareness:**
- User sees their current stage badge and knows other stages exist
- Natural curiosity — no push, just information

**First connection moment:**
- When the first real connection forms, the constellation transitions from ghost/estimated to real
- A nice visual moment — the sky lights up. Not a reward ceremony, not confetti, just the visualization coming alive

**Layer 1 solo value (already built):**
- Journal, health log, reminders, verified badges, personal insights — all work without any connections
- This is the "single player mode" that keeps users engaged while the network builds

---

## 5. Reciprocity & Exposure Opt-In

### Principle

"You contribute, you see. You stop contributing, you stop seeing."

### Design

| Aspect | Details |
|--------|---------|
| Opt-in | Clear confirmation screen explaining what you share (your test results enter the aggregate pool) and what you get (see exposure data across your network). Not scary, not permanent |
| What you give | Your test results are included in aggregate exposure calculations for your connections |
| What you get | See exposure data: conditions detected in network, degree of separation, recency |
| Opt-out | Allowed anytime — your data leaves the pool AND you lose access to exposure data |
| Anti-gaming | 15-day cooldown on re-opt-in after opting out. Prevents toggle-to-deduce attacks (configurable) |
| Minimum threshold | Requires 3+ confirmed connections before showing exposure data (configurable) |

### Changes from Original Design

The original ACEPTO model required permanent, irreversible opt-in. This was replaced because:
- Permanent commitment scares users away — bad for adoption
- The toggle-attack (opt in/out to deduce who reported) is mitigated by the 15-day cooldown + cached snapshots
- The reciprocity principle is preserved: you must contribute to see data

---

## 6. Configurability Architecture

**Nothing hardcoded.** All conditions, thresholds, time periods, and options are configurable.

### Database-Driven (Runtime Configurable, No Redeploy)

| Table | Purpose | Examples |
|-------|---------|---------|
| `condition_catalog` | STI/condition definitions | Name, display order, active/inactive, icon, description |
| `network_stages` | Constellation stage thresholds | Stage name, min nodes, max nodes, description |
| `app_config` | Key-value runtime settings | Rate limits, card expiry options, view limit options, phone match window days |

**Note:** The current `ConditionType` Java enum is replaced by `condition_catalog` DB table. All code that references conditions uses catalog lookups instead of enum values.

### Application Config (Env-Overridable, Needs Redeploy)

| Setting | Location | Examples |
|---------|----------|---------|
| BFS max depth | `application.yml` | Default: 3 |
| Minimum connections threshold | `application.yml` | Default: 3 |
| Cache TTLs | `application.yml` | Exposure snapshot: 7 days, health log summary: 5 min |
| QR token lifetime | `application.yml` | Default: 5 min |
| Reciprocity cooldown | `application.yml` | Default: 15 days |

---

## 7. Growth Engine — Shareable Assets

Two user-generated shareable assets drive organic awareness:

| Asset | Signal | Audience | Where Shared |
|-------|--------|----------|-------------|
| Verification Card | "I'm clean, here's proof" | Trust | Social media bios, dating profiles, in-person (QR) |
| Network Constellation Card | "Look at my network" | Curiosity/ego | Social media posts, messaging |

Every share is a free ad for Navilla. A non-user who sees either card encounters the Navilla brand and a reason to sign up.

---

## Migration Plan

Next migration number: **014**

New tables needed:
- `condition_catalog` — replaces hardcoded ConditionType enum
- `network_stages` — stage definitions and thresholds
- `app_config` — runtime key-value configuration
- `connection_phone_entries` — phone hash + encounter date for matching
- `phone_blocks` — blocked phone hashes per user
- `phone_reports` — abuse reports
- `verification_cards` — generated card settings, tokens, limits
- `verification_card_views` — view tracking for private cards

Altered tables:
- `connections` — add `connection_type` column
- `encounter_journal` — add `phone_hash` column
- `users` — add `receive_match_notifications`, `exposure_opted_in`, `exposure_opted_in_at`, `exposure_opted_out_at` columns

---

## Open Questions (For Future Sessions)

1. **Constellation naming algorithm** — exact algorithm for generating Latin/celestial names from network hash. Design during implementation
2. **Lab-verified integration** — Chopo/Salud Digna API availability. Research when approaching that milestone
3. **Estimated network formula** — exact CDC/WHO data sources and calculation model. Research during implementation
4. **Document upload infrastructure** — encrypted file storage for lab PDFs. Was deferred from Week 6, needed for document-verified badges
5. **Phone number format normalization** — international formats, country codes, stripping before hashing. Design during implementation
