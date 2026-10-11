"use client";

import { physicsActions } from "@/modules/physics";
import type { Point } from "../types";

/*
 * Everyone shares one coordinate space: the document's own layout coordinates,
 * which are also the physics world's. So a cursor sent from a phone in physics
 * mode lands in the right place on a laptop that is scrolling normally.
 */

/** Pointer position on this screen to the shared space. */
export function screenToShared(clientX: number, clientY: number): Point {
  const cam = physicsActions.getCamera();
  if (cam) return { x: (clientX - cam.x) / cam.zoom, y: (clientY - cam.y) / cam.zoom };
  return { x: clientX + window.scrollX, y: clientY + window.scrollY };
}

/** Shared space to a position on this screen. */
export function sharedToScreen(point: Point): Point {
  const cam = physicsActions.getCamera();
  if (cam) return { x: point.x * cam.zoom + cam.x, y: point.y * cam.zoom + cam.y };
  return { x: point.x - window.scrollX, y: point.y - window.scrollY };
}

/**
 * `whenReady` covers physics having just been switched on: the engine is still
 * downloading, so there is no camera yet and the scroll branch would be wrong.
 */
export function goToShared(point: Point, whenReady = false) {
  if (whenReady) {
    physicsActions.flyToPointWhenReady(point.x, point.y);
    return;
  }
  if (physicsActions.getCamera()) {
    physicsActions.flyToPoint(point.x, point.y);
    return;
  }
  window.scrollTo({
    top: Math.max(0, point.y - window.innerHeight / 2),
    // The CSS reduced-motion rule cannot reach an explicit `behavior`.
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}
