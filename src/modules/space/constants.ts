export const STAR_COUNT = 4200;
export const STAR_COUNT_MOBILE = 1600;

export const STAR_RADIUS = 90;
export const STAR_DEPTH = 55;
export const STAR_FACTOR = 3.4;
export const STAR_SATURATION = 0.4;
export const STAR_SPEED = 0.7;

/** Radians per second. */
export const DRIFT_SPEED = 0.012;

export const PARALLAX_STRENGTH = 2.4;
export const PARALLAX_EASE = 0.045;

export const CAMERA_FOV = 72;
export const CAMERA_Z = 1;

export const DPR_RANGE: [number, number] = [1, 1.75];

export const COARSE_POINTER_QUERY = "(pointer: coarse)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** A context reclaimed on a tab switch returns within a frame or two. */
export const CONTEXT_RESTORE_MS = 3_000;

/* ---------- solar system ---------- */

/**
 * Placed as a fraction of what is visible at `SOLAR_DEPTH`, not at fixed world
 * coordinates: a fixed position is only correct at one window size, and this
 * one sat off the right edge of a phone entirely.
 */
export const SOLAR_DEPTH = -34;
export const SOLAR_X_FRACTION = 0.56;
export const SOLAR_Y_FRACTION = 0.34;

/** The view the orbit radii were chosen against; the group scales off it. */
export const SOLAR_REFERENCE_HALF_WIDTH = 36;
export const SOLAR_SCALE_MIN = 0.42;
export const SOLAR_SCALE_MAX = 1.15;
export const SOLAR_TILT: [number, number, number] = [-1.15, 0, 0.22];

export const SUN_RADIUS = 1.35;
export const SUN_COLOR = "#ffd7a0";
export const SUN_GLOW_SCALE = 7;
export const SUN_GLOW_STOPS = [
  { at: 0, color: "rgb(255 226 178 / 80%)" },
  { at: 0.16, color: "rgb(255 178 102 / 28%)" },
  { at: 0.42, color: "rgb(255 140 70 / 7%)" },
  { at: 1, color: "rgb(255 130 60 / 0%)" },
] as const;
export const SUN_GLOW_TEXTURE_SIZE = 128;

export const SUN_LIGHT_INTENSITY = 2.4;
export const SOLAR_AMBIENT = 0.3;

export const ORBIT_LINE_COLOR = "#8d93a8";
export const ORBIT_LINE_OPACITY = 0.13;
export const ORBIT_LINE_WIDTH = 0.012;

export const PLANET_SEGMENTS = 24;
export const PLANET_SEGMENTS_MOBILE = 12;

export type Planet = {
  orbit: number;
  size: number;
  /** Radians per second; inner planets move faster. */
  speed: number;
  /** Starting angle, so they never line up on load. */
  phase: number;
  color: string;
  /** Inner and outer radius as multiples of the planet size. */
  ring?: { inner: number; outer: number; color: string };
};

export const PLANETS: readonly Planet[] = [
  { orbit: 2.6, size: 0.16, speed: 0.22, phase: 0.4, color: "#b9b2a4" },
  { orbit: 3.7, size: 0.26, speed: 0.16, phase: 2.1, color: "#e0a06a" },
  { orbit: 5.0, size: 0.3, speed: 0.115, phase: 4.0, color: "#6f8fd6" },
  { orbit: 6.4, size: 0.22, speed: 0.082, phase: 1.1, color: "#c4654a" },
  {
    orbit: 8.3,
    size: 0.62,
    speed: 0.05,
    phase: 5.2,
    color: "#d8b37a",
    ring: { inner: 1.5, outer: 2.4, color: "#c9ab86" },
  },
  { orbit: 10.2, size: 0.42, speed: 0.034, phase: 3.1, color: "#7fc8d9" },
] as const;
