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
import { CinematicCamera, FollowCamera } from './FollowCamera';
import { PlaybackControls } from './PlaybackControls';
import { Starfield } from './Starfield';
import { TelemetryHUD } from './TelemetryHUD';
import { TimelinePanel } from './TimelinePanel';
import { FullTrajectoryLine, TrajectoryTrail } from './TrajectoryTrail';

// Type imports
import { TimelineEvent, TrajectoryData } from '@/types/trajectory';

interface Atlas3DTrackerEnhancedProps {
  autoPlay?: boolean;
  initialSpeed?: number;
  initialFollowMode?: boolean;
}

export function Atlas3DTrackerEnhanced({
  autoPlay = true,
  initialSpeed = 2,
  initialFollowMode = true,
}: Atlas3DTrackerEnhancedProps) {
  // State management
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryData | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(initialSpeed);
  const [followMode, setFollowMode] = useState(initialFollowMode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cinematic camera state
  const [cinematicActive, setCinematicActive] = useState(false);
  const [cinematicEvent, setCinematicEvent] = useState<'mars_flyby' | 'perihelion' | 'jupiter_approach' | null>(null);

  // Animation ref
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  // Load trajectory data
  useEffect(() => {
    async function loadData() {
      try {
        // Load trajectory data
        const trajectoryResponse = await fetch('/data/trajectory_static.json');
        if (!trajectoryResponse.ok) {
          throw new Error('Failed to load trajectory data');
        }
        const trajectoryJson = await trajectoryResponse.json();
        setTrajectoryData(trajectoryJson);

        // Load events
        const eventsResponse = await fetch('/data/timeline_events.json');
        if (!eventsResponse.ok) {
          throw new Error('Failed to load events data');
        }
        const eventsJson = await eventsResponse.json();
        setEvents(eventsJson.events);

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
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
        <PerspectiveCamera makeDefault position={[10, 8, 10]} fov={60} />

        {/* Scene */}
        <Suspense fallback={null}>
          {/* Starfield Background */}
          <Starfield count={3000} radius={80} depth={40} />

          {/* Sun - Compressed scale: ~5x Jupiter for visibility */}
          <Sun radius={2.0} />

          {/* Planets */}
          {/* Planets - Compressed scale relative to Jupiter=0.4 */}
          {/* Mercury - 0.38× Earth */}
          {trajectoryData.mercury && trajectoryData.mercury.length > 0 && (
            <Planet
              name="Mercury"
              trajectoryData={trajectoryData.mercury}
              currentIndex={currentIndex / 4}
              radius={0.012}
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
              radius={0.034}
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
              radius={0.036}
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
              radius={0.01}
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
              radius={0.006}
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
              radius={0.006}
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
              radius={0.019}
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
              radius={0.4}
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
              radius={0.34}
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
              radius={0.14}
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
              radius={0.14}
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
              radius={0.007}
              color="#b8a793"
              showOrbit={true}
            />
          )}

          {/* 3I/ATLAS Comet */}
          <Comet3D
            position={cometPosition}
            velocity={cometVelocity}
            scale={0.05}
            tailLength={0.8}
          />

          {/* Perihelion Glow Effect */}
          <HighlightGlow
            position={cometPosition}
            intensity={8.0}
            visible={isPerihelion}
          />

          {/* Trajectory Trail */}
          <TrajectoryTrail
            trajectoryData={trajectoryData.atlas || trajectoryData['3iatlas'] || []}
            currentIndex={currentIndex}
            color="#00ff88"
            opacity={0.8}
          />

          {/* Full Trajectory (dimmer, for context) */}
          <FullTrajectoryLine
            trajectoryData={trajectoryData.atlas || trajectoryData['3iatlas'] || []}
            color="#00ff88"
            opacity={0.15}
          />

          {/* Camera Controls - Free Cam Mode */}
          {!followMode && !cinematicActive && (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              enableZoom={true}
              zoomSpeed={1.2}
              minDistance={0.5}
              maxDistance={150}
              target={cometPositionVec}
              mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
              }}
            />
          )}

          {/* Follow Camera */}
          {followMode && !cinematicActive && (
            <FollowCamera
              target={cometPositionVec}
              enabled={true}
              offset={new THREE.Vector3(5, 3, 5)}
              smoothness={0.05}
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

      {/* Controls Help - Show when in Free Cam mode */}
      {!followMode && (
        <div className="absolute top-20 right-4 bg-black/70 text-white text-xs p-3 rounded border border-cyan-500/30 backdrop-blur-sm">
          <div className="font-bold text-cyan-400 mb-2">🎮 Free Cam Controls</div>
          <div className="space-y-1">
            <div><span className="text-cyan-300">Left Click + Drag:</span> Rotate</div>
            <div><span className="text-cyan-300">Scroll Wheel:</span> Zoom In/Out</div>
            <div><span className="text-cyan-300">Right Click + Drag:</span> Pan</div>
          </div>
        </div>
      )}

      <TimelinePanel events={events} onEventClick={handleEventClick} />

      <PlaybackControls
        isPlaying={isPlaying}
        speed={speed}
        currentIndex={currentIndex}
        maxIndex={(trajectoryData.atlas || trajectoryData['3iatlas'] || []).length - 1}
        followMode={followMode}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onReset={() => setCurrentIndex(0)}
        onSpeedChange={setSpeed}
        onSeek={setCurrentIndex}
        onFollowModeToggle={() => setFollowMode(!followMode)}
      />
    </div>
  );
}
