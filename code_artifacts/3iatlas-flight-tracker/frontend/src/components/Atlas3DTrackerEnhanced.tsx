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
import { SceneContent } from './SceneContent';
import { TelemetryHUD } from './TelemetryHUD';
import { TexturePreloader } from './TexturePreloader';
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
  initialViewMode = 'ride-atlas',
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

  // Log state changes for debugging
  useEffect(() => {
    console.log('viewMode=', viewMode);
  }, [viewMode]);

  useEffect(() => {
    console.log('speed=', speed);
  }, [speed]);
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
    <div className="flex flex-col min-h-screen bg-black text-white">
      <div className="relative flex-1 min-h-[60vh] overflow-hidden">
        {/* Preload textures on mount */}
        <TexturePreloader />

        {/* 3D Canvas */}
        <Canvas
          className="h-full w-full border-2 border-emerald-500/30"
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.3} />

          <PerspectiveCamera
            makeDefault
            position={viewMode === "true-scale" ? [0, 0, 5] : [6, 4, 6]}
            fov={viewMode === "true-scale" ? 45 : 50}
          />

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
      </div>

      <div className="border-t border-emerald-500/20 bg-black/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TimelinePanel
              events={events}
              onEventClick={handleEventClick}
              variant="inline"
            />
            <TelemetryHUD
              currentFrame={currentFrame}
              className="h-full border border-emerald-500/20 bg-black/60"
            />
            <CameraHelpCard viewMode={viewMode} />
          </div>

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
            layout="inline"
          />
        </div>
      </div>
    </div>
  );
}

function CameraHelpCard({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className="h-full rounded-xl border border-cyan-500/20 bg-black/60 p-4 text-xs shadow-lg backdrop-blur">
      <div className="mb-3 text-sm font-bold uppercase tracking-wide text-cyan-300">
        Camera Controls
      </div>
      <ul className="space-y-2 text-gray-200">
        <li><span className="text-cyan-300">Left Click + Drag</span>: Rotate</li>
        <li><span className="text-cyan-300">Scroll Wheel</span>: Zoom In/Out</li>
        <li><span className="text-cyan-300">Right Click + Drag</span>: Pan</li>
        <li><span className="text-cyan-300">+ / - Buttons</span>: Zoom Controls</li>
      </ul>

      <div className="mt-4 rounded-lg border border-cyan-500/20 bg-black/50 p-3 text-xs text-cyan-100">
        {viewMode === 'ride-atlas' ? (
          <>
            <div className="font-semibold text-amber-300">🚀 Ride With ATLAS Mode</div>
            <p className="mt-1 text-gray-300">
              Camera follows the comet automatically while leaving full manual overrides available.
            </p>
          </>
        ) : viewMode === 'true-scale' ? (
          <>
            <div className="font-semibold text-emerald-300">📏 True Scale Mode</div>
            <p className="mt-1 text-gray-300">
              Distances and planetary sizes are rendered at realistic proportions for comparison.
            </p>
          </>
        ) : (
          <>
            <div className="font-semibold text-cyan-300">🛰️ Explorer Mode</div>
            <p className="mt-1 text-gray-300">
              Freely orbit the solar system with balanced scale and visibility for each body.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
