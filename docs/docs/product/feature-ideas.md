---
title: Feature Ideas
---

# Feature Ideas — What Makes Navilla Worth Opening

**Date:** 2026-02-05
**Purpose:** Product brainstorm for features that make users curious, engaged, and genuinely informed. Separated into engagement-driven and health-driven, though the best features are both.

---

## Design Principle

Every feature should pass at least one of these filters:

1. **"I wonder..."** — Makes users curious enough to open the app
2. **"I should..."** — Gives users a reason to act (test, report, connect)
3. **"I didn't know..."** — Teaches users something about their own risk

Features that pass two or three of these filters are the ones worth building first.

---

## 1. Network Statistics That Tell a Story

Network size is confirmed as a must. But a raw number is less interesting than a number with context. Here's how to make network stats genuinely compelling.

### 1.1 Network Size with Growth

**What the user sees:**
```
Your Network
  847 people
  +23 since last week
  ↑ 12% this month
```

**Why it works:** A growing number is inherently satisfying. Users will check back to see if it went up. The growth rate makes it feel alive — "my network is expanding even when I'm not doing anything."

**What to store:** Previous snapshot's `totalGraphNodes` (already computed, just needs to persist the delta).

### 1.2 Degree Breakdown — The Concentric Circles

**What the user sees:**
```
Your Network by Degree

  1st degree     12 people     ████████████
  2nd degree    134 people     ████████████████████████████████
  3rd degree    701 people     ████████████████████████████████████████████████████
```

Or as concentric rings (visual metaphor for "degrees of separation"):
- Inner ring: 1st degree (your direct connections)
- Middle ring: 2nd degree (their connections)
- Outer ring: 3rd degree (and beyond)

**Why it works:** People intuitively understand "degrees of separation." Seeing their own numbers makes it personal. The exponential fan-out ("12 connections means 847 people") is genuinely surprising and makes people realize the scale of indirect contact.

**What to store:** Already available — `connectionCount`, `secondDegreeCount`, `thirdDegreeCount`.

### 1.3 Network Density

**What the user sees:**
```
Network Density: Clustered

Your connections tend to know each other.
43% of your 1st-degree connections are also
connected to each other.
```

**Why it works:** This tells users something they might not have realized about their own social/sexual network. High density means a tighter circle — which could mean faster exposure spread but also easier communication. Low density means a dispersed network.

**What to store:** Count of edges between 1st-degree connections (subgraph density). Computed during BFS — for each pair of 1st-degree nodes, check if an edge exists.

**Categories:**
- **Clustered** (>40% density): "Your connections tend to know each other"
- **Mixed** (15–40%): "Your network has some clusters and some independent connections"
- **Dispersed** (<15%): "Your connections mostly don't know each other"

This is interesting data. Users will talk about it. "Apparently my network is clustered." That's word-of-mouth growth.

### 1.4 Your Reach

**What the user sees:**
```
Your Reach

If you reported a positive status today, 847 people
in your extended network would be anonymously informed.

That's why your reports matter.
```

**Why it works:** Flips the perspective. Most of the app is about "what affects me." This shows "what I affect." It's a subtle nudge toward reporting honestly — users see that their data contributes to protecting a real number of real people.

**What to store:** Already have `totalGraphNodes`. This is just a different framing of the same number.

---

## 2. Connection-Level Features

Connections are currently binary — they exist or they don't. Adding depth to individual connections makes the app more personal and useful.

### 2.1 Private Notes on Connections

**What the user sees:**
```
Ana Martinez (@ana_m)
Connected since: Jan 15, 2025
Your note: "Met at Diego's party. Lives in Condesa."

[Edit note]
```

**Why it works:** Over time, users forget context. "Who was this person again?" is a real problem in a sexual health app where connections may span years. Private notes solve this.

**Privacy rules:**
- Notes are encrypted and stored locally or in the user's profile — never visible to the other person.
- Notes are never included in exposure calculations or any shared data.
- Notes are deleted when the connection is removed.

**What to store:** New field on the connection or a separate `connection_notes` entity. Encrypted with the user's key.

### 2.2 Connection Tags / Categories

