export const BodyKind = {
  Card: "card",
  Chip: "chip",
  Title: "title",
} as const;
export type BodyKind = (typeof BodyKind)[keyof typeof BodyKind];

/** Attributes the engine finds bodies, regions and the grid by. */
export const PHYSICS_ATTR = "data-physics";
export const KIND_ATTR = "data-physics-kind";
export const REGION_ATTR = "data-physics-region";
export const GRID_ATTR = "data-physics-grid";

/* World units throughout. */
export const WALL_THICKNESS = 400;
export const FLOOR_INSET = 24;
export const REGION_HEADROOM = 400;
export const WALL_SPAN_FACTOR = 6;
export const FLOOR_SPAN_FACTOR = 8;

/** Without this slack, containment wakes settled bodies every frame. */
export const CONTAIN_SLACK = 4;

/** Larger elements are skipped: too big to be throwable. */
export const MAX_BODY_SIZE = 1400;

export const ZOOM_MIN = 0.08;
export const ZOOM_MAX = 2.5;
export const WHEEL_ZOOM_SENSITIVITY = 0.0088;
export const PAN_OVERSCROLL = 400;

export const REGION_FIT_PAD = 0.88;
export const OVERVIEW_FIT_PAD = 0.86;
export const FLY_DURATION_MS = 620;

export const GRID_STEP = 22;

/** Fixed step, so the world runs at the same rate on 60Hz and 120Hz. */
export const STEP_MS = 1000 / 60;
export const MAX_FRAME_MS = 50;
export const MAX_STEPS_PER_FRAME = 3;

export const KEY_ZOOM_STEP = 1.3;
export const KEY_PAN_STEP = 140;

/** Tabbing to a body flies to it; below this it would arrive unreadable. */
export const FOCUS_MIN_ZOOM = 0.75;

/** Height must move by more than the slack: a mobile URL bar is not a resize. */
export const RESIZE_DEBOUNCE_MS = 250;
export const RESIZE_HEIGHT_SLACK = 140;

/** A held body drops the floor bit so it can be carried between sections. */
export const CATEGORY_ALL = 0xffffffff;
export const CATEGORY_FLOOR = 0x0002;

/** Below both, a press is a tap rather than a throw. */
export const TAP_MAX_MOVE = 10;
export const TAP_MAX_MS = 280;
