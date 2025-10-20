"use client";

/**
 * Enhanced HistoricalFlightView - Immersive 3I/ATLAS Flight Tracker
 * 
 * Major Features:
 * - "Ride with ATLAS" camera perspective
 * - Multiple camera views (5 modes)
 * - Enhanced comet visuals (greenish tail, coma, nucleus)
 * - Animated starfield background
 * - Interactive milestone markers
 * - Improved playback controls
 * - Real-time telemetry with milestone countdown
 */

import { Canvas, useFrame } from "@react-three/fiber";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useAdaptiveQuality } from "../../hooks/useAdaptiveQuality";
import { ThreeJSErrorBoundary } from "../ThreeJSErrorBoundary";
import CelestialLabel from "../ui/CelestialLabel";
import TelemetryHUD from "../ui/TelemetryHUD";
import EducationalPanel from "../ui/EducationalPanel";
import CameraController, { CameraViewMode } from "../three/CameraController";
import CometVisuals from "../three/CometVisuals";
import MilestoneMarkers, { Milestone } from "../three/MilestoneMarkers";
import Starfield from "../three/Starfield";
import ViewSwitcher from "../three/ViewSwitcher";

// Scaling factor for orbits
const ORBIT_SCALE = 10;

interface VectorData {
  jd?: number;
  date: string;
  position: number[] | { x: number; y: number; z: number };
  velocity: number[] | { vx: number; vy: number; vz: number };
}

interface TrajectoryData {
  atlas: VectorData[];
  earth: VectorData[];
  mars: VectorData[];
  jupiter: VectorData[];
  milestones: Milestone[];
}

// --- Helper function to normalize position/velocity data ---
const normalizeVector = (
  data: number[] | { x: number; y: number; z: number } | { vx: number; vy: number; vz: number }
): THREE.Vector3 => {
  if (Array.isArray(data)) {
    return new THREE.Vector3(data[0], data[1], data[2]);
  }
  // Check if it's a velocity object
  if ('vx' in data) {
    return new THREE.Vector3(data.vx, data.vy, data.vz);
  }
  // Otherwise, it's a position object
  return new THREE.Vector3(data.x, data.y, data.z);
};

// --- Sun Component ---
const Sun = () => (
  <group>
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[1.0, 64, 64]} />
      <meshStandardMaterial
        color="#ffff00"
        emissive="#ffff00"
        emissiveIntensity={5}
      />
    </mesh>
    <pointLight position={[0, 0, 0]} intensity={100} color="white" />
    <CelestialLabel
      position={[0, 0, 0]}
      label="Sun"
      color="#ffff00"
      fontSize={0.6}
      offset={[0, 1.5, 0]}
    />
  </group>
);

// --- Planet Component ---
const Planet = ({
  trajectory,
  currentIndex,
  color,
  size,
  label,
  planetRef,
}: {
  trajectory: VectorData[];
  currentIndex: number;
  color: string;
  size: number;
  label?: string;
  planetRef?: React.RefObject<THREE.Group>;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const frame = trajectory[Math.floor(currentIndex)];
    if (frame && frame.position && groupRef.current) {
      const pos = normalizeVector(frame.position);
      groupRef.current.position.set(
        pos.x * ORBIT_SCALE,
        pos.z * ORBIT_SCALE,
        -pos.y * ORBIT_SCALE
      );
    }
  });

  useEffect(() => {
    if (planetRef && groupRef.current) {
      (planetRef as any).current = groupRef.current;
    }
  }, [planetRef]);

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[size * ORBIT_SCALE, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {label && (
        <CelestialLabel
          position={[0, 0, 0]}
          label={label}
          color={color}
          fontSize={0.4}
          offset={[0, 0.8, 0]}
        />
      )}
    </group>
  );
};

