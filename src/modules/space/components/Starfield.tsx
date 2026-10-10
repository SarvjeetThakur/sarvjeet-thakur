"use client";

import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import {
  DRIFT_SPEED,
  PARALLAX_EASE,
  PARALLAX_STRENGTH,
  STAR_COUNT,
  STAR_COUNT_MOBILE,
  STAR_DEPTH,
  STAR_FACTOR,
  STAR_RADIUS,
  STAR_SATURATION,
  STAR_SPEED,
} from "../constants";

type StarfieldProps = {
  /** Fewer stars and no parallax on phones. */
  lite: boolean;
  /** Freeze all motion for prefers-reduced-motion. */
  still: boolean;
};

export function Starfield({ lite, still }: StarfieldProps) {
  const group = useRef<Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  /*
   * The pointer is tracked on `window` rather than read from fiber's own
   * `state.pointer`. fiber binds its pointer listeners to the Canvas wrapper,
   * and the background layer above it sets `pointer-events: none`, which is
   * inherited — so no pointermove ever reaches the canvas and `state.pointer`
   * stays at (0, 0) forever. The parallax looked implemented and never moved.
   */
  useEffect(() => {
    if (lite || still) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [lite, still]);

  useFrame((state, delta) => {
    if (still) return;
    if (group.current) group.current.rotation.y += delta * DRIFT_SPEED;
    if (lite) return;
    // Lean the camera toward the pointer so the field has real depth.
    const { camera } = state;
    const { x, y } = pointer.current;
    camera.position.x += (x * PARALLAX_STRENGTH - camera.position.x) * PARALLAX_EASE;
    camera.position.y += (y * PARALLAX_STRENGTH - camera.position.y) * PARALLAX_EASE;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <Stars
        radius={STAR_RADIUS}
        depth={STAR_DEPTH}
        count={lite ? STAR_COUNT_MOBILE : STAR_COUNT}
        factor={STAR_FACTOR}
        saturation={STAR_SATURATION}
        speed={still ? 0 : STAR_SPEED}
        fade
      />
    </group>
  );
}
