import { Bodies, Body, Composite, Engine, Query, Sleeping } from "matter-js";
import {
  BodyKind,
  CATEGORY_ALL,
  CATEGORY_FLOOR,
  CONTAIN_SLACK,
  FLOOR_INSET,
  FLOOR_SPAN_FACTOR,
  FLY_DURATION_MS,
  FOCUS_MIN_ZOOM,
  GRID_ATTR,
  GRID_STEP,
  KEY_PAN_STEP,
  KEY_ZOOM_STEP,
  KIND_ATTR,
  MAX_BODY_SIZE,
  MAX_FRAME_MS,
  MAX_STEPS_PER_FRAME,
  OVERVIEW_FIT_PAD,
  PHYSICS_ATTR,
  REGION_ATTR,
  REGION_FIT_PAD,
  REGION_HEADROOM,
  STEP_MS,
  TAP_MAX_MOVE,
  TAP_MAX_MS,
  WALL_SPAN_FACTOR,
  WALL_THICKNESS,
} from "../constants";
import {
  centreX,
  clampPan,
  clampZoom,
  easeOutCubic,
  fitBox,
  screenToWorld,
  zoomAt,
  type Box,
  type Camera,
} from "./camera";
import { FEEL } from "./feel";

export type PhysicsController = {
  pan: (dx: number, dy: number) => void;
  zoomBy: (sx: number, sy: number, factor: number) => void;
  zoomTo: (sx: number, sy: number, zoom: number) => void;
  /** Keyboard equivalents of pan and pinch, about the viewport centre. */
  stepZoom: (direction: 1 | -1) => void;
  stepPan: (direction: 1 | -1) => void;
  getZoom: () => number;
  getCamera: () => Camera;
  flyToPoint: (x: number, y: number) => void;
  flyTo: (regionId: string) => void;
  flyToOverview: () => void;
  /** Returns true when a body was grabbed, so the caller pans instead. */
  grab: (sx: number, sy: number) => boolean;
  moveTo: (sx: number, sy: number) => void;
  release: () => void;
  shake: () => void;
  reset: () => void;
  destroy: () => void;
};

type Point = { x: number; y: number };

type Region = { id: string; box: Box };

type Item = {
  el: HTMLElement;
  body: Body;
  w: number;
  h: number;
  region: Region;
  home: Point;
};

type Drag = {
  item: Item;
  offset: Point;
  target: Point;
  velocity: Point;
  startedAt: number;
  moved: number;
};

const KINDS: string[] = Object.values(BodyKind);

function kindOf(el: HTMLElement): BodyKind {
  const kind = el.getAttribute(KIND_ATTR);
  return kind && KINDS.includes(kind) ? (kind as BodyKind) : BodyKind.Card;
}

const clampThrow = (v: number) => Math.max(-FEEL.throwClamp, Math.min(FEEL.throwClamp, v));

const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Turns the laid-out page into an infinite canvas of rigid bodies.
 *
 * World coordinates are the document's own layout coordinates, so nothing
 * jumps when physics begins, and the camera is composed into each body's
 * transform so React never re-renders during the simulation. Everything is
 * measured once: a resize rebuilds the controller rather than patching it.
 */