**What the user sees:**
```
Filter connections:  [All]  [Recent]  [Long-term]  [Needs renewal]

Tags on each connection:
  Ana Martinez — Recent, Confirmed
  Carlos Ruiz — Long-term, Last active 2023
```

**Why it works:** Users with many connections need organization. Tags help users prioritize who to follow up with, who to renew (when temporal edges ship), and who might be relevant to recent exposure alerts.

**Suggested system tags (auto-applied):**
- **Recent** — connected in the last 90 days
- **Long-term** — connected for more than 1 year
- **Needs renewal** — connection is approaching temporal expiry (post-MVP)
- **Active reporter** — this connection has reported health statuses (without revealing what they reported)

**User-defined tags:** Let users create their own private tags. These are never shared or visible to the other person.

### 2.3 Connection Timeline

**What the user sees:**
```
Ana Martinez
  Jan 15, 2025 — Connected
  Mar 02, 2025 — Ana updated their health status
  Jun 10, 2025 — Connection renewed

  [Your private notes appear here too]
```

**Why it works:** A timeline gives context and history. "Ana updated their health status" is deliberately vague — it tells the user that something happened without revealing what. This creates a gentle prompt to check your own exposure data.

**Privacy rules:**
- Only show "updated health status" — never the condition or result.
- Only show events on the specific connection, not the other person's broader activity.
- The other person sees a symmetric timeline from their own perspective.

---

## 3. Health-Honest Features

These features provide genuine health value. They're the reason the platform exists. But they also happen to be interesting enough to drive engagement.

### 3.1 Testing Freshness — "How Current Is Your Data?"

**What the user sees:**
```
Your Testing Freshness

Last report: 4 months ago
Recommended: Every 3–6 months if sexually active

Your network's freshness:
  32% reported in the last 3 months
  28% reported in the last 6 months
  40% haven't reported in 6+ months
```

**Why it works:** This nudges users to test without being preachy. Showing that 40% of your network hasn't reported recently is a subtle signal: "your data might not be telling the full story." It motivates both the user and their connections to stay current.

**What to store:** Already have `reportedAt` on health statuses. Aggregate freshness is a computation during snapshot generation.

### 3.2 Condition Prevalence — Your Network vs. General Population

**What the user sees:**
```
Chlamydia in your network:  3.2%  (4 of 124 in 1st–3rd degree)
National average (ages 20–34): 1.8%

This doesn't mean your risk is higher — it means more people
in your network are reporting. Higher reporting = better data.
```

**Why it works:** Comparative context makes abstract numbers meaningful. And the framing matters — we're not saying "your network is riskier." We're saying "your network reports more." This reframes high numbers as a positive (transparency) rather than a negative (danger).

**Where to get baseline data:** CDC STI Surveillance Report (published annually, publicly available). Store a simple lookup table of national/regional prevalence rates by condition and age group.

**What to store:** New reference data table for population baselines. Computed comparison during snapshot generation.

### 3.3 Exposure Heatmap by Degree

**What the user sees:**
```
Exposure by Degree

         1st degree    2nd degree    3rd degree
Chlamydia    —          2 cases       1 case
Gonorrhea   1 case        —            —
HSV-2        —          1 case        3 cases
HIV          —            —           1 case
```

**Why it works:** A grid/table view is denser than the current list. It shows patterns: "HSV-2 is mostly at 3rd degree" vs "Gonorrhea is at 1st degree." Degree proximity is the most actionable dimension — 1st degree exposure is genuinely different from 3rd degree.

**What to store:** Already available. The current `ExposureItem` has `closestDegree` and `count`, but doesn't break down count *per degree*. Would need to aggregate differently: instead of "closest degree = 2, count = 3", store "degree 1 = 0, degree 2 = 2, degree 3 = 1."

### 3.4 Personal Risk Context (Not a Score)

**What the user sees:**
```
Your Exposure Context

Based on your network:
• 1 active condition reported by a direct connection (1st degree)
• 2 active conditions reported within 2nd degree
• No recent changes since your last snapshot

What this might mean:
A 1st-degree exposure means someone you are directly connected to
has reported a positive result. Consider getting tested for the
relevant conditions. [Learn more →]
```

