"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, CanvasTexture, DoubleSide, type Group } from "three";
import {
  CAMERA_FOV,
  CAMERA_Z,
  ORBIT_LINE_COLOR,
  ORBIT_LINE_OPACITY,
  ORBIT_LINE_WIDTH,
  PLANET_SEGMENTS,
  PLANET_SEGMENTS_MOBILE,
  PLANETS,
  SOLAR_AMBIENT,
  SOLAR_DEPTH,
  SOLAR_REFERENCE_HALF_WIDTH,
  SOLAR_SCALE_MAX,
  SOLAR_SCALE_MIN,
  SOLAR_TILT,
  SOLAR_X_FRACTION,
  SOLAR_Y_FRACTION,
  SUN_COLOR,
  SUN_GLOW_SCALE,
  SUN_GLOW_STOPS,
  SUN_GLOW_TEXTURE_SIZE,
  SUN_LIGHT_INTENSITY,
  SUN_RADIUS,
  type Planet,
} from "../constants";

type SolarSystemProps = {
  /** Cheaper spheres and no corona on phones. */
  lite: boolean;
  /** Freeze the orbits for prefers-reduced-motion. */
  still: boolean;
};

/** The orbit is a rotation of the pivot, not a position write. */
function Orbiter({
  planet,
  segments,
  still,
}: {
  planet: Planet;
  segments: number;
  still: boolean;
}) {
  const pivot = useRef<Group>(null);

  useFrame((_, delta) => {
    if (still || !pivot.current) return;
    pivot.current.rotation.y += delta * planet.speed;
  });

  return (
    <group ref={pivot} rotation={[0, planet.phase, 0]}>
      <group position={[planet.orbit, 0, 0]}>
        <mesh>
          <sphereGeometry args={[planet.size, segments, segments]} />
          <meshStandardMaterial color={planet.color} roughness={0.85} metalness={0} />
        </mesh>
        {planet.ring ? (
          <mesh rotation={[-Math.PI / 2.3, 0, 0]}>
            <ringGeometry
              args={[
                planet.size * planet.ring.inner,
                planet.size * planet.ring.outer,
                segments * 2,
              ]}
            />
            <meshBasicMaterial
              color={planet.ring.color}
              side={DoubleSide}
              transparent
              opacity={0.45}
            />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}

/** Corona texture: a sprite always faces the camera, so the glow stays round. */
function useGlowTexture() {
  const texture = useMemo(() => {
    const size = SUN_GLOW_TEXTURE_SIZE;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const half = size / 2;
    const gradient = context.createRadialGradient(half, half, 0, half, half, half);
    for (const stop of SUN_GLOW_STOPS) gradient.addColorStop(stop.at, stop.color);
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    return new CanvasTexture(canvas);
  }, []);

  // three does not free GPU textures on unmount.
  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

function OrbitLine({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - ORBIT_LINE_WIDTH, radius + ORBIT_LINE_WIDTH, 128]} />
      <meshBasicMaterial
        color={ORBIT_LINE_COLOR}
        side={DoubleSide}
        transparent
        opacity={ORBIT_LINE_OPACITY}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Decorative, inside an `aria-hidden` canvas. Motion stops under reduced
 * motion, and the canvas drops to an on-demand frameloop then and in physics
 * mode, so a frozen system costs nothing.
 */
export function SolarSystem({ lite, still }: SolarSystemProps) {
  const segments = lite ? PLANET_SEGMENTS_MOBILE : PLANET_SEGMENTS;
  const glow = useGlowTexture();

  // Placed as a fraction of what is visible at this depth, so it survives a resize.
  const size = useThree((state) => state.size);
  const { position, scale } = useMemo(() => {
    const distance = Math.abs(SOLAR_DEPTH) + CAMERA_Z;
    const halfHeight = Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180) * distance;
    const halfWidth = halfHeight * (size.width / Math.max(size.height, 1));
    const fitted = halfWidth / SOLAR_REFERENCE_HALF_WIDTH;
    return {
      position: [halfWidth * SOLAR_X_FRACTION, halfHeight * SOLAR_Y_FRACTION, SOLAR_DEPTH] as const,
      scale: Math.min(SOLAR_SCALE_MAX, Math.max(SOLAR_SCALE_MIN, fitted)),
    };
  }, [size.width, size.height]);
  const radii = useMemo(() => PLANETS.map((planet) => planet.orbit), []);

  return (
    <group position={position} rotation={SOLAR_TILT} scale={scale}>
      {/* decay 0: lights every orbit equally rather than fading by the outer one. */}
      <pointLight color={SUN_COLOR} intensity={SUN_LIGHT_INTENSITY} decay={0} />
      <ambientLight intensity={SOLAR_AMBIENT} />

      <mesh>
        <sphereGeometry args={[SUN_RADIUS, segments * 2, segments * 2]} />
        <meshBasicMaterial color={SUN_COLOR} />
      </mesh>
      {glow ? (
        <sprite scale={[SUN_RADIUS * SUN_GLOW_SCALE, SUN_RADIUS * SUN_GLOW_SCALE, 1]}>
          <spriteMaterial map={glow} transparent blending={AdditiveBlending} depthWrite={false} />
        </sprite>
      ) : null}

      {radii.map((radius) => (
        <OrbitLine key={radius} radius={radius} />
      ))}
      {PLANETS.map((planet) => (
        <Orbiter key={planet.orbit} planet={planet} segments={segments} still={still} />
      ))}
    </group>
  );
}
