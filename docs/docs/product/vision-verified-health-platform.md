---
title: "Vision: Verified Health Platform"
---

# Vision: From Self-Reported Network to Verified Health Platform

**Date:** 2026-02-05
**Purpose:** Long-term product vision for Navilla's evolution from a self-reported exposure tool to a verified health credentialing platform. This document maps the journey, the markets, the partnerships, and the hard problems.

---

## The Evolution — Three Phases

### Phase 1: Trust Through Transparency (Now — MVP)
- Self-reported health statuses
- Anonymous exposure calculations
- Network statistics and engagement
- **Value proposition:** "Know your network's exposure risk, anonymously"
- **User trust:** "I trust the system's privacy model"

### Phase 2: Trust Through Verification (6–12 months post-launch)
- Optional verified lab results alongside self-reported data
- Verified results carry more weight in exposure calculations
- Visual distinction between verified and unverified data
- **Value proposition:** "Know your network's exposure risk with real data"
- **User trust:** "I trust the data because it's lab-verified"

### Phase 3: Trust Through Proof (12–24 months post-launch)
- Verified results become the standard
- Health credentials that users can share selectively
- Lab and clinic partnerships
- Professional-grade features for regulated industries
- **Value proposition:** "Prove your health status to the people who matter"
- **User trust:** "I trust this person because Navilla verified their results"

---

## Phase 2: Verified Results (The Bridge)

### How Verification Works

**Option A: Lab Report Upload**
User uploads a PDF or photo of their lab results. Navilla extracts or manually reviews the data and marks the status as "verified."

```
My Health Status

Chlamydia    Negative ✓ Verified    Lab: Quest Diagnostics    Feb 1, 2026
Gonorrhea    Negative ✓ Verified    Lab: Quest Diagnostics    Feb 1, 2026
HIV          Negative ✓ Verified    Lab: Quest Diagnostics    Feb 1, 2026
Syphilis     Positive   Self-reported                         Jan 15, 2026
```

**Pros:** Low technical barrier. Works with any lab. User-initiated.
**Cons:** Manual review doesn't scale. Photos can be forged. Slow turnaround.

**Option B: Direct Lab API Integration**
Navilla connects to lab result APIs (Health Gorilla, Particle Health, or direct lab partnerships) and pulls results automatically with user consent.

```
Connect your lab results

We partner with these labs:
  ☐ Quest Diagnostics
  ☐ LabCorp
  ☐ Planned Parenthood
  ☐ Any lab via Health Gorilla

[Connect Lab Account →]

Your results will be imported automatically.
You control what is shared.
```

**Pros:** Automated, tamper-proof, scalable. Real-time verification.
**Cons:** Requires API partnerships. HIPAA compliance mandatory. Complex integration.

**Option C: Clinic-Verified QR Code**
Partner clinics issue a QR code after testing. User scans the QR code in Navilla, which verifies the result with the clinic's system.

```
Verify via clinic

[Scan QR code from your clinic receipt]

Or enter verification code: _______________
```

**Pros:** Works in-person. No API needed initially (shared secret model). Clinic partnership is a marketing channel.
**Cons:** Requires clinic buy-in. Limited to partner clinics. QR code can be shared (though tied to user account).

**Recommendation:** Start with Option A (upload) for immediate availability, pursue Option B (lab API) as the primary long-term path, and explore Option C (clinic QR) as a parallel partnership channel.

### How Verification Changes Exposure — The Verified Data Layer

A badge is not enough. Nobody goes to a lab, waits for results, and uploads them for a checkmark. The real incentive is **access to a richer data layer that only verified users can see.**

#### The Core Principle: You Get What You Give

If you contribute verified data, you earn the right to see verified data from others. If you only self-report, you see the same health-relevant information (nothing is hidden that could affect your safety), but you don't see the confidence breakdown.

#### What Each Tier Sees

**Unverified user sees:**
```
Exposure Overview

Chlamydia — 2nd degree — 3 cases — recent, active
Gonorrhea — 1st degree — 1 case — recent, active

Your data is based on self-reported results.
Verify your results to see confidence details. [Learn more →]
```