**Why it works:** This is NOT a "risk score" (which would be medical advice). It's a contextualized summary that helps users understand what the raw numbers mean for them specifically. The "what this might mean" section provides actionable framing without making medical claims.

**What NOT to do:**
- Don't assign a number or letter grade ("Risk: B+")
- Don't use colors like red/yellow/green (implies medical severity)
- Don't say "you should get tested" (medical advice)
- Do say "consider getting tested" (suggestion)

### 3.5 Testing Reminders Tied to Exposure

**What the user sees:**
```
[Notification]
New exposure detected in your network since your last report.
Consider updating your health status.

[Remind me in 1 week]  [Report now]  [Dismiss]
```

**Why it works:** Instead of generic "it's been 6 months" reminders, tie reminders to actual exposure changes. This is more relevant and less spammy. The user sees a notification only when something in their network actually changed.

**Privacy safeguard:** The reminder says "new exposure detected" — it never says what condition or from what degree. It's a nudge, not a disclosure.

---

## 4. Engagement Features That Serve a Purpose

These are features that exist primarily to bring users back, but they're designed so that engagement also serves the health mission.

### 4.1 Weekly Network Digest

**What the user sees (in-app or email):**
```
Your Weekly Navilla Update — Feb 3, 2026

Network: 847 people (+23)
Connections: 12 (+1 new)
Exposure changes: 1 new, 1 resolved
Testing freshness: You last reported 4 months ago

[View Dashboard →]
```

**Why it works:** A regular digest creates a habit. Users don't have to remember to check — the digest comes to them. The content is always personalized and always has at least one number that changed.

**Implementation:** Aligns with the existing Sunday batch notification infrastructure. Can be the first real use of email notifications.

### 4.2 Milestones

**What the user sees:**
```
🏥 Health Champion
You've reported 5 health statuses.
Your data helps protect 847 people in your network.
```

```
🔗 Network Builder
Your network reached 500 people.
```

```
📋 Regular Tester
You've reported health statuses in 3 consecutive quarters.
```

**Why it works:** Milestones gamify responsible behavior. The milestones aren't about "being popular" — they're about reporting, testing, and keeping data current. This aligns engagement with the health mission.

**What NOT to gamify:**
- Don't reward having more connections (encourages spammy connection requests)
- Don't reward "clean" health statuses (stigmatizes positive reports)
- Don't create leaderboards (privacy violation)

**What to store:** Achievement records per user. Can be computed from existing data (report count, network size, reporting frequency).

### 4.3 "Did You Know?" Cards

**What the user sees (rotating cards on dashboard):**
```
Did you know?
Chlamydia is the most commonly reported STI in the US,
with over 1.6 million cases in 2023. Most cases are
asymptomatic — testing is the only way to know.
[Source: CDC]
```

```
Did you know?
In your network of 847 people, statistically ~15 may have
an undiagnosed STI based on national prevalence rates.
Only 4 have reported on Navilla.
```

**Why it works:** Educational content with a personal twist. The second card type — mixing general statistics with the user's own network size — makes epidemiology personal and drives reporting.

**What to store:** A content table of educational cards. Shown on rotation, dismissed after viewing.

### 4.4 Connection Activity Pulse

**What the user sees:**
```
Network Activity

This week:
  2 connections updated their health status
  1 new connection joined your network
  Your network grew by 23 people

[This is anonymous — you can't see who did what]
```

**Why it works:** The app feels alive. Something is always happening. And every "connection updated their health status" is a signal that the system is working — people are reporting, data is flowing.

**Privacy rules:**
- Numbers only, never identities.
- Minimum threshold: only show activity pulse if the event count is >= 3 (same logic as exposure threshold).
- "2 connections updated" could be narrowed down if user has few connections. Apply the same 3-minimum rule.

---

## 5. Decision Points for Users

Currently, users make few decisions: connect, report, clear. Adding more meaningful choices increases engagement and personalization.

### 5.1 Alert Preferences

