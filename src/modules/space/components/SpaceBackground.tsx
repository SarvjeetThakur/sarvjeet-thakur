"use client";

import dynamic from "next/dynamic";
import { usePhysicsMode } from "@/modules/mode";
import { ErrorBoundary, useHydrated, useMediaQuery } from "@/modules/shared";
import { COARSE_POINTER_QUERY, REDUCED_MOTION_QUERY } from "../constants";

/*
 * Statically imported, three/fiber/drei sit in the first client chunk and are
 * parsed before hydration even on a device that never starts WebGL.
 */
const StarfieldCanvas = dynamic(
  () => import("./StarfieldCanvas").then((module) => module.StarfieldCanvas),
  { ssr: false },
);

/**
 * The live starfield behind the whole site. The WebGL canvas mounts only in
 * the browser and is isolated behind an error boundary: if a device cannot
 * start a context, the page keeps the gradient and stays fully usable.
 */
export function SpaceBackground() {
  const hydrated = useHydrated();
  const lite = useMediaQuery(COARSE_POINTER_QUERY);
  const still = useMediaQuery(REDUCED_MOTION_QUERY);
  // A third animation loop would compete with physics for the frame budget.
  const physics = usePhysicsMode();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      {/* Nebula wash: the only colour in the scene, and the fallback when WebGL is unavailable. */}
      <div className="absolute inset-0 bg-[radial-gradient(90rem_55rem_at_15%_-10%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_60%),radial-gradient(70rem_45rem_at_85%_10%,color-mix(in_oklab,var(--accent-2)_14%,transparent),transparent_55%)]" />
      {hydrated ? (
        <ErrorBoundary>
          <StarfieldCanvas lite={lite} still={still} paused={physics} />
        </ErrorBoundary>
      ) : null}
      {/* A scrim for text contrast, not a lid: opaque would bury the stars. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,color-mix(in_oklab,var(--bg)_28%,transparent)_45%,color-mix(in_oklab,var(--bg)_52%,transparent)_100%)]" />
    </div>
  );
}
