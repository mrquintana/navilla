# Navilla — Upcoming Features & Product Roadmap

> This document captures the product vision, feature definitions, and phased roadmap for evolving Navilla from an STI exposure network into a comprehensive sexual health companion.
>
> **Core positioning shift:** From "Find out if you've been exposed" (scary, niche) to "Your private sexual health companion" (empowering, broad).
>
> The measure of success: would someone mention this app casually? "I use Navilla to track my testing schedule" should feel as normal as "I use Flo to track my cycle."

---

## Product Layer Architecture

Navilla is structured as progressive layers of value. Each layer works independently. Users opt into what they want.

| Layer | Name | Requires Account | Requires Network | Purpose |
|-------|------|-----------------|-------------------|---------|
| 0 | Education & Tools | No | No | SEO acquisition, immediate public value |
| 1 | Personal Tracker | Yes | No | Day-1 solo value, retention |
| 2 | Connection Network | Yes | Yes | Exposure intelligence, network health |
| 3 | Anonymous Notifications | Yes | Yes | Growth engine, public health impact |

---

## Layer 0: Education & Tools (No Account Required)

### Goal
Make navilla.app useful to anyone who arrives — from a Google search, a shared link, or curiosity. Deliver genuine value with zero friction. Convert visitors to registered users organically.

### Why This Matters
- People searching "how long after sex can I test for STI" or "chlamydia symptoms" are high-intent visitors
- Current top results are dense CDC PDFs or ad-filled clickbait sites
- A clean, well-designed, mobile-friendly tool earns trust and positions Navilla as the go-to resource
- Every tool page ends with a soft CTA: "Want to track this privately? Create a free account."

---

### Feature 0.1: Window Period Calculator

**What it does:**
Interactive tool where a user enters an encounter date and sees when each STI becomes reliably testable.

**Example output:**
```
Encounter date: February 10, 2026

Chlamydia .............. Testable from: Feb 15 (5 days)
Gonorrhea .............. Testable from: Feb 15 (5 days)
Syphilis ............... Testable from: Mar 12 (30 days)
HIV (4th gen) .......... Testable from: Feb 28 (18 days) — conclusive by Apr 6 (45 days)
Herpes (HSV) ........... Testable from: Mar 26 (if symptomatic; blood test: 12 weeks)
Hepatitis B ............ Testable from: Mar 12 (30 days)
Hepatitis C ............ Testable from: Apr 6 (8 weeks)
HPV .................... No routine test for most people. Screening via Pap/HPV test.
Trichomoniasis ......... Testable from: Feb 15 (5 days)
Mycoplasma genitalium .. Testable from: Feb 24 (14 days)
```

**Data source:** CDC STI Screening Recommendations + WHO guidelines.

**UI notes:**
- Clean, minimal interface — date picker + results table
- Color-coded: green = "testable now", yellow = "wait X more days", gray = "no standard test"
- "Find a clinic near you" button below results
- Source citation at bottom with links to CDC/WHO pages

---

### Feature 0.2: STI Education Library

**What it does:**
Plain-language fact sheets for each STI. Not clinical walls of text — concise, practical, non-judgmental.

**Structure per STI:**
- What it is (1-2 sentences)
- How it spreads (specific, practical — oral/anal/vaginal/skin contact)
- Symptoms (or "often no symptoms" — this is critical to communicate)
- Testing (what test, when to test, what to expect)
- Treatment (curable vs manageable, typical treatment)
- Prevention (condoms, PrEP, vaccines where applicable)
- Source citations

**STIs to cover (initial set — 10 conditions):**
1. Chlamydia
2. Gonorrhea
3. Syphilis
4. HIV
5. Herpes (HSV-1 & HSV-2)
6. HPV
7. Hepatitis B
8. Hepatitis C
9. Trichomoniasis
10. Mycoplasma genitalium

**Content approach:**
- Bilingual from day one (English primary, Spanish for Mexico launch)
- Non-judgmental tone — no scare tactics, no shame
- Practical focus — "here's what to actually do"
- Each page ends with: testing CTA + "Save this to your health tracker" (account prompt)

---

### Feature 0.3: Symptom Guide

**What it does:**
User selects symptoms they're experiencing from a structured list. The guide shows which STIs commonly present with those symptoms and recommends next steps.

**Important: This is NOT a diagnosis tool.**

**How it works:**
1. User selects from symptom categories (e.g., "unusual discharge", "sores/bumps", "burning during urination", "itching", "no symptoms but concerned")
2. Guide shows: "These symptoms are commonly associated with: [list of STIs with brief context]"
3. Always ends with: "These are possibilities, not a diagnosis. Only a healthcare provider can diagnose an STI. Find a clinic near you."

**Why not a chatbot or AI diagnosis:**
- Legal risk is too high
- Users might trust an AI "diagnosis" and skip the doctor
- A structured guide with citations is safer and equally useful

**Data source:** CDC symptom guides, WHO clinical manuals, CENSIDA educational materials.

---

### Feature 0.4: Testing Location Finder

**What it does:**
Find free or low-cost STI testing clinics near the user.

**Data sources for Mexico:**
- CENSIDA directory of free HIV/STI testing centers (CAPASITS, SAIs)
- IMSS clinic locations (for insured users)
- Secretaria de Salud state-level directories
- Clínicas Condesa (CDMX — free, walk-in, LGBTQ+ friendly)

**Data sources for future US expansion:**
- CDC GetTested API (gettested.cdc.gov)
- AIDSVu clinic finder
- Planned Parenthood location API

**UI:**
- Map view + list view
- Filter: free / low-cost / insurance accepted
- Filter: walk-in vs appointment
- Show: hours, phone, services offered, languages
- "Get directions" button (opens maps app)

**Data maintenance:**
- Clinic directories don't change frequently — quarterly manual verification is sufficient
- Start with CDMX metro area, expand by state

---

### Feature 0.5: Testing Cost Estimator

**What it does:**
Shows approximate cost of STI testing at different facility types in the user's area.

**Example output (Mexico):**
```
Full STI panel:
  CAPASITS / SAI (public) ......... Free
  IMSS (with coverage) ............ Free
  Private lab (Chopo, Olab, etc.).. $    (budget-friendly)
  Private clinic .................. $$   (moderate)
  Specialist / urgent ............. $$$  (premium)
```

**Pricing approach:** Use tier labels (Free / $ / $$ / $$$) instead of exact peso amounts. Exact prices change constantly, are location-dependent, and users get frustrated when they're wrong. Tier labels set expectations without creating maintenance burden or trust issues.

**Data source:** Manually researched. Crowdsource tier corrections from users over time ("Was this price range accurate? Report an update").

---

### Content Sourcing & Quality Strategy

**Approach: Manual curation + AI drafting (NOT scraping)**

Why not scrape:
- CDC/WHO pages change layout frequently — scrapers break
- Terms of use may prohibit automated scraping
- Raw HTML needs heavy cleaning — garbage in, garbage out
- The total content volume is small (~20-30 articles) — curation beats automation

**Workflow:**
1. Identify the topic and authoritative source(s)
2. Use AI (Claude API) to draft plain-language summaries from official sources
3. Store as structured content in the database:
   - `title`, `slug`, `body_es`, `body_en`, `sources[]`, `review_status`, `last_verified`, `reviewer`
4. Verify all content against original sources for accuracy (self-review). Future: professional medical review when budget allows
5. Quarterly re-verification: check that source data hasn't changed materially

**Content DB schema (conceptual):**
```
health_content:
  id: uuid
  slug: varchar (e.g., "chlamydia", "window-period-calculator")
  category: enum (STI_GUIDE, TOOL, SYMPTOM_INFO, GENERAL)
  title_en: varchar
  title_es: varchar
  body_en: text (markdown)
  body_es: text (markdown)
  sources: jsonb (array of {name, url, accessed_date})
  review_status: enum (DRAFT, REVIEWED, PUBLISHED)
  reviewed_by: varchar (reviewer name/credentials)
  reviewed_at: timestamp
  last_verified_at: timestamp
  created_at: timestamp
  updated_at: timestamp
```

**Credibility approach (no medical review for now):**
- All content cites its source directly (CDC, WHO, CENSIDA) with links to the original material
- Every page includes a clear disclaimer: this is educational content from official sources, not medical advice
- Source citation IS the credibility mechanism — users can verify anything by clicking through to CDC/WHO
- **Future enhancement (when budget allows):** hire a doctor to review content batch. Adds "Reviewed by [Dr. Name]" badge. Not required for launch
- Never present content as Navilla's own medical opinion — always attribute to the source

---

### Legal & Compliance (Layer 0)

**Disclaimers (present on every health content page):**
> "La información presentada proviene de fuentes oficiales (CDC, OMS, CENSIDA) y tiene fines exclusivamente educativos. No sustituye el consejo, diagnóstico o tratamiento médico profesional. Siempre consulta a un profesional de la salud."

**Rules:**
- Every factual claim must cite its source
- Never use diagnostic language ("you have", "you likely have", "this means you have")
- Always use informational language ("common symptoms include", "may be associated with", "consult a healthcare provider")
- Every content page ends with a call to action toward professional care
- No treatment dosage recommendations — only "this is typically treated with [class of medication]"

**Mexico regulatory notes:**
- COFEPRIS jurisdiction applies to medical devices, pharmaceuticals, and diagnostic tools
- Informational health content platforms that cite official sources and don't diagnose are generally not regulated
- Recommended: one-hour consultation with a health-tech lawyer in CDMX before launch to confirm
- NOM-024-SSA3 (health information systems) — review for applicability

---

### SEO & Acquisition Strategy (Layer 0)

These pages are the top of the funnel. Target keywords:

**Spanish (Mexico priority):**
- "cuánto tiempo esperar para prueba de ETS"
- "síntomas de clamidia"
- "dónde hacerme prueba de VIH gratis CDMX"
- "prueba de ETS precio México"
- "periodo de ventana VIH"

**English (secondary):**
- "STI testing window period calculator"
- "chlamydia symptoms"
- "free STI testing near me"
- "how long after sex to test for STDs"

**Implementation:**
- Each tool/article is a standalone page with clean URL (e.g., `/tools/window-period-calculator`, `/guide/chlamydia`)
- Structured data (schema.org MedicalWebPage) for rich search results
- Open Graph tags for social sharing
- Sitemap.xml and robots.txt properly configured

**Language routing — current vs future:**

Currently: language is detected from browser `Accept-Language` header and stored in localStorage. English is prerendered (what Google indexes). Spanish is served client-side. `hreflang` alternate tags point to the same URL for both languages — valid, but means Google indexes one version.

**Future (path-prefix routing):** For full bilingual SEO — separate Spanish rankings in Mexico — migrate to `/es/` path prefix (e.g., `/es/guide/clamidia`). This allows Google to independently rank Spanish-language content for Mexican search queries like "periodo de ventana VIH" or "síntomas de clamidia". Requires:
- React Router path prefix for all Layer 0 routes
- Spanish prerender for `/es/*` routes
- Updated `hreflang` canonical pairs (`/guide/chlamydia` ↔ `/es/guide/clamidia`)
- Spanish-language slugs (SEO value: "clamidia" outranks "chlamydia" in Mexico)

**Recommended timing:** After Layer 0 deploys and gets indexed (post-Week 4). Implement as a dedicated SEO sprint in Phase 2 (Week 6 or 7) once there is real search traffic data to justify the investment. Track in GitHub issue #[see issue].

---

### Rendering Strategy for Layer 0 Pages

> **DECIDED: Pre-render Layer 0 routes within the existing Vite SPA.**

**Approach:** Use `vite-plugin-prerender` (or equivalent) to pre-render Layer 0 public pages at build time. Everything stays in one codebase, one build, one deploy. No new frameworks.

**How it works:**
1. Layer 0 pages are built as normal React components inside the existing `frontend/` project
2. At build time, the plugin visits each listed route, renders it, and saves the HTML
3. When a user (or Google) visits a Layer 0 page, they get pre-rendered HTML immediately (fast + SEO-friendly)
4. React hydrates on top and makes interactive elements work (calculator, symptom selector)
5. Authenticated pages (Layers 1-3) are untouched — they work as a normal SPA