**Verified user sees:**
```
Exposure Overview

Chlamydia — 2nd degree — 3 cases — recent, active
  ✓ 2 lab-verified    ◯ 1 self-reported
  Confidence: High (67% verified)

Gonorrhea — 1st degree — 1 case — recent, active
  ◯ 1 self-reported
  Confidence: Low (0% verified)

Network verification rate: 43% of reports in your
network are lab-verified.
```

The unverified user sees "3 cases." The verified user sees "3 cases — 2 verified, 1 self-reported." Same health signal, but the verified user knows *how much to trust the number.* That difference is worth getting tested for.

#### What Else the Verified Data Layer Unlocks

| Feature | Unverified | Verified |
|---------|-----------|----------|
| Exposure count and degree | Yes | Yes |
| Timeframe and status (active/resolved) | Yes | Yes |
| Verified vs self-reported breakdown | No | **Yes** |
| Per-exposure confidence indicator | No | **Yes** |
| Network verification rate ("43% of your network is verified") | No | **Yes** |
| Testing freshness of connections ("68% tested in last 6 months") | No | **Yes** |
| Exposure heatmap with verification overlay | No | **Yes** |
| Prevalence comparison (your network vs national average) | No | **Yes** |
| Health Card generation and sharing | No | **Yes** |
| Exposure journal with verification markers | No | **Yes** |
| "Network confidence score" on dashboard | No | **Yes** |

**Critical rule:** No health-relevant information is withheld from unverified users. They see the same exposure counts, degrees, and timeframes. What's gated is the *confidence metadata* — the layer that tells you how trustworthy those numbers are. This is an important ethical line: we never hide risk from someone because they didn't verify. We give verified users *more context*, not more safety.

#### Why This Works as an Incentive

1. **Curiosity gap.** Unverified users see "3 cases" and wonder: "But are those real? How many are verified?" That question alone drives verification.
2. **Skin in the game.** If you've verified, you know your data is contributing real signal. Seeing that others have too makes the whole system feel more credible.
3. **Social proof loop.** The network verification rate ("43% verified") creates collective motivation. Users want that number to go up because it makes *their* data more useful.
4. **The confidence indicator is genuinely valuable.** "Chlamydia: 3 cases, 67% verified" means something very different from "Chlamydia: 3 cases, 0% verified." The first is actionable. The second might be noise. Only verified users get to make that distinction.

#### The Verification Flywheel

```
User verifies their results
  → Sees richer data about their network
    → Realizes some connections are unverified
      → Encourages connections to verify ("you should see what I can see")
        → Network verification rate goes up
          → Data becomes more trustworthy for everyone
            → More users want to verify
```

This is a self-reinforcing loop. The product gets better as more people verify, and the *visible* improvement (rising verification rate) motivates further verification.

#### What About Gaming?

Could someone upload a fake lab result to unlock the verified layer without actually getting tested?

Yes, initially (with manual upload). Mitigations:
- **Phase 2:** Manual review catches obvious fakes. Accept the risk that some slip through — imperfect verification is better than no verification.
- **Phase 3:** Lab API integration makes faking impossible. Results come directly from the lab, not from the user.
- **Design principle:** Don't let perfect verification block good-enough verification. Start with upload, move to API, and the gaming problem shrinks as the system matures.

### Verified Negative — The Real Product

Here's the insight that changes everything: **the most valuable verified result is a verified negative.**

A verified positive is important for exposure accuracy. But a **verified negative** is what users actually want to show others. "I was tested on Feb 1, 2026. All clear. Here's the proof."

This is the bridge to Phase 3 — the health credential.

---

## Phase 3: Health Credentials and Proof

### The Health Card

**What the user sees:**

```
My Navilla Health Card

Miguel Ramos
Last full panel: Feb 1, 2026 (34 days ago)
Status: All clear ✓ Verified

Conditions tested:
  ✓ Chlamydia    Negative    Feb 1, 2026
  ✓ Gonorrhea    Negative    Feb 1, 2026
  ✓ HIV          Negative    Feb 1, 2026
  ✓ Syphilis     Negative    Feb 1, 2026
  ✓ HSV-1        Negative    Feb 1, 2026
  ✓ HSV-2        Negative    Feb 1, 2026
  ✓ Hepatitis B  Negative    Feb 1, 2026
  ✓ Hepatitis C  Negative    Feb 1, 2026

[Share card]  [Generate QR]  [Download PDF]
```

