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
