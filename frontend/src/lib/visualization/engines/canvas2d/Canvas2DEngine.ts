import type {
  ExportOptions,
  NetworkData,
  VisualizationEngine,
} from '../../types';

// ---------------------------------------------------------------------------
// Seeded PRNG — deterministic random from a string seed
// ---------------------------------------------------------------------------
function createSeededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------
interface Star {
  x: number;
  y: number;
  radius: number;
  color: string;
  baseOpacity: number;
  phase: number; // twinkle phase offset
  degree: 0 | 1 | 2 | 3; // 0 = center
}

interface Stardust {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BG_TOP = '#1e1b4b'; // indigo-950
const BG_BOTTOM = '#0a0a0f'; // near-black
const CENTER_COLOR = '#fff5e6'; // warm white
const DEG1_COLOR = '#e0e7ff'; // bright indigo-white
const DEG2_COLOR = '#a5b4fc'; // indigo-300
const DEG3_COLOR = '#818cf8'; // indigo-400
const LINE_COLOR_START = 'rgba(255, 255, 255, 0.3)';
const LINE_COLOR_END = 'rgba(255, 255, 255, 0.05)';
const GLOW_COLOR = 'rgba(99, 102, 241, 0.35)'; // indigo-500
const TWINKLE_SPEED = 0.001;
const TWINKLE_AMPLITUDE = 0.15;
const STARDUST_COUNT = 50;
const MAX_DEG1 = 20;
const MAX_DEG2 = 40;
const MAX_DEG3 = 60;

// ---------------------------------------------------------------------------
// Canvas2DEngine
// ---------------------------------------------------------------------------
export class Canvas2DEngine implements VisualizationEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrameId: number | null = null;
  private data: NetworkData | null = null;
  private stars: Star[] = [];
  private stardust: Stardust[] = [];
  private startTime = 0;

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  mount(container: HTMLElement, data: NetworkData): void {
    this.container = container;
    this.data = data;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    // Size canvas to container
    this.syncSize();

    // Watch for container resize
    this.resizeObserver = new ResizeObserver(() => {
      this.syncSize();
      this.regenerate();
    });
    this.resizeObserver.observe(container);

    // Build stars from data
    this.regenerate();

    // Start animation
    this.startTime = performance.now();
    this.tick();
  }

  update(data: NetworkData): void {
    this.data = data;
    this.regenerate();
  }

