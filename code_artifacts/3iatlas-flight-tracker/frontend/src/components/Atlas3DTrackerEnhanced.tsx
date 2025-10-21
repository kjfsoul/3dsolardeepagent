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

import { PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// Component imports
import { PlaybackControls } from './PlaybackControls';
import { PlaybackRecorder } from './PlaybackRecorder';
import { SceneContent } from './SceneContent';
import { TelemetryHUD } from './TelemetryHUD';
import { TimelinePanel } from './TimelinePanel';

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

  // Auto fly-by zoom states
  const [focusBody, setFocusBody] = useState<string | null>(null);
  const [focusUntil, setFocusUntil] = useState<number>(0);

  // Animation ref
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  // Helper function to get body position at index
  function bodyPositionAt(trajectory: any[] | undefined, idx: number) {
    if (!trajectory || trajectory.length === 0) return null;
    const f = trajectory[Math.floor(idx)];
    if (!f) return null;
    return new THREE.Vector3(f.position.x, f.position.z, -f.position.y);
  }

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

  // Auto fly-by zoom: proximity detection
  useEffect(() => {
    if (!trajectoryData || !currentFrame) return;

    const atlasPos = new THREE.Vector3(
      currentFrame.position.x,
      currentFrame.position.z,
      -currentFrame.position.y
    );

    const cands = [
      { name: "Mars", pos: bodyPositionAt(trajectoryData.mars, currentIndex / 4), r: 0.2 },
      { name: "Earth", pos: bodyPositionAt(trajectoryData.earth, currentIndex / 4), r: 0.15 },
      { name: "Jupiter", pos: bodyPositionAt(trajectoryData.jupiter, currentIndex / 8), r: 0.4 },
    ];

    let near: { name: string; d: number } | null = null;
    for (const c of cands) {
      if (!c.pos) continue;
      const d = atlasPos.distanceTo(c.pos);
      if (d < c.r && (!near || d < near.d)) near = { name: c.name, d };
    }

    const now = performance.now();
    if (near && (!focusBody || (near.name !== focusBody && now > focusUntil))) {
      setFocusBody(near.name);
      setFocusUntil(now + 3500);
      setCinematicEvent({
        id: `focus-${near.name}-${now}`,
        name: `Fly-by: ${near.name}`,
        date: currentFrame.date,
        description: `Close approach to ${near.name}`,
        type: "encounter",
      } as any);
    } else if (!near && now > focusUntil) {
      setFocusBody(null);
    }
  }, [trajectoryData, currentFrame, currentIndex, focusBody, focusUntil, setCinematicEvent]);

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
      position: [cameraPosition.x, cameraPosition.y, cameraPosition.z] as [number, number, number],
      target: [cometPos.x, cometPos.y, cometPos.z] as [number, number, number],
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
          <SceneContent
            trajectoryData={trajectoryData}
            currentIndex={currentIndex}
            currentFrame={currentFrame}
            viewMode={viewMode}
            cometPosition={cometPosition}
            cometVelocity={cometVelocity}
            isPerihelion={isPerihelion}
            cinematicActive={cinematicActive}
            cometPositionVec={cometPositionVec}
            rideAlongCamera={rideAlongCamera}
            focusBody={focusBody}
            setCinematicActive={setCinematicActive}
            setCinematicEvent={setCinematicEvent}
            cinematicEvent={cinematicEvent}
          />
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