**Config (minimal — ~10 lines):**
```js
// vite.config.ts — add to existing plugins array
import prerender from 'vite-plugin-prerender'

prerender({
  routes: [
    '/',
    '/tools/window-period-calculator',
    '/tools/symptom-guide',
    '/tools/clinic-finder',
    '/tools/cost-estimator',
    '/guide/chlamydia',
    '/guide/gonorrhea',
    '/guide/syphilis',
    '/guide/hiv',
    '/guide/herpes',
    '/guide/hpv',
    '/guide/hepatitis-b',
    '/guide/hepatitis-c',
    '/guide/trichomoniasis',
    '/guide/mycoplasma-genitalium',
  ]
})
```

**SEO meta tags:** Use `react-helmet-async` on each Layer 0 page for title, description, and Open Graph tags. Standard React pattern.

**What this gives us:**
- Full SEO for Layer 0 pages (Google sees complete HTML)
- Open Graph previews work when shared on social media
- Fast initial load (no JS needed to see content)
- Interactive elements still work after hydration
- Zero impact on authenticated SPA pages
- One codebase, one build, one deploy pipeline on Railway

---

### Conversion Points (Layer 0 → Layer 1)

Every Layer 0 page includes soft, non-pushy prompts to create an account:

| After using... | CTA |
|---------------|-----|
| Window period calculator | "Want to save this and get a reminder when it's time to test? Create a free account." |
| STI guide | "Track your testing history privately. Create a free account." |
| Symptom guide | "Log this concern and get follow-up reminders. Create a free account." |
| Clinic finder | "Save your preferred clinics and get testing reminders. Create a free account." |

---

## Layer 1: Personal Tracker (Account Required, No Network Needed)

### Goal
Give every registered user immediate, private, personal value — before they add a single connection. This is the retention layer. A user who logs even one encounter or one test result has a reason to come back.

### Why This Matters
- Solves the cold start problem: the app is useful with zero connections
- Creates a daily/weekly habit of opening Navilla
- Builds the data foundation that makes Layers 2 and 3 more powerful later
- Positions Navilla as a health tool, not just an exposure alert system

### Privacy Principle
Everything in Layer 1 is **private by default, visible only to the user**. No data from Layer 1 is shared with connections, shown in exposure calculations, or accessible to other users — unless the user explicitly opts into Layer 2 features later.

---

### Feature 1.1: Encounter Journal

**What it does:**
A private, encrypted log of sexual encounters. Think of it as a health diary — not a "body count tracker." The framing matters.

**What the user logs per entry:**
- **Date** (required)
- **Protection used** (multi-select: condom, dental dam, PrEP, none, other)
- **Type of encounter** (optional, multi-select: vaginal, oral, anal — relevant for risk context)
- **Linked connection** (optional: link to a Navilla connection, or leave anonymous)
- **Private notes** (optional: free text, encrypted — "met at [place]", "first time", whatever the user wants)

**What the user sees:**
- Chronological timeline of entries
- Monthly/yearly summary view
- Protection usage rate ("83% of encounters in the last 6 months were protected")
- Activity frequency (not judgmental — just data)

**Privacy & encryption:**
- Entries are encrypted at rest in the database
- Private notes should ideally be client-side encrypted (the server stores ciphertext it cannot read)
- No entry is ever shared with connections or used in exposure calculations
- If the user deletes their account, all journal entries are permanently destroyed

**UX tone:**
- Normalizing, not clinical: "Log an encounter" not "Report sexual activity"
- No shame-inducing UI — no red warnings for unprotected encounters, just neutral data
- The journal should feel like a personal health tool, like logging a workout or a meal

**Why users would actually use this:**
- "My doctor asked how many partners in the last 6 months — I just checked my Navilla journal"
- "I want to remember when my last encounter was so I know when to test"
- "I'm tracking my PrEP adherence alongside my activity"
- "I want to understand my own patterns over time"

---

### Feature 1.2: Testing History Tracker

**What it does:**
Log STI test results over time. Build a personal health record that shows testing cadence and outcomes.

**What the user logs per test:**
- **Date of test** (required)
- **Conditions tested for** (multi-select from standard list: HIV, chlamydia, gonorrhea, syphilis, etc.)
- **Results per condition** (negative / positive / pending / indeterminate)
- **Testing facility** (optional: pick from saved clinics or type freely)
- **Document upload** (optional: photo of results for personal records — stored encrypted)
- **Notes** (optional: "routine quarterly", "had symptoms", etc.)

**What the user sees:**
- Testing timeline with results
- "Days since last test" prominent counter
- Per-condition history: "HIV: tested 4 times, all negative. Last test: Jan 15, 2026"
- Coverage indicator: "You've been tested for 8 of 10 common STIs in the past year"
- Visual badges/indicators for consistent testers (subtle positive reinforcement)

**Smart features:**
- After logging a positive result, offer: "Would you like to set a treatment reminder?" and "Would you like to notify connections anonymously?" (bridges to Layer 3)
- After logging all-negative results: "Great news. Based on your activity, your next recommended test is around [date]." (bridges to Feature 1.3)
- If the user hasn't logged a test in X months (based on their activity level): gentle nudge via reminder

