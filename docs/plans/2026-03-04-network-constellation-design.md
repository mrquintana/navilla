# Network Constellation Visualization — Design Document

> **Date:** 2026-03-04
> **Status:** Approved
> **Scope:** Interactive constellation visualization of the user's sexual health network, with shareable card export

---

## Overview

A visual representation of the user's network as a starfield constellation. Each star represents a node in the network (connections and their extended connections). The visualization grows denser and more impressive as the network expands through six stages: Empty Sky → Spark → Cluster → Constellation → Galaxy → Supercluster.

The visualization lives on a dedicated `/network` page with a compact preview card on the dashboard. Users can export a personalized PNG card to share on social media — a growth engine for organic awareness.

---

## 1. Pluggable Visualization Engine

### Principle

**The app knows nothing about how the visualization works.** The entire rendering system is replaceable — technology, layout algorithm, animation system, visual style — without touching any other code.

### Contract

```typescript
interface VisualizationEngine {
  // Render into a container element (canvas, div, WebGL context, etc.)
  mount(container: HTMLElement, data: NetworkData): void;

  // Update with new data without full remount
  update(data: NetworkData): void;

  // Export as image for shareable card
  exportImage(options: ExportOptions): Promise<Blob>;

  // Cleanup (remove listeners, cancel animations, free resources)
  destroy(): void;
}

interface NetworkData {
  directCount: number;
  degree2Count: number;
  degree3Count: number;
  totalNodes: number;
  stageName: string;
  userSeed: string; // deterministic hash for consistent star positions
}

interface ExportOptions {
  width: number;
  height: number;
  identityText: string | null;
  stageLabel: string;
  stats: string;
}
```

### What the engine owns (fully replaceable):

- Rendering technology (Canvas 2D, WebGL, Three.js, SVG, D3, anything)
- Layout algorithm (how network metrics map to visual positions)
- Animation system (twinkle, pulse, parallax, etc.)
- Visual style (colors, glow, particles, connection lines)
- Export rendering (how the shareable image is composed)

### What the app owns (stays the same regardless of engine):

- Data fetching (`/api/exposures`, `/api/catalog/stages`, `/api/users/me`)
- Stage resolution (totalNodes → stage name, using catalog data)
- React wrapper component (`<NetworkVisualizationHost />`)
- Share modal UI + identity picker
- Dashboard preview card
- Routing (`/network`)
- i18n (all labels, messages, stage names)

### File structure

```
frontend/src/lib/visualization/
  types.ts                        ← VisualizationEngine interface + data types
  engines/
    canvas2d/
      Canvas2DEngine.ts           ← first engine implementation
      README.md                   ← how this engine works internally
  index.ts                        ← exports the active engine
```

### Switching engines

1. Create a new folder under `engines/`
2. Implement `VisualizationEngine` interface
3. Change the export in `index.ts`
4. Done — zero changes anywhere else

### Documentation

- `docs/docs/frontend/visualization-engine.md` — Docusaurus page explaining the contract, how to create a new engine, what data is available, how export works
- Each engine has its own `README.md` explaining its internals (algorithm, dependencies, performance characteristics)

---

## 2. First Engine: Canvas 2D

The initial implementation uses Canvas 2D — lightweight, fast on all mobile devices, easy PNG export, zero dependencies.

### Star rendering

- **Center node (you):** Bright warm-white star with indigo glow halo, subtle pulse animation
- **1st-degree stars:** Bright, close to center, connected by thin constellation lines
- **2nd-degree stars:** Medium brightness, further out, fainter connecting threads
- **3rd-degree stars:** Distant faint points, no connecting lines
- **Background:** Deep indigo-to-navy gradient with subtle stardust particles

### Deterministic positioning

Star positions are seeded from a hash of the user's ID (`userSeed`). The constellation always looks the same for the same user — not random on each render.

### Stage progression