**What the user sees:**
```
Alert Settings

Notify me about:
  ☑ New exposures at 1st degree
  ☑ New exposures at 2nd degree
  ☐ New exposures at 3rd degree
  ☑ Exposure status changes (resolved)
  ☑ Network size milestones
  ☐ Weekly digest
```

**Why it works:** Users who can customize their experience feel ownership. Some users want maximum information; others only care about 1st-degree exposure. Giving the choice respects both.

### 5.2 Health Tracking Preferences

**What the user sees:**
```
Conditions I Track

  ☑ Chlamydia
  ☑ Gonorrhea
  ☑ HIV
  ☐ HSV-1
  ☐ HSV-2
  ☑ Syphilis
  ☐ HPV
  ☐ Hepatitis B
  ☐ Hepatitis C
  ☐ Trichomoniasis

Exposure data will only show conditions you track.
```

**Why it works:** Some conditions are more relevant to some users than others. Letting users choose what to track reduces noise and makes the exposure page more focused. It also reduces anxiety — users don't have to see conditions they've been vaccinated against (HPV, Hep B) or conditions not relevant to their situation.

**What to store:** User preference array. Filter exposure display on the frontend (backend still computes everything for correctness).

### 5.3 Connection Approval Preferences

**What the user sees:**
```
Connection Settings

Who can send me connection requests?
  ○ Anyone on Navilla
  ● Only people who know my username
  ○ Nobody (I'll initiate all connections)

Auto-decline requests from:
  ☐ New accounts (created in last 7 days)
```

**Why it works:** Gives users control over their inbox. Reduces spam connection requests as the platform grows. The "only people who know my username" option is a nice middle ground — it means connections are intentional.

---

## 6. Data That Gets Richer Over Time

These features encourage users to add more context to their data, making the platform more valuable the longer they use it.

### 6.1 Testing History Timeline

**What the user sees:**
```
My Testing History

2026
  Feb — Chlamydia: Negative ✓
  Feb — Gonorrhea: Negative ✓

2025
  Oct — Chlamydia: Positive → Cleared (Dec 2025)
  Aug — Full panel: All negative ✓
  Mar — HIV: Negative ✓

[Add past result]
```

**Why it works:** A personal health timeline is genuinely useful. Users can see their own testing patterns, notice gaps, and have a record they can reference when talking to healthcare providers. The "add past result" option lets users backfill history, enriching the data set.

**What to store:** Already storing health statuses with `testDate` and `reportedAt`. This is mostly a frontend presentation improvement, plus allowing multiple historical records per condition (currently one per condition via unique constraint — would need to be relaxed).

### 6.2 Connection Context (Private Metadata)

**What the user sees when adding a connection:**
```
Add Connection

Username or email: ana_martinez
When did you meet? [Approximate date picker — month/year only]
Optional note: _______________

[Send Request]
```

**Why it works:** Capturing when a connection was formed (even approximately) is foundational for temporal edges. But it's also useful for users — "when did I connect with this person?" is a common question. The approximate date picker (month/year) balances usefulness with privacy.

**What to store:** `connection_context_date` (month/year) and `connection_note` (encrypted). Both private to the user who entered them.

### 6.3 Exposure Journal

**What the user sees:**
```
Exposure Journal

Feb 5, 2026 — Snapshot updated
  Chlamydia: 2 cases at 2nd degree (was: 1 case)
  Gonorrhea: 1 case resolved

Jan 31, 2026 — Snapshot updated
  No changes from previous snapshot

Jan 26, 2026 — Snapshot updated
  New: Chlamydia at 2nd degree, 1 case
```

**Why it works:** A historical log of how your exposure landscape has changed over time. Users can see trends: "Chlamydia in my network is increasing." This transforms exposure from a static snapshot into a narrative — and narratives are more engaging than numbers.

**What to store:** Store summary of each snapshot alongside the current snapshot. Or compute diffs between consecutive snapshots. A lightweight approach: store just the exposure item counts per condition per snapshot, and diff them on the frontend.

---

## 7. Social Features That Respect Privacy

### 7.1 Anonymous Network Health Score

