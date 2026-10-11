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
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage) return;

    let cancelled = false;

    function onTap(el: HTMLElement) {
      const link = el instanceof HTMLAnchorElement ? el : el.querySelector("a");
      link?.click();
    }

    // matter-js is only downloaded when physics is switched on.
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
   * The world is measured once, so a resize leaves the walls and floors in the
   * wrong place. Rebuilding re-measures, at the cost of resetting positions.
   * Height alone must move by more than the slack, or a mobile URL bar
   * collapsing resets the canvas under the reader's hand.
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
        Siblings, not nested: the stage sits above the bodies to receive
        gestures, so a grid inside it would paint over the cards. The negative
        inset is the one-tile overhang, and must exceed GRID_STEP x ZOOM_MAX.
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