**How sharing works:**

The user generates a one-time or time-limited share link or QR code. The recipient (who may or may not be a Navilla user) can view the card in a browser. The card shows:
- What was tested and results
- When it was tested
- That it was lab-verified through Navilla
- A verification code the recipient can check

**What the recipient sees:**

```
navilla.app/verify/abc123

Navilla Verified Health Card

This card was shared by a Navilla user.
Verified on: Feb 1, 2026

All tested conditions: Negative ✓

This card expires: Mar 7, 2026
Verification code: NVL-2026-ABC123

[Verify this card]
```

**Privacy controls:**
- User chooses which conditions to include on the card
- User sets expiration (24 hours, 7 days, 30 days, or custom)
- User can revoke a shared card at any time
- Share history is logged (user can see who they shared with and when)
- No Navilla account required to view a shared card

### Selective Disclosure

Not everyone wants to share everything. The card should support selective disclosure:

```
Share Settings

What to include:
  ☑ Full panel results (all conditions)
  ☐ Specific conditions only
  ☑ Test date
  ☑ Lab name
  ☐ My display name (share anonymously)
  ☑ Verification code

Card expires after:
  ○ 24 hours
  ● 7 days
  ○ 30 days
  ○ Custom
```

This lets users share proof of a negative HIV test without revealing their HSV status, for example. Selective disclosure is critical for adoption — people won't use it if it's all-or-nothing.

---

## Market Segments

### Segment 1: Sex Workers

**Why they need this:**
- Regular testing is already standard practice in this community
- Clients increasingly ask for proof of testing
- Current proof: showing lab printouts, photos of results, or nothing
- Navilla replaces paper with a verifiable digital credential

**What they'd use:**
- Health Card (share with clients)
- Verified results (credibility)
- Testing history timeline (show consistency)
- Testing freshness reminders

**Specific needs:**
- Anonymity is paramount — display names, not real names
- Card sharing without revealing Navilla username or network
- Frequent testing cadence (monthly or bi-weekly)
- Quick share via QR code (in-person scenarios)

**Growth potential:** Sex workers are early adopters for health tools and influential within their communities. If the tool is genuinely useful for them, word-of-mouth will be strong.

### Segment 2: Adult Entertainment Industry

**Why they need this:**
- OSHA and Cal/OSHA require STI testing (every 14 days in California for performers)
- Industry currently uses PASS (Performer Availability Screening Services) — centralized, expensive, limited
- Studios and producers need to verify performer health status before shoots
- Performers need to prove their status quickly and frequently

**What they'd use:**
- Health Card with industry-specific panel (the "performer panel")
- Automatic verification via lab API (no manual uploads for frequent testers)
- Studio/producer dashboard (see performer cards without seeing network)
- Compliance calendar (next test due date)

**Specific needs:**
- 14-day testing cycle compliance tracking
- Panel-specific verification (the industry has a standard panel)
- Producer/studio accounts (B2B — different role than individual users)
- Expiration enforcement — cards expire after 14 days automatically
- Integration with booking/scheduling systems (future)

**Growth potential:** Large — this is a genuine pain point. PASS is the only real competitor and it's centralized and costly. A privacy-preserving alternative could capture significant market share.

**Regulatory note:** This enters OSHA compliance territory. The platform would need to meet workplace health and safety documentation standards.

### Segment 3: Open/Poly/ENM Relationships

**Why they need this:**
- Multiple partners means more complex exposure networks
- Communication about testing is already normalized in these communities
- But there's no standardized way to share verified results with a polycule
- Trust between partners is built on transparency about health

**What they'd use:**
- Network statistics (genuinely useful — their networks are larger and more interconnected)
- Network density (highly relevant — polycules are naturally clustered)
- Health Card sharing within relationship groups
- Connection notes and tags (organizing a complex relationship network)
- Exposure heatmap (actionable when you have many 1st-degree connections)

**Specific needs:**
- Group verification — share a card with multiple people at once
- Relationship groups — define a "polycule" or "relationship group" where all members can see each other's verified status (with consent)
- Fluid network boundaries — people join and leave groups
- No judgment in the UX — language should be neutral and inclusive

**Growth potential:** High engagement, moderate scale. These communities are tight-knit and adopt tools that serve them. Strong word-of-mouth.

