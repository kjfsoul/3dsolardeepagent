/**
 * Atlas3DTrackerEnhanced Component
 * =============================
 * Main 3D visualization component for 3I/ATLAS flight tracker
 *
 * Features:
 * - Real-time trajectory visualization
 * - "Riding with ATLAS" follow camera
 * - Cinematic transitions for key events
 * - Interactive timeline with educational content
 * - User controls for playback
 * - Mobile responsive
 */

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// Component imports
import { Planet, Sun } from './CelestialBodies';
import { Comet3D, HighlightGlow } from './Comet3D';
import { CinematicCamera } from './FollowCamera';
import { PlaybackControls } from './PlaybackControls';
import { PlaybackRecorder } from './PlaybackRecorder';
import { Starfield } from './Starfield';
import { TelemetryHUD } from './TelemetryHUD';
import { TimelinePanel } from './TimelinePanel';
import { FullTrajectoryLine, TrajectoryTrail } from './TrajectoryTrail';

// Type imports
import { TimelineEvent, TrajectoryData } from '@/types/trajectory';

type ViewMode = 'explorer' | 'true-scale' | 'ride-atlas';

interface Atlas3DTrackerEnhancedProps {
  autoPlay?: boolean;
  initialSpeed?: number;
  initialViewMode?: ViewMode;
}

