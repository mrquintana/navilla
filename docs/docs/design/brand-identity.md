---
sidebar_position: 2
title: Brand & Visual Identity
---

# Brand & Visual Identity

## Decision

**Navilla's visual identity is Vital · Plum Refined** — a design system built on Plus Jakarta Sans typography, a deep aubergine primary color (`#4C1A80`), and a clean, precise component language that conveys privacy, seriousness, and trust.

> The goal: when someone sees this interface, they immediately understand that what happens inside is private, that it matters for their health, and that the product was built by people who take both of those things seriously.

---

## What We Were Solving For

The design had to carry three messages simultaneously without any of them canceling the others out:

1. **This is private.** Users are sharing sensitive health exposure data. The interface must feel contained and secure — nothing leaks, nothing is casual.
2. **This is serious.** The information shown here can meaningfully affect someone's health decisions. The product should not feel like a social app.
3. **This is trustworthy.** People need to feel safe enough to connect their real network to this system. The design can't create anxiety — it needs to create confidence.

Most health apps solve for one of these. Navilla needed all three.

---

## The Design Process

We evaluated **14 distinct design directions** before arriving at the final choice. The process moved in three phases.

### Phase 1 — Broad Exploration (10 Options)

The first pass explored a wide range of aesthetic directions, testing which ones could carry Navilla's tone without feeling borrowed from another product category.

| Option | Name | Fonts | Accent | Verdict |
|--------|------|-------|--------|---------|
| 01 | Editorial | Playfair Display + DM Sans | Crimson | Too magazine-like. Implies publication, not protection. |
| 02 | Refined Minimal | Syne | Warm gold | Elegant, but the gold reads as luxury rather than health. |
| 03 | Warm Organic | Nunito Sans | Terracotta | Warm and human, but leans wellness/lifestyle rather than serious. |
| 04 | Utilitarian | IBM Plex Mono + IBM Plex Sans | Cyan | Data-dense and precise, but reads as dev tool, not patient-facing. |
| 05 | Understated Luxury | Cormorant Garamond + Jost | Brass | Beautiful, but aspirational — not appropriate for a health network. |
| 06 | Vital | Plus Jakarta Sans | Teal | Strong health-tech feel. Clean, modern, trustworthy. Advanced to Phase 2. |
| 07 | Sanctum | Fraunces + Source Sans 3 | Forest green | Warm, community-first. Works well but skews softer than needed. |
| 08 | Clarity | Outfit | Indigo | Professional healthcare aesthetic, slightly generic. |
| 09 | Biophilic | Bricolage Grotesque | Olive | Nature-grounded and distinctive, but not serious enough for exposures. |
| 10 | Signal | Manrope | Electric mint | Excellent in dark mode. Alert-system energy is appropriate, but light mode is weak. |

**Eliminated in Phase 1:** Options 01–05 were eliminated as off-brand for a health privacy network. Options 07–10 were retained as references but not advanced.

**Advanced to Phase 2:** Option 06 — Vital.

---

### Phase 2 — Palette Exploration on the Vital Framework

Vital's structure (Plus Jakarta Sans, medium radius, clean component language) was strong. The question became: which color palette best carries the brand message?

Three palette variants were built on the same Vital typographic and layout system:

| Option | Name | Accent | What it says |
|--------|------|--------|--------------|
| 11 | Vital · Indigo | `#3730A3` deep indigo | Privacy-first, encrypted, trusted. Familiar territory — many secure/private apps live here. |
| 12 | Vital · Slate + Coral | `#E05A44` warm coral on slate | Serious infrastructure, human stakes. The tension between the cold slate and warm accent reflects the product's duality. |
| 13 | Vital · Plum | `#6B21A8` saturated purple | Distinctive, gravity-heavy. Too saturated for comfortable daily use. |
| 14 | Vital · Plum Refined | `#4C1A80` deep aubergine | Ownable, serious, and livable. Advanced to final selection. |

---

### Phase 3 — The Final Choice: Indigo vs. Plum Refined

The final decision came down to **Vital · Indigo** vs. **Vital · Plum Refined**.

Both are strong. The difference is strategic.

#### Vital · Indigo
- Immediately comfortable because it is familiar
- Indigo is used by Linear, Notion, numerous privacy/security tools, and encrypted messaging apps
- Communicates trust and privacy effectively
- **Weakness:** It blends into a crowded space. In five years, users may struggle to distinguish Navilla's aesthetic from a dozen other apps

#### Vital · Plum Refined
- Slightly less immediately familiar, but quickly understood
- Deep aubergine occupies almost no space in health tech — it is a genuinely open lane
- The darkness and depth of the color reads as serious and contained, not soft or approachable
- **Opportunity:** This color can become ownable

---

## The Tinder Principle

The concern raised was whether deep purple might skew Navilla's perceived demographic toward women and deter male users.