// --- Comet Component ---
const Comet = ({
  trajectory,
  currentIndex,
  cometRef,
  quality,
  onPositionUpdate,
}: {
  trajectory: VectorData[];
  currentIndex: number;
  cometRef: React.RefObject<THREE.Group>;
  quality: { geometryDetail: number };
  onPositionUpdate?: (
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    distanceFromSun: number
  ) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [cometPosition, setCometPosition] = useState(new THREE.Vector3());
  const [cometVelocity, setCometVelocity] = useState(new THREE.Vector3());
  const [distanceFromSun, setDistanceFromSun] = useState(1.0);

  useFrame(() => {
    const frame = trajectory[Math.floor(currentIndex)];
    if (frame && groupRef.current) {
      const pos = normalizeVector(frame.position);
      const vel = normalizeVector(frame.velocity);

      // Update position
      const scaledPos = new THREE.Vector3(
        pos.x * ORBIT_SCALE,
        pos.z * ORBIT_SCALE,
        -pos.y * ORBIT_SCALE
      );
      groupRef.current.position.copy(scaledPos);

      // Calculate distance from Sun
      const distance = pos.length();

      // Update state
      setCometPosition(scaledPos);
      setCometVelocity(vel);
      setDistanceFromSun(distance);

      // Callback to parent
      onPositionUpdate?.(scaledPos, vel, distance);
    }
  });

  useEffect(() => {
    if (cometRef && groupRef.current) {
      (cometRef as any).current = groupRef.current;
    }
  }, [cometRef]);

  return (
    <group ref={groupRef}>
      <CometVisuals
        position={cometPosition}
        velocity={cometVelocity}
        distanceFromSun={distanceFromSun}
        quality={quality}
        scale={1.0}
      />
      <CelestialLabel
        position={[0, 0, 0]}
        label="3I/ATLAS"
        color="#00ff88"
        fontSize={0.5}
        offset={[0, 1.5, 0]}
      />
    </group>
  );
};

// --- Trajectory Trail Component ---
const TrajectoryTrail = ({
  trajectory,
  currentIndex,
}: {
  trajectory: VectorData[];
  currentIndex: number;
}) => {
  const points = useMemo(() => {
    if (!trajectory || trajectory.length === 0) return [];

    const trailLength = Math.min(currentIndex + 1, trajectory.length);
    return trajectory.slice(0, trailLength).map((frame) => {
      const pos = normalizeVector(frame.position);
      return new THREE.Vector3(
        pos.x * ORBIT_SCALE,
        pos.z * ORBIT_SCALE,
        -pos.y * ORBIT_SCALE
      );
    });
  }, [trajectory, currentIndex]);

  if (points.length < 2) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#00ff88"
        linewidth={2}
        transparent
        opacity={0.6}
      />
    </line>
  );
};

// --- Main 3D Scene ---
const Scene = ({
  currentIndex,
  trajectoryData,
  quality,
  cameraViewMode,
  onMilestoneClick,
}: {
  currentIndex: number;
  trajectoryData: TrajectoryData;
  quality: {
    starCount: number;
    geometryDetail: number;
    shadowMapSize: number;
    pixelRatio: number;
  };
  cameraViewMode: CameraViewMode;
  onMilestoneClick?: (milestone: Milestone) => void;
}) => {
  const cometRef = useRef<THREE.Group>(null);
  const marsRef = useRef<THREE.Group>(null);
  const [cometVelocity, setCometVelocity] = useState(new THREE.Vector3());

  const handleCometPositionUpdate = (
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    distanceFromSun: number
  ) => {
    setCometVelocity(velocity);
  };

  return (
    <>
      <color attach="background" args={["#000510"]} />
      <ambientLight intensity={0.3} />
      
      {/* Starfield */}
      <Starfield quality={quality} />

      {/* Sun */}
      <Sun />

      {/* Planets */}
      <Planet
        trajectory={trajectoryData.earth}
        currentIndex={currentIndex}
        color="skyblue"
        size={0.06}
        label="Earth"
      />
      <Planet
        trajectory={trajectoryData.mars}
        currentIndex={currentIndex}
        color="#ff6666"
        size={0.04}
        label="Mars"
        planetRef={marsRef}
      />

      {/* Comet */}
      <Comet
        trajectory={trajectoryData.atlas}
        currentIndex={currentIndex}
        cometRef={cometRef}
        quality={quality}
        onPositionUpdate={handleCometPositionUpdate}
      />

      {/* Trajectory Trail */}
      <TrajectoryTrail
        trajectory={trajectoryData.atlas}
        currentIndex={currentIndex}
      />

      {/* Milestone Markers */}
      <MilestoneMarkers
        milestones={trajectoryData.milestones}
        onMilestoneClick={onMilestoneClick}
        orbitScale={ORBIT_SCALE}
      />

      {/* Camera Controller */}
      <CameraController
        viewMode={cameraViewMode}
        cometRef={cometRef}
        marsRef={marsRef}
        sunPosition={new THREE.Vector3(0, 0, 0)}
        cometVelocity={cometVelocity}
      />

      {/* Visual reference grid */}
      <gridHelper args={[100, 50, "#222222", "#111111"]} />
    </>
  );
};

