/**
 * SceneContent Component
 * =============================
 * Inner scene content with access to Three.js camera for distance-aware sizing
 */

import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { AsteroidBelt } from './AsteroidBelt';
import { Planet, Sun } from './CelestialBodies';
import { Comet3D, HighlightGlow } from './Comet3D';
import { CinematicCamera } from './FollowCamera';
import { Starfield } from './Starfield';
import { FullTrajectoryLine, TrajectoryTrail } from './TrajectoryTrail';

import {
  SOLAR_SYSTEM_OBJECTS,
  SolarSystemObjectKey,
} from "@/lib/solar-system-data";
import { TrajectoryData, VectorData } from "@/types/trajectory";
import { PlanetLocators } from "./PlanetLocators";

type OrbitControlsWithState = OrbitControlsImpl & { userIsInteracting?: boolean };

type ViewMode = "explorer" | "true-scale" | "ride-atlas";

interface SceneContentProps {
  trajectoryData: TrajectoryData;
  planetData: Record<string, VectorData[]>;
  currentIndex: number;
  currentFrame: VectorData | null;
  viewMode: ViewMode;
  cometPosition: [number, number, number];
  cometVelocity: [number, number, number];
  isPerihelion: boolean;
  cinematicActive: boolean;
  cometPositionVec: THREE.Vector3;
  rideAlongCamera: {
    position: [number, number, number];
    target: [number, number, number];
  } | null;
  focusBody: string | null;
  setCinematicActive?: (active: boolean) => void;
  setCinematicEvent?: (event: any) => void;
  cinematicEvent?: any;
}

