export type { VisualizationEngine, NetworkData, ExportOptions } from './types';
export { Canvas2DEngine } from './engines/canvas2d/Canvas2DEngine';

// Active engine — change this one line to swap engines
export { Canvas2DEngine as ActiveEngine } from './engines/canvas2d/Canvas2DEngine';
