/**
 * SceneContent Component
 * =============================
 * Inner scene content with access to Three.js camera for distance-aware sizing
 */

import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from 'react';
import * as THREE from "three";

import { AsteroidBelt } from './AsteroidBelt';
import { Planet, Sun } from './CelestialBodies';
import { Comet3D, HighlightGlow } from './Comet3D';
import { CinematicCamera } from './FollowCamera';
import { Starfield } from './Starfield';
import { FullTrajectoryLine, TrajectoryTrail } from './TrajectoryTrail';

import { TrajectoryData, VectorData } from "@/types/trajectory";
import { PlanetLocators } from "./PlanetLocators";

type ViewMode = "explorer" | "true-scale" | "ride-atlas";

interface SceneContentProps {
  trajectoryData: TrajectoryData;
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
        r = base * 0.1;
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

    const desiredScale = viewMode === "ride-atlas" ? 0.8 : 0.3;
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

  // Velocity-based camera motion for Ride mode
  const controlsRef = useRef<any>(null);
  const desiredTargetRef = useRef(new THREE.Vector3());
  const currentTargetRef = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    if (!controlsRef.current) return;

    if (viewMode === "ride-atlas" && cometVelocity && cometPosition) {
      // Compute desired target with lead + bank
      const v = new THREE.Vector3(...cometVelocity).normalize();
      const comet = new THREE.Vector3(...cometPosition);

      const right = new THREE.Vector3()
        .crossVectors(v, new THREE.Vector3(0, 1, 0))
        .normalize();
      const bank = right.multiplyScalar(
        0.15 * Math.sin(performance.now() * 0.001)
      );

      desiredTargetRef.current.copy(comet).add(bank); // where we want to look
    } else {
      desiredTargetRef.current.set(0, 0, 0);
    }

    // Critically-damped approach to desired target (no overshoot)
    currentTargetRef.current.lerp(
      desiredTargetRef.current,
      1 - Math.exp(-6 * dt)
    );

    controlsRef.current.target.copy(currentTargetRef.current);
    controlsRef.current.update();
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

      {/* Planets */}
      {trajectoryData.mercury && trajectoryData.mercury.length > 0 && (
        <Planet
          name="Mercury"
          trajectoryData={trajectoryData.mercury}
          currentIndex={currentIndex / 4}
          radius={sizeForView(
            "Mercury",
            0.012,
            getPlanetPos(trajectoryData.mercury, currentIndex / 4)
          )}
          color="#8c7853"
          showOrbit={true}
        />
      )}

      {trajectoryData.venus && trajectoryData.venus.length > 0 && (
        <Planet
          name="Venus"
          trajectoryData={trajectoryData.venus}
          currentIndex={currentIndex / 4}
          radius={sizeForView(
            "Venus",
            0.034,
            getPlanetPos(trajectoryData.venus, currentIndex / 4)
          )}
          color="#ffc649"
          showOrbit={true}
        />
      )}

      {trajectoryData.earth.length > 0 && (
        <Planet
          name="Earth"
          trajectoryData={trajectoryData.earth}
          currentIndex={currentIndex / 4}
          radius={sizeForView(
            "Earth",
            0.036,
            getPlanetPos(trajectoryData.earth, currentIndex / 4)
          )}
          color="#00aaff"
          showOrbit={true}
        />
      )}

      {trajectoryData.ceres && trajectoryData.ceres.length > 0 && (
        <Planet
          name="Ceres"
          trajectoryData={trajectoryData.ceres}
          currentIndex={currentIndex / 8}
          radius={sizeForView(
            "Ceres",
            0.01,
            getPlanetPos(trajectoryData.ceres, currentIndex / 8)
          )}
          color="#a89f91"
          showOrbit={true}
        />
      )}

      {trajectoryData.vesta && trajectoryData.vesta.length > 0 && (
        <Planet
          name="Vesta"
          trajectoryData={trajectoryData.vesta}
          currentIndex={currentIndex / 8}
          radius={sizeForView(
            "Vesta",
            0.006,
            getPlanetPos(trajectoryData.vesta, currentIndex / 8)
          )}
          color="#b5a88f"
          showOrbit={true}
        />
      )}

      {trajectoryData.pallas && trajectoryData.pallas.length > 0 && (
        <Planet
          name="Pallas"
          trajectoryData={trajectoryData.pallas}
          currentIndex={currentIndex / 8}
          radius={sizeForView(
            "Pallas",
            0.006,
            getPlanetPos(trajectoryData.pallas, currentIndex / 8)
          )}
          color="#9d9589"
          showOrbit={true}
        />
      )}

      {trajectoryData.mars.length > 0 && (
        <Planet
          name="Mars"
          trajectoryData={trajectoryData.mars}
          currentIndex={currentIndex / 4}
          radius={sizeForView(
            "Mars",
            0.019,
            getPlanetPos(trajectoryData.mars, currentIndex / 4)
          )}
          color="#ff6666"
          showOrbit={true}
        />
      )}

      {trajectoryData.jupiter.length > 0 && (
        <Planet
          name="Jupiter"
          trajectoryData={trajectoryData.jupiter}
          currentIndex={currentIndex / 8}
          radius={sizeForView(
            "Jupiter",
            0.4,
            getPlanetPos(trajectoryData.jupiter, currentIndex / 8)
          )}
          color="#ffbb88"
          showOrbit={true}
        />
      )}

      {trajectoryData.saturn && trajectoryData.saturn.length > 0 && (
        <Planet
          name="Saturn"
          trajectoryData={trajectoryData.saturn}
          currentIndex={currentIndex / 8}
          radius={sizeForView(
            "Saturn",
            0.34,
            getPlanetPos(trajectoryData.saturn, currentIndex / 8)
          )}
          color="#fad5a5"
          showOrbit={true}
        />
      )}

      {trajectoryData.uranus && trajectoryData.uranus.length > 0 && (
        <Planet
          name="Uranus"
          trajectoryData={trajectoryData.uranus}
          currentIndex={currentIndex / 16}
          radius={sizeForView(
            "Uranus",
            0.14,
            getPlanetPos(trajectoryData.uranus, currentIndex / 16)
          )}
          color="#4fd0e0"
          showOrbit={true}
        />
      )}

      {trajectoryData.neptune && trajectoryData.neptune.length > 0 && (
        <Planet
          name="Neptune"
          trajectoryData={trajectoryData.neptune}
          currentIndex={currentIndex / 16}
          radius={sizeForView(
            "Neptune",
            0.14,
            getPlanetPos(trajectoryData.neptune, currentIndex / 16)
          )}
          color="#4166f5"
          showOrbit={true}
        />
      )}

      {trajectoryData.pluto && trajectoryData.pluto.length > 0 && (
        <Planet
          name="Pluto"
          trajectoryData={trajectoryData.pluto}
          currentIndex={currentIndex / 16}
          radius={sizeForView(
            "Pluto",
            0.007,
            getPlanetPos(trajectoryData.pluto, currentIndex / 16)
          )}
          color="#b8a793"
          showOrbit={true}
        />
      )}

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
          enableDamping={false}
          enableZoom={true}
          zoomSpeed={1.5}
          minDistance={viewMode === "ride-atlas" ? 0.02 : 0.5}
          maxDistance={focusBody ? 16 : viewMode === "ride-atlas" ? 12 : 50}
          enablePan={true}
          panSpeed={1.0}
          rotateSpeed={1.0}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
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
