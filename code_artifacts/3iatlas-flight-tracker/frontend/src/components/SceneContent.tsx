/**
 * SceneContent Component
 * =============================
 * Inner scene content with access to Three.js camera for distance-aware sizing
 */

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMemo } from 'react';

import { AsteroidBelt } from './AsteroidBelt';
import { Planet, Sun } from './CelestialBodies';
import { Comet3D, HighlightGlow } from './Comet3D';
import { CinematicCamera } from './FollowCamera';
import { Starfield } from './Starfield';
import { FullTrajectoryLine, TrajectoryTrail } from './TrajectoryTrail';

import { TrajectoryData, VectorData } from '@/types/trajectory';

type ViewMode = 'explorer' | 'true-scale' | 'ride-atlas';

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
  rideAlongCamera: { position: [number, number, number]; target: [number, number, number] } | null;
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
  rideAlongCamera,
  focusBody,
  setCinematicActive,
  setCinematicEvent,
  cinematicEvent,
}: SceneContentProps) {
  const { camera } = useThree();

  // Distance-aware sizing helper
  function sizeForView(body: string, base: number, pos: [number, number, number]) {
    // Start with mode logic
    let r = base;
    switch (viewMode) {
      case 'true-scale':
        r = base * 0.1;
        break;
      case 'ride-atlas':
        r = body === 'Sun' ? base * 0.5 : base * 0.3;
        break;
      default:
        r = base;
    }

    // Distance floor: keep a minimum on-screen apparent size
    const p = new THREE.Vector3(...pos);
    const d = camera.position.distanceTo(p) + 1e-6;

    // Tunables: a gentle floor that varies per mode
    const targetFrac =
      viewMode === 'ride-atlas' ? 0.045 : viewMode === 'true-scale' ? 0.025 : 0.0;

    if (targetFrac > 0) {
      const floor = d * targetFrac; // "visible enough" size
      r = THREE.MathUtils.lerp(r, Math.max(r, floor), 0.8);
    }

    // Clamp absurdly large sizes when very close (prevents "planet fills screen" shots)
    const clampMax = viewMode === 'ride-atlas' ? base * 1.2 : base * 3.0;
    r = Math.min(r, clampMax);
    return r;
  }

  // Helper to get planet position
  function getPlanetPos(trajectory: VectorData[], idx: number): [number, number, number] {
    const frame = trajectory[Math.floor(idx)];
    if (!frame) return [0, 0, 0];
    return [frame.position.x, frame.position.z, -frame.position.y];
  }

  // Calculate comet scale with distance awareness
  const cometScale = useMemo(() => {
    const baseScale = viewMode === 'ride-atlas' ? 0.8 : 0.3;
    const d = camera.position.distanceTo(new THREE.Vector3(...cometPosition)) + 1e-6;
    const floor = viewMode === 'ride-atlas' ? d * 0.035 : d * 0.02;
    return Math.min(Math.max(baseScale, floor), 1.2);
  }, [viewMode, cometPosition, camera.position]);

  return (
    <>
      {/* Starfield Background */}
      <Starfield count={3000} radius={80} depth={40} />

      {/* Sun */}
      <Sun radius={sizeForView('Sun', 2.0, [0, 0, 0])} viewMode={viewMode} />

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
          radius={sizeForView('Mercury', 0.012, getPlanetPos(trajectoryData.mercury, currentIndex / 4))}
          color="#8c7853"
          showOrbit={true}
        />
      )}

      {trajectoryData.venus && trajectoryData.venus.length > 0 && (
        <Planet
          name="Venus"
          trajectoryData={trajectoryData.venus}
          currentIndex={currentIndex / 4}
          radius={sizeForView('Venus', 0.034, getPlanetPos(trajectoryData.venus, currentIndex / 4))}
          color="#ffc649"
          showOrbit={true}
        />
      )}

      {trajectoryData.earth.length > 0 && (
        <Planet
          name="Earth"
          trajectoryData={trajectoryData.earth}
          currentIndex={currentIndex / 4}
          radius={sizeForView('Earth', 0.036, getPlanetPos(trajectoryData.earth, currentIndex / 4))}
          color="#00aaff"
          showOrbit={true}
        />
      )}

      {trajectoryData.ceres && trajectoryData.ceres.length > 0 && (
        <Planet
          name="Ceres"
          trajectoryData={trajectoryData.ceres}
          currentIndex={currentIndex / 8}
          radius={sizeForView('Ceres', 0.01, getPlanetPos(trajectoryData.ceres, currentIndex / 8))}
          color="#a89f91"
          showOrbit={true}
        />
      )}

      {trajectoryData.vesta && trajectoryData.vesta.length > 0 && (
        <Planet
          name="Vesta"
          trajectoryData={trajectoryData.vesta}
          currentIndex={currentIndex / 8}
          radius={sizeForView('Vesta', 0.006, getPlanetPos(trajectoryData.vesta, currentIndex / 8))}
          color="#b5a88f"
          showOrbit={true}
        />
      )}

      {trajectoryData.pallas && trajectoryData.pallas.length > 0 && (
        <Planet
          name="Pallas"
          trajectoryData={trajectoryData.pallas}
          currentIndex={currentIndex / 8}
          radius={sizeForView('Pallas', 0.006, getPlanetPos(trajectoryData.pallas, currentIndex / 8))}
          color="#9d9589"
          showOrbit={true}
        />
      )}

      {trajectoryData.mars.length > 0 && (
        <Planet
          name="Mars"
          trajectoryData={trajectoryData.mars}
          currentIndex={currentIndex / 4}
          radius={sizeForView('Mars', 0.019, getPlanetPos(trajectoryData.mars, currentIndex / 4))}
          color="#ff6666"
          showOrbit={true}
        />
      )}

      {trajectoryData.jupiter.length > 0 && (
        <Planet
          name="Jupiter"
          trajectoryData={trajectoryData.jupiter}
          currentIndex={currentIndex / 8}
          radius={sizeForView('Jupiter', 0.4, getPlanetPos(trajectoryData.jupiter, currentIndex / 8))}
          color="#ffbb88"
          showOrbit={true}
        />
      )}

      {trajectoryData.saturn && trajectoryData.saturn.length > 0 && (
        <Planet
          name="Saturn"
          trajectoryData={trajectoryData.saturn}
          currentIndex={currentIndex / 8}
          radius={sizeForView('Saturn', 0.34, getPlanetPos(trajectoryData.saturn, currentIndex / 8))}
          color="#fad5a5"
          showOrbit={true}
        />
      )}

      {trajectoryData.uranus && trajectoryData.uranus.length > 0 && (
        <Planet
          name="Uranus"
          trajectoryData={trajectoryData.uranus}
          currentIndex={currentIndex / 16}
          radius={sizeForView('Uranus', 0.14, getPlanetPos(trajectoryData.uranus, currentIndex / 16))}
          color="#4fd0e0"
          showOrbit={true}
        />
      )}

      {trajectoryData.neptune && trajectoryData.neptune.length > 0 && (
        <Planet
          name="Neptune"
          trajectoryData={trajectoryData.neptune}
          currentIndex={currentIndex / 16}
          radius={sizeForView('Neptune', 0.14, getPlanetPos(trajectoryData.neptune, currentIndex / 16))}
          color="#4166f5"
          showOrbit={true}
        />
      )}

      {trajectoryData.pluto && trajectoryData.pluto.length > 0 && (
        <Planet
          name="Pluto"
          trajectoryData={trajectoryData.pluto}
          currentIndex={currentIndex / 16}
          radius={sizeForView('Pluto', 0.007, getPlanetPos(trajectoryData.pluto, currentIndex / 16))}
          color="#b8a793"
          showOrbit={true}
        />
      )}

      {/* 3I/ATLAS Comet */}
      <Comet3D
        position={cometPosition}
        velocity={cometVelocity}
        scale={cometScale}
        tailLength={viewMode === "ride-atlas" ? 4.0 : 2.0}
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
          enableDamping
          dampingFactor={0.03}
          enableZoom={true}
          zoomSpeed={1.5}
          minDistance={viewMode === 'ride-atlas' ? 0.02 : 0.5}
          maxDistance={focusBody ? 16 : (viewMode === 'ride-atlas' ? 12 : 50)}
          target={viewMode === 'ride-atlas' && rideAlongCamera ? rideAlongCamera.target : cometPositionVec}
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