export function Atlas3DTrackerEnhanced({
  autoPlay = true,
  initialSpeed = 2,
  initialViewMode = 'explorer',
}: Atlas3DTrackerEnhancedProps) {
  // State management
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryData | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(initialSpeed);
  // Removed followMode - always use free cam with zoom/pan/rotate
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cinematic camera state
  const [cinematicActive, setCinematicActive] = useState(false);
  const [cinematicEvent, setCinematicEvent] = useState<'mars_flyby' | 'perihelion' | 'jupiter_approach' | null>(null);

  // Animation ref
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  // Scale calculation helper
  const getScaledRadius = (name: string, baseRadius: number): number => {
    switch (viewMode) {
      case 'true-scale':
        // True scale ratios (Sun = 10x Jupiter, Jupiter = base)
        const trueScaleRatios: Record<string, number> = {
          'Sun': 10.0,      // ~10x Jupiter diameter
          'Mercury': 0.03,  // ~0.38x Earth
          'Venus': 0.09,    // ~0.95x Earth
          'Earth': 0.09,    // Reference
          'Mars': 0.05,     // ~0.53x Earth
          'Jupiter': 1.0,   // Base scale
          'Saturn': 0.84,   // ~0.84x Jupiter
          'Uranus': 0.36,   // ~0.36x Jupiter
          'Neptune': 0.35,  // ~0.35x Jupiter
          'Pluto': 0.02,    // ~0.18x Earth
          'Ceres': 0.03,    // ~0.27x Earth
          'Vesta': 0.015,   // ~0.15x Earth
          'Pallas': 0.015,  // ~0.15x Earth
        };
        return (trueScaleRatios[name] || baseRadius) * 0.1; // Scale down for visibility

      case 'ride-atlas':
        // Keep planets at explorer scale, but smaller overall
        return baseRadius * 0.5;

      case 'explorer':
      default:
        // Current compressed scale
        return baseRadius;
    }
  };

  // Load trajectory data
  useEffect(() => {
    async function loadData() {
      try {
        console.log('🚀 Starting data load...');
        // Load trajectory data
        const trajectoryResponse = await fetch('/data/trajectory_static.json');
        console.log('📡 Trajectory response:', trajectoryResponse.status);
        if (!trajectoryResponse.ok) {
          throw new Error('Failed to load trajectory data');
        }
        const trajectoryJson = await trajectoryResponse.json();
        console.log('✅ Trajectory data loaded:', Object.keys(trajectoryJson));
        setTrajectoryData(trajectoryJson);

        // Load events
        const eventsResponse = await fetch('/data/timeline_events.json');
        console.log('📡 Events response:', eventsResponse.status);
        if (!eventsResponse.ok) {
          throw new Error('Failed to load events data');
        }
        const eventsJson = await eventsResponse.json();
        console.log('✅ Events data loaded:', eventsJson.events?.length || 0);
        setEvents(eventsJson.events);

        console.log('🎉 All data loaded successfully!');
        setLoading(false);
      } catch (err) {
        console.error('❌ Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !trajectoryData) {
      return;
    }
    const atlasData = trajectoryData.atlas || trajectoryData['3iatlas'];
    if (!atlasData || atlasData.length === 0) {
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = now;

      setCurrentIndex((prevIndex) => {
        const increment = speed * deltaTime * 2.0; // Adjust multiplier for desired speed
        const nextIndex = prevIndex + increment;

        // Loop back to start if we reach the end
        if (nextIndex >= atlasData.length - 1) {
          return 0;
        }

        return nextIndex;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed, trajectoryData]);

  // Get current frame data
  const currentFrame = useMemo(() => {
    if (!trajectoryData) return null;
    // Handle both 'atlas' and '3iatlas' keys from the data
    const atlasData = trajectoryData.atlas || trajectoryData['3iatlas'];
    if (!atlasData || atlasData.length === 0) return null;
    const index = Math.floor(currentIndex);
    return atlasData[index] || null;
  }, [trajectoryData, currentIndex]);

  // Calculate comet position and velocity for 3D scene
  const cometPosition = useMemo((): [number, number, number] => {
    if (!currentFrame) return [0, 0, 0];
    return [
      currentFrame.position.x,
      currentFrame.position.z,
      -currentFrame.position.y,
    ];
  }, [currentFrame]);

  const cometVelocity = useMemo((): [number, number, number] => {
    if (!currentFrame) return [0, 0, 0];
    return [
      currentFrame.velocity.x,
      currentFrame.velocity.z,
      -currentFrame.velocity.y,
    ];
  }, [currentFrame]);

  // Camera target (for follow mode)
  const cometPositionVec = useMemo(
    () => new THREE.Vector3(...cometPosition),
    [cometPosition]
  );

  // Handle event timeline clicks
  const handleEventClick = (event: TimelineEvent) => {
    if (!trajectoryData) return;

    // Find the index corresponding to the event date
    const eventDate = new Date(event.date);
    const atlasData = trajectoryData.atlas || trajectoryData['3iatlas'] || [];
    const eventIndex = atlasData.findIndex((frame) => {
      const frameDate = new Date(frame.date);
      return frameDate >= eventDate;
    });

    if (eventIndex !== -1) {
      setCurrentIndex(eventIndex);
      setIsPlaying(false);

      // Trigger cinematic camera if appropriate
      if (event.id === 'mars_flyby') {
        setCinematicEvent('mars_flyby');
        setCinematicActive(true);
      } else if (event.id === 'perihelion') {
        setCinematicEvent('perihelion');
        setCinematicActive(true);
      } else if (event.id === 'jupiter_approach') {
        setCinematicEvent('jupiter_approach');
        setCinematicActive(true);
      }
    }
  };

  // Camera preset for Ride With ATLAS mode
  useEffect(() => {
    if (viewMode === "ride-atlas" && trajectoryData) {
      // Set camera to follow comet closely
      const atlasData = trajectoryData.atlas || trajectoryData["3iatlas"];
      if (atlasData && atlasData.length > 0) {
        const currentFrame = atlasData[Math.floor(currentIndex)];
        if (currentFrame) {
          const cometPos = new THREE.Vector3(
            currentFrame.position.x,
            currentFrame.position.z,
            -currentFrame.position.y
          );

          // Position camera slightly behind and above the comet
          const cameraOffset = new THREE.Vector3(2, 1, 2);
          const cameraPosition = cometPos.clone().add(cameraOffset);

          // This will be handled by OrbitControls target
          console.log(
            "🎯 Ride With ATLAS: Camera targeting comet at",
            cometPos
          );
        }
      }
    }
  }, [viewMode, currentIndex, trajectoryData]);

  // True ride-along camera for Ride With ATLAS mode
  const rideAlongCamera = useMemo(() => {
    if (viewMode !== "ride-atlas" || !currentFrame) return null;

    const cometPos = new THREE.Vector3(
      currentFrame.position.x,
      currentFrame.position.z,
      -currentFrame.position.y
    );

    // Camera positioned closer behind and above the comet for better focus
    const cameraOffset = new THREE.Vector3(1.0, 0.5, 1.0);
    const cameraPosition = cometPos.clone().add(cameraOffset);

    return {
      position: cameraPosition,
      target: cometPos,
      distance: cameraOffset.length(),
    };
  }, [viewMode, currentFrame]);

  // Check if we're near perihelion for glow effect
  const isPerihelion = useMemo(() => {
    if (!currentFrame || !trajectoryData) return false;
    const perihelionDate = new Date('2025-10-29');
    const currentDate = new Date(currentFrame.date);
    const daysDiff = Math.abs(
      (currentDate.getTime() - perihelionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff < 3; // Within 3 days of perihelion
  }, [currentFrame, trajectoryData]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-xl">Loading 3I/ATLAS trajectory data...</div>
          <div className="text-sm text-gray-400 mt-2">
            From NASA JPL Horizons System
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !trajectoryData) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center text-red-400">
          <div className="text-xl mb-2">❌ Error Loading Data</div>
          <div className="text-sm">{error || 'Unknown error'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Canvas */}
      <Canvas
        className="w-full h-full"
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />

        {/* Camera */}
        <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={50} />

        {/* Scene */}
        <Suspense fallback={null}>
          {/* Starfield Background */}
          <Starfield count={3000} radius={80} depth={40} />

          {/* Sun - Compressed scale: ~5x Jupiter for visibility */}
          <Sun radius={getScaledRadius("Sun", 2.0)} viewMode={viewMode} />

          {/* Planets */}
          {/* Planets - Compressed scale relative to Jupiter=0.4 */}
          {/* Mercury - 0.38× Earth */}
          {trajectoryData.mercury && trajectoryData.mercury.length > 0 && (
            <Planet
              name="Mercury"
              trajectoryData={trajectoryData.mercury}
              currentIndex={currentIndex / 4}
              radius={getScaledRadius("Mercury", 0.012)}
              color="#8c7853"
              showOrbit={true}
            />
          )}

          {/* Venus - 0.95× Earth */}
          {trajectoryData.venus && trajectoryData.venus.length > 0 && (
            <Planet
              name="Venus"
              trajectoryData={trajectoryData.venus}
              currentIndex={currentIndex / 4}
              radius={getScaledRadius("Venus", 0.034)}
              color="#ffc649"
              showOrbit={true}
            />
          )}

          {/* Earth - Reference: 0.09× Jupiter */}
          {trajectoryData.earth.length > 0 && (
            <Planet
              name="Earth"
              trajectoryData={trajectoryData.earth}
              currentIndex={currentIndex / 4}
              radius={getScaledRadius("Earth", 0.036)}
              color="#00aaff"
              showOrbit={true}
            />
          )}

          {/* Ceres - Largest asteroid, 0.27× Earth (dwarf planet) */}
          {trajectoryData.ceres && trajectoryData.ceres.length > 0 && (
            <Planet
              name="Ceres"
              trajectoryData={trajectoryData.ceres}
              currentIndex={currentIndex / 8}
              radius={getScaledRadius("Ceres", 0.01)}
              color="#a89f91"
              showOrbit={true}
            />
          )}

          {/* Vesta - 2nd largest asteroid, ~0.15× Earth */}
          {trajectoryData.vesta && trajectoryData.vesta.length > 0 && (
            <Planet
              name="Vesta"
              trajectoryData={trajectoryData.vesta}
              currentIndex={currentIndex / 8}
              radius={getScaledRadius("Vesta", 0.006)}
              color="#b5a88f"
              showOrbit={true}
            />
          )}

          {/* Pallas - 3rd largest asteroid, ~0.15× Earth */}
          {trajectoryData.pallas && trajectoryData.pallas.length > 0 && (
            <Planet
              name="Pallas"
              trajectoryData={trajectoryData.pallas}
              currentIndex={currentIndex / 8}
              radius={getScaledRadius("Pallas", 0.006)}
              color="#9d9589"
              showOrbit={true}
            />
          )}

          {/* Mars - 0.53× Earth */}
          {trajectoryData.mars.length > 0 && (
            <Planet
              name="Mars"
              trajectoryData={trajectoryData.mars}
              currentIndex={currentIndex / 4}
              radius={getScaledRadius("Mars", 0.019)}
              color="#ff6666"
              showOrbit={true}
            />
          )}

          {/* Jupiter - Largest planet, base scale */}
          {trajectoryData.jupiter.length > 0 && (
            <Planet
              name="Jupiter"
              trajectoryData={trajectoryData.jupiter}
              currentIndex={currentIndex / 8}
              radius={getScaledRadius("Jupiter", 0.4)}
              color="#ffbb88"
              showOrbit={true}
            />
          )}

          {/* Saturn - 0.84× Jupiter */}
          {trajectoryData.saturn && trajectoryData.saturn.length > 0 && (
            <Planet
              name="Saturn"
              trajectoryData={trajectoryData.saturn}
              currentIndex={currentIndex / 8}
              radius={getScaledRadius("Saturn", 0.34)}
              color="#fad5a5"
              showOrbit={true}
            />
          )}

          {/* Uranus - 0.36× Jupiter */}
          {trajectoryData.uranus && trajectoryData.uranus.length > 0 && (
            <Planet
              name="Uranus"
              trajectoryData={trajectoryData.uranus}
              currentIndex={currentIndex / 16}
              radius={getScaledRadius("Uranus", 0.14)}
              color="#4fd0e0"
              showOrbit={true}
            />
          )}

          {/* Neptune - 0.35× Jupiter */}
          {trajectoryData.neptune && trajectoryData.neptune.length > 0 && (
            <Planet
              name="Neptune"
              trajectoryData={trajectoryData.neptune}
              currentIndex={currentIndex / 16}
              radius={getScaledRadius("Neptune", 0.14)}
              color="#4166f5"
              showOrbit={true}
            />
          )}

          {/* Pluto - 0.18× Earth (dwarf planet) */}
          {trajectoryData.pluto && trajectoryData.pluto.length > 0 && (
            <Planet
              name="Pluto"
              trajectoryData={trajectoryData.pluto}
              currentIndex={currentIndex / 16}
              radius={getScaledRadius("Pluto", 0.007)}
              color="#b8a793"
              showOrbit={true}
            />
          )}

          {/* 3I/ATLAS Comet */}
          <Comet3D
            position={cometPosition}
            velocity={cometVelocity}
            scale={viewMode === "ride-atlas" ? 0.8 : 0.05}
            tailLength={viewMode === "ride-atlas" ? 4.0 : 0.8}
          />

          {/* Perihelion Glow Effect */}
          <HighlightGlow
            position={cometPosition}
            intensity={8.0}
            visible={isPerihelion}
          />

          {/* Trajectory Trail */}
          <TrajectoryTrail
            trajectoryData={
              trajectoryData.atlas || trajectoryData["3iatlas"] || []
            }
            currentIndex={currentIndex}
            color="#00ff88"
            opacity={0.8}
          />

          {/* Full Trajectory (dimmer, for context) */}
          <FullTrajectoryLine
            trajectoryData={
              trajectoryData.atlas || trajectoryData["3iatlas"] || []
            }
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
              maxDistance={viewMode === 'ride-atlas' ? 10 : 150}
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
                setCinematicActive(false);
                setCinematicEvent(null);
              }}
            />
          )}
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <TelemetryHUD currentFrame={currentFrame} />
      <PlaybackRecorder enabled={true} duration={30} />

      {/* Controls Help - Always show since we only have free cam */}
      <div className="absolute top-20 right-4 bg-black/70 text-white text-xs p-3 rounded border border-cyan-500/30 backdrop-blur-sm">
        <div className="font-bold text-cyan-400 mb-2">
          🎮 Camera Controls
        </div>
        <div className="space-y-1">
          <div>
            <span className="text-cyan-300">Left Click + Drag:</span> Rotate
          </div>
          <div>
            <span className="text-cyan-300">Scroll Wheel:</span> Zoom In/Out
          </div>
          <div>
            <span className="text-cyan-300">Right Click + Drag:</span> Pan
          </div>
          {viewMode === 'ride-atlas' && (
            <div className="mt-2 pt-2 border-t border-cyan-500/30">
              <div className="text-yellow-400 font-bold">
                🚀 Ride With ATLAS Mode
              </div>
              <div className="text-yellow-300">
                Camera follows comet closely
              </div>
            </div>
          )}
        </div>
      </div>

      <TimelinePanel events={events} onEventClick={handleEventClick} />

      <PlaybackControls
        isPlaying={isPlaying}
        speed={speed}
        currentIndex={currentIndex}
        maxIndex={
          (trajectoryData.atlas || trajectoryData["3iatlas"] || []).length - 1
        }
        viewMode={viewMode}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onReset={() => setCurrentIndex(0)}
        onSpeedChange={setSpeed}
        onSeek={setCurrentIndex}
        onViewModeChange={setViewMode}
      />
    </div>
  );
}
