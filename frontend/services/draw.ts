import { computeViewportTransform, type ViewportTransform, logicalRectToScreen } from "./renderModel";

export interface RectLike { x: number; y: number; w: number; h: number; color?: string }

export interface SnapshotLike {
  // Extremely simplified shape for early rendering
  players?: Array<{ id: string; x: number; y: number; w?: number; h?: number; color?: string }>;
  pipes?: Array<{ x: number; y: number; w: number; h: number; color?: string }>;
  track?: Array<{ x: number; y: number; w: number; h: number; color?: string }>;
}

export function drawBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f172a"; // slate-900
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawBounds(
  ctx: CanvasRenderingContext2D,
  viewportW: number,
  viewportH: number,
  logicalW: number,
  logicalH: number,
): ViewportTransform {
  const t = computeViewportTransform(viewportW, viewportH, logicalW, logicalH);
  ctx.strokeStyle = "#22d3ee"; // cyan-400
  ctx.lineWidth = 2;
  ctx.strokeRect(t.offsetX, t.offsetY, t.viewW, t.viewH);
  return t;
}

export function drawRects(ctx: CanvasRenderingContext2D, rects: RectLike[], t: ViewportTransform) {
  for (const r of rects) {
    ctx.fillStyle = r.color ?? "#94a3b8"; // slate-400
    const sr = logicalRectToScreen(r.x, r.y, r.w, r.h, t);
    ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  }
}

export function drawSnapshot(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, logical: { w: number; h: number }, snap: SnapshotLike) {
  const t = drawBounds(ctx, canvas.width, canvas.height, logical.w, logical.h);
  // Render order: track (back), pipes (mid), players (front)
  if (snap.track && snap.track.length) drawRects(ctx, snap.track, t);
  if (snap.pipes && snap.pipes.length) drawRects(ctx, snap.pipes, t);
  if (snap.players && snap.players.length)
    drawRects(
      ctx,
      snap.players.map((p) => ({ x: p.x, y: p.y, w: p.w ?? 8, h: p.h ?? 8, color: p.color ?? "#f59e0b" })),
      t,
    );
}
