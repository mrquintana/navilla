# Visualization Engine

The Network Constellation visualization uses a **pluggable engine architecture**. The entire rendering system — technology, layout algorithm, animation, visual style — is replaceable without touching any other application code.

## Architecture

```
App Layer (React)          Engine Layer (Pure JS/TS)
┌─────────────────┐        ┌──────────────────────┐
│ NetworkPage     │        │ VisualizationEngine  │ ← interface
│ DashboardCard   │───────▶│                      │
│ ShareModal      │        │ mount()              │
│ useNetwork...() │        │ update()             │
│                 │        │ exportImage()         │
│                 │        │ destroy()             │
└─────────────────┘        └──────────────────────┘
                                    ▲
                           ┌────────┴────────┐
                           │  Canvas2DEngine │ ← current implementation
                           │  (or WebGL,     │
                           │   Three.js,     │
                           │   D3, etc.)     │
                           └─────────────────┘
```

The **app layer** handles data fetching, routing, React state, i18n, and share UI. It knows nothing about how the visualization renders.

The **engine layer** owns all rendering: technology choice, layout algorithm, animation system, visual style, and image export.

## Engine Interface

```typescript
interface VisualizationEngine {
  mount(container: HTMLElement, data: NetworkData): void;
  update(data: NetworkData): void;
  exportImage(options: ExportOptions): Promise<Blob>;
  destroy(): void;
}
```

### Methods

| Method | Purpose |
|--------|---------|
| `mount` | Attach to a DOM container, render initial state, start animations |
| `update` | Receive new data without full remount (e.g., when network grows) |
| `exportImage` | Render a static frame as PNG at specified dimensions with text overlays |
| `destroy` | Cleanup: cancel animations, remove DOM elements, free resources |

## Data Types

### NetworkData

```typescript
interface NetworkData {
  directCount: number;      // 1st-degree connections
  degree2Count: number;     // 2nd-degree connections
  degree3Count: number;     // 3rd-degree connections
  totalNodes: number;       // sum of all network nodes
  stageName: string;        // stage code: "EMPTY_SKY", "SPARK", etc.
  stageDisplayName: string; // localized stage name for display
  userSeed: string;         // deterministic seed for star positions
}
```

This data comes from the existing `/api/exposures` and `/api/catalog/stages` endpoints, composed by the `useNetworkVisualization()` hook.

### ExportOptions

```typescript
interface ExportOptions {
  width: number;            // export width in px (e.g., 1080)
  height: number;           // export height in px (e.g., 1920)
  identityText: string | null; // user's chosen name, or null for anonymous
  stageLabel: string;       // stage name to display
  stats: string;            // stats line (e.g., "3 direct · 12 extended · 15 total")
}
```

## File Structure

```
frontend/src/lib/visualization/
  types.ts                              ← interface + data types
  index.ts                              ← barrel export (change ActiveEngine here)
  engines/
    canvas2d/
      Canvas2DEngine.ts                 ← current engine
      README.md                         ← engine-specific docs
```

## How to Create a New Engine

1. **Create a folder:** `frontend/src/lib/visualization/engines/your-engine/`

2. **Implement the interface:**

```typescript
import type { VisualizationEngine, NetworkData, ExportOptions } from '../../types';

export class YourEngine implements VisualizationEngine {
  mount(container: HTMLElement, data: NetworkData): void {
    // Set up your rendering (WebGL context, D3 SVG, etc.)
  }

  update(data: NetworkData): void {
    // Update rendering with new data
  }

  async exportImage(options: ExportOptions): Promise<Blob> {
    // Render to an image and return as PNG Blob
  }

  destroy(): void {
    // Cleanup everything
  }
}
```

3. **Update the barrel export** in `frontend/src/lib/visualization/index.ts`:

```typescript
// Change this one line:
export { YourEngine as ActiveEngine } from './engines/your-engine/YourEngine';
```

4. **Done.** No other files need to change. The React components, hooks, pages, share modal, and dashboard card all work with any engine.

## Current Engine: Canvas 2D

The default engine uses HTML Canvas 2D API. See `engines/canvas2d/README.md` for details on its rendering algorithm, star placement, and animation system.

**Key properties:**
- Zero external dependencies
- Lightweight, fast on all mobile devices
- Deterministic star positions from `userSeed`
- Handles up to ~120 visible stars smoothly
- PNG export via offscreen canvas