  async exportImage(options: ExportOptions): Promise<Blob> {
    const { width, height, identityText, stageLabel, stats } = options;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context for export canvas');

    // Render constellation onto offscreen canvas
    const data = this.data;
    if (!data) throw new Error('No data to export');

    const exportStardust = this.generateStardust(width, height, data.userSeed);
    const exportStars = this.generateStars(width, height, data);
    const now = performance.now();
    const elapsed = now - this.startTime;

    this.renderFrame(ctx, width, height, exportStardust, exportStars, elapsed);

    // Draw text overlays
    this.renderExportText(ctx, width, height, identityText, stageLabel, stats);

    return new Promise<Blob>((resolve, reject) => {
      offscreen.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to export canvas as PNG'));
        },
        'image/png',
        1.0,
      );
    });
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.container = null;
    this.data = null;
    this.stars = [];
    this.stardust = [];
  }

  // -----------------------------------------------------------------------
  // Sizing
  // -----------------------------------------------------------------------

  private syncSize(): void {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx?.scale(dpr, dpr);
  }

  // -----------------------------------------------------------------------
  // Star generation
  // -----------------------------------------------------------------------

  private regenerate(): void {
    if (!this.canvas || !this.data || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    this.stardust = this.generateStardust(w, h, this.data.userSeed);
    this.stars = this.generateStars(w, h, this.data);
  }

  private generateStardust(w: number, h: number, seed: string): Stardust[] {
    const rng = createSeededRandom(seed + ':stardust');
    const dots: Stardust[] = [];
    for (let i = 0; i < STARDUST_COUNT; i++) {
      dots.push({
        x: rng() * w,
        y: rng() * h,
        radius: 1 + rng(),
        opacity: 0.1 + rng() * 0.2,
      });
    }
    return dots;
  }

  private generateStars(w: number, h: number, data: NetworkData): Star[] {
    const rng = createSeededRandom(data.userSeed + ':stars');
    const cx = w / 2;
    const cy = h / 2;
    const canvasRadius = Math.min(w, h) / 2;
    const stars: Star[] = [];

    // Center node
    stars.push({
      x: cx,
      y: cy,
      radius: 6,
      color: CENTER_COLOR,
      baseOpacity: 1,
      phase: rng() * Math.PI * 2,
      degree: 0,
    });

    // Helper: generate stars in a ring
    const addRing = (
      count: number,
      minR: number,
      maxR: number,
      color: string,
      opacity: number,
      radiusMin: number,
      radiusMax: number,
      degree: 1 | 2 | 3,
    ) => {
      if (count === 0) return;
      const angleStep = (Math.PI * 2) / count;
      for (let i = 0; i < count; i++) {
        const offsetDeg = (rng() - 0.5) * 30; // +/-15 degrees
        const offsetRad = (offsetDeg * Math.PI) / 180;
        const angle = angleStep * i + offsetRad;
        const r = (minR + rng() * (maxR - minR)) * canvasRadius;
        stars.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          radius: radiusMin + rng() * (radiusMax - radiusMin),
          color,
          baseOpacity: opacity,
          phase: rng() * Math.PI * 2,
          degree,
        });
      }
    };

    addRing(
      Math.min(data.directCount, MAX_DEG1),
      0.15,
      0.3,
      DEG1_COLOR,
      1,
      3,
      4,
      1,
    );
    addRing(
      Math.min(data.degree2Count, MAX_DEG2),
      0.35,
      0.55,
      DEG2_COLOR,
      0.6,
      2,
      3,
      2,
    );
    addRing(
      Math.min(data.degree3Count, MAX_DEG3),
      0.6,
      0.85,
      DEG3_COLOR,
      0.3,
      1,
      2,
      3,
    );

    return stars;
  }

  // -----------------------------------------------------------------------
  // Animation loop
  // -----------------------------------------------------------------------

  private tick = (): void => {
    this.animationFrameId = requestAnimationFrame(this.tick);
    if (!this.ctx || !this.canvas || !this.container) return;

    const rect = this.container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const elapsed = performance.now() - this.startTime;

    this.renderFrame(this.ctx, w, h, this.stardust, this.stars, elapsed);
  };

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  private renderFrame(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    stardust: Stardust[],
    stars: Star[],
    elapsed: number,
  ): void {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, BG_TOP);
    bg.addColorStop(1, BG_BOTTOM);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Stardust
    for (const dot of stardust) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
      ctx.fill();
    }

    // Find center star for lines
    const center = stars.find((s) => s.degree === 0);

    // Constellation lines (center to 1st-degree)
    if (center) {
      for (const star of stars) {
        if (star.degree !== 1) continue;
        const grad = ctx.createLinearGradient(
          center.x,
          center.y,
          star.x,
          star.y,
        );
        grad.addColorStop(0, LINE_COLOR_START);
        grad.addColorStop(1, LINE_COLOR_END);
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(star.x, star.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Stars with twinkle
    for (const star of stars) {
      const twinkle =
        Math.sin(elapsed * TWINKLE_SPEED + star.phase) * TWINKLE_AMPLITUDE;
      const opacity = Math.max(
        0,
        Math.min(1, star.baseOpacity + twinkle * star.baseOpacity),
      );

      // Glow halo for center node
      if (star.degree === 0) {
        const glowRadius =
          18 +
          Math.sin(elapsed * TWINKLE_SPEED * 0.7 + star.phase) * 3;
        const glow = ctx.createRadialGradient(
          star.x,
          star.y,
          star.radius,
          star.x,
          star.y,
          glowRadius,
        );
        glow.addColorStop(0, GLOW_COLOR);
        glow.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.beginPath();
        ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // -----------------------------------------------------------------------
  // Export text overlays
  // -----------------------------------------------------------------------

  private renderExportText(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    identityText: string | null,
    stageLabel: string,
    stats: string,
  ): void {
    ctx.textAlign = 'center';

    // Position text in the lower portion of the image
    let y = h * 0.78;

    // Identity text
    if (identityText) {
      ctx.font = '48px Fraunces, Georgia, serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(identityText, w / 2, y);
      y += 52;
    }

    // Stage label
    ctx.font = '28px Fraunces, Georgia, serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText(stageLabel, w / 2, y);
    y += 40;

    // Stats
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(stats, w / 2, y);

    // Branding at bottom
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#6366f1';
    ctx.fillText('navilla.app', w / 2, h - 32);
  }
}
