# Network Constellation Visualization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive constellation visualization of the user's network with shareable PNG card export.

**Architecture:** Pluggable visualization engine (interface-driven, SOLID) with Canvas 2D as the first implementation. React wrapper component consumes the engine via a standard contract. The app layer (data fetching, routing, share UI) is engine-agnostic. No backend changes — uses existing `/api/exposures` and `/api/catalog/stages` endpoints.

**Tech Stack:** React 19, Canvas 2D API, TypeScript, React Query, Web Share API, Lucide icons, i18n (en_US + es_MX)

**Design Doc:** `docs/plans/2026-03-04-network-constellation-design.md`

---

### Task 1: Visualization Engine Types

Define the pluggable engine interface and data types.

**Files:**
- Create: `frontend/src/lib/visualization/types.ts`

**Step 1: Create the types file**

```typescript
// frontend/src/lib/visualization/types.ts

export interface NetworkData {
  directCount: number;
  degree2Count: number;
  degree3Count: number;
  totalNodes: number;
  stageName: string;
  stageDisplayName: string;
  userSeed: string;
}

export interface ExportOptions {
  width: number;
  height: number;
  identityText: string | null;
  stageLabel: string;
  stats: string;
}

export interface VisualizationEngine {
  /** Render into a container element */
  mount(container: HTMLElement, data: NetworkData): void;

  /** Update with new data without full remount */
  update(data: NetworkData): void;

  /** Export as image for shareable card */
  exportImage(options: ExportOptions): Promise<Blob>;

  /** Cleanup listeners, cancel animations, free resources */
  destroy(): void;
}
```

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/lib/visualization/types.ts
git commit -m "feat: add VisualizationEngine interface and data types"
```

---

### Task 2: Canvas 2D Engine — Core Rendering

Implement the first visualization engine using Canvas 2D.

**Files:**
- Create: `frontend/src/lib/visualization/engines/canvas2d/Canvas2DEngine.ts`
- Create: `frontend/src/lib/visualization/engines/canvas2d/README.md`

**Context:**
- The engine receives `NetworkData` with degree counts and a `userSeed` for deterministic star placement
- Stars are positioned using a seeded PRNG (pseudo-random number generator) so the same user always sees the same constellation
- Visual density scales with totalNodes across 6 stages (Empty Sky → Supercluster)

**Step 1: Implement Canvas2DEngine**

The engine must:
1. Create an offscreen `<canvas>` element, insert it into the container
2. Draw a deep indigo-to-navy gradient background
3. Generate star positions from `userSeed` using a simple hash-based PRNG
4. Draw stars in 3 layers:
   - 1st degree: bright, close to center, connected by thin lines to center
   - 2nd degree: medium brightness, further out, faint connecting threads
   - 3rd degree: distant faint dots, no lines
5. Draw center node (you) with warm-white color and indigo glow
6. Animate: subtle twinkle (opacity oscillation) via `requestAnimationFrame`
7. Handle resize via `ResizeObserver`
8. `exportImage()`: render a static frame at specified dimensions onto a temporary canvas, add text overlays (name, stage, stats, branding), return as PNG Blob
9. `destroy()`: cancel animation frame, disconnect observer, remove canvas

**Key implementation details:**
- Seeded PRNG: `function seededRandom(seed: string)` — returns a function that produces deterministic 0-1 values from a string seed
- Star count per layer: `Math.min(directCount, 20)` for 1st degree, `Math.min(degree2Count, 40)` for 2nd, `Math.min(degree3Count, 60)` for 3rd — cap visible stars for performance, scale brightness/size with actual count
- Background stardust: ~50 tiny static dots for ambiance regardless of data
- Center node position: canvas center
- 1st degree ring: 15-30% radius from center
- 2nd degree ring: 35-55% radius
- 3rd degree ring: 60-85% radius
- Angular positions: evenly distributed with slight random offset from seed
- Constellation lines: thin (0.5px), gradient from white to transparent, only between center and 1st degree stars

**Step 2: Create engine README**

```markdown
# Canvas 2D Visualization Engine