// --- Loading Fallback ---
const LoadingFallback = () => (
  <div className="w-full h-full bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading 3D Visualization...</p>
      <p className="text-gray-400 text-sm mt-2">
        Initializing enhanced trajectory data
      </p>
    </div>
  </div>
);

// --- Error Fallback ---
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="w-full h-full bg-gray-900 text-white flex items-center justify-center p-4">
    <div className="max-w-lg w-full bg-gray-800 rounded-lg p-6 border border-red-500">
      <h1 className="text-xl font-bold text-red-400 mb-4">
        3D Visualization Error
      </h1>
      <p className="text-gray-300">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
      >
        Reload Page
      </button>
    </div>
  </div>
);

// --- Main Component ---
interface HistoricalFlightViewEnhancedProps {
  trajectoryData: TrajectoryData;
  isPlaying: boolean;
  speed: number;
  currentIndex: number;
  onPlayPause: () => void;
  onReset: () => void;
  onIndexChange: (index: number) => void;
  onSpeedChange: (speed: number) => void;
  selectedMilestone: string | null;
  isPanelOpen: boolean;
  onMilestoneClick: (milestone: Milestone) => void;
  onPanelClose: () => void;
}

const HistoricalFlightViewEnhanced: React.FC<
  HistoricalFlightViewEnhancedProps
