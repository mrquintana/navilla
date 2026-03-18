# Navilla — Roadmap Summary

> **Core positioning:** "Your private sexual health companion" — empowering, broad, not scary.
> Full detailed specs: `docs/plans/full-roadmap.md`

## Product Layer Architecture

| Layer | Name | Requires Account | Purpose |
|-------|------|-----------------|---------|
| 0 | Education & Tools | No | SEO acquisition, immediate public value |
| 1 | Personal Tracker | Yes | Day-1 solo value, retention |
| 2 | Connection Network | Yes | Exposure intelligence, network health |
| 3 | Anonymous Notifications | Yes | ~~Growth engine~~ PROBABLY WON'T DO — reconsider post-launch |

## Completion Status

### Phase 0: Foundation — Week 1 ✅
### Phase 1: Layer 0 — Public Tools — Weeks 2-4 ✅
- Window period calculator, 10 STI guides, symptom filter, cost estimator, SEO

### Phase 2: Layer 1 — Personal Tracker — Weeks 5-9 ✅
- Week 5: Encounter journal + partners ✅
- Week 6: Health log (testing history tracker) ✅
- Week 7: Smart reminders + medication tracking ✅
- Week 8: Personal insights + onboarding ✅
- Week 9: PWA + push notifications + caching + email ✅

### Phase 3: Layer 2 — Network Enhancements — Weeks 10-14
- Week 10: Network foundation (reciprocity, catalog, phone matching, constellation viz, profile) ✅
- Week 11: Exposure recency buckets + verification cards + profile refactor ✅
- Week 12: Notification privacy + polish (vault + app lock DEFERRED post-launch) ✅
- Week 13: ~~Data retention + connection staleness~~ DEFERRED post-launch
- Week 14: Network health stats + Layer 2 polish ✅

### Phase 4: Launch Prep — Weeks 15-16 ✅
- Week 15: Content verification (CDC audit, 4 treatment updates) + OWASP security review ✅
- Week 16: Rate limiting (Bucket4j 3-tier), resource caps (9 types), validation sweep, mobile polish ✅

### Phase 5: Soft Launch + Growth — Weeks 17-20
- Week 17: Soft launch — LGBTQ+ CDMX
- Weeks 18-20: Iterate, content marketing, growth assessment

## Current Position

**We are at Week 17** (Phase 5). Weeks 1-12 + 14-16 complete. Week 13 deferred. Layer 3 (anonymous notifications) probably won't do — reconsider post-launch.

Next up: Week 17 soft launch in LGBTQ+ CDMX.

## Key References

- Full roadmap with feature specs, data models, GTM strategy: `docs/plans/full-roadmap.md`
- Session history archive: `docs/session-archive.md`
- Design system + coding standards: `CLAUDE.md`
- Architecture + key decisions: `CONTEXT.md`
- Project memory: `.claude/projects/-Users-prediktive-navilla/memory/MEMORY.md`

## Milestone-Gated Features (NOT to build yet)

- 1K-10K users: Health status sharing cards, onboarding A/B tests
- 10K-100K: CENSIDA/IMSS partnerships, simplified verification, native mobile eval
- 100K-500K: Telehealth bridge, advanced analytics, multi-language
- 500K+: Dating app integration badges
