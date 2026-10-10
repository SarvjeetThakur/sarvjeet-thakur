import { BodyKind } from "../constants";

type BodyFeel = {
  restitution: number;
  friction: number;
  frictionAir: number;
  density: number;
  chamfer: number;
};

export type Feel = {
  gravity: number;
  bodies: Record<BodyKind, BodyFeel>;
  /** Max world-units per frame imparted on release. */
  throwClamp: number;
  /** Angular velocity per unit of horizontal throw. */
  spinFromThrow: number;
  /** Per-frame decay of throw velocity while a body is held still. */
  holdDecay: number;
  shake: { spreadX: number; liftMin: number; liftRange: number; spin: number };
};

/** All physics tuning lives here. Cards are heavy, chips are light and bouncy. */
export const FEEL: Feel = {
  gravity: 1,
  bodies: {
    [BodyKind.Card]: {
      restitution: 0.18,
      friction: 0.45,
      frictionAir: 0.012,
      density: 0.0022,
      chamfer: 16,
    },
    [BodyKind.Chip]: {
      restitution: 0.46,
      friction: 0.38,
      frictionAir: 0.018,
      density: 0.0007,
      chamfer: 18,
    },
    [BodyKind.Title]: {
      restitution: 0.26,
      friction: 0.5,
      frictionAir: 0.014,
      density: 0.0016,
      chamfer: 10,
    },
  },
  throwClamp: 48,
  spinFromThrow: 0.0026,
  holdDecay: 0.55,
  shake: { spreadX: 28, liftMin: 8, liftRange: 24, spin: 0.45 },
};