> = (props) => {
  const {
    trajectoryData,
    isPlaying,
    speed,
    currentIndex,
    onPlayPause,
    onReset,
    onIndexChange,
    onSpeedChange,
    selectedMilestone,
    isPanelOpen,
    onMilestoneClick,
    onPanelClose,
  } = props;

  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraViewMode, setCameraViewMode] =
    useState<CameraViewMode>("RIDE_WITH_ATLAS");
  const [currentDate, setCurrentDate] = useState("");
  const [distanceFromSun, setDistanceFromSun] = useState(0);
  const [currentVelocity, setCurrentVelocity] = useState(0);
  const [nextMilestone, setNextMilestone] = useState<{
    name: string;
    date: string;
    daysUntil: number;
  } | null>(null);

  const { quality, handleMetricsUpdate } = useAdaptiveQuality();

  const AU_TO_KM = 149597870.7;
  const DAY_TO_SECONDS = 86400;

  useEffect(() => {
    setIsClient(true);
    
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate metrics when currentIndex changes
  useEffect(() => {
    if (!trajectoryData?.atlas || trajectoryData.atlas.length === 0) return;

    const currentFrame = trajectoryData.atlas[Math.floor(currentIndex)];
    if (!currentFrame) return;

    // Update date
    setCurrentDate(currentFrame.date || "");

    // Calculate distance from Sun
    const pos = normalizeVector(currentFrame.position);
    const distance = pos.length();
    setDistanceFromSun(distance);

    // Calculate velocity
    const vel = normalizeVector(currentFrame.velocity);
    const velocityMagnitude = vel.length();
    const velocityKmPerSec = (velocityMagnitude * AU_TO_KM) / DAY_TO_SECONDS;
    setCurrentVelocity(velocityKmPerSec);

    // Find next milestone
    const currentDateObj = new Date(currentFrame.date);
    let closestMilestone = null;
    let minDiff = Infinity;

    for (const milestone of trajectoryData.milestones) {
      const milestoneDate = new Date(milestone.date);
      const diffMs = milestoneDate.getTime() - currentDateObj.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays >= 0 && diffDays < minDiff) {
        minDiff = diffDays;
        closestMilestone = {
          name: milestone.name,
          date: milestone.date,
          daysUntil: diffDays,
        };
      }
    }

    setNextMilestone(closestMilestone);
  }, [currentIndex, trajectoryData]);

  if (!isClient) {
    return null;
  }

  if (!trajectoryData?.atlas || trajectoryData.atlas.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-white">
          Enhanced trajectory data not found. Please check data files.
        </p>
      </div>
    );
  }

  // Speed presets
  const speedPresets = [0.5, 1, 2, 5, 10];

  return (
    <div className="w-full h-full flex bg-black relative">
      {/* Main content area - adjusts based on panel state and screen size */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isPanelOpen && !isMobile ? 'mr-[450px]' : ''
      }`}>
      {/* View Switcher */}
      <ViewSwitcher
        currentView={cameraViewMode}
        onViewChange={setCameraViewMode}
      />

      {/* Telemetry HUD */}
      <TelemetryHUD
        distanceFromSun={distanceFromSun}
        currentVelocity={currentVelocity}
        currentDate={currentDate}
        cameraViewMode={cameraViewMode}
        playbackSpeed={speed}
        nextMilestone={nextMilestone || undefined}
      />

      {/* 3D Canvas */}
      <div className="w-full flex-grow rounded-lg overflow-hidden">
        <ThreeJSErrorBoundary
          fallback={<ErrorFallback error={new Error("3D rendering failed")} />}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Canvas
              camera={{ position: [10, 6, 10], fov: 60 }}
              frameloop="always"
              dpr={quality.pixelRatio}
              performance={{ min: 0.5 }}
            >
              <Scene
                currentIndex={currentIndex}
                trajectoryData={trajectoryData}
                quality={quality}
                cameraViewMode={cameraViewMode}
                onMilestoneClick={onMilestoneClick}
              />
            </Canvas>
          </Suspense>
        </ThreeJSErrorBoundary>
      </div>

      {/* Enhanced Playback Controls */}
      <div className="flex-shrink-0 p-4 bg-black/80 backdrop-blur-md border-t border-white/20">
        {/* Timeline */}
        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-center justify-between text-white/70 text-xs">
            <span>
              {trajectoryData.atlas[0]?.date
                .split(" ")[0]
                .replace(/-/g, "/")}
            </span>
            <span className="font-bold text-white">
              {currentDate.split(" ")[0].replace(/-/g, "/")}
            </span>
            <span>
              {trajectoryData.atlas[trajectoryData.atlas.length - 1]?.date
                .split(" ")[0]
                .replace(/-/g, "/")}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={trajectoryData.atlas.length - 1}
            value={currentIndex}
            onChange={(e) => onIndexChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl w-32"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl w-32"
          >
            ↺ Reset
          </button>

          {/* Speed Controls */}
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <span className="text-white text-sm font-semibold">Speed:</span>
            <div className="flex gap-1">
              {speedPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => onSpeedChange(preset)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    speed === preset
                      ? "bg-green-600 text-white"
                      : "bg-white/20 text-white/70 hover:bg-white/30"
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Educational Panel - OFF-CANVAS */}
      <EducationalPanel
        selectedMilestone={selectedMilestone}
        onClose={onPanelClose}
        isOpen={isPanelOpen}
        isMobile={isMobile}
      />
    </div>
  );
};

export default HistoricalFlightViewEnhanced;