### Segment 4: General Public (Health-Conscious)

**Why they need this:**
- Growing awareness of STI prevalence
- Destigmatization of testing (especially among younger demographics)
- Curiosity about network effects and exposure risk
- New relationships — the "before we start dating, can you show me your results?" conversation

**What they'd use:**
- Basic exposure overview
- Network size (curiosity-driven)
- Health Card (share with new partners)
- Testing reminders
- Educational content ("Did You Know" cards)

**Specific needs:**
- Low friction onboarding — don't scare casual users with complexity
- Clear "this is not a dating app" positioning
- Emphasis on privacy and anonymity
- Simple, clean UI — not clinical, not social-media-like

**Growth potential:** Largest market by far, but hardest to acquire. Requires brand trust, press coverage, or institutional partnerships (university health centers, Planned Parenthood, etc.).

---

## Partnerships

### Lab Partnerships

**Tier 1 — API Integration (high value, high effort):**
- Quest Diagnostics
- LabCorp
- BioReference Laboratories

These are the big three in the US. API integration via Health Gorilla or Particle Health (lab result aggregators) can provide access to multiple labs through a single integration.

**Tier 2 — Clinic Partnerships (medium value, medium effort):**
- Planned Parenthood (national network, progressive, aligned mission)
- Community health centers (FQHCs)
- University health centers (direct access to young demographic)
- LGBTQ+ health clinics (The Trevor Project, Callen-Lorde, etc.)

Clinic partnerships work both ways: clinics refer patients to Navilla for ongoing monitoring, Navilla drives patients to partner clinics for testing.

**Tier 3 — At-Home Testing (future):**
- Everlywell
- myLAB Box
- STDcheck.com

At-home testing kits with direct result reporting to Navilla. The user orders a kit, takes the test, and results flow directly into their Navilla profile.

### Health Organization Partnerships

- **CDC / State Health Departments:** Anonymized aggregate data could be valuable for surveillance. Navilla could provide a real-time signal that supplements traditional reporting (which has a 2–6 week lag).
- **WHO / UNAIDS:** International reach for HIV-focused features.
- **Insurance companies:** Verified regular testing could qualify for wellness incentives (long-term, complex).

### Industry Partnerships (Adult Entertainment)

- **Free Speech Coalition (FSC):** Industry trade association that operates PASS. Navilla could be a technology provider or alternative.
- **Studios and production companies:** B2B accounts for performer verification.
- **Talent agencies:** Streamlined health compliance for represented talent.

---

## Contracts and Agreements

### What the User Mentioned: "Relationships/Contracts"

This could mean several things. Here are the product interpretations:

### 6.1 Sexual Health Agreements

**What this is:**
A mutual agreement between two or more people about their sexual health practices. Not a legal contract — a shared understanding documented in the app.

**What the user sees:**

```
Health Agreement with Ana Martinez

We agree to:
  ☑ Get tested every 3 months
  ☑ Share verified results with each other
  ☑ Notify each other of new connections
  ☐ Use protection (personal — not tracked by app)

Status:
  You: Last tested Feb 1, 2026 ✓ On schedule
  Ana: Last tested Dec 15, 2025 ⚠ Due for testing

[View agreement]  [Propose changes]
```

**Why it works:** Formalizes conversations that already happen informally. Reduces the awkwardness of "when did you last get tested?" — the app tracks it. Creates accountability without surveillance (both parties see the same dashboard).

**Privacy rules:**
- Both parties must agree to every term.
- Either party can dissolve the agreement at any time.
- Agreement details are never used in exposure calculations.
- Agreements are encrypted and visible only to the parties.

### 6.2 Relationship Health Dashboard

**What this is:**
A shared view between connected users who opt in. Shows mutual health status, testing cadence, and agreement compliance.

**What the user sees:**

```
Relationship Dashboard — You & Ana

Combined status:
  Both verified negative as of Feb 2026 ✓

Testing sync:
  You: Every 3 months (next: May 2026)
  Ana: Every 3 months (next: Mar 2026)

Shared network overlap:
  You share 3 mutual connections.
  Combined network: 1,204 people.

Agreement: Active since Jan 2026
```