**Document upload notes:**
- Photos are for the user's own reference only
- Stored encrypted — not used for verification (that's Layer 2/WS-B territory)
- In the future, could offer optional OCR to auto-fill results from a lab report photo

---

### Feature 1.3: Smart Reminders & Scheduling

**What it does:**
Proactive, personalized reminders based on the user's activity and testing history. Not generic "get tested!" spam — contextual and useful.

**Reminder types:**

**Testing reminders (activity-based):**
- Tracks encounter frequency from the journal (Feature 1.1) and time since last test (Feature 1.2)
- Applies CDC/WHO guidelines for recommended testing frequency:
  - Sexually active with multiple partners → every 3 months
  - New partner → test before and after
  - Men who have sex with men → every 3-6 months (CDC guideline)
  - Single monogamous partner, both tested → annually
- Generates personalized suggestions: "You've logged 4 new encounters since your last test on Jan 15. Consider scheduling a test. [Find clinics]"
- User controls frequency and can snooze/disable

**Medication reminders:**
- **PrEP (daily pill):** Daily reminder at user-chosen time. Tracks adherence: "You've taken 27 of 30 doses this month (90%)"
- **PrEP (injectable — Apretude/CAB-LA):** Reminder for next injection date (every 2 months after initial doses)
- **Treatment courses:** "Day 3 of 7: Doxycycline for chlamydia. Take with food." Countdown to completion
- **DoxyPEP (post-exposure prophylaxis):** If enabled, reminder to take within 72 hours after an encounter (emerging prevention strategy)

**Vaccination tracking:**
- **HPV series:** 3 doses over 6 months. Track which doses are done, remind for next
- **Hepatitis B series:** 3 doses. Same tracking
- **Mpox vaccine:** 2 doses, 4 weeks apart
- **Hepatitis A:** 2 doses, 6 months apart
- Shows completion status: "HPV: 2 of 3 doses complete. Next dose due: March 2026"

**Follow-up reminders:**
- After logging a positive result: "It's been 2 weeks since your chlamydia treatment. Consider a test-of-cure to confirm it's cleared."
- After an encounter with no protection: "Based on your encounter on [date], you may want to test for [conditions] starting [date based on window periods]." (Connects to the Layer 0 window period calculator logic)

**Notification channels:**
- In-app notifications (default)
- Push notifications (when mobile/PWA is available)
- Email digest (optional — weekly summary, not per-reminder)
- All channels configurable per reminder type
- Quiet hours setting

---

### Feature 1.4: Personal Insights & Statistics

**What it does:**
Aggregated, visual view of the user's sexual health patterns over time. Data-driven but non-judgmental.

**Dashboard cards:**

**Activity summary:**
- Encounters this month / this year
- Protection usage rate (% protected) with trend arrow
- Average encounters per month (rolling 6-month)

**Testing summary:**
- Days since last test (with color context: green <90 days, yellow 90-180, neutral >180)
- Tests this year
- Conditions coverage map: which STIs have you been tested for recently?
- Testing-to-activity ratio: "You test once for every X encounters" (contextual, not judgmental)

**Prevention summary:**
- PrEP adherence rate (if tracking)
- Vaccination completion status
- Protection usage trend over time

**Timeline view:**
- Combined chronological view: encounters, tests, medications, vaccinations
- Helps the user see the full picture of their sexual health management
- Useful for doctor visits: "Here's my last 6 months at a glance"

**Tone guidelines:**
- Never use red/warning colors for high activity or low protection — that's judgmental
- Use neutral data presentation: numbers, trends, context
- Positive reinforcement for consistent testing and prevention
- No gamification of sexual activity (no streaks, no badges for "encounters")
- Okay to have subtle positive feedback for health behaviors: "Consistent tester — 4 tests this year"

---

### Feature 1.5: Doctor Visit Prep

**What it does:**
Generate a concise health summary the user can show or share with their healthcare provider during a visit.

**What it includes:**
- Date range (e.g., "Since your last visit" or "Last 12 months")
- Number of encounters logged
- Protection usage rate
- Testing history with results
- Active medications (PrEP, current treatments)
- Vaccination status
- Any flagged concerns or symptoms
- Current connections count (anonymized — just the number, no names)

**Format:**
- On-screen view optimized for showing a phone to a doctor
- Export as PDF option
- Print-friendly layout
- All partner-identifying information excluded — only aggregated data

**Why this matters:**
- Most people can't accurately recall their sexual history during a doctor visit
- Doctors need this information to recommend the right tests
- Having it organized and ready makes the visit more productive
- It's a feature users would recommend to friends: "My app generates a summary for my doctor"

**Privacy:**
- Generated on-device or as a temporary server-side render
- Not stored unless the user explicitly saves it
- No copy sent to anyone — the user controls who sees it
- Clear disclaimer on the document: "Self-reported data. Not a medical record."

---

### Feature 1.6: Saved Clinics & Preferences

**What it does:**
Save preferred testing locations and health preferences for quick access.

**What the user can save:**
- Favorite clinics from the Layer 0 finder (with notes: "walk-in Saturdays", "Dr. García is great")
- Preferred testing panel (which STIs to include in routine screening)
- Insurance/coverage info (IMSS number, private insurance, or "uninsured — show free options")
- Preferred language for health content

**Why it exists:**
- Reduces friction between "I should get tested" and actually booking
- One tap from a reminder to "Go to my saved clinic"
- Personalized experience that gets better over time

---

### Data Model (Conceptual — Layer 1)

```
encounter_journal:
  id: uuid
  user_id: uuid (FK)
  encounter_date: date
  protection_methods: varchar[] (e.g., ['condom', 'prep'])
  encounter_types: varchar[] (optional, e.g., ['oral', 'vaginal'])
  linked_connection_id: uuid (optional FK to connections)
  notes_encrypted: bytea (client-side encrypted)
  created_at: timestamp
  updated_at: timestamp

test_records:
  id: uuid
  user_id: uuid (FK)
  test_date: date
  facility_name: varchar (optional)
  facility_id: uuid (optional FK to saved_clinics)
  notes: text (optional)
  document_url: varchar (optional, encrypted storage reference)
  created_at: timestamp
  updated_at: timestamp

test_record_results:
  id: uuid
  test_record_id: uuid (FK)
  condition: varchar (e.g., 'hiv', 'chlamydia')
  result: enum (NEGATIVE, POSITIVE, PENDING, INDETERMINATE)
  created_at: timestamp

medications:
  id: uuid
  user_id: uuid (FK)
  medication_type: enum (PREP_DAILY, PREP_INJECTABLE, TREATMENT, DOXY_PEP, OTHER)
  name: varchar (e.g., "Truvada", "Doxycycline")
  start_date: date
  end_date: date (null if ongoing)
  frequency: varchar (e.g., "daily", "every 2 months")
  reminder_time: time (optional)
  notes: text (optional)
  created_at: timestamp
  updated_at: timestamp

medication_logs:
  id: uuid
  medication_id: uuid (FK)
  logged_date: date
  taken: boolean
  created_at: timestamp

vaccinations:
  id: uuid
  user_id: uuid (FK)
  vaccine_type: enum (HPV, HEP_B, HEP_A, MPOX)
  dose_number: int
  total_doses: int
  administered_date: date
  next_dose_due: date (null if complete)
  facility_name: varchar (optional)
  notes: text (optional)
  created_at: timestamp

saved_clinics:
  id: uuid
  user_id: uuid (FK)
  clinic_name: varchar
  address: text
  phone: varchar (optional)
  notes_encrypted: bytea (optional, client-side encrypted)
  latitude: decimal (optional)
  longitude: decimal (optional)
  created_at: timestamp

reminder_preferences:
  id: uuid
  user_id: uuid (FK)
  reminder_type: enum (TESTING, MEDICATION, VACCINATION, FOLLOW_UP)
  enabled: boolean
  channel: enum (IN_APP, PUSH, EMAIL)
  quiet_hours_start: time (optional)
  quiet_hours_end: time (optional)
  custom_interval_days: int (optional — override default testing frequency)
  created_at: timestamp
  updated_at: timestamp
```

---

### Conversion Points (Layer 1 → Layer 2)

Once a user has been tracking privately, natural prompts to explore the network:

| Trigger | CTA |
|---------|-----|
| User has 5+ encounters logged | "Want to know about potential exposures in your network? Add a connection." |
| User logs a positive result | "Would you like to anonymously notify your recent partners? Connect with them on Navilla." |
| User views insights dashboard | "Your personal data + network data = complete picture. Learn about connections." |
| After 30 days of active use | "You're taking your health seriously. Navilla's network feature adds another layer of protection. Learn more." |

These are **never forced** — always informational, dismissible, and shown at most once per trigger.

---

## Layer 2: Connection Network (Account Required, Social)

### Goal
Build a private, consent-based network that enables exposure awareness and network-level health insights. This is Navilla's core differentiator — no other app does this.

### How People Actually Connect (Being Honest)

Before designing features, acknowledge reality:

| Scenario | How it actually happens | Navilla implication |
|----------|------------------------|---------------------|
| Dating app match → hookup | Meet on Tinder/Bumble/Grindr, go out, things happen | Connection added AFTER, not during. "Hey, I use this app" via text/DM the next day |
| Party / spontaneous | Alcohol, energy, no planning | You might not have their info. Log as anonymous encounter in journal (Layer 1). Connect later IF you can |
| Regular FWB / casual | See each other periodically, already have contact info | Natural moment to share a link: "connect with me on Navilla" |
| Serious partner | Established trust, ongoing relationship | Easy sell: "let's both use this for our health" |
| One-night stand, no contact after | It happened, you have no way to reach them | Encounter journal only. Anonymous notification via other channel if needed (Layer 3) |

**Key insight:** Most Navilla connections will be added hours or days AFTER an encounter, not during. The product must be designed for this reality. The encounter journal (Layer 1) covers the cases where a connection isn't possible at all.

---

### Feature 2.1: How Connections Work

**Connection methods (in order of likelihood of actual use):**

**1. Share link (primary method)**
- Every user has a unique connection link: `navilla.app/connect/username` or a short code
- User sends it via WhatsApp, iMessage, DM, text — whatever they already use to communicate
- Recipient clicks → sees a clean page: "[Username] wants to connect with you on Navilla for mutual health awareness"
- If recipient has an account → accept/decline
- If recipient doesn't have an account → sign up flow → connection auto-established after registration
- This is the most natural flow: it mirrors how people already share things

**2. Username search (in-app)**
- Search by username within the app
- Send a connection request
- Respects privacy settings (private profiles don't appear in search)
- Already implemented in current codebase

**3. QR code (optional, secondary — don't over-engineer)**
- Available in profile settings for users who want it
- Useful for: planned dates, health-conscious encounters, regular partners
- Not the primary method — it's there for those who use it, not pushed on everyone
- Reality check: this will be used by maybe 5-10% of connections. Simple implementation only

**4. Conversation scripts (built into the share flow)**
- Users struggle with the awkwardness of asking someone to connect on a sexual health app
- When sharing a link, offer copy-paste message templates:
  - *"Hey, I use Navilla to keep track of my sexual health. Want to connect? [link]"*
  - *"I just got tested and I'm trying to stay on top of things. I use this app — here's my link if you want to connect: [link]"*
  - *"I use this to get reminders about testing and keep track of things. Totally private. [link]"*
- Reduces friction at the hardest moment — actually sending the message
- Low effort to build (list of copyable texts on the share screen), potentially high impact on connection rates

**Connection request flow:**
```
User A sends request → User B receives notification
  → User B accepts → Connection confirmed (bidirectional)
  → User B declines → Request dismissed, A sees "request declined" (no reason given)
  → User B ignores → Request expires after 30 days
  → User A can cancel → Request withdrawn before B responds
```

**Mutual consent is non-negotiable:** Both parties must confirm. No one-way "following." This is a health tool, not social media.

---

### Feature 2.2: Connection States & Lifecycle

**State model:**

```
PENDING → CONFIRMED → ACTIVE
                    → STALE (no activity from either party for X days)
                    → REMOVED (one party removes)

PENDING → DECLINED
PENDING → EXPIRED (30 days, no response)
PENDING → CANCELLED (requester withdraws)
```

**Active connections:**
- Both parties confirmed
- Data is used in exposure calculations
- Appears in connections list with full interaction options
- Shows "last encounter" date if either party logs one linked to this connection (private to each user individually — they see their own log, not the other person's)

**Stale connections:**
- Confirmed but no activity (no linked encounters, no test updates) for a configurable period (default: 180 days)
- System prompts: "You and [name] connected 6 months ago. Is this connection still relevant to your health?"
  - "Yes, keep active" → resets staleness timer
  - "No, archive" → moves to archived (excluded from exposure calculations but preserved for history)
- This prevents the graph from filling with years-old connections that distort exposure relevance
- Aligns with WS-A (recency): the network itself should be time-relevant, not just the health data

**Archived connections:**
- Excluded from active exposure calculations
- Still visible in connection history (user can see their own past)
- Can be reactivated if the relationship resumes
- Historical exposure data that involved this connection remains (with recency labeling)

**Removed connections:**
- Soft delete: the removing user no longer sees the connection
- The other party's historical data is preserved (they still see the connection existed, but marked as "removed by other party")
- Exposure history involving this connection is preserved with appropriate context
- Cannot be undone — must send a new request to reconnect

---

### Feature 2.3: What Each User Sees About Their Connections

**Your connections list shows:**

| Data | Visible | Source |
|------|---------|--------|
| Display name | Yes | Their profile |
| Username | Yes | Their profile |
| Avatar | Yes | Their profile |
| Connection date | Yes | System |
| Connection status | Yes | System (active/stale/archived) |
| Their individual health data | **NO — never** | — |
| Their individual test results | **NO — never** | — |
| Their encounter journal | **NO — never** | — |
| Whether they've tested recently | **NO** | — |
| Their other connections | **NO — never** | — |

**The "numbers, not names" principle is absolute.** You never see who reported what, who tested for what, or who is connected to whom beyond your own direct connections.

**Your connection's profile shows (if they allow it via privacy settings):**
- Display name
- Username
- Avatar
- Bio (if they've written one)
- Account creation date (optional)
- Verification badge (if verified — future Layer 2/WS-B feature)

**What you do NOT see on anyone's profile:**
- Their connection count
- Their health status
- Their activity level
- Their testing history
- Anything from their encounter journal

---

### Feature 2.4: Exposure Calculation & Display

This is the core intellectual property of Navilla. It already exists in the backend (BFS algorithm, up to 5 degrees). Here's how it should work as a refined product feature:

**How exposure calculation works (user-facing explanation):**
1. Connections in your network report health statuses (self-reported or verified)
2. The system traces the connection graph to determine your degree of separation from reported conditions
3. You see **aggregated, anonymized** exposure data — never individual reports

**Degree model:**
- **Degree 1:** Your direct connection reported something. Highest relevance.
- **Degree 2:** A connection of your connection reported something. Lower relevance.
- **Degree 3:** Three steps away. Included for awareness but clearly labeled as distant.
- **Degrees 4-5:** Available in data but shown only if user opts in. Very low signal at this distance.

**What the exposure dashboard shows:**

```
Your Exposure Overview
Last updated: Feb 25, 2026

Chlamydia
  ● Active — 1 report in your network
    Closest: 1st degree · Reported: 12 days ago
    Recency: Recent (0-30 days)
    → Get tested · Find clinics

Syphilis
  ○ Historical — 1 report in your network
    Closest: 2nd degree · Reported: 4 months ago
    Recency: Older (91-365 days)
    → For awareness only

No other conditions reported in your network.
```

**Key display rules:**
- Active (not cleared) conditions are visually prominent
- Cleared/resolved conditions are de-emphasized but visible
- Recency buckets always shown: `0-30d`, `31-90d`, `91-365d`, `365d+`
- Degree distance always shown: closer = more relevant
- Every active exposure includes a CTA: "Get tested" + "Find clinics" (links to Layer 0 tools)
- No condition appears without a time label (WS-A requirement)

**What the exposure dashboard does NOT show:**
- Who reported the condition (never, under any circumstances)
- Which connection path leads to the exposure
- The specific date of the report (only the recency bucket)
- How many people in the chain between you and the report (just the degree)

**The 3-connection minimum threshold:**
- Exposure data is only shown when the user has 3+ confirmed connections
- Below 3: "Add more connections to see exposure insights. This threshold exists to protect the anonymity of your connections."
- This prevents de-anonymization: with 1 connection, any exposure obviously came from them. With 3+, there's ambiguity.
- This already exists in the current implementation — keep it

**Edge case: what if only 1 of 3 connections has reported anything?**
- The system still shows the exposure — the threshold is about connection count, not reporter count
- Acknowledged privacy limitation: with 3 connections and 1 report, a motivated user could guess. But:
  - They still can't confirm it
  - The system never tells them which connection
  - The degree information is the only proximity signal
- For tighter privacy, the threshold could be raised to 5 — this is a configurable decision

---

### Feature 2.5: Network Health Stats (Aggregated)

**What it does:**
Anonymized, aggregated view of your network's health posture. No individual data — just patterns.

**What you see:**

```
Your Network Health
8 active connections

Testing activity:
  ● High — Most of your network has tested recently
  (This means: ≥60% of connections have logged a test in the last 90 days)

Network coverage:
  You're connected to people who have 23 total connections.
  Your network reaches approximately 31 unique people across 3 degrees.

Exposure summary:
  1 active condition in your network (see Exposure Overview)
  0 conditions resolved in the last 30 days
```

**Why "High/Medium/Low" instead of exact numbers:**
- Exact numbers could leak information: "75% of my 4 connections tested = 3 people tested. I know who didn't."
- Qualitative labels prevent this inference
- Thresholds: High (≥60% tested in 90d), Medium (30-59%), Low (<30%), Unknown (insufficient data)

**What you don't see:**
- Which connections tested and which didn't
- Individual testing dates
- What anyone tested for
- Any per-connection health indicators

---

### Feature 2.6: Privacy Model (Detailed)

**Privacy settings the user controls:**

**Profile visibility:**
| Setting | What it means |
|---------|--------------|
| Public | Searchable by username. Anyone can send a connection request. Profile visible to all users. |
| Connections Only | Not searchable. Only existing connections can see your profile. New connections only via direct link sharing. |
| Private | Not searchable. Profile hidden. Connections only via direct link. Existing connections see minimal info (name + avatar only). |

**Search visibility:**
- Separate toggle: "Appear in search results" (on/off)
- When off, the user can only be found via direct link or QR code
- Already implemented in current codebase

**Exposure network opt-in (Reciprocity model — permanent):**

Users start in Layer 1 only (personal tracker). The exposure network (Layer 2) is opt-in.

- **Default state:** NOT opted in. User has full Layer 1 functionality. No exposure data visible, no health reports shared.
- **Opting in:** User can opt in at any time (during onboarding or months later). Requires explicit confirmation:
  - Explanation screen: "By joining the exposure network, your health reports will be anonymously included in exposure calculations for your connections. In return, you'll see anonymized exposure data from your network. **This decision cannot be reversed.**"
  - Confirmation: user must type `ACEPTO` / `ACCEPT` in a text field to confirm (similar to account deletion flow)
  - Once confirmed, the user is permanently part of the exposure network
- **Reciprocity enforced:** If you're not opted in, you cannot see exposure data. No free-riding. You give to get.
- **Blur teaser UX:** Users who haven't opted in see a blurred version of the exposure section — blurred cards with a message: "Opt into the exposure network to unlock this." This is purely cosmetic — the API does NOT send real exposure data to non-opted-in users. The blur is a conversion driver, showing them what they're missing without revealing actual information
- **Cannot be reversed:** The opt-in is permanent to prevent gaming (opt in → check exposure → opt out). The only way out is full account deletion.
- **Why permanent:** If users could toggle off after seeing exposure data, they'd learn who in their network reported something (by toggling off and watching what disappears). Permanence prevents this information leak.

**Other data sharing controls:**
- "Show my verification status to connections" (on/off, default: on — once verification exists)

**What the system guarantees regardless of settings:**
- Your encounter journal is NEVER shared or used in any calculation visible to others
- Your individual test results are NEVER visible to any other user
- Your connection list is NEVER visible to any other user
- Your personal statistics (Layer 1) are NEVER shared
- If you remove a connection, they lose access to your profile information immediately
- Account deletion destroys all personal data permanently (GDPR/CCPA compliance — already implemented)

**Privacy by architecture (not just by policy):**
- Exposure calculations should run server-side and return only aggregated results
- API responses for exposure NEVER include user IDs, connection IDs, or any path information
- The BFS traversal happens in the backend — the frontend only receives: condition, degree, recency bucket, status
- Audit logging tracks all data access for compliance

---

### Feature 2.7: Connection Reconfirmation & Renewal

**The problem this solves:**
Over time, connections become stale. Someone you connected with 2 years ago may not be relevant to your current health picture. But their old data still affects your exposure calculations if the connection stays active.

**How it works:**

**Automatic staleness detection:**
- After 180 days with no activity on a connection (no new linked encounters, no health updates from either party), the system flags it as potentially stale
- Notification to both parties: "Your connection with [name] has been inactive for 6 months. Is this still relevant to your health?"
- Options: "Still active" / "Archive this connection" / "Remind me later"

**Periodic reconfirmation (optional, user-configurable):**
- Users can enable: "Ask me to reconfirm connections every [3/6/12] months"
- Gentle prompt: "You have 3 connections older than 6 months. Review?"
- Quick action: keep / archive / remove for each

**Why this matters:**
- Keeps the exposure graph time-relevant (aligns with WS-A)
- Prevents years-old connections from creating misleading exposure signals
- Gives users a natural moment to clean up their network
- Archived connections preserve history while keeping active calculations focused

---

### Feature 2.8: Private Vault (Safety Feature)

**The problem this solves:**
A controlling or jealous partner could demand to see someone's Navilla history. An abusive partner could grab the phone and look through the encounter journal. In conservative environments, having visible evidence of sexual activity (especially same-sex activity) could put someone at risk. The app must protect users from coerced disclosure.

**This is a safety feature, not a convenience feature.**

**How the vault works:**

**Setup (hidden by design):**
- The vault feature is NOT visible in normal settings or menus
- To enable it: user types a specific activation phrase in the app's search bar (e.g., `#vault` or a documented phrase in the help section)
- This reveals the vault setup screen where the user sets a personal vault phrase — a word, phrase, or sequence only they know (e.g., "miSalud2026")
- Once set, the setup screen disappears. No trace of the vault exists in the UI

**Using the vault:**
- Any encounter journal entry, connection, or test record can be individually "moved to vault"
- Vaulted items **completely vanish** from the app — no placeholders, no counters, no "X items hidden" message, nothing
- Statistics and insights recalculate WITHOUT vaulted items (so the numbers don't hint at hidden data)
- To reveal vaulted items: type the vault phrase in the search bar → vaulted content appears temporarily
- Auto-lock: vault content hides again after navigating away, closing the app, or 5 minutes of inactivity
- To access vault settings (change phrase, disable vault): type the vault phrase → settings option appears

**What can be vaulted:**
- Individual encounter journal entries
- Specific connections (connection disappears from the list entirely)
- Specific test records
- The vault does NOT affect exposure calculations — vaulted data still participates in the network if the user has opted in. The data is hidden from the UI, not from the system

**Plausible deniability:**
- If a partner says "Show me your Navilla," the app shows a clean, normal interface
- If they've heard about the vault feature: "Look, there's nothing hidden — search for anything"
  - Searching normal terms returns normal results. Only the exact vault phrase triggers the vault
  - The vault phrase is never stored in plaintext — it's hashed, same as a password
- No setting, menu item, or UI element ever reveals that the vault exists or is active
- Even inspecting the app's settings screen shows nothing unusual

**Additional safety layers:**

**App-level lock:**
- Optional PIN or biometric lock to open Navilla (separate from phone lock)
- If someone knows the phone PIN, they still can't open Navilla without the app PIN
- Standard feature for health apps — not suspicious to have enabled

**Notification privacy:**
- All push/lock screen notifications are intentionally vague
- Shows: "Navilla: You have a new update" — never "Navilla: Chlamydia exposure detected"
- No preview content on lock screen under any setting
- Notification content only visible after opening the app and authenticating

**Quick exit (FUTURE — nice-to-have, not for initial build):**
- Shake gesture or triple-tap that immediately closes the app
- App switcher/recent apps shows a generic splash screen, not actual app content
- Configurable by user (can disable if not needed)
- More relevant for mobile app (React Native) than web. Defer until mobile development

---

### Feature 2.9: Data Retention Controls

**What it does:**
User controls how long their encounter journal data is kept. Automatic deletion after the retention window.

**Settings:**
```
Keep my encounter journal entries for:
  ○ Forever (default)
  ○ 2 years
  ○ 1 year
  ○ 6 months
  ○ 3 months
```

**How it works:**
- Entries older than the retention window are permanently deleted — not recoverable
- Deletion happens automatically on a schedule (daily background job)
- Test records follow a separate retention setting (users may want to keep test history longer than encounter history)
- Connections are not affected by retention — they have their own staleness/archive lifecycle

**Why this matters:**
- Gives users genuine control over their data
- Provides a natural cover story: "The app only keeps the last 6 months, older stuff is automatically deleted"
- Reduces long-term storage risk (less data = less exposure in a breach)
- A user in a new relationship can set retention to 3 months — by the time their partner asks, pre-relationship history is genuinely gone

**Data retention for test records (separate setting):**
```
Keep my test records for:
  ○ Forever (default — recommended for health continuity)
  ○ 5 years
  ○ 2 years
  ○ 1 year
```

**Important:** Retained test result data that was already shared with the exposure network (because the user opted in) cannot be "un-shared." The anonymized exposure signal already propagated. Deleting the local record removes it from the user's view, but the anonymized impact on connections' exposure calculations has already occurred. This is explained clearly in the retention settings.

---

### How Layer 2 Integrates with Layer 1

The two layers strengthen each other:

| Layer 1 data | How Layer 2 uses it |
|-------------|---------------------|
| Encounter journal entry linked to a connection | Updates the connection's "last activity" date (prevents staleness). Only visible to the user who logged it — the other party doesn't see the entry |
| Test result logged (positive) | Triggers exposure calculation update for the network. Others see anonymized exposure data, not your result |
| Test result logged (negative) | Updates your personal dashboard. Does NOT propagate to network (negative results aren't "exposure") |
| Testing frequency | Contributes to anonymized "Network Health" stats (Feature 2.5) |

| Layer 2 data | How it enhances Layer 1 |
|-------------|------------------------|
| Exposure alert received | Smart reminder: "A new exposure was detected in your network. Consider testing. [Find clinics]" |
| New connection confirmed | Encounter journal suggestion: "You connected with [name]. Want to log an encounter?" |
| Network health stats | Personal insights context: "Your network is actively tested. You're part of a health-conscious community." |

---

### Existing Features (Already Built) vs. New for Layer 2

| Feature | Status | Notes |
|---------|--------|-------|
| Connection request/accept/deny | Built | Current codebase has full CRUD |
| Username search | Built | Respects privacy settings |
| Exposure calculation (BFS, 5 degrees) | Built | Backend algorithm exists |
| Exposure display | Built | Dashboard + Health page |
| 3-connection threshold | Built | Privacy protection active |
| Notifications for connection events | Built | In-app + header preview |
| Connection stats | Built | Basic stats endpoint |
| Recency buckets | Not built | WS-A in playbook — highest priority |
| Connection staleness/reconfirmation | Not built | WS-C-3 in playbook |
| Network health stats (aggregated) | Not built | New feature |
| Shareable connection link | Not built | Primary connection method for growth |
| QR code connection | Not built | Secondary method |
| Privacy settings granularity | Partially built | Visibility exists, reciprocity opt-in is new |
| Archived connections | Not built | New lifecycle state |
| Exposure network reciprocity opt-in | Not built | Permanent opt-in with typed confirmation |
| Private vault (safety feature) | Not built | Hidden vault with secret phrase trigger |
| Data retention controls | Not built | Auto-delete encounters/tests after configurable window |
| App-level PIN/biometric lock | Not built | Separate from phone lock |
| Notification privacy (vague previews) | Not built | Safety feature for lock screen |

---

### Data Model Additions (Conceptual — Layer 2)

Most connection data already exists. New additions:

```
-- Extend existing connections table
ALTER TABLE connections ADD COLUMN:
  last_activity_at: timestamp (updated when either party links an encounter or reports a test)
  staleness_notified_at: timestamp (when staleness prompt was sent)
  archived_at: timestamp (null if active, set when archived)
  archive_reason: enum (USER_CHOICE, SYSTEM_STALE, null)

-- New: shareable connection invites
connection_invites:
  id: uuid
  creator_user_id: uuid (FK)
  invite_code: varchar (short, unique, e.g., "abc123")
  invite_type: enum (LINK, QR)
  max_uses: int (default 1)
  uses_count: int (default 0)
  expires_at: timestamp
  created_at: timestamp

-- New: privacy preferences (extend existing user settings)
user_privacy_settings:
  user_id: uuid (PK, FK)
  profile_visibility: enum (PUBLIC, CONNECTIONS_ONLY, PRIVATE)
  searchable: boolean (default true)
  exposure_network_opted_in: boolean (default false)
  exposure_network_opted_in_at: timestamp (null until opted in — permanent, never reverted)
  show_verification_status: boolean (default true)
  connection_reconfirmation_interval_days: int (null = disabled, e.g., 180)
  updated_at: timestamp

-- New: private vault
user_vault:
  user_id: uuid (PK, FK)
  vault_phrase_hash: varchar (bcrypt/argon2 hash of the vault phrase)
  enabled: boolean (default false)
  created_at: timestamp
  updated_at: timestamp

vaulted_items:
  id: uuid
  user_id: uuid (FK)
  item_type: enum (ENCOUNTER, CONNECTION, TEST_RECORD)
  item_id: uuid (FK to the respective table)
  vaulted_at: timestamp

-- New: data retention preferences
data_retention_settings:
  user_id: uuid (PK, FK)
  encounter_retention_days: int (null = forever, e.g., 90, 180, 365, 730)
  test_record_retention_days: int (null = forever, e.g., 365, 730, 1825)
  updated_at: timestamp

-- New: app-level authentication
app_lock_settings:
  user_id: uuid (PK, FK)
  lock_enabled: boolean (default false)
  lock_type: enum (PIN, BIOMETRIC)
  pin_hash: varchar (bcrypt/argon2 hash, null if biometric)
  created_at: timestamp
  updated_at: timestamp
```

---

### Connections FAQ (User-Facing — for site/help section)

**Q: What is a connection?**
A connection means "I had a sexual encounter with this person." It's not a friendship or a follow — it's a health link. You're telling Navilla: if either of us gets sick, the other should know.

**Q: Why should I connect with someone?**
If someone in your network tests positive for an STI, you get an anonymous heads-up so you can get tested early. Without connections, you're using Navilla as a personal health diary. With connections, you get a radar.

**Q: What do I get from connecting?**
Exposure alerts ("There's a chlamydia report in your network, 1st degree, recent"), peace of mind when nothing is reported, network health snapshots, and smarter testing reminders tied to real network activity.

**Q: Can my connection see my health data?**
No. Never. They see your name, avatar, and that you're connected. Your test results, encounter journal, and statistics are invisible to everyone.

**Q: Can I see how many connections my connection has?**
No. You only see your own connections.

**Q: What if I only have 1 or 2 connections and they report something?**
You won't see it. Navilla requires a minimum of 3 connections before showing exposure data. This protects anonymity — with fewer connections, any alert would obviously point to someone specific.

**Q: How do I connect with someone?**
The most common way: share your personal link (e.g., `navilla.app/connect/yourname`) via text, WhatsApp, DM, or however you communicate. They click, accept, done. You can also search by username in the app, or use a QR code if you're face to face.

**Q: What if I hooked up with someone and don't have their contact info?**
You can't connect, and that's okay. Log the encounter in your private journal so you have a record. If you ever find a way to reach them and need to notify them, the anonymous notification feature (Layer 3) can help — even if they're not on Navilla.

**Q: Can someone connect with me without me knowing?**
No. Every connection requires your explicit acceptance. Nobody is added to your network without your consent.

**Q: Can I remove a connection?**
Yes, at any time. Historical exposure data is preserved (you can't un-know something already calculated), but no new data flows between you.

**Q: What if I connect but I'm not opted into the exposure network?**
The connection exists but does nothing for exposure. You're using Navilla as a personal tracker only. Your connections won't see health data from you, and you won't see exposure data from them. The connection becomes active for exposure when you opt in.

**Q: What if I'm opted in but my connection isn't?**
Your data flows into the network, but theirs doesn't. You'll see alerts from other opted-in connections, but nothing from this specific person.

**Q: Do both people need to be opted in for the connection to work?**
For exposure calculations: at least one needs to be opted in for their data to flow. The connection exists regardless. It becomes fully useful when both are opted in.

**Q: What happens if a connection goes stale?**
After 6 months of no activity, Navilla asks both of you: "Is this connection still relevant?" You can keep it active, archive it (removes from exposure calculations but keeps history), or remove it.

**Q: Can my partner see who I'm connected to?**
No. Your connection list is private. If you're concerned about a controlling partner, Navilla has safety features that let you hide specific connections with no visible trace.

**Q: Why can't I connect anonymously?**
Because mutual consent is a core principle. Both people deserve to know and agree that a health link exists between them.

**Q: What's the difference between a connection and an encounter journal entry?**
An encounter journal entry is your private note: "I was with someone on Feb 15." Nobody sees it but you. A connection is a mutual agreement between two Navilla users to be linked for health awareness. You can have encounters without connections (the journal covers those), but connections are what power the exposure network.

---

### Conversion Points (Layer 2 → Layer 3)

| Trigger | CTA |
|---------|-----|
| User logs a positive test result | "Would you like to anonymously notify your connections? Your identity is never revealed." |
| User views an active exposure | "Anonymous notifications help people in your situation get tested early. Learn how it works." |
| User has connections who aren't on Navilla (from Layer 1 encounter journal — unlinked entries) | "You have encounters logged without connections. If you ever need to notify someone anonymously, Navilla can help — even if they're not on the app." |

---

## Layer 3: Anonymous Out-of-Network Notifications (Optional, Lightweight)

### Goal
Allow users to optionally notify past partners who are NOT on Navilla. This is a secondary feature — not the growth engine. The primary exposure notification happens automatically through the Layer 2 network.

### Important Clarification: What's Automatic vs. What's Manual

| Mechanism | How it works | User effort |
|-----------|-------------|-------------|
| **Layer 2 exposure alerts** | User reports positive result → all opted-in connections see anonymized exposure alert automatically | **Zero** — automatic side effect of opting in |
| **Layer 3 out-of-network notification** | User generates an anonymous link and manually sends it to someone not on Navilla | **Manual** — user chooses to do it |

**Layer 2 is the core.** Layer 3 is a nice-to-have for the subset of users who want to reach people outside the network.

### Why Build It At All

Most people won't use this. But some will:
- People in health-conscious communities (especially LGBTQ+) where notification culture is stronger
- People who feel genuine responsibility
- **Legal protection** — in some jurisdictions, knowingly transmitting an STI is a crime. Evidence of attempted notification (even anonymous) could be legally relevant
- **Future: public health partnerships** — a clinic or CENSIDA could use this mechanism to notify on behalf of patients, removing the altruism requirement entirely

### How It Works

**Step 1: User reports a positive result (in Layer 1)**
After logging a positive result, a gentle prompt appears:
> "Would you like to anonymously notify anyone outside your Navilla network? Your identity is never revealed."

**Step 2: Generate a notification link**
- User taps "Create anonymous notification"
- Selects the condition (pre-filled from their report)
- System generates a unique, one-time link: `navilla.app/notify/abc123xyz`
- User copies the link and sends it however they want (WhatsApp, text, DM, email)
- Multiple links can be generated (one per person they want to notify)

**Step 3: Recipient opens the link**
The recipient sees a clean, non-alarming page:

> **You've received an anonymous health notification**
>
> Someone you've been intimate with wants you to know about a potential exposure to [condition name].
>
> This notification was sent anonymously through Navilla. We have no information about who sent this.
>
> **What to do:**
> - [Condition] is testable [X] days after exposure. [Link to window period calculator]
> - Find a testing clinic near you. [Link to clinic finder]
> - Learn more about [condition]. [Link to STI guide]
>
> *Want to take control of your sexual health?* [Create a free Navilla account]

**Step 4: Prosocial feedback (for the sender)**
After generating notifications:
> "You've taken a responsible step. Anonymous notifications like yours help people get tested early."

### Privacy Safeguards

- The link contains NO information about the sender — not even hashed
- Links are one-time use (can only be opened once, then deactivated) to prevent sharing/forwarding
- Links expire after 30 days
- The recipient page has no tracking pixels, no analytics beyond "link was opened"
- Navilla stores: link ID, condition, created_at, opened_at. Does NOT store: sender identity linked to the specific link (the link is dissociated from the user after generation)
- If someone generates a link, changes their mind, and deletes it — the link is deactivated immediately

### Implementation Scope

This is intentionally small:
- One backend endpoint to generate links
- One backend endpoint to serve the notification page
- One frontend screen for generating/managing links
- One public-facing notification landing page
- Estimated effort: 3-5 days

### Data Model (Conceptual — Layer 3)

```
anonymous_notifications:
  id: uuid
  link_code: varchar (unique, URL-safe random string)
  condition: varchar (e.g., 'chlamydia')
  status: enum (ACTIVE, OPENED, EXPIRED, CANCELLED)
  created_at: timestamp
  opened_at: timestamp (null until opened)
  expires_at: timestamp (created_at + 30 days)
  -- NOTE: no user_id FK — link is dissociated from sender after creation
  -- The sender's identity is never stored with the notification
```

---

## Additional Features (Milestone-Gated)

Features below are organized by the userbase milestone needed to justify building them. Do NOT build these prematurely — focus on Layers 0-2 until the milestone is reached.

### Available Now (0 users) — Zero Development Cost

**Reddit Community**
- Create r/NavillaSalud (or similar) as the community hub
- Link from the app's help section: "Join the community"
- Moderate with a small set of rules (no medical advice, no shaming, anonymity respected)
- Zero development cost — Reddit handles everything
- Doubles as a feedback channel and organic content marketing
- Post useful content (STI guides, testing tips) to build SEO backlinks

**Social Media Presence**
- Instagram/TikTok focused on sexual health education (not product marketing)
- Content: myth-busting, testing reminders, destigmatization
- Target: LGBTQ+ community in CDMX initially
- This is marketing, not engineering — but it feeds Layer 0 SEO

---

### At 0-1K Users — Early Traction

**PWA (Progressive Web App)**
> Build this alongside or immediately after Layer 1 — it makes reminders and tracking work as a proper "app."

**What PWA gives you:**
- Installable on home screen (looks and feels like a native app)
- Push notifications (testing reminders, exposure alerts, medication reminders)
- Offline access to Layer 0 content (STI guides, calculator)
- No App Store friction — "go to navilla.app, tap Install"

**Technical requirements (with current React + Vite stack):**
- `vite-plugin-pwa` — handles service worker generation and manifest
- `manifest.json` — app name, icons (192x192 + 512x512 minimum), theme colors, `display: "standalone"`
- Service worker — caching strategy for Layer 0 content (cache-first), API calls (network-first)
- Web Push API integration — for notifications (works on Android + iOS 16.4+)
- HTTPS — already have this

**Estimated effort:** 2-3 days for installable PWA. Another 3-4 days for push notifications.

**PWA limitations vs native (acceptable for now):**
- No App Store presence (can list on Google Play via TWA wrapper later)
- iOS push notifications require "Add to Home Screen" first
- Limited background processing on iOS
- Some biometric APIs unavailable on older devices

**LGBTQ+ Community Outreach (CDMX)**
- Partner with Clínica Condesa (free HIV/STI testing, LGBTQ+-focused, walk-in)
- Approach: offer the window period calculator and clinic finder as free tools they can recommend to patients
- Attend health fairs, pride events, testing drives with a simple presence
- Target PrEP users specifically — they already test quarterly and take daily medication. Layer 1 is immediately valuable to them
- Organic posts in Grindr community boards, LGBTQ+ Facebook groups, local subreddits
- **Messaging: never "STI tracker" — always "your private sexual health companion"**
- Geographic focus: CDMX (Zona Rosa, Condesa) → Guadalajara → Monterrey

---

### At 1K-10K Users — Product-Market Fit Signals

**Health Status Sharing for New Partners**
- Voluntary "health card" — a snapshot: "Last tested: Feb 10, 2026. Results: all negative."
- User generates a temporary, shareable card they can show before an encounter
- Could include verification badge once verification exists
- Think of it as a "health passport" for dating — completely voluntary
- This feature makes sense ONLY when enough users exist that both people in a date might have Navilla

**Onboarding Optimization**
- By now you have data on where users drop off
- A/B test onboarding flows, conversion CTAs, Layer 1 → Layer 2 prompts
- This is iterative improvement, not a feature build

**Localized Content Expansion**
- Expand clinic finder beyond CDMX to major Mexican cities
- Add region-specific pricing to cost estimator
- Translate content to additional Spanish variants if expanding beyond Mexico

---

### At 10K-100K Users — Partnership Territory

**CENSIDA / IMSS / Secretaría de Salud Partnerships**
- At this scale, you have data to show: "X thousand people use our free tools monthly"
- Propose: official clinic directory integration, co-branded testing reminders
- CENSIDA could use Layer 3 anonymous notifications on behalf of patients (removes altruism barrier)
- IMSS could link to Navilla's tools from patient portals
- These partnerships provide credibility AND distribution

**Verification v1 (Simplified)**
- NOT the full provider dashboard from the original playbook (WS-B)
- Simpler: user uploads a photo of test results → Navilla marks it as "document attached" (not verified, but higher confidence than pure self-report)
- Optional: OCR to auto-extract results from common lab report formats (Chopo, Olab, Laboratorio Médico Polanco)
- Full provider verification (WS-B) only if there's clear demand from the partnership channel

**Native Mobile App Evaluation**
- Evaluate whether PWA is sufficient or native is needed
- If App Store presence is critical for growth → React Native or Expo (reuses React knowledge)
- If PWA engagement metrics are strong → stay with PWA, invest elsewhere

---

### At 100K-500K Users — Scale Features

**Telehealth Bridge**
- Partner with telehealth platforms (Doctoralia, Sofia Salud, Médica Sur telemedicina)
- User logs a concern or positive result → one-tap connection to a doctor
- Potential revenue stream: referral fee per consultation
- Only makes sense at scale — telehealth partners need volume to justify integration

**Advanced Analytics & Insights**
- Anonymized, aggregate health trends: "Chlamydia reports in CDMX are up 15% this quarter"
- Useful for public health, useful for users, useful for partnerships
- Requires enough data to be statistically meaningful

**Multi-Language Expansion**
- Portuguese (Brazil — huge market, similar culture)
- English (US expansion — requires HIPAA compliance work)

---

### At 500K+ Users — Ecosystem Play

**Dating App Integration**
- Navilla verification badge on Tinder/Bumble/Grindr profiles
- "Navilla Verified: Tested in the last 30 days"
- Requires partnership agreements — dating apps will want to see massive user numbers
- This is a 2-3 year horizon feature at minimum

**Public Health Collaboration (if approached by health orgs)**
- Anonymized, aggregate STI trend data could be shared with public health departments if they request partnership
- This is NOT a revenue play — it's a credibility and social impact play
- **Navilla does NOT sell user data. Period.** This must be a core brand promise from day one
- Only consider if: fully anonymized, opt-in, ethically reviewed
- Let health orgs come to us with the user base as leverage, don't pursue proactively

---

## Go-to-Market Strategy

### Phase 1: LGBTQ+ Community in CDMX (0 → 1K users)

**Why this segment first:**
- Highest existing awareness of STI testing and prevention
- Strong community networks — organic word-of-mouth
- PrEP users already test quarterly — Layer 1 reminders are immediately valuable
- Concentrated geographically (Zona Rosa, Condesa, Roma) — easy to target
- Tech-savvy, app-friendly demographic

**Channels:**
- Clínica Condesa partnership (free testing clinic, LGBTQ+ focused)
- Organic posts in community groups (Grindr boards, Facebook groups, local subreddits)
- LGBTQ+ health events and pride events
- 2-3 LGBTQ+ micro-influencers in CDMX who talk about health
- Content marketing: sexual health tips on Instagram/TikTok

**Messaging (critical):**
- DO: "Your private sexual health companion — track testing, get reminders, stay informed"
- DON'T: "STI exposure tracker" or anything fear-based
- The tone is empowerment, not alarm

### Phase 2: Health-Conscious Sexually Active Adults (1K → 10K users)

**Expand beyond LGBTQ+ to anyone who:**
- Uses dating apps regularly
- Gets tested periodically
- Takes PrEP or is considering it
- Is in non-monogamous relationships

**Channels:**
- SEO from Layer 0 tools (window period calculator, STI guides in Spanish)
- Reddit community (r/NavillaSalud + posts in r/mexico, r/sexualhealth)
- University health centers in CDMX (UNAM, Tec, Ibero)
- Word of mouth from Phase 1 users

### Phase 3: Mainstream + Partnerships (10K → 100K users)

- CENSIDA/IMSS partnerships for distribution
- Content marketing at scale
- Potential press coverage ("Mexican startup builds privacy-first sexual health app")
- Expand to Guadalajara and Monterrey

---

## Week-by-Week Roadmap (AI-Assisted Development)

> **Assumptions:**
> - One developer + AI agents (Claude, potentially others)
> - Continuing with existing codebase (see "Codebase Decision" section below)
> - Medical content review happens in parallel (non-blocking)
> - Some weeks can be parallelized with multiple agents

### Phase 0: Foundation (Week 1)

| Week | Focus | Deliverables |
|------|-------|-------------|
| 1 | Architecture decisions + planning | Configure vite-plugin-prerender + react-helmet-async for Layer 0 SEO. Align AGENT_EXECUTION_PLAYBOOK with new roadmap. Cleanup sprint on existing codebase (verify tests pass, remove dead code) |

### Phase 1: Layer 0 — Public Tools (Weeks 2-4)

| Week | Focus | Deliverables |
|------|-------|-------------|
| 2 | Window period calculator + first 5 STI guides | Interactive calculator (date input → results table). AI-draft 5 STI guides (chlamydia, gonorrhea, syphilis, HIV, herpes). Basic page layout with disclaimers and source citations |
| 3 | Remaining content + symptom filter on guides | 5 more STI guides (HPV, Hep B, Hep C, trichomoniasis, mycoplasma). Symptom filter on guides index: select symptoms as chips, cards filter by OR match, sorted by match count, per-card matched symptom chips. |
| 4 | SEO + cost estimator + polish | Cost estimator with Mexico pricing. Open Graph tags, structured data, sitemap. Bilingual content (en_US primary, es_MX alongside). Conversion CTAs on every page. Deploy Layer 0. Note: full path-prefix i18n routing (`/es/*`) is a Phase 2 task — see SEO section |

#### Progress Snapshot (February 26, 2026)

- **Week 2 status:** ✅ Complete.
- **Week 3 status:** ✅ Complete.
- **Completed this session (Week 3 — Symptom Filter):**
  - `SYMPTOM_LABELS` — 10 bilingual symptom keys added to `stiContent.ts` (single source of truth, self-documenting with maintainability guide)
  - `symptoms[]` arrays added to all 10 STI entries (data sourced from CDC/WHO clinical guidelines)
  - `useSymptomFilter` hook — 3 pure exported functions (`computeMatchCounts`, `computeVisibleSlugs`, `computeAvailableSymptoms`) + thin React hook wrapper; fully unit-tested (12 tests)
  - Guides index filter bar: selected chips (removable), smart `[+ Add symptom]` dropdown (hides symptoms that can't reveal new cards), `Clear all`
  - Cards filter by OR match, sort by match count descending, per-card matched symptom chips
  - Full bilingual support (EN/ES throughout)
  - Pre-existing `Header.test.tsx` failure fixed (`navbar--transparent` → `navbar--landing-top` after glass header refactor)
- **Completed in earlier sessions:**
  - renderMarkdown micro-renderer utility (zero-dependency, converts `- bullets` / `**bold**` → React elements)
  - `tagline` + `facts` (type/curable/vaccine) fields added to all 10 STI entries
  - Fact chips component (`FactChips`) — Bacterial/Viral/Parasitic + Curable/Lifelong + Vaccine
  - Guide index cards enriched: tagline + 3 fact chips + window period footer
  - Guide detail page: QuickStatsBlock (chips + window + CTA), unique per-section icons, renderMarkdown body text
  - Calculator: per-row progress bar (daysWaited / minDays, indigo=waiting, green=testable)
  - All 10 STI guide objects written with full content (chlamydia, gonorrhea, syphilis, HIV, herpes, HPV, Hep B, Hep C, Trichomoniasis, Mycoplasma)
  - Landing page content and IA simplified for scanability.
  - Footer-linked informational pages refreshed (`How It Works`, `Privacy`, `Privacy Policy`, `Terms`, `Help`, `About`, `Security`).
  - Site-wide cookie notice banner added.
  - Header UX upgraded to consistent glass states (landing dark + warm app chrome).
  - Window period calculator (date input → results table).
- **Won't Do (descoped):**
  - ~~Standalone symptom guide~~ — replaced by symptom filter on guides index.
  - ~~CDMX clinic finder~~ — Google Maps already solves this better. Future: revisit if we partner with labs (Chopo, Salud Digna) to offer discount codes + verified result upload. Labs would gain a referral channel; users get integrated verified results.
- **Week 4 status:** ✅ Complete.

#### Authoritative STI Content Sources

All factual content (symptoms, testing windows, treatment) must be verified against these sources before public launch. Future: schedule a periodic crawl/refresh pipeline.

**English**
- [CDC STIs](https://www.cdc.gov/sti/) — US government, per-condition fact sheets, most comprehensive
- [WHO STIs](https://www.who.int/news-room/fact-sheets/detail/sexually-transmitted-infections-(stis)) — International, global epidemiology
- [MedlinePlus](https://medlineplus.gov) — NIH consumer health, plain language
- [Mayo Clinic](https://www.mayoclinic.org) — Clinical detail, symptom-level accuracy
- [NHS](https://www.nhs.uk) — UK government, excellent plain-language guides
- [Planned Parenthood](https://www.plannedparenthood.org) — Sexual health specific, bilingual
- [Office on Women's Health](https://womenshealth.gov) — Bilingual fact sheets

**Spanish / Mexico**
- [CENSIDA](https://www.gob.mx/censida) — Mexico's primary HIV/STI authority
- [Secretaría de Salud](https://www.gob.mx/salud) — National health ministry
- [IMSS](https://www.imss.gob.mx) — Largest insurer, clinical guidelines
- [OPS/PAHO](https://www.paho.org) — Pan-American WHO, structured data
- [UNFPA México](https://mexico.unfpa.org) — Reproductive rights focus
- [AHF México](https://ahfmexico.org.mx) — Free testing, practical local info
- [MedlinePlus en Español](https://medlineplus.gov/spanish/) — NIH quality in Spanish

### Phase 2: Layer 1 — Personal Tracker (Weeks 5-9)

| Week | Focus | Deliverables |
|------|-------|-------------|
| 5 | Encounter journal | Backend: encounter_journal table, API (CRUD), encryption. Frontend: journal UI (log entry, timeline view, monthly summary). Client-side encryption for notes field |
| 6 | Testing history tracker | Backend: test_records + test_record_results tables, API. Frontend: testing log UI, per-condition history, "days since last test" counter. Document upload (encrypted storage) |
| 7 | Smart reminders + medication tracking | Backend: medications, medication_logs tables, reminder engine. Frontend: reminder settings, PrEP tracker, vaccination tracker, treatment course tracker. Push notification groundwork |
| 8 | Personal insights + doctor visit prep | Frontend: insights dashboard (activity summary, testing summary, prevention summary). Doctor visit prep: generate summary, PDF export. Saved clinics feature |
| 9 | PWA + Layer 1 polish | PWA: vite-plugin-pwa setup, manifest, service worker, push notifications. Install prompt. Offline caching for Layer 0 content. Layer 1 end-to-end testing. Bug fixes and UX polish |

#### Progress Snapshot (February 27, 2026)

- **Week 5 status:** ✅ Complete (ahead of schedule — delivered extras beyond spec).
- **Completed (Week 5 — Encounter Journal + Partners + Polish):**
  - Migration `008_encounter_journal.sql`: `encounter_journal` + `journal_field_templates` tables, AES-256-GCM encryption
  - Migration `009_journal_partners.sql`: `journal_partners` table with soft-delete, `partner_id` FK on encounter_journal
  - Backend: `EncounterJournalService`, `JournalPartnerService`, 16 REST endpoints, Micrometer metrics, 105 backend tests passing
  - Frontend: JournalPage with timeline/calendar views, JournalEntryModal with partner picker autocomplete, JournalCalendar grid, JournalTimeline grouped by month, JournalPartnersTab, PartnerDetailPage with soft/destructive delete
  - Promote-to-partner toast (3rd encounter heuristic)
  - 196 frontend tests passing, full i18n (en_US + es_MX)
- **Completed (Week 5 — UX polish, beyond original spec):**
  - Calendar smart skip navigation: `«`/`»` buttons jump to nearest month with entries, "Today" pill, boundary feedback
  - Encounter date validation: constrained between user DOB and today (matches HealthStatusPage pattern)
  - View toggle hierarchy: Timeline/Calendar grouped under "View" label, Partners separated by divider
- **Deferred (not blocked, will add when needed):**
  - ~~Client-side encryption for notes~~ — server-side AES-256-GCM is in place; client-side E2E encryption deferred to a future security sprint (requires key management UX)
  - ~~Protection used (multi-select) + Encounter type (multi-select)~~ — specced in Feature 1.1 but deferred to Week 8 (Personal Insights). Rationale: these structured fields exist to power computed insights like "83% of encounters were protected." Custom fields already let users note protection freeform. No real users are logging entries yet, so no backfill problem. Adding two dropdowns + a migration is a half-day task — do it in Week 8 when we actually build the insights dashboard that consumes the data. Decision: 2026-02-27, product owner approved

- **Week 6 status:** ✅ Complete
- **Completed (Week 6 — Health Log):**
  - Migration `010_health_log.sql`: `labs`, `lab_credentials`, `test_visits`, `test_results` tables with AES-256-GCM encryption
  - Backend: `LabService` (lab CRUD + credentials), `HealthLogService` (visit CRUD, summary, condition history, write-through sync to health_status)
  - Backend: `HealthLogController` with 11 endpoints, 14 integration tests, 159 total backend tests passing
  - Frontend: HealthLogPage dashboard (stats bar, exposure overview, condition cards), ConditionDetailPage (per-condition timeline), TestVisitModal (log/edit visits), LabPicker (autocomplete + inline creation), HealthLogStats, ConditionCard
  - React Query hooks for all endpoints, 236 frontend tests passing, full i18n (en_US + es_MX)
  - Routing: `/health-log` + `/health-log/:condition`, `/health` redirects, nav updated
- **Deferred (Week 6):**
  - Document upload infrastructure (Week 9 — `document_ref_encrypted` column ready)
  - Chopo/Salud Digna verification endpoint (future — schema supports it via `labs` + `lab_credentials`)
  - Verified badge UI (needs verification endpoint first)

- **Week 7 status:** ✅ Complete
- **Completed (Week 7 — Smart Reminders + Medication Tracking):**
  - Migration `011_reminders_medications.sql`: `medications`, `medication_logs`, `vaccinations`, `reminders`, `reminder_settings` tables with AES-256-GCM encryption
  - Configuration-driven health catalog (`navilla.health-catalog` in application.yaml) — all medication types, vaccine series, frequencies, heuristic thresholds in YAML. No hardcoded enums. Adding new types = YAML only
  - Backend: `MedicationService`, `VaccinationService`, `ReminderService`, `ReminderCalculationEngine`, `ReminderSchedulerJob` (daily cron)
  - Backend: `CatalogController` (public), `MedicationController` (7 endpoints), `VaccinationController` (4 endpoints), `ReminderController` (8 endpoints), 234 backend tests
  - Frontend: 15 DTO types, 14 API methods, 4 hook files, 10 new components
  - Health Log → "My Health" tabbed page: Upcoming Reminders + Tests/Medications/Vaccines tabs
  - Dashboard redesign: "Next Up" widget, quick actions, removed profile card, 2-col layout
  - Partner creation modal in JournalPartnersTab (quick win)
  - Full i18n (~100 new keys), 237 frontend tests
- **Deferred (Week 7):**
  - Push notifications (Week 9 — PWA)
  - Email digest sending (toggle stored, sending in Week 9)
  - E2E tests for scheduler

- **Week 8 status:** ✅ Complete
- **Completed (Week 8 — Personal Insights + Onboarding + Quick Wins):**
  - Migration `012_encounter_fields.sql`: encounter type + protection fields (encrypted BYTEA columns)
  - Backend: `InsightsService` (aggregates data from 7 repositories), `InsightsController` at `GET /api/insights` (ActivitySummary, TestingSummary, PreventionSummary)
  - Backend: PrEP adherence streaks (`MedicationService.getPrepStreak()` — current/longest streak, milestones at 7d/30d/90d)
  - Backend: Encounter type catalog (5 types) + protection method catalog (7 methods) via `CatalogController`
  - Frontend: Personal Insights page (3-card layout: Activity, Testing, Prevention), loading skeleton, milestone badges
  - Frontend: Guided onboarding flow (3-step modal with localStorage persistence)
  - Frontend: Encounter type + protection multi-select chip UI in `JournalEntryModal`
  - Frontend: Toast notification system (global `ToastContext`, auto-dismiss, `prefers-reduced-motion`, `aria-live`)
  - Frontend: Route-level code splitting (31 lazy-loaded pages, 58 JS chunks)
  - 258 backend + 273 frontend = **531 tests passing**
  - Full i18n (~50 new keys in en_US + es_MX)

- **Week 9 status:** ✅ Complete
- **Completed (Week 9 — PWA + Push Notifications + Caching + Email):**
  - Migration `013_push_subscriptions.sql`: `push_subscriptions` table with AES-256-GCM encrypted endpoint/p256dh/auth
  - Backend: Caffeine cache setup (`@EnableCaching`, 4 named caches: catalog 1hr, healthLogSummary 5min, insights 5min, prepStreak 10min)
  - Backend: Web Push service (VAPID/RFC 8030 via jose4j), `PushSubscription` entity + CRUD controller at `/api/push/*`
  - Backend: Email infrastructure — SendGrid HTTP API v3, Thymeleaf templates (en/es), `EmailService` with fire-and-forget delivery
  - Backend: Email digest job (`@Scheduled` daily — weekly digest with PrEP adherence, testing status, upcoming reminders, vaccine due dates)
  - Backend: Push wired into `NotificationService.createNotification()` — single push point for all 10 NotificationType values
  - Frontend: PWA manifest + icons (vite-plugin-pwa, `injectManifest` strategy, Workbox precaching + runtime caching)
  - Frontend: Install prompt + offline indicator + update prompt (SKIP_WAITING flow)
  - Frontend: Push subscription hook (`usePushNotifications`), push toggle in `ReminderSettingsModal`
  - Frontend: Custom service worker (precaching + NetworkFirst API + StaleWhileRevalidate catalog + CacheFirst fonts/images)
  - 299 backend tests passing, frontend lint + build clean
  - Full i18n (~15 new keys in en_US + es_MX)
  - Email delivery validated end-to-end via SendGrid HTTP API on Railway

### Phase 3: Layer 2 — Network Enhancements (Weeks 10-14)

| Week | Focus | Deliverables |
|------|-------|-------------|
| 10 | Shareable connection links + reciprocity opt-in | Backend: connection_invites table, invite link generation/redemption API. Frontend: share link UI, "Join exposure network" opt-in flow with ACEPTO confirmation. Non-user landing page for invite links |
| 11 | Exposure recency buckets (WS-A from playbook) | Backend: recency metadata in exposure API response (0-30d, 31-90d, 91-365d, 365d+). Frontend: updated exposure dashboard with recency labels, visual de-emphasis of old data. Update How It Works page |
| 12 | Vault + app lock + notification privacy | Backend: user_vault, vaulted_items tables. Frontend: vault activation via search phrase, vault/unveil UI, auto-lock timer. App-level PIN lock. Vague notification previews |
| 13 | Data retention + connection staleness | Backend: retention settings, daily cleanup job. Staleness detection + notification. Frontend: retention settings UI, connection reconfirmation prompts, archive flow |
| 14 | Network health stats + Layer 2 polish | Backend: aggregated network health calculation. Frontend: network health dashboard (High/Medium/Low testing activity). End-to-end testing for all Layer 2 features. Bug fixes |

#### Progress Snapshot (March 4, 2026)

- **Week 10 status:** ✅ Complete
- **Completed (Week 10 — Network Foundation: Reciprocity, Catalog, Phone Matching):**
  - Migration `014_network_foundation.sql`: 6 new tables (`condition_catalog`, `network_stages`, `app_config`, `connection_phone_entries`, `phone_blocks`, `phone_reports`) + 3 ALTER TABLE (users, connections, encounter_journal)
  - Backend: DB-driven condition catalog (`ConditionCatalogEntry` + service) replacing hardcoded `ConditionType` enum. All services refactored to use `String` + catalog validation
  - Backend: Runtime app config (`AppConfig` + service) — key-value configuration for reciprocity cooldown, phone match window, etc. No redeployment needed
  - Backend: Network stages (`NetworkStage` + service) — configurable constellation stage thresholds via DB
  - Backend: Reciprocity system (`ReciprocityService` + `ReciprocityController`) — opt-in/opt-out with 15-day configurable cooldown. `ExposureService` now guards with reciprocity check
  - Backend: Phone matching (`PhoneMatchService`) — SHA-256 + pepper hashing, rate-limited entry registration, mutual match detection within configurable date window. `PhoneMatchJob` for async background processing. `PhoneNotificationMatchService` for confirm/deny/block/report
  - Backend: `ConnectionType` enum (`PHONE_MATCH`, `NOTIFICATION_MATCH`, `EXPLICIT`, `LINK`) on `Connection` entity
  - Backend: New exceptions — `RateLimitException` (429), `CooldownActiveException` (403)
  - Frontend: Reciprocity API + hooks (`useReciprocityStatus`, `useOptIn`, `useOptOut`), `ReciprocityOptInCard` (3 states), DashboardPage integration
  - Frontend: Phone field in `JournalEntryModal` (type=tel, maxLength=20), catalog-driven `TestVisitModal` condition dropdown
  - Frontend: Phone match hooks (`usePendingPhoneMatches`, `useConfirmPhoneMatch`, `useDenyPhoneMatch`, `useBlockPhoneNumber`)
  - Frontend: Catalog hooks (`useConditionCatalog`, `useNetworkStages`)
  - New API endpoints: `GET /api/catalog/conditions`, `GET /api/catalog/stages`, `GET /api/reciprocity/status`, `POST /api/reciprocity/opt-in`, `POST /api/reciprocity/opt-out`
  - **370 backend tests passing** (was 299), frontend lint + build clean
  - Full i18n (~20 new keys in en_US + es_MX)
  - Design docs: `docs/plans/2026-03-04-phase3-redesign-design.md`, `docs/plans/2026-03-04-phase3-implementation.md`
- **Note:** Week 10 scope diverged from the original roadmap table (which specified shareable connection links + invite landing page). The actual implementation focused on the network foundation layer: reciprocity opt-in, DB-driven catalogs, and phone-based matching — prerequisites for all subsequent Layer 2 features. Shareable connection links will be addressed in a future week.

### Phase 4: Layer 3 + Launch Prep (Weeks 15-16)

| Week | Focus | Deliverables |
|------|-------|-------------|
| 15 | Anonymous notifications + content verification | Backend: anonymous_notifications table, link generation/serving. Frontend: notification generation screen, public landing page. Verify all Layer 0 content against official sources for accuracy — including symptom-to-STI mappings (SYMPTOM_LABELS + symptoms[] arrays in stiContent.ts) |
| 16 | Launch prep + security hardening | Final testing pass (unit + E2E). Performance optimization. Content accuracy fixes. **API security hardening** (see details below). Reddit community created. Social media accounts set up |

#### Week 16: API Security Hardening (Details)

Security measures to implement before soft launch. Not needed during POC phase (free-tier infra limits exposure), but mandatory before real users arrive.

**Rate limiting (Bucket4j + Spring Boot):**
- Write operations (create/update/delete): 30 req/min per user
- Read operations (list/get): 120 req/min per user
- Auth-sensitive endpoints (connections): 10 req/min per user
- Global per-IP fallback: 300 req/min
- Return 429 Too Many Requests with Retry-After header

**Per-user resource caps (hard limits, checked on every create):**
- Journal entries: 10,000 per user
- Partners: 500 per user
- Custom field templates: 10 per user
- Test visits: 5,000 per user
- Labs: 50 per user
- Connections: 500 per user

**Request body size limits:**
- `server.tomcat.max-http-post-size: 1MB`
- `spring.servlet.multipart.max-file-size: 1MB`

**Validation sweep:**
- Ensure all DTOs have `@Size` constraints on every string field (backend)
- Ensure all inputs have `maxLength` attributes (frontend)
- Fill gaps: `UpdateLabRequest`, `UpdateTestVisitRequest` missing validation

**Abuse detection (Grafana/Loki alerting rules):**
- Alert on >100 writes/hour from single user
- Alert on >1000 requests/hour from single IP
- Log authentication failures with IP + user agent

**OWASP top 10 check:**
- SQL injection (JPA parameterized queries — already safe)
- XSS (React auto-escaping — already safe)
- CSRF (stateless JWT — N/A)
- Broken auth (Supabase JWT verification — already solid)
- Security misconfiguration (review headers, error responses, actuator exposure)
- Sensitive data exposure (encryption audit — AES-256-GCM already in place)

### Phase 5: Soft Launch + Growth (Weeks 17-20)

| Week | Focus | Deliverables |
|------|-------|-------------|
| 17 | Soft launch — LGBTQ+ CDMX | Deploy to production. Begin Clínica Condesa outreach. Organic community posts. Monitor error rates and user feedback |
| 18 | Iterate on feedback | Bug fixes from real usage. UX improvements based on user behavior. Content corrections if any |
| 19 | Content marketing + community | Reddit community active posting. Instagram/TikTok health content. University health center outreach (UNAM, Tec) |
| 20 | Growth assessment + next phase planning | Analyze: user signups, retention, Layer 1 engagement, Layer 2 opt-in rate. Decide: double down on current approach or pivot. Plan next quarter |

### Summary Timeline

```
Week  1       ████ Foundation + decisions
Weeks 2-4     ████████████ Layer 0 (public tools)
Weeks 5-9     ████████████████████ Layer 1 (personal tracker)
Weeks 9       ████ PWA
Weeks 10-14   ████████████████████ Layer 2 (network enhancements)
Weeks 15-16   ████████ Layer 3 + launch prep
Weeks 17-20   ████████████████ Soft launch + growth
              |----|----|----|----|
              M1   M2   M3   M4   M5
```

**Total: ~20 weeks (5 months) to soft launch**

---

## Codebase Decision: Continue, Don't Restart

> **Decision: Continue with the existing codebase. Do NOT start from scratch.**

**What already exists and is reusable:**

| Existing Feature | Reuse for |
|-----------------|-----------|
| Supabase Auth (login, signup, password reset) | All layers — auth is done |
| User entity + API (/api/users/me) | Layer 1 (extend with new fields) |
| Connection CRUD (request, accept, deny, remove) | Layer 2 (extend with invites, staleness, archiving) |
| Health status reporting API | Layer 1 testing tracker (adapt), Layer 2 exposure (keep) |
| Exposure calculation (BFS, 5 degrees, 3-connection threshold) | Layer 2 (add recency buckets on top) |
| Notifications system (in-app + header preview) | All layers (extend with push via PWA) |
| i18n infrastructure (en_US + es_MX) | All layers — just add new keys |
| Dashboard + Health pages | Layer 1 + 2 (extend, not rewrite) |
| E2E test infrastructure (Playwright) | All layers |
| CI/CD (GitHub Actions) | All layers |
| Docker configuration | Deployment |
| Checkstyle + code quality | Backend consistency |

**What's NEW (doesn't exist yet):**

| New Feature | Build from scratch |
|------------|-------------------|
| Layer 0 public pages | Yes — pre-rendered routes within existing Vite SPA |
| Encounter journal | Yes — new backend tables + frontend pages |
| Testing history tracker | Partially — extend existing health status system |
| Reminders + medication tracking | Yes — new backend + frontend |
| Insights dashboard | Yes — new frontend (data comes from existing + new APIs) |
| PWA support | Yes — plugin + configuration |
| Shareable connection links | Yes — new backend endpoint + public landing page |
| Reciprocity opt-in | Yes — new backend field + frontend flow |
| Vault system | Yes — new backend tables + frontend UI |
| Data retention | Yes — new backend job + settings |
| Anonymous notification links | Yes — new backend + simple public page |

**Layer 0 uses pre-rendering within the existing SPA** (vite-plugin-prerender). No separate framework. See "Rendering Strategy" section above.

**Why not restart:**
- You'd lose 2-3 months of work (auth, connections, exposure algorithm, notifications, testing infrastructure)
- The existing code works — it needs features added, not a rewrite
- The tech stack (Java 25 + Spring Boot 4, React 19 + Vite + TypeScript) is modern and solid
- Starting over introduces new bugs in systems that are already working

**One recommendation:** Before starting new feature work, do a quick cleanup sprint (2-3 days):
- Verify all existing tests pass
- Clean up any dead code from iterations
- Ensure the development environment runs cleanly
- This gives you a solid baseline to build on

---

## React Native Strategy

> **Decision: Web first → PWA → React Native. Separate repo for mobile.**

### Why Web First
- Backend is the same either way — build it once, both platforms consume the same API
- Web validates the product faster (no App Store review cycles, instant deploys)
- Layer 0 (SEO acquisition) must be web — no way around it
- PWA bridges the gap until native is ready (installable, push notifications, home screen icon)
- If the product doesn't resonate, you haven't sunk months into native dev

### When to Start React Native
- After web soft launch + initial user feedback (~Week 20-24)
- When daily active usage of Layer 1 confirms the tracker concept works
- When PWA limitations become real blockers, not theoretical ones

### Long-Term Platform Split
```
Web app (this repo)       → Layer 0 SEO acquisition + lightweight Layers 1-3 + admin
Mobile app (separate repo) → Primary experience for Layers 1-3 (daily tracker, reminders, connections)
Backend (this repo)        → Shared API for both platforms
```

### What to Structure NOW for React Native Later

The code you write today for the web app should be organized so the **business logic and types are easily portable** to React Native. React Native uses React + TypeScript — same language, same patterns. What CANNOT be shared is UI components (DOM vs native views) and navigation. What CAN be shared is everything else.

**Shareable between web and React Native (structure these as clean, importable modules):**

| What | Where to put it | Why it's shareable |
|------|----------------|-------------------|
| TypeScript types/interfaces (DTOs, enums, models) | `frontend/src/types/` | Identical in both platforms |
| API client (fetch calls, endpoints, error handling) | `frontend/src/lib/api.ts` | Same HTTP calls, same API |
| React Query hooks (useUser, useConnections, useExposure, etc.) | `frontend/src/hooks/` | React Query works in React Native |
| Validation logic (form validation, business rules) | `frontend/src/lib/validators.ts` | Pure functions, no DOM dependency |
| i18n locale files (en_US.json, es_MX.json) | `frontend/src/locales/` | JSON files work everywhere |
| Constants (STI lists, recency buckets, config) | `frontend/src/lib/constants.ts` | Pure data, no platform dependency |
| Auth logic (Supabase client, session management) | `frontend/src/lib/auth.ts` | Supabase has a React Native SDK |
| Utility functions (date formatting, encryption helpers) | `frontend/src/lib/utils.ts` | Pure functions |

**NOT shareable (will be rewritten in React Native):**

| What | Why |
|------|-----|
| UI components (pages, forms, buttons, layout) | React DOM elements vs React Native `<View>`, `<Text>`, etc. |
| CSS / TailwindCSS styling | React Native uses `StyleSheet`, not CSS (though NativeWind exists as a bridge) |
| React Router navigation | React Native uses React Navigation |
| Browser APIs (localStorage, DOM events) | Different platform APIs |

**Coding rules to follow NOW (enforced in every session):**
1. **Never put business logic inside UI components.** Extract it into hooks or utility functions. A component should call `useEncounterJournal()` — it should not contain fetch calls or data transformation inline
2. **Never put API URLs or endpoints in components.** They live in `api.ts` only
3. **Keep types in `types/`.** Every API response shape, every form input shape, every enum — in a types file, not co-located with a component
4. **Keep validation in `lib/validators.ts`.** Form validation rules are pure functions that take data and return errors. No DOM, no React, no components
5. **Use React Query hooks as the data layer.** These hooks work identically in React Native. If all data access goes through hooks, the React Native app just imports the same hooks and wraps them in different UI

**When the React Native project starts:**
- Create a new repo: `navilla-mobile`
- Copy over: `types/`, `lib/`, `hooks/`, `locales/` from the web frontend
- Build new UI with React Native components (using the same hooks and types)
- Point at the same backend API
- The mobile app is a new UI skin on top of the same logic layer

### React Native Tech Stack (Preliminary)
- **Framework:** React Native with Expo (simplifies build/deploy significantly)
- **Navigation:** React Navigation
- **State:** React Query (same as web)
- **Styling:** NativeWind (TailwindCSS for React Native) — optional, reduces style rewrite effort
- **Auth:** Supabase React Native SDK (@supabase/supabase-js works in RN)
- **Push notifications:** Expo Notifications
- **Biometrics:** expo-local-authentication (for app lock feature)
- **Secure storage:** expo-secure-store (for vault, encrypted data)

---

## How This Compares to AGENT_EXECUTION_PLAYBOOK.md

The playbook was designed to improve an existing product. This roadmap is designed to build a product people want to use. Here's how they relate:

### What Stays Relevant

| Playbook Item | New Roadmap Equivalent | Status |
|--------------|----------------------|--------|
| WS-A: Exposure recency buckets | Layer 2, Week 11 | Kept — still highest priority for Layer 2 |
| WS-C: Connection lifecycle (staleness, reconfirmation) | Layer 2, Feature 2.2 + 2.7, Week 13 | Kept — expanded scope |
| WS-D: Privacy controls | Layer 2, Feature 2.6 + 2.8 + 2.9, Weeks 12-13 | Kept — significantly expanded (vault, retention, reciprocity) |
| WS-E: Notifications UX (already completed items) | Layer 2 | Completed work stays |
| Engineering gates (tests, docs, build checks) | Applies to all phases | Kept as-is |
| Footer content audit | Layer 0 + Phase 4 launch prep | Kept — folded into content review |

### What Gets Deprioritized

| Playbook Item | Why | When Instead |
|--------------|-----|-------------|
| WS-B: Verification tiers (provider accounts, dashboards, audit logs) | Massive effort, only matters at scale | 10K-100K users (simplified version first — document upload, not provider dashboard) |
| WS-E: Notification preferences (channel/frequency/quiet hours) | Nice-to-have, not growth-critical | After soft launch, based on user feedback |
| WS-E: Onboarding activation checklist | Wrong pattern for a health app — feels gamified and tone-deaf | Replace with natural Layer 1 → Layer 2 conversion prompts |
| 12-week execution plan (Weeks 7-12: provider accounts, anti-abuse, pilot, lab integration) | Premature — no users to pilot with | Revisit after 10K users |

### What's Entirely New (Not in the Playbook)

| New Item | Why It Matters |
|---------|---------------|
| Layer 0: Public tools & education | SEO acquisition, day-0 value, no account needed |
| Layer 1: Personal tracker (encounter journal, testing, reminders, insights) | Day-1 value, retention, cold-start solution |
| Shareable connection links | Primary growth mechanic for connections |
| Vault system | Safety feature for controlling relationship scenarios |
| Data retention controls | User autonomy + privacy protection |
| Reciprocity model | Fair exchange — prevents free-riding |
| PWA | Mobile experience without app store friction |
| Go-to-market strategy | The playbook had no growth plan |
| LGBTQ+ CDMX launch strategy | Specific, actionable first-adopter plan |

### Recommendation: Update the Playbook

The AGENT_EXECUTION_PLAYBOOK.md should be updated to align with this roadmap:
- Replace WS-A through WS-E with the new Layer-based phasing
- Update the 12-week plan to match the 20-week roadmap
- Keep the engineering gates and quality standards
- Keep the agent update protocol
- Remove or archive the provider verification workstream (WS-B) for later
- Add Layer 0 and Layer 1 as new workstreams

> **NEEDS REVIEW** — Do not update the playbook until this roadmap is approved. Both documents should be aligned, not contradictory.

---

## Change Log

### 2026-02-25
- Document created
- Layer 0 fully defined: window period calculator, STI education library, symptom guide, testing location finder, cost estimator
- Content sourcing strategy defined (manual curation + AI drafting, no scraping)
- Legal/compliance baseline documented
- SEO acquisition strategy outlined
- SSR/rendering architecture options documented (NEEDS REVIEW — decision pending)
- Layer 1 fully defined: encounter journal, testing tracker, smart reminders, personal insights, doctor visit prep, saved clinics
- Layer 1 data model (conceptual) added
- Layer 1 → Layer 2 conversion points defined
- Layer 2 fully defined: connection methods, lifecycle states, privacy model, exposure calculation, network health stats, reconfirmation system
- Layer 2 data model additions documented
- Layer 2 → Layer 3 conversion points defined
- Mapped existing vs. new features for Layer 2
- Added Feature 2.8: Private Vault — hidden safety feature for coerced disclosure protection
- Added Feature 2.9: Data Retention Controls — auto-delete with configurable windows
- Updated Feature 2.6: Privacy model changed to reciprocity + permanent opt-in (typed confirmation, cannot be reversed)
- Added app-level lock, notification privacy, and quick exit safety features
- Updated data model with vault, retention, app lock, and opt-in tracking tables
- Added Connections FAQ (user-facing, 16 questions) for future site/help section
- Layer 3 reframed: lightweight optional feature, not growth engine. Automatic exposure alerts are Layer 2
- Layer 3 fully defined: anonymous link generation, privacy safeguards, simple data model
- Additional features organized by userbase milestone (0, 1K, 10K, 100K, 500K+)
- Go-to-market strategy: LGBTQ+ CDMX first → health-conscious adults → mainstream + partnerships
- PWA technical requirements documented
- 20-week roadmap with week-by-week deliverables
- Codebase decision: continue with existing code, don't restart
- Playbook comparison: mapped existing WS-A through WS-E to new layer model, identified what stays/changes/is new
- Rendering strategy decided: pre-render Layer 0 within Vite SPA (vite-plugin-prerender). No Astro/Next.js
- Fixed hosting reference: Railway (backend + frontend), not AWS
- Fixed language priority: English primary, Spanish secondary
- Added database migration strategy to CLAUDE.md
- React Native strategy: web first → PWA → React Native (Expo). Separate repo when ready
- React Native prep rules: keep business logic, types, API client, hooks, validators portable
- Added React Native tech stack (Expo, React Navigation, NativeWind, Supabase RN SDK)
- Updated CLAUDE.md with React Native prep coding rules enforced per session
- Added blur teaser UX for reciprocity opt-in (cosmetic blur, API sends no data to non-opted users)
- Added conversation scripts feature to connection sharing flow (copy-paste message templates)
- Cost estimator changed from exact MXN amounts to tier labels (Free / $ / $$ / $$$)
- Medical review removed as requirement — cite sources directly, doctor review is future enhancement when budget allows
- Panic button / quick exit marked as future nice-to-have (more relevant for mobile)
- Removed data licensing / data selling from 500K+ features — Navilla does NOT sell data, ever

### 2026-02-27
- Week 5 (Encounter Journal) marked ✅ complete — progress snapshot added to Phase 2
- Delivered beyond spec: journal partners/regulars feature (not in original Week 5 scope)
- Calendar smart skip navigation: `«`/`»` jump to nearest month with entries, "Today" pill, boundary feedback
- Encounter date validation: DOB min + future max constraints on date input and submit handler
- View toggle hierarchy: Timeline/Calendar grouped under "View" label, Partners visually separated
- Client-side E2E encryption for notes descoped from Week 5 — server-side AES-256-GCM sufficient for now
- Updated Week 1 and Week 15-16 roadmap to reflect no-Astro and no-medical-review decisions
- Added trust/UX polish emphasis to CLAUDE.md quality standards
- Week 6 (Health Log) marked ✅ complete — progress snapshot added to Phase 2
- Health Log replaces Health Status page: parent-child data model (visits → results), normalized lab storage, write-through sync to health_status
- 4 new tables: `labs`, `lab_credentials`, `test_visits`, `test_results` (migration 010)
- 11 new API endpoints under `/api/health-log/` (visits CRUD, summary, condition history, labs CRUD)
- 6 new frontend components: HealthLogPage, ConditionDetailPage, TestVisitModal, LabPicker, HealthLogStats, ConditionCard
- 159 backend tests, 236 frontend tests passing
- Deferred: document upload (Week 9), Chopo/Salud Digna verification, verified badge UI
