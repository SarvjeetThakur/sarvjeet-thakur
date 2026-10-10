/** Stars rendered in the drei starfield. Lowered on coarse pointers. */
export const STAR_COUNT = 4200;
export const STAR_COUNT_MOBILE = 1600;

/** Radius and depth of the star sphere, in scene units. */
export const STAR_RADIUS = 90;
export const STAR_DEPTH = 55;
/** drei `factor`: star sprite size. */
export const STAR_FACTOR = 3.4;
export const STAR_SATURATION = 0.4;
/** drei `speed`: how fast the field twinkles. */
export const STAR_SPEED = 0.7;

/** Constant drift of the whole field, radians per second. */
export const DRIFT_SPEED = 0.012;

/** How far the camera leans toward the pointer, in scene units. */
export const PARALLAX_STRENGTH = 2.4;
/** Share of the remaining distance the camera covers each frame. */
export const PARALLAX_EASE = 0.045;

/** Device pixel ratio is clamped to this range so high-DPI phones stay smooth. */
export const DPR_RANGE: [number, number] = [1, 1.75];

export const COARSE_POINTER_QUERY = "(pointer: coarse)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * How long to wait for a lost WebGL context to come back before removing the
 * canvas. A GPU reclaimed on a tab switch usually restores within a frame or
 * two; anything this slow is not coming back.
 */
export const CONTEXT_RESTORE_MS = 3_000;