export function SceneContent({
  trajectoryData,
  planetData,
  currentIndex,
  currentFrame: _currentFrame,
  viewMode,
  cometPosition,
  cometVelocity,
  isPerihelion,
  cinematicActive,
  cometPositionVec,
  rideAlongCamera: _rideAlongCamera,
  focusBody,
  setCinematicActive,
  setCinematicEvent,
  cinematicEvent,
}: SceneContentProps) {
  const { camera } = useThree();

  // Distance-aware sizing helper
  function sizeForView(
    body: string,
    base: number,
    pos: [number, number, number]
  ) {
    // Start with mode logic
    let r = base;
    switch (viewMode) {
      case "true-scale":
        r = base * 0.001; // Much smaller for true scale
        break;
      case "ride-atlas":
        r = body === "Sun" ? base * 0.45 : base * 0.4; // was 0.3 - make planets more visible
        break;
      default:
        r = base;
    }

    // Distance floor: keep a minimum on-screen apparent size
    const p = new THREE.Vector3(...pos);
    const d = camera.position.distanceTo(p) + 1e-6;

    // Tunables: a gentle floor that varies per mode
    const targetFrac =
      viewMode === "ride-atlas"
        ? 0.06 // was 0.045 - make planets readable
        : viewMode === "true-scale"
        ? 0.025
        : 0.0;

    if (targetFrac > 0) {
      const floor = d * targetFrac;
      r = Math.max(r, floor); // Direct max, no lerp for clearer sizing
    }

    // Keep things from going hilariously huge near camera
    const clampMax = viewMode === "ride-atlas" ? base * 1.1 : base * 3.0;
    return Math.min(r, clampMax);
  }

  // Helper to get planet position
  function getPlanetPos(
    trajectory: VectorData[],
    idx: number
  ): [number, number, number] {
    const frame = trajectory[Math.floor(idx)];
    if (!frame) return [0, 0, 0];
    return [frame.position.x, frame.position.z, -frame.position.y];
  }

  // Calculate comet scale with smooth hysteresis
  const scaleStateRef = useRef({ value: 0.3, clamped: false });
  const tailRef = useRef(2.0);

  const { cometScale, tailLength } = useMemo(() => {
    const sunBaseRadius = 2.0;
    const sunRideScale = 0.45;
    const sunRadius = viewMode === "ride-atlas" ? sunBaseRadius * sunRideScale : sunBaseRadius;
    const cometPos = new THREE.Vector3(...cometPosition);

    const camToComet = camera.position.distanceTo(cometPos);
    const camToSun = camera.position.length(); // Sun at [0,0,0]

    // Apparent sizes ~ radius / distance
    const sunApparent = sunRadius / Math.max(camToSun, 1e-6);
    const rawBoundary = sunApparent * 0.3 * camToComet; // 30% of Sun

    // Hysteresis: once clamped, keep a 3% buffer to avoid flip-flop
    let boundary = rawBoundary;
    if (scaleStateRef.current.clamped) boundary *= 0.97; // small buffer

    const desiredScale = viewMode === "ride-atlas" ? 0.8 : 0.6; // Make comet more visible in explorer
    let targetScale = desiredScale;

    if (desiredScale > boundary) {
      targetScale = boundary;
      scaleStateRef.current.clamped = true;
    } else {
      scaleStateRef.current.clamped = false;
    }

    // Critically damp the scale
    scaleStateRef.current.value = THREE.MathUtils.damp(
      scaleStateRef.current.value,
      targetScale,
      8, // stiffness
      1 / 60 // approx frame time
    );

    // Tail grows as we near perihelion (heliocentric distance)
    const heliocentricR = cometPos.length(); // AU in scene
    const tailTarget = THREE.MathUtils.clamp(
      3.5 / Math.max(heliocentricR, 0.5),
      1.2,
      6.0
    );

    // Smooth tail length transitions
    tailRef.current = THREE.MathUtils.damp(tailRef.current, tailTarget, 6, 1 / 60);

    return {
      cometScale: scaleStateRef.current.value,
      tailLength: viewMode === "ride-atlas" ? tailRef.current : 2.0,
    };
  }, [viewMode, cometPosition, camera.position]);

  // Prepare bodies for screen-space locators (in Ride mode only) - memoized to prevent recreation
  const locatorBodies = useMemo(() => {
    if (viewMode !== "ride-atlas") return [];

    const pick = (arr: VectorData[] | undefined, idxDiv = 4) => {
      if (!arr || arr.length === 0) return null;
      const f = arr[Math.floor(currentIndex / idxDiv)];
      if (!f) return null;
      return new THREE.Vector3(f.position.x, f.position.z, -f.position.y);
    };

    return [
      { name: "Earth", color: "#6cf", world: pick(trajectoryData.earth, 4) },
      { name: "Mars", color: "#faa", world: pick(trajectoryData.mars, 4) },
      { name: "Jupiter", color: "#fcb", world: pick(trajectoryData.jupiter, 8) },
    ].filter((b) => b.world) as { name: string; color: string; world: THREE.Vector3 }[];
  }, [viewMode, trajectoryData, currentIndex]);

  // Stable chase camera for Ride mode (no sway)
  const controlsRef = useRef<OrbitControlsWithState | null>(null);
  const targetRef = useRef(new THREE.Vector3());
  const camPosRef = useRef(new THREE.Vector3(6, 4, 6)); // initial position

  // Add zoom event listeners
  useEffect(() => {
    const handleZoomIn = () => {
      if (controlsRef.current) {
        controlsRef.current.dollyIn(0.5);
        controlsRef.current.update();
      }
    };

    const handleZoomOut = () => {
      if (controlsRef.current) {
        controlsRef.current.dollyOut(0.5);
        controlsRef.current.update();
      }
    };

    window.addEventListener('zoom-in', handleZoomIn);
    window.addEventListener('zoom-out', handleZoomOut);

    return () => {
      window.removeEventListener('zoom-in', handleZoomIn);
      window.removeEventListener('zoom-out', handleZoomOut);
    };
  }, []);

  // Add user interaction detection for ride-along camera
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      if (controlsRef.current) controlsRef.current.userIsInteracting = true;
    };
    const onEnd = () => {
      if (controlsRef.current) controlsRef.current.userIsInteracting = false;
    };
    controls.addEventListener?.('start', onStart);
    controls.addEventListener?.('end', onEnd);
    return () => {
      controls.removeEventListener?.('start', onStart);
      controls.removeEventListener?.('end', onEnd);
    };
  }, []);

  useFrame((state, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const userBusy = Boolean(controls.userIsInteracting);

    if (viewMode === "ride-atlas" && !userBusy && cometVelocity && cometPosition) {
      // Comet world position & forward (from velocity)
      const comet = new THREE.Vector3(...cometPosition);
      const fwd = new THREE.Vector3(...cometVelocity).normalize();

      // Build a stable local frame around comet (right, up)
      const worldUp = new THREE.Vector3(0, 1, 0);
      let right = new THREE.Vector3().crossVectors(fwd, worldUp);
      if (right.lengthSq() < 1e-6) right = new THREE.Vector3(1, 0, 0);
      right.normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd).normalize();

      // Comfortable chase offset (AU-ish scene units)
      const back = 2.2; // behind comet along -fwd
      const height = 0.9; // above
      const lateral = 0.0; // left/right

      const desiredPos = comet
        .clone()
        .add(fwd.clone().multiplyScalar(-back))
        .add(up.clone().multiplyScalar(height))
        .add(right.clone().multiplyScalar(lateral));

      // Critically-damped smoothing for position + target
      const k = 6; // responsiveness
      camPosRef.current.lerp(desiredPos, 1 - Math.exp(-k * dt));
      targetRef.current.lerp(comet, 1 - Math.exp(-k * dt));

      // Apply
      state.camera.position.copy(camPosRef.current);
      controls.target.copy(targetRef.current);
      controls.update();
    } else {
      // Outside ride mode or while user interacting: do NOT override camera.position
      controls.update();
    }
  });

  return (
    <>
      {/* Starfield Background */}
      <Starfield count={3000} radius={80} depth={40} />

      {/* Planet Locators (screen-space) */}
      {viewMode === "ride-atlas" && locatorBodies.length > 0 && (
        <PlanetLocators bodies={locatorBodies} />
      )}

      {/* Sun */}
      <Sun radius={sizeForView("Sun", 2.0, [0, 0, 0])} viewMode={viewMode} />

      {/* Asteroid Belt */}
      <group renderOrder={-1}>
        <AsteroidBelt
          count={1600}
          innerRadius={2.2}
          outerRadius={3.2}
          thickness={0.3}
          scale={0.015}
        />
      </group>

      {/* Planets - Using new planetData structure */}
      {Object.entries(planetData).map(([key, positions]) => {
        const planet = SOLAR_SYSTEM_OBJECTS[key as SolarSystemObjectKey];
        if (!planet || key === 'atlas' || positions.length === 0) return null;

        return (
          <Planet
            key={key}
            name={planet.name}
            trajectoryData={positions}
            currentIndex={currentIndex}
            radius={sizeForView(
              planet.name,
              planet.size,
              getPlanetPos(positions, currentIndex)
            )}
            color={`#${planet.color.toString(16).padStart(6, '0')}`}
            showOrbit={true}
          />
        );
      })}


      {/* 3I/ATLAS Comet */}
      <Comet3D
        position={cometPosition}
        velocity={cometVelocity}
        scale={cometScale}
        tailLength={tailLength}
        sunPosition={[0, 0, 0]}
      />

      {/* Perihelion Glow Effect */}
      <HighlightGlow
        position={cometPosition}
        intensity={8.0}
        visible={isPerihelion}
      />

      {/* Trajectory Trail */}
      <TrajectoryTrail
        trajectoryData={trajectoryData.atlas || trajectoryData["3iatlas"] || []}
        currentIndex={currentIndex}
        color="#00ff88"
        opacity={0.8}
      />

      {/* Full Trajectory (dimmer, for context) */}
      <FullTrajectoryLine
        trajectoryData={trajectoryData.atlas || trajectoryData["3iatlas"] || []}
        color="#00ff88"
        opacity={0.15}
      />

      {/* Camera Controls - Enhanced for better exploration */}
      {!cinematicActive && (
        <OrbitControls
          ref={controlsRef}
          enableDamping={true}
          dampingFactor={0.05}
          enablePan={true}
          enableRotate={true}
          enableZoom={true}
          zoomSpeed={1.5}
          minDistance={0.02}
          maxDistance={focusBody ? 16 : viewMode === "ride-atlas" ? 12 : 50}
          panSpeed={1.0}
          rotateSpeed={1.0}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      )}

      {/* Cinematic Camera */}
      {cinematicActive && (
        <CinematicCamera
          active={true}
          eventType={cinematicEvent}
          target={cometPositionVec}
          onComplete={() => {
            if (setCinematicActive) setCinematicActive(false);
            if (setCinematicEvent) setCinematicEvent(null);
          }}
        />
      )}
    </>
  );
}