**Why it works:** For people in ongoing relationships (monogamous or otherwise), this provides a shared health view. It's especially valuable for ENM/poly relationships where multiple partners need to coordinate testing schedules.

**Privacy rules:**
- Strictly opt-in. Both parties must consent.
- Either party can leave the shared dashboard at any time.
- What's shared: testing dates, verified status (conditions opted in), agreement status.
- What's NOT shared: individual network details, other connections, notes.

### 6.3 Professional Health Contracts (Adult Industry)

**What this is:**
A formalized pre-work health verification used in the adult entertainment industry.

**What the producer/studio sees:**

```
Production Health Check — Shoot: Feb 10, 2026

Required: Full panel within 14 days

Performers:
  Performer A    ✓ Verified    Panel date: Feb 2, 2026    8 days ago
  Performer B    ✓ Verified    Panel date: Jan 30, 2026   11 days ago
  Performer C    ⚠ Expired     Panel date: Jan 20, 2026   21 days ago

Status: 2 of 3 cleared. Performer C needs updated panel.

[Download compliance report]
```

**What the performer sees:**

```
Work Verification Request

Studio: [Studio Name]
Shoot date: Feb 10, 2026
Required: Full panel within 14 days

Your status:
  Last panel: Feb 2, 2026 (8 days ago) ✓ Valid

[Approve sharing]  [Decline]
```

**Why it works:** Replaces the current paper/PDF/screenshot workflow. Performers share a verified card with the studio. The studio sees a compliance dashboard. Everything is consent-based — performers approve each share.

**Critical design choice:** Performers are always in control. Studios cannot pull data without performer consent. The performer approves sharing for a specific production/date. Approval can be revoked.

---

## Mandatory Verification — The Path

Moving from optional to mandatory verification is a gradual process. Forcing it too early kills adoption.

### Stage 1: Self-Report Only (MVP — Now)
- All data is self-reported. No verification available.
- Exposure shows flat counts: "3 cases at 2nd degree."
- This gets users in the door. Growth is the priority.

### Stage 2: Verified Data Layer Unlocks (Phase 2)
- Users who verify at least one result unlock the Verified Data Layer.
- They see confidence breakdowns, verification rates, testing freshness, prevalence comparisons — the full rich view.
- Unverified users see the same health-relevant counts and degrees. Nothing unsafe is hidden. But they see a clear prompt: "Verify your results to see confidence details."
- Health Card generation requires verified results.
- Self-reported data is still accepted and always will be.

### Stage 3: Verified Weight in Algorithm (Phase 2.5)
- Verified results count as higher-confidence data in exposure calculations.
- Exposure items show a confidence indicator for verified users: "High (67% verified)" vs "Low (0% verified)."
- Network-wide verification rate displayed on dashboard for verified users.
- Relationship agreements and professional contracts require verification.

### Stage 4: Verified as Norm (Phase 3)
- New users prompted to verify during onboarding with clear benefit messaging: "Verify to see the full picture."
- Platform trust metric visible to everyone: "87% of reports on Navilla are lab-verified."
- Self-reported data still accepted for core exposure calculations — never locked out.
- Professional features (industry compliance, clinic dashboards) require full verified panels.

**Never fully mandatory for basic use.** Some users can't access labs easily (cost, location, stigma). The platform should always accept self-reported data for basic exposure calculations. The "mandatory" push applies to premium features (Health Card, contracts, professional features) — not to the core product.

---

## Compliance Landscape

### What Changes with Verification

| Area | Self-Reported (Now) | Verified (Future) |
|------|-------------------|-------------------|
| **FDA/Medical Device** | Not applicable | Likely still not a medical device (displaying lab results, not diagnosing). But borderline — legal review needed. |
| **HIPAA** | Not applicable (no PHI from covered entities) | **Applicable.** Receiving lab results from covered entities makes Navilla a Business Associate. BAA required with each lab partner. |
| **GDPR Special Category** | Already applies (health data) | Same, but stronger obligations due to clinical data source. |
| **State Health Privacy Laws** | Varies | More states' laws trigger when dealing with verified clinical data. |
| **Insurance Portability** | Not applicable | If integrated with insurance wellness programs, HIPAA portability rules apply. |
| **Mandatory STI Reporting** | Not applicable (self-reported) | Must ensure platform doesn't interfere with labs' mandatory reporting obligations. |
| **OSHA (Adult Industry)** | Not applicable | If used for workplace compliance, OSHA standards for bloodborne pathogen testing apply. |

