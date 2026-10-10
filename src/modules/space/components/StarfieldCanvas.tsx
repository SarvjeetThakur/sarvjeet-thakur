"use client";

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { CONTEXT_RESTORE_MS, DPR_RANGE } from "../constants";
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
       * Stopping the motion is not the same as stopping the work: drei's
       * `Stars` drives its own `useFrame`, so without this the scene would
       * still be drawn sixty times a second with thousands of sprites under
       * reduced motion, and again behind physics mode. "demand" renders once
       * and then only when something asks.
       */
      frameloop={still || paused ? "demand" : "always"}
      gl={{ antialias: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: false }}
      camera={{ position: [0, 0, 1], fov: 72 }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        let giveUp: ReturnType<typeof setTimeout>;
        canvas.addEventListener("webglcontextlost", (event) => {
          // Preventing the default is what makes a restore possible at all. A
          // mobile GPU reclaimed on a tab switch loses the context and then
          // gets it back, so wait before tearing the canvas down for good —
          // the old code gave up on the first loss, permanently.
          event.preventDefault();
          giveUp = setTimeout(() => setFailed(true), CONTEXT_RESTORE_MS);
        });
        canvas.addEventListener("webglcontextrestored", () => clearTimeout(giveUp));
      }}
    >
      <Starfield lite={lite} still={still} />
    </Canvas>
  );
}
