export type Pt = { id: number; x: number; y: number };
export type PairKind = "horizontal" | "vertical" | "other";
export type Pair = { id: string; a: Pt; b: Pt; kind: PairKind };

// View-model overlays for a stateless graph renderer
export type OverlayLine = {
  x1: number; y1: number; x2: number; y2: number;
  stroke?: string; dash?: string; width?: number; opacity?: number;
};
export type OverlayRect = {
  x1: number; y1: number; x2: number; y2: number;
  fill?: string; stroke?: string; opacity?: number;
};
export type OverlayLabel = {
  x: number; y: number; lines: string[];
  anchor?: 'start'|'middle'|'end'; fill?: string; fontSize?: number;
};
export type PlaneOverlays = { lines: OverlayLine[]; rects: OverlayRect[]; labels: OverlayLabel[] };