### What Navilla Must Do Before Phase 2

1. **Engage a healthcare compliance attorney.** This is not optional. The self-reported-to-verified transition changes the legal category of the data.
2. **Complete a DPIA (Data Protection Impact Assessment)** under GDPR.
3. **Establish BAA framework** for lab partnerships.
4. **Review FDA guidance** on clinical decision support software (21st Century Cures Act exemptions may apply).
5. **Review state-by-state STI reporting laws** to ensure the platform doesn't create conflicts.

---

## Revenue Model Implications

Self-reported Navilla is a free tool. Verified Navilla opens revenue paths:

| Revenue Stream | Description | Phase |
|----------------|-------------|-------|
| **Freemium** | Basic features free, verified features paid (Health Card, sharing, professional tools) | Phase 2 |
| **Lab referral fees** | Commission from partner labs for referred testing | Phase 2 |
| **B2B subscriptions** | Studio/clinic dashboards for performer/patient verification | Phase 3 |
| **At-home test kit sales** | White-label or referral for at-home testing kits | Phase 3 |
| **Enterprise compliance** | OSHA-compliant testing management for adult industry companies | Phase 3 |
| **Wellness partnerships** | Insurance/employer wellness program integration | Phase 3+ |
| **Anonymized data licensing** | Aggregate, anonymized epidemiological data for public health research | Phase 3+ |

**Recommendation:** Keep the core product free forever. Monetize verification, professional features, and B2B. The free tier is the growth engine — the verified tier is the business.

---

## Technical Implications (High Level)

### New Entities Needed

- `VerifiedResult` — linked to a health status, includes lab name, verification method, verification date, raw result hash (for tamper detection), and expiration
- `HealthCard` — shareable credential linked to user, includes selected conditions, expiration, share link/QR code, revocation status
- `HealthAgreement` — mutual agreement between users, includes terms, compliance tracking, dissolution date
- `ShareLog` — audit trail of card shares (who, when, what was included, expiration)
- `LabPartner` — reference data for integrated labs, API credentials, supported panels
- `ProducerAccount` — B2B role for studios/clinics with compliance dashboard access

### New Roles

- `USER` — individual user (existing)
- `PRODUCER` — studio/clinic account that can receive shared cards and view compliance dashboards
- `LAB_PARTNER` — system role for automated result import
- `ADMIN` — platform administration

### API Surface Expansion

- `POST /api/health-status/{id}/verify` — upload or link lab verification
- `POST /api/health-cards` — generate a shareable health card
- `GET /api/health-cards/{code}` — public endpoint to view/verify a shared card
- `DELETE /api/health-cards/{id}` — revoke a shared card
- `POST /api/agreements` — propose a health agreement
- `PUT /api/agreements/{id}/accept` — accept an agreement
- `DELETE /api/agreements/{id}` — dissolve an agreement
- `GET /api/producer/compliance` — producer dashboard endpoint (B2B)

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users forge lab results (upload fake PDFs) | High — undermines trust in verification | Start with upload + manual review. Move to API integration ASAP. Watermark verification with lab-specific checks. |
| HIPAA breach from lab integration | Critical — legal liability, user trust destruction | Engage compliance attorney before any lab integration. BAAs with all partners. Encrypted data at rest and in transit. Regular security audits. |
| Verified features create a two-tier system (verified = trusted, unverified = suspect) | Medium — could stigmatize users who can't access labs | Always accept self-reported data. Frame unverified as "pending verification" not "untrustworthy." Provide paths to free testing (Planned Parenthood, community health centers). |
| Adult industry adoption brings brand risk | Medium — association with adult content | Separate branding for professional features ("Navilla for Business" or sub-brand). Professional dashboard has no connection to individual social features. |
| Feature creep — trying to be everything | High — dilutes core product, slows shipping | This document is a vision, not a sprint plan. Implement one phase at a time. Each phase must prove value before starting the next. |
| Mandatory verification pushes users away | High — especially in regions with poor lab access | Never mandatory for core features. Mandatory only for premium/professional features. Provide clear paths to verification (partner labs, at-home kits). |
