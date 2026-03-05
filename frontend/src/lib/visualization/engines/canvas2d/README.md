# Canvas 2D Visualization Engine

The `Canvas2DEngine` renders the Network Constellation using the browser Canvas 2D API. It implements the `VisualizationEngine` interface defined in `../../types.ts`.

## How It Works

### Lifecycle

1. **`mount(container, data)`** -- Creates a `<canvas>` element inside the given container, sets up a `ResizeObserver` to keep the canvas sized correctly, generates stars from the network data, and starts a `requestAnimationFrame` animation loop.
2. **`update(data)`** -- Accepts new `NetworkData` and regenerates star positions on the next frame. No remount needed.
3. **`destroy()`** -- Cancels the animation frame, disconnects the resize observer, removes the canvas from the DOM, and releases all references.

### Rendering Algorithm

Each frame draws the following layers in order:

1. **Background gradient** -- Linear gradient from indigo-950 (`#1e1b4b`) at the top to near-black (`#0a0a0f`) at the bottom.
2. **Stardust** -- 50 tiny white dots (1-2 px, opacity 0.1-0.3) at positions determined by a seeded PRNG. They provide ambient depth without competing with data stars.
3. **Constellation lines** -- 0.5 px lines from the center node to each 1st-degree star. Each line uses a gradient that fades from 30% white at the center to 5% white at the star.
4. **Stars** -- Circles at deterministic positions, colored and sized by degree:
   - **Center (degree 0):** 6 px, warm white `#fff5e6`, indigo radial glow halo.
   - **1st degree:** 3-4 px, bright white `#e0e7ff`, ring at 15-30% canvas radius.
   - **2nd degree:** 2-3 px, `#a5b4fc` at 60% opacity, ring at 35-55% canvas radius.
   - **3rd degree:** 1-2 px, `#818cf8` at 30% opacity, ring at 60-85% canvas radius.
5. **Twinkle** -- Every star oscillates opacity by +/-15% using `sin(time * 0.001 + phase)`. The center node also pulses its glow radius.

### Determinism

All positions and phase offsets come from a seeded PRNG (`createSeededRandom`). The seed is `NetworkData.userSeed`, so two users with the same seed and counts will always see the same constellation. The PRNG uses a simple multiplicative hash (Murmur-style finalizer) that is fast and has good distribution for this use case.

### Image Export

`exportImage(options)` creates a temporary offscreen canvas at the requested resolution (default 1080x1920 for stories), renders the constellation at that size, overlays text (identity, stage, stats, branding), and returns a PNG `Blob`.

## Replacing This Engine

To swap in a different renderer (e.g., WebGL, Three.js, Pixi.js):

1. Create a new directory under `engines/` (e.g., `engines/webgl/`).
2. Export a class that implements `VisualizationEngine` from `../../types.ts`.
3. Update the import in the component that mounts the engine to point to your new class.

No other code needs to change -- the component only interacts through the `VisualizationEngine` interface.
