export const BodyKind = {
  Card: "card",
  Chip: "chip",
  Title: "title",
} as const;
export type BodyKind = (typeof BodyKind)[keyof typeof BodyKind];

/** Attributes the engine finds bodies and regions by. */
export const PHYSICS_ATTR = "data-physics";
export const KIND_ATTR = "data-physics-kind";
export const REGION_ATTR = "data-physics-region";
/** The dot-grid layer inside the stage, moved by the camera. */
export const GRID_ATTR = "data-physics-grid";

/** Thickness of the static floors and walls, in world units. */
export const WALL_THICKNESS = 400;
/** Gap between a region's bottom edge and the floor its bodies rest on. */
export const FLOOR_INSET = 24;
/** How far above its region a body may fly before containment pulls it back. */
export const REGION_HEADROOM = 400;
/** Walls and floors are drawn far longer than the world so nothing rounds an end. */
export const WALL_SPAN_FACTOR = 6;
export const FLOOR_SPAN_FACTOR = 8;

/**
 * Resting bodies sink a hair into the floor, so containment only corrects a
 * body once it is out of bounds by more than this. Without the slack it would
 * nudge, and so wake, settled bodies on every frame.
 */
export const CONTAIN_SLACK = 4;

/** Bodies wider or taller than this are skipped: too big to be throwable. */
export const MAX_BODY_SIZE = 1400;

/** Camera limits. */
export const ZOOM_MIN = 0.08;
export const ZOOM_MAX = 2.5;
export const WHEEL_ZOOM_SENSITIVITY = 0.0088;
/** How far past the world edges the camera may be pushed. */
export const PAN_OVERSCROLL = 400;

/** Share of the viewport a framed region fills when flying to it. */
export const REGION_FIT_PAD = 0.88;
export const OVERVIEW_FIT_PAD = 0.86;
export const FLY_DURATION_MS = 620;

/** Spacing of the stage's dot grid, in world units. */
export const GRID_STEP = 22;

/**
 * The simulation runs on a fixed step so the world advances at the same rate
 * on a 60Hz and a 120Hz screen. Real elapsed time is clamped and spent in
 * whole steps; the cap on steps per frame keeps a stalled tab from trying to
 * catch up all at once.
 */
export const STEP_MS = 1000 / 60;
export const MAX_FRAME_MS = 50;
export const MAX_STEPS_PER_FRAME = 3;

/** One step of the keyboard zoom and pan controls. */
export const KEY_ZOOM_STEP = 1.3;
export const KEY_PAN_STEP = 140;

/**
 * Tabbing to a body flies the camera to it, since a `position: fixed` body can
 * be anywhere on screen or off it. Below this zoom it would arrive unreadably
 * small, so the camera zooms in to at least this much on the way.
 */
export const FOCUS_MIN_ZOOM = 0.75;

/**
 * The world is measured once, so a resize has to rebuild it. Debounced, and
 * height alone must move by more than the slack: a mobile URL bar collapsing
 * fires resize constantly and must not reset the canvas under the reader.
 */
export const RESIZE_DEBOUNCE_MS = 250;
export const RESIZE_HEIGHT_SLACK = 140;

/**
 * Collision categories. A held body drops the floor bit so it can be carried
 * from one section to another; the screen-edge walls always block.
 */
export const CATEGORY_ALL = 0xffffffff;
export const CATEGORY_FLOOR = 0x0002;

/** A press is a tap, not a throw, below both of these. */
export const TAP_MAX_MOVE = 10;
export const TAP_MAX_MS = 280;