The analogy that resolved it: **Tinder is pink, and a large portion of its users are men.**

Tinder did not design for men. They designed to attract women, because they understood that in a social network with any gender dynamics, the platform that resonates with women will bring everyone else with it. Men follow women onto platforms. The product value transcends the color.

The same logic applies here — and more specifically:

- Women are statistically the primary users of health tracking and exposure notification apps
- Women manage health decisions not just for themselves but for their households and relationships
- Women are more likely to onboard their partners, friends, and family members into a network like Navilla
- If Navilla's early growth is driven by women, the network effects bring everyone else

The "feminine" concern also weakens on inspection. What reads as feminine is pastel purple — lavender and lilac. Deep aubergine reads as **serious, premium, and private.** Twitch, Discord, and Crown Royal all use deep purple and have broad or male-skewed audiences. The darkness of the hue is the critical variable.

**Conclusion:** A slight demographic lean toward women in the color signal is not a liability for Navilla. It is a growth mechanism.

---

## Why Plum Refined, Not Plum

The original Plum variant (`#6B21A8`) was too saturated. On light backgrounds it read as "purple website" — the color dominated rather than supported the interface.

Plum Refined pulls the accent darker and less chromatic: `#4C1A80`. The result is a color that:

- Does not immediately announce itself as purple — it is deep and quiet
- Only reveals its hue in context (against white cards, on buttons, in the progress bar)
- In dark mode, deepens to near-black with plum undertones — a color that feels like a vault

This is the **Cadbury principle**: Cadbury's purple is not loud or decorative. It is simply the color that belongs to that brand, so consistently applied that recognition is automatic. The goal for Navilla is the same.

---

## Final Design Specification

### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Background | `#FAFAF9` | `#09060F` | Page background |
| Background Secondary | `#F0EBF6` | `#110D1C` | Surfaces, inputs |
| Card | `#FFFFFF` | `#110D1C` | Cards, modals |
| Text | `#1A1020` | `#EAE4F8` | Primary text |
| Text Secondary | `#30204A` | `#B09ED0` | Supporting text |
| Text Muted | `#7A5E96` | `#5A4478` | Labels, captions |
| **Accent** | `#4C1A80` | `#9B5DE5` | Primary color |
| Accent Hover | `#3D1468` | `#B07AEE` | Hover state |
| Border | `#D8CCEC` | `#221640` | Component borders |
| Success | `#15803D` | `#4ADE80` | Positive states |
| Warning | `#B45309` | `#FBBF24` | Warning states |
| Error | `#DC2626` | `#F87171` | Error states |

### Typography

**Font:** Plus Jakarta Sans (Google Fonts)

| Role | Weight | Usage |
|------|--------|-------|
| Display / Headings | 800 | Page titles, hero |
| Semibold | 600 | Card titles, labels, nav links |
| Medium | 500 | Navigation, button text |
| Regular | 400 | Body copy, descriptions |

### Shape System

| Token | Value | Usage |
|-------|-------|-------|
| Radius SM | `6px` | Badges, small elements |
| Radius MD | `10px` | Inputs, buttons, small cards |
| Radius LG | `16px` | Cards, modals, hero panels |

### Voice in the Interface

The color and typography system should be reinforced by the tone of all UI text:
- **Direct, not clinical.** "Your network has no active exposures" — not "Status: Negative."
- **Private, not paranoid.** The interface does not amplify alarm unless there is a real alert.
- **Human, not corporate.** We use "you" and "your network," not "the user" or "account."

---

## Design Reference

The full interactive design reference — showing all 14 explored directions, all components, and dark mode for each — is available here:

👉 **[Open Design Reference](/design-reference.html)**

Use the dropdown in the top-right corner to switch between styles, and the toggle to compare light and dark modes.

---

## Options Not Chosen

Brief rationale for the most competitive alternatives, for stakeholder reference:

**Vital · Indigo** — Excellent UX, immediately familiar, strong privacy signal. Not chosen because indigo is occupied territory in the privacy/tech space and offers low brand differentiation at scale.

**Signal** — Exceptional in dark mode, appropriate urgency for the alert use case. Not chosen because its light mode is unremarkable and it communicates reactive urgency rather than ongoing trusted infrastructure.

**Warm Organic** — The most human and approachable of the options evaluated. Not chosen because the warmth and rounded aesthetic undercut the seriousness the product needs to carry when showing real health exposure data.

---

## Age Policy Note

Navilla targets **18+ users**. Health data on minors introduces significant legal complexity — parental consent requirements, LFPDPPP (Mexico) sensitivity classifications for health data, and US state-level variations — that would require a separate consent architecture. The 18+ restriction is reflected in the design: the visual identity is adult, considered, and never playful.

The primary user demographic is **18–35**, with the core engagement likely skewing toward the 20–30 range. The dark mode experience is designed for this audience: comfortable, confident, and not optimized for accessibility concerns that primarily affect older users.
