"use client";

import { useGesture } from "@use-gesture/react";
import { useEffect, useRef, useState } from "react";
import { usePhysicsMode } from "@/modules/mode";
import {
  GRID_ATTR,
  RESIZE_DEBOUNCE_MS,
  RESIZE_HEIGHT_SLACK,
  WHEEL_ZOOM_SENSITIVITY,
} from "../constants";
import { setPhysicsController } from "../lib/controller-store";
import type { PhysicsController } from "../lib/engine";

/**
 * The input surface for physics mode: a full-screen canvas that exists only
 * while physics is on. The bodies are the page's own elements; this layer owns
 * the gestures that pan, zoom, grab and throw them.
 */
export function PhysicsStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const controller = useRef<PhysicsController | null>(null);
  const grabbed = useRef(false);
  const enabled = usePhysicsMode();
  const [ready, setReady] = useState(false);
  // Bumped on a real viewport change, which rebuilds the world below.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage) return;

    let cancelled = false;

    function onTap(el: HTMLElement) {
      // The stage covers the page, so a confirmed tap is what follows a link.
      const link = el instanceof HTMLAnchorElement ? el : el.querySelector("a");
      link?.click();
    }

    // matter-js is only downloaded when physics is actually switched on.
    void import("../lib/engine").then(({ createPhysics }) => {
      if (cancelled) return;
      controller.current = createPhysics(stage, onTap);
      setPhysicsController(controller.current);
      setReady(true);
    });

    return () => {
      cancelled = true;
      setPhysicsController(null);
      controller.current?.destroy();
      controller.current = null;
      setReady(false);
    };
  }, [enabled, generation]);

  /*
   * The world — walls, floors, region boxes and every body's size — is
   * measured once when the engine starts, so a resize or a rotation would
   * otherwise leave the walls on the old screen edges and the floors at the
   * wrong world height. Rebuilding re-measures everything, at the cost of
   * returning the bodies to their laid-out positions.
   *
   * Height alone has to move by more than the slack: a mobile URL bar
   * collapsing fires resize constantly and must not reset the canvas
   * under the reader's hand.
   */
  useEffect(() => {
    if (!enabled) return;
    let w = window.innerWidth;
    let h = window.innerHeight;
    let timer: ReturnType<typeof setTimeout>;

    const onResize = () => {
      const nextW = window.innerWidth;
      const nextH = window.innerHeight;
      if (nextW === w && Math.abs(nextH - h) < RESIZE_HEIGHT_SLACK) return;
      w = nextW;
      h = nextH;
      clearTimeout(timer);
      timer = setTimeout(() => setGeneration((value) => value + 1), RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [enabled]);

  useGesture(
    {
      onDragStart: ({ xy: [x, y] }) => {
        grabbed.current = controller.current?.grab(x, y) ?? false;
      },
      onDrag: ({ xy: [x, y], delta: [dx, dy], pinching, cancel }) => {
        if (pinching) return cancel();
        if (grabbed.current) controller.current?.moveTo(x, y);
        else controller.current?.pan(dx, dy);
      },
      onDragEnd: () => {
        if (grabbed.current) controller.current?.release();
        grabbed.current = false;
      },
      // Wheel scrolls the canvas; ctrl+wheel (and trackpad pinch) zooms it.
      onWheel: ({ event, delta: [dx, dy] }) => {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) {
          controller.current?.zoomBy(
            event.clientX,
            event.clientY,
            Math.exp(-dy * WHEEL_ZOOM_SENSITIVITY),
          );
        } else {
          controller.current?.pan(-dx, -dy);
        }
      },
      onPinch: ({ origin: [ox, oy], offset: [scale], first, memo }) => {
        const base = first ? (controller.current?.getZoom() ?? 1) / scale : memo;
        controller.current?.zoomTo(ox, oy, base * scale);
        return base;
      },
    },
    {
      target: stageRef,
      enabled: enabled && ready,
      eventOptions: { passive: false },
      drag: { filterTaps: false, pointer: { touch: true } },
    },
  );

  if (!enabled) return null;

  return (
    <>
      {/*
        The grid and the input surface are siblings at different depths, and
        they have to be: the stage must sit above the bodies to receive the
        gestures, so a grid *inside* it would paint over the cards. This sits
        below the bodies (z-index 5) and above the starfield (-z-10).

        The negative inset is the one-tile overhang that lets the camera move
        it by a transform without exposing an edge, so it must stay larger
        than GRID_STEP x ZOOM_MAX.
      */}
      <div
        {...{ [GRID_ATTR]: "" }}
        aria-hidden
        className="pointer-events-none fixed -inset-16 z-0 origin-top-left bg-[radial-gradient(circle_at_1px_1px,var(--dot)_1px,transparent_0)] will-change-transform"
      />
      <div
        ref={stageRef}
        aria-hidden
        className="fixed inset-0 z-10 cursor-grab touch-none active:cursor-grabbing"
      />
    </>
  );
}
