import { PAN_OVERSCROLL, ZOOM_MAX, ZOOM_MIN } from "../constants";

/**
 * `translate(x, y) scale(zoom)` applied with `transform-origin: 0 0`.
 * World coordinates are the document's own layout coordinates.
 */
export type Camera = { x: number; y: number; zoom: number };

export type Box = { x: number; y: number; w: number; h: number };

// Guarded: Math.min/max propagate NaN, and a NaN camera makes every body
// transform invalid with no gesture able to recover it.
export const clampZoom = (zoom: number) =>
  Number.isFinite(zoom) ? Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) : ZOOM_MIN;

/** The only place screen coordinates become world coordinates. */
export function screenToWorld(sx: number, sy: number, cam: Camera) {
  return { x: (sx - cam.x) / cam.zoom, y: (sy - cam.y) / cam.zoom };
}

/**
 * The canvas is always exactly as wide as the screen, so horizontal position
 * is derived rather than panned: the content stays centred at every zoom, and
 * zooming out opens up room on both sides instead of shrinking the play area.
 */
export function centreX(zoom: number, vw: number, contentCentreX: number) {
  return vw / 2 - contentCentreX * zoom;
}

/** Zoom about a screen point. Only the vertical anchor is kept; x is derived. */
export function zoomAt(
  cam: Camera,
  sy: number,
  nextZoom: number,
  vw: number,
  contentCentreX: number,
): Camera {
  const zoom = clampZoom(nextZoom);
  const k = zoom / cam.zoom;
  return { x: centreX(zoom, vw, contentCentreX), y: sy - (sy - cam.y) * k, zoom };
}

/** Camera that frames a world-space box, fitted to the viewport. */
export function fitBox(
  box: Box,
  vw: number,
  vh: number,
  pad: number,
  contentCentreX: number,
): Camera {
  const zoom = clampZoom(Math.min(vw / box.w, vh / box.h) * pad);
  return {
    x: centreX(zoom, vw, contentCentreX),
    y: vh / 2 - (box.y + box.h / 2) * zoom,
    zoom,
  };
}

/** Keeps the world from being panned entirely off the screen, vertically. */
export function clampPan(cam: Camera, worldH: number, vh: number): Camera {
  const scaledH = worldH * cam.zoom;
  const slack = PAN_OVERSCROLL;
  const minY = Math.min(vh - scaledH - slack, slack);
  const maxY = Math.max(slack, vh - scaledH - slack);
  return { ...cam, y: Math.min(Math.max(cam.y, minY), maxY) };
}

export const easeOutCubic = (k: number) => 1 - (1 - k) ** 3;
