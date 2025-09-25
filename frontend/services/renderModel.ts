export interface ViewportTransform {
  scale: number;
  viewW: number;
  viewH: number;
  offsetX: number;
  offsetY: number;
}

export function computeViewportTransform(
  viewportW: number,
  viewportH: number,
  logicalW: number,
  logicalH: number,
): ViewportTransform {
  const scale = Math.min(viewportW / logicalW, viewportH / logicalH);
  const viewW = Math.floor(logicalW * scale);
  const viewH = Math.floor(logicalH * scale);
  const offsetX = Math.floor((viewportW - viewW) / 2);
  const offsetY = Math.floor((viewportH - viewH) / 2);
  return { scale, viewW, viewH, offsetX, offsetY };
}

export function logicalToScreenX(x: number, t: ViewportTransform): number {
  return Math.floor(x * t.scale) + t.offsetX;
}

export function logicalToScreenY(y: number, t: ViewportTransform): number {
  return Math.floor(y * t.scale) + t.offsetY;
}

export function logicalRectToScreen(
  x: number,
  y: number,
  w: number,
  h: number,
  t: ViewportTransform,
) {
  return {
    x: logicalToScreenX(x, t),
    y: logicalToScreenY(y, t),
    w: Math.floor(w * t.scale),
    h: Math.floor(h * t.scale),
  };
}