## Overview
First implementation of the `VisualizationEngine` interface. Uses HTML Canvas 2D API for rendering — lightweight, zero dependencies, mobile-optimized.

## Algorithm
- Stars placed in 3 concentric rings (1st/2nd/3rd degree connections)
- Positions are deterministic via seeded PRNG from `userSeed`
- Visual density increases with node count but caps visible stars for performance
- Background gradient: indigo-900 to near-black
- Animation: subtle opacity oscillation on stars via requestAnimationFrame

## Export
- Renders static frame to temporary canvas at 1080x1920
- Draws text overlays: identity, stage name, stats, branding
- Returns PNG Blob

## Performance
- Handles up to ~120 visible stars smoothly on mobile
- ResizeObserver for responsive canvas sizing
- Animation uses requestAnimationFrame (pauses when tab is hidden)

## Replacing This Engine
1. Create a new folder under `engines/`
2. Implement `VisualizationEngine` from `../../types.ts`
3. Update `frontend/src/lib/visualization/index.ts` to export your engine
4. See `docs/docs/frontend/visualization-engine.md` for full guide
```

**Step 3: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add frontend/src/lib/visualization/engines/canvas2d/
git commit -m "feat: implement Canvas2D visualization engine"
```

---

### Task 3: Engine Index — Active Engine Export

Create the barrel export that the rest of the app imports from.

**Files:**
- Create: `frontend/src/lib/visualization/index.ts`

**Step 1: Create index**

```typescript
// frontend/src/lib/visualization/index.ts
export type { VisualizationEngine, NetworkData, ExportOptions } from './types';
export { Canvas2DEngine } from './engines/canvas2d/Canvas2DEngine';

// Active engine — change this one line to swap engines
export { Canvas2DEngine as ActiveEngine } from './engines/canvas2d/Canvas2DEngine';
```

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/lib/visualization/index.ts
git commit -m "feat: add visualization engine barrel export"
```

---

### Task 4: useNetworkVisualization Hook

Create a React Query hook that composes exposure data + stages into `NetworkData`.

**Files:**
- Create: `frontend/src/hooks/useNetworkVisualization.ts`

**Context:**
- Existing hooks/API: `api.exposures.get(token)` returns `ExposureSnapshot`, `api.catalog.stages()` returns `NetworkStage[]`
- Stage resolution: find the stage where `totalNodes >= minNodes && (maxNodes == null || totalNodes <= maxNodes)`
- `userSeed`: use `session.user.id` (Supabase auth user UUID) — deterministic per user

**Step 1: Implement the hook**

```typescript
// frontend/src/hooks/useNetworkVisualization.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';
import { api } from '../lib/api';
import type { NetworkStage } from '../types/catalog';
import type { NetworkData } from '../lib/visualization/types';

function resolveStage(stages: NetworkStage[], totalNodes: number): NetworkStage | null {
  return stages.find(
    (s) => totalNodes >= s.minNodes && (s.maxNodes == null || totalNodes <= s.maxNodes),
  ) ?? stages[0] ?? null;
}

