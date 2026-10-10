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
  /** Camera: pan by a screen-space delta. */
  pan: (dx: number, dy: number) => void;
  /** Camera: zoom about a screen point by a multiplier. */
  zoomBy: (sx: number, sy: number, factor: number) => void;
  /** Camera: zoom about a screen point to an absolute level. */
  zoomTo: (sx: number, sy: number, zoom: number) => void;
  /** Keyboard equivalents of the pan and pinch gestures, about the viewport centre. */
  stepZoom: (direction: 1 | -1) => void;
  stepPan: (direction: 1 | -1) => void;
  getZoom: () => number;
  /** Current camera, so other modules can map world points to the screen. */
  getCamera: () => Camera;
  /** Frame a single world point, keeping the current zoom. */
  flyToPoint: (x: number, y: number) => void;
  /** Frame one region, or the whole world when the id is unknown. */
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

/** Checked per fly rather than once, so changing the OS setting takes effect. */
const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Turns the laid-out page into an infinite canvas of rigid bodies.
 *
 * World coordinates are the document's own layout coordinates, so every body
 * starts exactly where it was rendered and nothing jumps when physics begins.
 * The camera is composed into each body's transform, so no wrapper element is
 * needed and React never re-renders during the simulation.
 *
 * Everything is measured once, at construction. A viewport resize therefore
 * rebuilds the whole controller rather than patching it; see `PhysicsStage`.
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
  // Skipped elements are not bodies, but `main` is hidden in physics mode, so
  // they still have to opt back in or they would vanish instead of just being
  // unthrowable.
  const skipped = candidates.filter(({ box }) => box.w <= 0 || tooBig(box)).map(({ el }) => el);
  for (const el of skipped) el.style.visibility = "visible";

  /* ---------- build the world ---------- */
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = FEEL.gravity;

  const half = WALL_THICKNESS / 2;
  // The side walls are repositioned every camera change so they sit exactly on
  // the screen edges: the play area is always the full width of the screen.
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

    // Pin to the viewport; the transform carries both camera and body motion.
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = `${box.w}px`;
    el.style.height = `${box.h}px`;
    el.style.margin = "0";
    el.style.zIndex = "5";
    el.style.transformOrigin = "0 0";
    // The page is hidden with `visibility: hidden` in physics mode; bodies opt back in.
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
  // Start exactly where the reader was, so turning physics on does not teleport.
  let cam: Camera = { x: centreX(1, vw, contentCentreX), y: -scrollY, zoom: 1 };
  let camDirty = true;
  let flyRaf = 0;

  // A sibling of the stage, not a child: the stage is above the bodies so it
  // can take the gestures, and a grid inside it would paint over them.
  const grid = document.querySelector<HTMLElement>(`[${GRID_ATTR}]`);

  /** World-space x of the screen's left and right edges at the current zoom. */
  function screenBoundsX() {
    return { left: -cam.x / cam.zoom, right: (vw - cam.x) / cam.zoom };
  }

  /** Keeps the side walls on the screen edges, whatever the zoom. */
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
    // Reduced motion: arrive rather than travel. The destination is the point,
    // the 620ms glide is not.
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
    // origin 0 0: camera, then world position, then rotate about the centre.
    item.el.style.transform =
      `translate(${cam.x.toFixed(2)}px,${cam.y.toFixed(2)}px) scale(${cam.zoom.toFixed(4)})` +
      ` translate(${position.x.toFixed(2)}px,${position.y.toFixed(2)}px)` +
      ` rotate(${angle.toFixed(4)}rad)` +
      ` translate(${(-item.w / 2).toFixed(2)}px,${(-item.h / 2).toFixed(2)}px)`;
  }

  /*
   * The dot pattern repeats every `step`, so translating the layer by the
   * camera offset *modulo* step looks identical to moving `background-position`
   * by the offset itself — but a transform composites instead of repainting a
   * full-viewport gradient on every frame of every pan. `background-size` is
   * the one property that must change, so it is written only when the zoom
   * actually changed. The layer is a child of the stage and no ancestor of a
   * body, so transforming it is safe.
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

  /**
   * Walls alone are not enough: a crowded pile can squeeze a body through one.
   * This is the guarantee that nothing is ever lost.
   */
  function contain() {
    // The camera cannot change mid-loop, so these are read once per frame.
    const { left, right } = screenBoundsX();
    const strip = right - left;

    for (const item of items) {
      const halfW = item.w / 2;
      const halfH = item.h / 2;
      const { x, y } = item.body.position;
      const held = drag?.item === item;
      // A carried body may roam the whole world; a resting one stays in its section.
      const floorY = held
        ? worldH - FLOOR_INSET
        : item.region.box.y + item.region.box.h - FLOOR_INSET;
      const ceilY = held ? -REGION_HEADROOM : item.region.box.y - REGION_HEADROOM;

      /*
       * Horizontal bounds are the screen edges, so a body can always use the
       * full width of the screen but never leave it. Zoomed in far enough the
       * visible strip is narrower than the body itself, and clamping both
       * edges then has only one solution: every body pinned to the same x,
       * every frame, with its horizontal velocity zeroed. Leave x alone in
       * that case — the body is wider than the screen, so it is on screen
       * whatever its position.
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
    // Fixed steps from real elapsed time: the world must advance at the same
    // rate on a 120Hz phone as on a 60Hz laptop.
    debt += Math.min(now - lastAt, MAX_FRAME_MS);
    lastAt = now;

    let steps = 0;
    while (debt >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      if (drag) {
        // Carry the throw velocity into the step so collisions still respond.
        Sleeping.set(drag.item.body, false);
        Body.setVelocity(drag.item.body, drag.velocity);
      }
      Engine.update(engine, STEP_MS);
      if (drag) {
        // Then snap back under the pointer. Integrating the throw velocity
        // would otherwise run the body ahead of the hand. setPosition keeps
        // the velocity, so releasing still throws.
        Body.setPosition(drag.item.body, drag.target);
        drag.velocity = {
          x: drag.velocity.x * FEEL.holdDecay,
          y: drag.velocity.y * FEEL.holdDecay,
        };
      }
      debt -= STEP_MS;
      steps += 1;
    }
    // Do not try to catch up after a stall; drop the backlog instead.
    if (steps === MAX_STEPS_PER_FRAME) debt = 0;

    contain();

    if (camDirty) paintGrid();
    let awake = drag !== null || flyRaf !== 0;
    for (const item of items) {
      // A camera move repaints everything, settled or not.
      if (item.body.isSleeping && !camDirty) continue;
      paint(item);
      if (!item.body.isSleeping) awake = true;
    }
    camDirty = false;

    // Stop once everything has settled, so an idle canvas costs nothing.
    if (awake) raf = requestAnimationFrame(frame);
    else running = false;
  }

  function wake() {
    if (running) return;
    running = true;
    // Reset the clock: time spent asleep is not time the world should advance.
    lastAt = performance.now();
    debt = 0;
    raf = requestAnimationFrame(frame);
  }

  /*
   * A body is `position: fixed` wherever the simulation put it, and the
   * document cannot scroll, so the browser cannot bring a focused link into
   * view. Without this, tabbing through physics mode strands focus somewhere
   * off screen.
   */
  function onFocusIn(event: FocusEvent) {
    const target = event.currentTarget;
    const item = items.find((candidate) => candidate.el === target);
    if (!item) return;
    const { x, y } = item.body.position;
    flyToPointAtZoom(x, y, Math.max(cam.zoom, FOCUS_MIN_ZOOM));
  }
  for (const item of items) item.el.addEventListener("focusin", onFocusIn);

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
      // Bodies paint in DOM order, so the last match is the one on top: that
      // is the one the pointer visually landed on.
      const hit = hits.at(-1);
      const item = hit && items.find((candidate) => candidate.body === hit);
      if (!hit || !item) return false;
      // Drop the floor bit so a held body can be carried across sections.
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
      // Velocity set during the drag persists on release: that is the throw.
      const velocity = {
        x: clampThrow(target.x - body.position.x),
        y: clampThrow(target.y - body.position.y),
      };
      // Measured on screen, so a flick at low zoom is not counted as a throw.
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
      // It now belongs to whichever section it was dropped into.
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