**What the user sees:**
```
Network Health Pulse

Your network's reporting rate: High
  68% of your 1st-degree connections have reported
  a health status in the last 6 months.

Networks with higher reporting rates produce
more accurate exposure data.
```

**Why it works:** This doesn't reveal who reported — just the percentage. It creates social pressure to report (in a good way). If your network's rate is low, you know your exposure data might be incomplete.

### 7.2 Anonymous Network Comparison

**What the user sees:**
```
How Your Network Compares

                    You      Average Navilla User
Network size:       847      312
Reporting rate:     68%      41%
Connections:        12       7
```

**Why it works:** Comparison is one of the strongest engagement drivers. Users want to know "am I normal?" This provides that without any individual disclosure. It also motivates growth — "I have more connections than average" or "I should report more."

**What to store:** Aggregate stats across all users (computed periodically). No individual data exposed.

### 7.3 Invite with Context

**What the user sees:**
```
Invite someone to Navilla

Share this link: navilla.app/join/abc123

When they sign up, you'll both be prompted to confirm
the connection. No information about you is revealed
until you both confirm.

"I use Navilla to stay informed about my sexual health
network. Join me — it's private and anonymous."
[Copy invite message]
```

**Why it works:** The invite system is the core growth loop. The pre-written message normalizes the conversation. The link pre-stages the connection so onboarding is smoother.

---

## 8. Feature Priority Matrix

| Feature | Engagement | Health Value | Effort | Priority |
|---------|-----------|-------------|--------|----------|
| Network size + growth | High | Low | Small | **MVP** |
| Degree breakdown | High | Medium | Small | **MVP** |
| Private notes on connections | Medium | Medium | Small | **Post-launch week 1** |
| Exposure heatmap by degree | Medium | High | Small | **Post-launch week 1** |
| Testing freshness | Medium | High | Small | **Post-launch week 1** |
| Weekly digest | High | Medium | Medium | **Post-launch week 2** |
| Connection tags | Medium | Low | Small | **Post-launch week 2** |
| Alert preferences | Medium | Medium | Small | **Post-launch week 2** |
| Condition tracking preferences | Low | Medium | Small | **Post-launch month 1** |
| Milestones | High | Medium | Medium | **Post-launch month 1** |
| Network density | High | Low | Medium | **Post-launch month 1** |
| Did You Know cards | Medium | High | Small | **Post-launch month 1** |
| Exposure journal | Medium | High | Medium | **Post-launch month 1** |
| Prevalence comparison | High | High | Medium | **Post-launch month 2** |
| Network comparison | High | Low | Medium | **Post-launch month 2** |
| Connection activity pulse | High | Low | Medium | **Post-launch month 2** |
| Testing history timeline | Medium | High | Medium | **Post-launch month 2** |
| Connection context date | Medium | High | Small | **Post-launch month 2** |
| Invite system | Critical | Medium | Medium | **Post-launch month 1** |
| Personal risk context | Medium | High | Medium | **Post-launch month 2** |
| Connection approval prefs | Low | Low | Small | **Post-launch month 3** |
| Network health pulse | Medium | Medium | Medium | **Post-launch month 3** |

---

## 9. What NOT to Build

Some features seem tempting but would hurt the platform:

1. **Chat or messaging between connections.** This is not a dating app. Adding messaging changes the product category and creates moderation/liability nightmares.

2. **Leaderboards or public rankings.** Any public comparison of users violates the privacy model and creates perverse incentives.

3. **AI-generated health advice.** "Based on your exposure, you might have..." is a medical claim. Stay away from diagnosis. Stick to "consider testing."

4. **Identity verification.** Requiring ID to sign up would kill adoption for a sensitive health product. Trust the encryption model instead.

5. **Social sharing of health statuses.** "Share your clean bill of health!" stigmatizes positive results and incentivizes dishonest reporting.

6. **Read receipts on notifications.** Users should not know if their connection read an exposure alert. This enables inference.

7. **"Who viewed my profile" style features.** Tracking views creates surveillance dynamics that undermine the trust model.

8. **Integration with dating apps.** Even if technically possible, the association would position Navilla as a dating feature rather than a health tool. Keep the brand separate.