export function useNetworkVisualization() {
  const { session } = useAuth();
  const { i18n } = useTranslation();
  const token = session?.access_token ?? '';
  const userId = session?.user?.id ?? '';

  const exposureQuery = useQuery({
    queryKey: ['exposures'],
    queryFn: () => api.exposures.get(token),
    enabled: !!token,
  });

  const stagesQuery = useQuery({
    queryKey: ['catalog', 'stages'],
    queryFn: () => api.catalog.stages(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const networkData: NetworkData | null = useMemo(() => {
    const exposure = exposureQuery.data;
    const stages = stagesQuery.data;
    if (!exposure || !stages) return null;

    const totalNodes = exposure.totalGraphNodes ?? 0;
    const stage = resolveStage(stages, totalNodes);
    const isSpanish = i18n.language.startsWith('es');

    return {
      directCount: exposure.connectionCount ?? 0,
      degree2Count: exposure.secondDegreeCount ?? 0,
      degree3Count: exposure.thirdDegreeCount ?? 0,
      totalNodes,
      stageName: stage?.code ?? 'EMPTY_SKY',
      stageDisplayName: (isSpanish ? stage?.displayNameEs : stage?.displayName) ?? 'Empty Sky',
      userSeed: userId,
    };
  }, [exposureQuery.data, stagesQuery.data, userId, i18n.language]);

  return {
    data: networkData,
    isLoading: exposureQuery.isLoading || stagesQuery.isLoading,
    isError: exposureQuery.isError || stagesQuery.isError,
  };
}
```

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/hooks/useNetworkVisualization.ts
git commit -m "feat: add useNetworkVisualization hook"
```

---

### Task 5: NetworkVisualizationHost Component

React wrapper that mounts/unmounts the engine and handles lifecycle.

**Files:**
- Create: `frontend/src/components/network/NetworkVisualizationHost.tsx`

**Step 1: Implement the host component**

```typescript
// frontend/src/components/network/NetworkVisualizationHost.tsx
import { useEffect, useRef } from 'react';
import type { NetworkData, VisualizationEngine } from '../../lib/visualization/types';

interface Props {
  engine: VisualizationEngine;
  data: NetworkData;
  className?: string;
}

export function NetworkVisualizationHost({ engine, data, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    engine.mount(container, data);
    mountedRef.current = true;

    return () => {
      engine.destroy();
      mountedRef.current = false;
    };
    // Only mount/destroy on engine change — data updates handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  useEffect(() => {
    if (mountedRef.current) {
      engine.update(data);
    }
  }, [engine, data]);

  return <div ref={containerRef} className={className} />;
}
```

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/components/network/NetworkVisualizationHost.tsx
git commit -m "feat: add NetworkVisualizationHost wrapper component"
```

---

### Task 6: Share Modal Component

Modal for choosing identity and exporting the constellation card.

**Files:**
- Create: `frontend/src/components/network/ShareConstellationModal.tsx`

**Context:**
- User picks identity from profile fields: display name, @username, full name, or anonymous
- Options are disabled if the profile field is empty
- Live preview of the card
- Export at 1080x1920 PNG via `engine.exportImage()`
- Web Share API with download fallback

**Step 1: Implement the share modal**

The modal should:
1. Accept props: `isOpen`, `onClose`, `engine` (VisualizationEngine), `data` (NetworkData)
2. Fetch profile via `useUser()` hook to get display name, username, full name
3. Show radio group with available identity options (disabled if field is empty)
4. Show live preview (small canvas or static preview)
5. "Share" button:
   - Call `engine.exportImage({ width: 1080, height: 1920, identityText, stageLabel, stats })`
   - If `navigator.share` available and supports files, use Web Share API
   - Otherwise, create download link with `URL.createObjectURL(blob)`
6. Use i18n for all labels

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/components/network/ShareConstellationModal.tsx
git commit -m "feat: add ShareConstellationModal with identity picker and export"
```

---

### Task 7: Network Page

The full-screen immersive `/network` page.

**Files:**
- Create: `frontend/src/pages/NetworkPage.tsx`

**Context:**
- Dark background (full viewport height)
- Uses `useNetworkVisualization()` for data
- Uses `useReciprocityStatus()` to gate access — show `ReciprocityOptInCard` if not opted in
- Instantiates `ActiveEngine` from visualization index
- Renders `NetworkVisualizationHost` with the engine
- Overlay UI: stage badge (top-left), stats (bottom-left), share button (bottom-right)
- Cold start (0 connections): single star + soft message linking to /connections
- Loading state: use `PageSkeleton`
- Share button opens `ShareConstellationModal`

**Step 1: Implement NetworkPage**

Key layout:
```
<div className="network-page"> (full viewport, dark background)
  <div className="network-page-canvas"> (fills available space)
    <NetworkVisualizationHost engine={engine} data={data} />
  </div>
  <div className="network-page-overlay">
    <span className="network-stage-badge">{stageDisplayName}</span>  (top-left)
    <div className="network-stats">{stats}</div>  (bottom-left)
    <button className="network-share-btn">Share</button>  (bottom-right)
  </div>
</div>
```

**Step 2: Add CSS for network page**

Add to `frontend/src/index.css`:
- `.network-page`: min-height 100vh (minus navbar), background indigo-900 to near-black gradient
- `.network-page-canvas`: flex-grow, fills space
- `.network-page-overlay`: absolute positioned, pointer-events none on container, pointer-events auto on children
- `.network-stage-badge`: semi-transparent pill, white text, Fraunces font
- `.network-stats`: semi-transparent, small white text
- `.network-share-btn`: indigo button with share icon

**Step 3: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add frontend/src/pages/NetworkPage.tsx frontend/src/index.css
git commit -m "feat: add immersive /network page with constellation visualization"
```

---

### Task 8: Dashboard Preview Card

Compact constellation preview on the dashboard.

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`

**Context:**
- The dashboard has a 2-column grid with Status Card and Connections Card
- Add a third card below (full-width or in the grid) showing a compact constellation preview
- If not opted in: show nothing (ReciprocityOptInCard already handles that)
- If opted in: show small canvas (~200px tall), stage name, node count, "View constellation" link
- Instantiate the engine with a smaller container

**Step 1: Add preview card to DashboardPage**

After the existing grid (around line 389), add:
```tsx
{isOptedIn && networkData && (
  <div className="card card-elevated">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider">
        {t('dashboard.constellation')}
      </h3>
      <span className="badge badge-primary text-xs">{networkData.stageDisplayName}</span>
    </div>
    <div className="network-preview-canvas" style={{ height: 200 }}>
      <NetworkVisualizationHost engine={previewEngine} data={networkData} />
    </div>
    <Link to="/network" className="text-sm text-primary font-medium mt-3 inline-block">
      {t('dashboard.viewConstellation')} →
    </Link>
  </div>
)}
```

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx
git commit -m "feat: add constellation preview card to dashboard"
```

---

### Task 9: Navigation + Routing + i18n

Wire everything together: nav link, route, locale keys.

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx` — add Network nav link (desktop + mobile)
- Modify: `frontend/src/router.tsx` — add lazy-loaded `/network` route
- Modify: `frontend/src/locales/en_US.json` — add nav, network, dashboard keys
- Modify: `frontend/src/locales/es_MX.json` — add Spanish translations

**Step 1: Add lazy import to router.tsx**

After the InsightsPage import (around line 124):
```typescript
const NetworkPage = lazy(() =>
  import('./pages/NetworkPage').then(m => ({ default: m.NetworkPage })),
);
```

Add route in children array (after insights, before notifications):
```typescript
{
  path: 'network',
  element: (
    <ProtectedRoute>
      <Suspense fallback={<FullPageLoader />}>
        <NetworkPage />
      </Suspense>
    </ProtectedRoute>
  ),
},
```

**Step 2: Add nav link to Header.tsx**

Import `Sparkles` icon from lucide-react (add to existing import line).

Desktop nav (after /insights link, before notifications):
```tsx
<Link to="/network" className={`nav-link${pathname === '/network' ? ' nav-link-active' : ''}`}>
  <Sparkles className="nav-icon" aria-hidden="true" />
  {t('nav.network')}
</Link>
```

Mobile nav (same position in the mobile dropdown):
```tsx
<Link to="/network" className={`nav-dropdown-item${pathname === '/network' ? ' nav-dropdown-item-active' : ''}`} role="menuitem">
  <Sparkles className="nav-icon" aria-hidden="true" />
  {t('nav.network')}
</Link>
```

**Step 3: Add i18n keys to en_US.json**

```json
"nav": {
  ... existing keys ...,
  "network": "Network"
},
"network": {
  "title": "Your Constellation",
  "stats": "{{direct}} direct · {{extended}} extended · {{total}} total",
  "share": "Share",
  "coldStartMessage": "Your sky is empty. Connect with someone to see your constellation grow.",
  "coldStartLink": "Add a connection",
  "lockedTitle": "Your Constellation",
  "lockedMessage": "Join the exposure network to see your constellation.",
  "shareModalTitle": "Share your constellation",
  "shareIdentity": "Show as",
  "identityDisplayName": "Display name",
  "identityUsername": "Username",
  "identityFullName": "Full name",
  "identityAnonymous": "Anonymous",
  "shareButton": "Share",
  "downloadButton": "Download",
  "shareError": "Could not share. Try downloading instead."
},
"dashboard": {
  ... existing keys ...,
  "constellation": "Your Constellation",
  "viewConstellation": "View your constellation"
}
```

**Step 4: Add i18n keys to es_MX.json**

```json
"nav": {
  ... existing keys ...,
  "network": "Red"
},
"network": {
  "title": "Tu Constelación",
  "stats": "{{direct}} directos · {{extended}} extendidos · {{total}} total",
  "share": "Compartir",
  "coldStartMessage": "Tu cielo está vacío. Conecta con alguien para ver crecer tu constelación.",
  "coldStartLink": "Agregar una conexión",
  "lockedTitle": "Tu Constelación",
  "lockedMessage": "Únete a la red de exposición para ver tu constelación.",
  "shareModalTitle": "Comparte tu constelación",
  "shareIdentity": "Mostrar como",
  "identityDisplayName": "Nombre público",
  "identityUsername": "Usuario",
  "identityFullName": "Nombre completo",
  "identityAnonymous": "Anónimo",
  "shareButton": "Compartir",
  "downloadButton": "Descargar",
  "shareError": "No se pudo compartir. Intenta descargarlo."
},
"dashboard": {
  ... existing keys ...,
  "constellation": "Tu Constelación",
  "viewConstellation": "Ver tu constelación"
}
```

**Step 5: Run lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend/src/router.tsx frontend/src/components/layout/Header.tsx frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "feat: add /network route, nav link, and i18n keys"
```

---

### Task 10: Docusaurus Documentation — Visualization Engine Guide

Document the pluggable engine architecture for developers and future agents.

**Files:**
- Create: `docs/docs/frontend/visualization-engine.md`
- Modify: `docs/sidebars.ts` — add page to frontend sidebar

**Step 1: Write the documentation page**

The doc must cover:
1. **Overview** — what the visualization engine is, why it's pluggable
2. **Contract** — the `VisualizationEngine` interface with JSDoc for each method
3. **Data types** — `NetworkData` and `ExportOptions` explained field by field
4. **How to create a new engine** — step-by-step (create folder, implement interface, update index.ts)
5. **How the app uses the engine** — React wrapper, data flow, export flow
6. **Current engine: Canvas 2D** — overview of the first implementation
7. **File structure** — where everything lives

**Step 2: Add to sidebars.ts**

In the frontend sidebar section, add `'frontend/visualization-engine'` after the existing entries.

**Step 3: Run docs build**

Run: `cd docs && npm run build`
Expected: PASS (no broken links)

**Step 4: Commit**

```bash
git add docs/docs/frontend/visualization-engine.md docs/sidebars.ts
git commit -m "docs: add Visualization Engine guide to Docusaurus"
```

---

## Task Dependency Order

```
Task 1 (types) → Task 2 (engine) → Task 3 (index)
                                        ↓
Task 4 (hook) ←─────────────────────────┘
     ↓
Task 5 (host component)
     ↓
Task 6 (share modal)
     ↓
Task 7 (network page) → Task 8 (dashboard preview)
                              ↓
                    Task 9 (nav + routing + i18n)
                              ↓
                    Task 10 (documentation)
```

Tasks 1-3 are foundational. Tasks 4-6 build the components. Tasks 7-9 integrate into the app. Task 10 documents everything.

---

## Testing Strategy

**Unit-testable (TDD):**
- Seeded PRNG determinism (same seed → same sequence)
- Stage resolution logic (totalNodes → correct stage)
- `useNetworkVisualization` hook (data composition)
- Share modal identity option availability (disabled when field empty)

**Visual verification (manual):**
- Canvas rendering at each stage (Empty Sky through Supercluster)
- Export image quality and layout
- Responsive sizing on mobile
- Animation performance
- Dark page contrast with navbar

**Integration:**
- Navigation links active state on /network
- Protected route redirects when not authenticated
- Reciprocity gate shows opt-in card when not opted in
