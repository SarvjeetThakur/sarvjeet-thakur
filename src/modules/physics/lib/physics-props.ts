import { KIND_ATTR, PHYSICS_ATTR, REGION_ATTR, type BodyKind } from "../constants";

/** Spread onto any element that should become a rigid body in physics mode. */
export function physicsProps(kind: BodyKind) {
  return { [PHYSICS_ATTR]: "", [KIND_ATTR]: kind };
}

/**
 * Spread onto a section. Each region gets its own floor, so its bodies pile
 * inside it, and the camera can fly to it by id.
 */
export function regionProps(id: string) {
  return { [REGION_ATTR]: id };
}