export function createPhysics(
  stage: HTMLElement,
  onTap: (el: HTMLElement) => void,
): PhysicsController {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  /* ---------- measure everything before mutating anything ---------- */
  const worldW = Math.max(document.documentElement.scrollWidth, vw);
  const worldH = Math.max(document.documentElement.scrollHeight, vh);
  const world: Box = { x: 0, y: 0, w: worldW, h: worldH };

  const toWorldBox = (rect: DOMRect): Box => ({
    x: rect.left + scrollX,
    y: rect.top + scrollY,
    w: rect.width,
    h: rect.height,
  });

  const regions: Region[] = Array.from(
    document.querySelectorAll<HTMLElement>(`[${REGION_ATTR}]`),
  ).map((el) => ({
    id: el.getAttribute(REGION_ATTR) ?? "",
    box: toWorldBox(el.getBoundingClientRect()),
  }));
  const fallbackRegion: Region = { id: "", box: world };

  const regionAtY = (y: number): Region =>
    regions.find((r) => y >= r.box.y && y < r.box.y + r.box.h) ?? regions.at(-1) ?? fallbackRegion;

  const regionFor = (box: Box): Region => regionAtY(box.y + box.h / 2);

  const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[${PHYSICS_ATTR}]`)).map(
    (el) => ({ el, box: toWorldBox(el.getBoundingClientRect()) }),
  );
  const tooBig = (box: Box) => box.w > MAX_BODY_SIZE || box.h > MAX_BODY_SIZE;
  const measured = candidates.filter(({ box }) => box.w > 0 && !tooBig(box));
  // Not bodies, but still have to opt back in or they vanish rather than
  // merely being unthrowable.
  const skipped = candidates.filter(({ box }) => box.w <= 0 || tooBig(box)).map(({ el }) => el);
  for (const el of skipped) el.style.visibility = "visible";

  /* ---------- build the world ---------- */
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = FEEL.gravity;

  const half = WALL_THICKNESS / 2;
  // Repositioned on every camera change so the play area is always screen-wide.
  const leftWall = Bodies.rectangle(-half, worldH / 2, WALL_THICKNESS, worldH * WALL_SPAN_FACTOR, {
    isStatic: true,
  });
  const rightWall = Bodies.rectangle(
    worldW + half,
    worldH / 2,
    WALL_THICKNESS,
    worldH * WALL_SPAN_FACTOR,
    { isStatic: true },
  );
  Composite.add(engine.world, [
    leftWall,
    rightWall,
    // one floor per region, so each section keeps its own pile
    ...(regions.length > 0 ? regions : [fallbackRegion]).map((region) =>
      Bodies.rectangle(
        region.box.x + region.box.w / 2,
        region.box.y + region.box.h - FLOOR_INSET + half,
        worldW * FLOOR_SPAN_FACTOR,
        WALL_THICKNESS,
        { isStatic: true, collisionFilter: { category: CATEGORY_FLOOR } },
      ),
    ),
  ]);

  const items: Item[] = measured.map(({ el, box }) => {
    const feel = FEEL.bodies[kindOf(el)];
    const home = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    const body = Bodies.rectangle(home.x, home.y, box.w, box.h, {
      restitution: feel.restitution,
      friction: feel.friction,
      frictionAir: feel.frictionAir,
      density: feel.density,
      chamfer: { radius: feel.chamfer },
    });

    // The transform carries both camera and body motion.
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = `${box.w}px`;
    el.style.height = `${box.h}px`;
    el.style.margin = "0";
    el.style.zIndex = "5";
    el.style.transformOrigin = "0 0";
    el.style.visibility = "visible";

    return { el, body, w: box.w, h: box.h, region: regionFor(box), home };
  });
  Composite.add(
    engine.world,
    items.map((item) => item.body),
  );
  const bodies = items.map((item) => item.body);

  /* ---------- camera ---------- */
  const contentCentreX = worldW / 2;
  // Start where the reader was, so switching modes does not teleport.
  let cam: Camera = { x: centreX(1, vw, contentCentreX), y: -scrollY, zoom: 1 };
  let camDirty = true;
  let flyRaf = 0;

  // A sibling of the stage, not a child: the stage is above the bodies so it
  // can take the gestures, and a grid inside it would paint over them.
  const grid = document.querySelector<HTMLElement>(`[${GRID_ATTR}]`);

  function screenBoundsX() {
    return { left: -cam.x / cam.zoom, right: (vw - cam.x) / cam.zoom };
  }

  function placeWalls() {
    const { left, right } = screenBoundsX();
    Body.setPosition(leftWall, { x: left - half, y: leftWall.position.y });
    Body.setPosition(rightWall, { x: right + half, y: rightWall.position.y });
  }

  function setCam(next: Camera) {
    cam = clampPan(next, worldH, vh);
    camDirty = true;
    placeWalls();
    wake();
  }

  function cancelFly() {
    cancelAnimationFrame(flyRaf);
    flyRaf = 0;
  }

  function flyToBox(box: Box, pad: number) {
    cancelFly();
    const from = cam;
    const to = clampPan(fitBox(box, vw, vh, pad, contentCentreX), worldH, vh);
    // Reduced motion: arrive rather than travel.
    if (prefersReducedMotion()) {
      setCam(to);
      return;
    }
    const startedAt = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - startedAt) / FLY_DURATION_MS);
      const e = easeOutCubic(k);
      const zoom = from.zoom + (to.zoom - from.zoom) * e;
      cam = {
        x: centreX(zoom, vw, contentCentreX),
        y: from.y + (to.y - from.y) * e,
        zoom,
      };
      camDirty = true;
      placeWalls();
      wake();
      if (k < 1) flyRaf = requestAnimationFrame(step);
      else flyRaf = 0;
    };
    flyRaf = requestAnimationFrame(step);
  }

  /** Frames a world point at no less than `zoom`. */
  function flyToPointAtZoom(x: number, y: number, zoom: number) {
    const w = vw / zoom;
    const h = vh / zoom;
    flyToBox({ x: x - w / 2, y: y - h / 2, w, h }, 1);
  }

  /* ---------- painting ---------- */
  function paint(item: Item) {
    const { position, angle } = item.body;
    // origin 0 0: camera, world position, then rotate about the centre.
    item.el.style.transform =
      `translate(${cam.x.toFixed(2)}px,${cam.y.toFixed(2)}px) scale(${cam.zoom.toFixed(4)})` +
      ` translate(${position.x.toFixed(2)}px,${position.y.toFixed(2)}px)` +
      ` rotate(${angle.toFixed(4)}rad)` +
      ` translate(${(-item.w / 2).toFixed(2)}px,${(-item.h / 2).toFixed(2)}px)`;
  }

  /*
   * The pattern repeats every `step`, so translating by the offset *modulo*
   * step looks identical to moving `background-position` — but composites
   * instead of repainting a full-viewport gradient every frame.
   */
  let gridZoom = 0;
  function paintGrid() {
    if (!grid) return;
    const step = GRID_STEP * cam.zoom;
    if (cam.zoom !== gridZoom) {
      grid.style.backgroundSize = `${step}px ${step}px`;
      gridZoom = cam.zoom;
    }
    const wrap = (v: number) => (((v % step) + step) % step).toFixed(2);
    grid.style.transform = `translate(${wrap(cam.x)}px,${wrap(cam.y)}px)`;
  }

  /** Walls alone leak: a crowded pile can squeeze a body through one. */
  function contain() {
    const { left, right } = screenBoundsX();
    const strip = right - left;

    for (const item of items) {
      const halfW = item.w / 2;
      const halfH = item.h / 2;
      const { x, y } = item.body.position;
      const held = drag?.item === item;
      // Carried bodies roam the world; resting ones stay in their section.
      const floorY = held
        ? worldH - FLOOR_INSET
        : item.region.box.y + item.region.box.h - FLOOR_INSET;
      const ceilY = held ? -REGION_HEADROOM : item.region.box.y - REGION_HEADROOM;

      /*
       * Once the visible strip is narrower than the body, clamping both edges
       * has a single solution — every body pinned to the same x, every frame.
       * Leave x alone there: a body wider than the screen is on screen anyway.
       */
      const clampX = strip >= item.w;
      const nx = clampX
        ? Math.min(Math.max(x, left + halfW - CONTAIN_SLACK), right - halfW + CONTAIN_SLACK)
        : x;
      const ny = Math.min(Math.max(y, ceilY), floorY - halfH + CONTAIN_SLACK);
      if (nx === x && ny === y) continue;

      Sleeping.set(item.body, false);
      Body.setPosition(item.body, { x: nx, y: ny });
      const { x: vx, y: vy } = item.body.velocity;
      Body.setVelocity(item.body, { x: nx === x ? vx : 0, y: ny === y ? vy : 0 });
    }
  }

  /* ---------- loop ---------- */
  let drag: Drag | null = null;
  let raf = 0;
  let running = false;
  let lastAt = performance.now();
  let debt = 0;

  function frame(now: number) {
    // Fixed steps from real elapsed time, so 120Hz does not run the world fast.
    debt += Math.min(now - lastAt, MAX_FRAME_MS);
    lastAt = now;

    let steps = 0;
    while (debt >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      if (drag) {
        Sleeping.set(drag.item.body, false);
        Body.setVelocity(drag.item.body, drag.velocity);
      }
      Engine.update(engine, STEP_MS);
      if (drag) {
        // Snap back under the pointer; setPosition keeps the velocity, so a
        // release still throws.
        Body.setPosition(drag.item.body, drag.target);
        drag.velocity = {
          x: drag.velocity.x * FEEL.holdDecay,
          y: drag.velocity.y * FEEL.holdDecay,
        };
      }
      debt -= STEP_MS;
      steps += 1;
    }
    if (steps === MAX_STEPS_PER_FRAME) debt = 0;

    contain();

    if (camDirty) paintGrid();
    let awake = drag !== null || flyRaf !== 0;
    for (const item of items) {
      if (item.body.isSleeping && !camDirty) continue;
      paint(item);
      if (!item.body.isSleeping) awake = true;
    }
    camDirty = false;

    // Stop once settled, so an idle canvas costs nothing.
    if (awake) raf = requestAnimationFrame(frame);
    else running = false;
  }

  function wake() {
    if (running) return;
    running = true;
    // Time spent asleep is not time the world should advance.
    lastAt = performance.now();
    debt = 0;
    raf = requestAnimationFrame(frame);
  }

  // Fixed bodies plus a locked document: the browser cannot scroll a focused
  // link into view, so the camera has to.
  function onFocusIn(event: FocusEvent) {
    const target = event.currentTarget;
    const item = items.find((candidate) => candidate.el === target);
    if (!item) return;
    const { x, y } = item.body.position;
    flyToPointAtZoom(x, y, Math.max(cam.zoom, FOCUS_MIN_ZOOM));
  }
  for (const item of items) item.el.addEventListener("focusin", onFocusIn);

  placeWalls();
  paintGrid();
  for (const item of items) paint(item);
  wake();

  return {
    // Horizontal position is derived, so panning only moves vertically.
    pan(_dx, dy) {
      cancelFly();
      setCam({ ...cam, y: cam.y + dy });
    },
    zoomBy(_sx, sy, factor) {
      cancelFly();
      setCam(zoomAt(cam, sy, cam.zoom * factor, vw, contentCentreX));
    },
    zoomTo(_sx, sy, zoom) {
      cancelFly();
      setCam(zoomAt(cam, sy, clampZoom(zoom), vw, contentCentreX));
    },
    stepZoom(direction) {
      cancelFly();
      const factor = direction > 0 ? KEY_ZOOM_STEP : 1 / KEY_ZOOM_STEP;
      setCam(zoomAt(cam, vh / 2, cam.zoom * factor, vw, contentCentreX));
    },
    stepPan(direction) {
      cancelFly();
      setCam({ ...cam, y: cam.y - direction * KEY_PAN_STEP });
    },
    getZoom: () => cam.zoom,
    getCamera: () => cam,
    flyToPoint(x, y) {
      flyToPointAtZoom(x, y, cam.zoom);
    },
    flyTo(regionId) {
      const region = regions.find((r) => r.id === regionId);
      if (region) flyToBox(region.box, REGION_FIT_PAD);
      else flyToBox(world, OVERVIEW_FIT_PAD);
    },
    flyToOverview() {
      flyToBox(world, OVERVIEW_FIT_PAD);
    },
    grab(sx, sy) {
      cancelFly();
      const point = screenToWorld(sx, sy, cam);
      const hits = Query.point(bodies, point);
      // Bodies paint in DOM order, so the last match is the one on top.
      const hit = hits.at(-1);
      const item = hit && items.find((candidate) => candidate.body === hit);
      if (!hit || !item) return false;
      hit.collisionFilter.mask = CATEGORY_ALL & ~CATEGORY_FLOOR;
      drag = {
        item,
        offset: { x: point.x - hit.position.x, y: point.y - hit.position.y },
        target: { x: hit.position.x, y: hit.position.y },
        velocity: { x: 0, y: 0 },
        startedAt: performance.now(),
        moved: 0,
      };
      wake();
      return true;
    },
    moveTo(sx, sy) {
      if (!drag) return;
      const point = screenToWorld(sx, sy, cam);
      const { body } = drag.item;
      const target = { x: point.x - drag.offset.x, y: point.y - drag.offset.y };
      const velocity = {
        x: clampThrow(target.x - body.position.x),
        y: clampThrow(target.y - body.position.y),
      };
      drag.moved += (Math.abs(velocity.x) + Math.abs(velocity.y)) * cam.zoom;
      drag.target = target;
      drag.velocity = velocity;
      Body.setPosition(body, target);
      Body.setAngularVelocity(body, velocity.x * FEEL.spinFromThrow);
    },
    release() {
      if (!drag) return;
      const isTap = drag.moved < TAP_MAX_MOVE && performance.now() - drag.startedAt < TAP_MAX_MS;
      const { item } = drag;
      item.body.collisionFilter.mask = CATEGORY_ALL;
      item.region = regionAtY(item.body.position.y);
      drag = null;
      wake();
      if (isTap) onTap(item.el);
    },
    shake() {
      const { spreadX, liftMin, liftRange, spin } = FEEL.shake;
      for (const { body } of items) {
        Sleeping.set(body, false);
        Body.setVelocity(body, {
          x: (Math.random() - 0.5) * spreadX,
          y: -Math.random() * liftRange - liftMin,
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * spin);
      }
      wake();
    },
    reset() {
      for (const item of items) {
        Sleeping.set(item.body, false);
        Body.setPosition(item.body, item.home);
        Body.setVelocity(item.body, { x: 0, y: 0 });
        Body.setAngle(item.body, 0);
        Body.setAngularVelocity(item.body, 0);
      }
      wake();
    },
    destroy() {
      cancelAnimationFrame(raf);
      cancelFly();
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      if (grid) {
        grid.style.transform = "";
        grid.style.backgroundSize = "";
      }
      for (const el of skipped) el.style.visibility = "";
      for (const { el } of items) {
        el.removeEventListener("focusin", onFocusIn);
        el.style.position = "";
        el.style.top = "";
        el.style.left = "";
        el.style.width = "";
        el.style.height = "";
        el.style.margin = "";
        el.style.zIndex = "";
        el.style.transformOrigin = "";
        el.style.transform = "";
        el.style.visibility = "";
      }
    },
  };
}