| Stage | Total Nodes | Visual |
|-------|-------------|--------|
| Empty Sky | 0 | Single pulsing star, dark empty space |
| Spark | 1–50 | Small cluster forming, few faint connections |
| Cluster | 51–500 | Clear pattern, nebula hint appearing |
| Constellation | 501–2,000 | Rich star field, visible structure |
| Galaxy | 2,001–10,000 | Dense, layered, nebula glow |
| Supercluster | 10,000+ | Overwhelming, brilliant, celestial |

### Animations

Subtle twinkle on stars (opacity oscillation), gentle pulse on center node. Alive but calm — not distracting.

---

## 3. Page Structure

### Full page (`/network`)

- Dark immersive background (indigo-900 to near-black gradient), full viewport height
- Canvas fills the main area
- Overlay UI (semi-transparent):
  - Stage badge top-left (e.g., "Spark")
  - Stats bottom-left: "3 direct · 12 extended · 15 total"
  - Share button bottom-right
- Mobile: same layout, canvas responsive to viewport

### Dashboard preview card

- Compact card with small static canvas render (~200px tall)
- Shows stage name + node count
- "View your constellation" link → navigates to `/network`

### Not opted in

- `/network` page shows `ReciprocityOptInCard` instead of visualization
- Dashboard preview card shows dimmed/locked state: "Join the exposure network to see your constellation"

### Cold start (0 connections, opted in)

- Single center star (Empty Sky stage)
- Soft message below: "Your sky is empty. Connect with someone to see your constellation grow."
- Link to `/connections`

---

## 4. Shareable Constellation Card

### Purpose

A personalized PNG that users share on social media. Someone sees the card → "What is Navilla?" → visits navilla.app → signs up. The card IS the ad.

### Export flow

1. User taps "Share" button on `/network` page
2. Customization modal appears:
   - **Identity** — radio group: Display name, Username (@handle), Full name, or Anonymous
   - Options are disabled if the corresponding profile field is empty
   - **Live preview** of the card
3. User confirms → engine renders **1080x1920 PNG** (Instagram story dimensions)
4. Native share dialog (Web Share API) or download fallback

### Card layout

- Deep space background (same gradient as visualization)
- Constellation rendered at center
- User's chosen name (from their actual profile data) in Fraunces
- Stage name
- Stats in white Plus Jakarta Sans: "3 nodes · 2 degrees"
- Navilla branding at bottom: "navilla.app"
- **No free text input** — only verified profile fields to maintain credibility

### No server-side storage

Client-side PNG export only. No tokens, no tables, no public routes. The card is a visualization of metrics, not a hosted artifact.

---

## 5. Navigation

Add "Network" link to header nav (desktop + mobile), between Insights and Notifications. Lucide icon: `Sparkles` or `Stars`.

New route: `/network` — lazy-loaded.

---

## 6. Backend Changes

**None.** Existing API provides everything needed:

- `GET /api/exposures` → connectionCount, secondDegreeCount, thirdDegreeCount, totalGraphNodes
- `GET /api/catalog/stages` → stage definitions with thresholds and i18n names
- `GET /api/users/me` → display name, username, full name for share card

Stage resolution happens client-side.

---

## 7. i18n

All UI text in both en_US and es_MX:
- Stage names (already in DB with `displayNameEs`)
- Page title, stats labels, share modal text, cold start message, locked state message
- Nav link label

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering tech | Canvas 2D | Lightweight, mobile-fast, easy PNG export, zero deps |
| Architecture | Pluggable engine interface | SOLID — entire rendering system replaceable without touching app code |
| Placement | Dashboard preview + full `/network` page | Discoverable + immersive |
| Sharing | Client-side PNG export | No server infrastructure needed; card is a metric visualization |
| Identity on card | Profile fields only (no free text) | Card is a credibility artifact — must be verified data |
| Constellation naming | Stage name only | Simple, avoids Latin name generation complexity |
| Backend changes | None | Existing API sufficient |
