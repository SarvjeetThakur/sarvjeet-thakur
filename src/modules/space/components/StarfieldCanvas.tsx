"use client";

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { CAMERA_FOV, CAMERA_Z, CONTEXT_RESTORE_MS, DPR_RANGE } from "../constants";
import { SolarSystem } from "./SolarSystem";
import { Starfield } from "./Starfield";

type StarfieldCanvasProps = { lite: boolean; still: boolean; paused: boolean };

/**
 * Isolated so a WebGL failure is contained. Some mobile browsers refuse a
 * context instead of throwing, so `onCreated` failures and a missing context
 * both end in the same place: no canvas, page unaffected.
 */
export function StarfieldCanvas({ lite, still, paused }: StarfieldCanvasProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <Canvas
      dpr={DPR_RANGE}
      /*
       * drei's `Stars` drives its own `useFrame`, so stopping the motion does
       * not stop the work: without this the scene is still drawn 60x a second.
       */
      frameloop={still || paused ? "demand" : "always"}
      gl={{ antialias: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: false }}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        let giveUp: ReturnType<typeof setTimeout> | undefined;
        canvas.addEventListener("webglcontextlost", (event) => {
          clearTimeout(giveUp);
          // preventDefault is what makes a restore possible; a reclaimed GPU
          // usually returns, so wait before giving up for good.
          event.preventDefault();
          giveUp = setTimeout(() => setFailed(true), CONTEXT_RESTORE_MS);
        });
        canvas.addEventListener("webglcontextrestored", () => clearTimeout(giveUp));
      }}
    >
      <Starfield lite={lite} still={still} />
      <SolarSystem lite={lite} still={still} />
    </Canvas>
  );
}
