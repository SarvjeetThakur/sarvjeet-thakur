"use client";

import type { PhysicsController } from "./engine";

let current: PhysicsController | null = null;
/** A fly asked for while the engine was still loading, replayed when it lands. */
let pending: { x: number; y: number } | null = null;

/** Set by the stage when the engine starts (controller) or stops (null). */
export function setPhysicsController(controller: PhysicsController | null) {
  current = controller;
  if (!controller) {
    pending = null;
    return;
  }
  if (pending) {
    const { x, y } = pending;
    pending = null;
    controller.flyToPoint(x, y);
  }
}

/** How the rest of the UI drives the running engine. No-ops while physics is off. */
export const physicsActions = {
  shake: () => current?.shake(),
  reset: () => current?.reset(),
  flyTo: (regionId: string) => current?.flyTo(regionId),
  flyToOverview: () => current?.flyToOverview(),
  flyToPoint: (x: number, y: number) => current?.flyToPoint(x, y),
  /**
   * Aims the camera as soon as there is a camera to aim. matter-js is only
   * downloaded when physics is switched on, so switching and flying in the
   * same breath would otherwise race the import and silently do nothing.
   */
  flyToPointWhenReady: (x: number, y: number) => {
    if (current) current.flyToPoint(x, y);
    else pending = { x, y };
  },
  /** Keyboard equivalents of pinch and drag, for the control bar. */
  zoomIn: () => current?.stepZoom(1),
  zoomOut: () => current?.stepZoom(-1),
  panUp: () => current?.stepPan(-1),
  panDown: () => current?.stepPan(1),
  /** Null while physics is off, so callers fall back to document coordinates. */
  getCamera: () => current?.getCamera() ?? null,
};
