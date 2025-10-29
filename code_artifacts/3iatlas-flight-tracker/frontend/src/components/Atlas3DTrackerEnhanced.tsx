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
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

// Component imports
import { PlaybackControls } from "./PlaybackControls";
import { SceneContent } from "./SceneContent";
import { TelemetryHUD } from "./TelemetryHUD";
import { TexturePreloader } from "./TexturePreloader";

// Type imports
import {
  fetchSolarSystemData,
  SolarSystemObjectKey,
} from "@/lib/solar-system-data";
import { TimelineEvent, TrajectoryData, VectorData } from "@/types/trajectory";

type ViewMode = /* 'explorer' | */ "true-scale" | "ride-atlas"; // Explorer commented out
type MissionId = "discovery" | "mars_flyby" | "perihelion" | "jupiter_approach";

interface Atlas3DTrackerEnhancedProps {
  autoPlay?: boolean;
  initialSpeed?: number;
  initialViewMode?: ViewMode;
}

export function Atlas3DTrackerEnhanced({
  autoPlay = true,
  initialSpeed = 10,
  initialViewMode = "ride-atlas",
}: Atlas3DTrackerEnhancedProps) {
  // State management
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryData | null>(
    null
  );
  const [planetData, setPlanetData] = useState<Record<string, VectorData[]>>(
    {}
  );
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(initialSpeed);
  // Removed followMode - always use free cam with zoom/pan/rotate
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [loading, setLoading] = useState(true);

  // Log state changes for debugging
  useEffect(() => {
    console.log("viewMode=", viewMode);
  }, [viewMode]);

  useEffect(() => {
    console.log("speed=", speed);
  }, [speed]);
  const [error, setError] = useState<string | null>(null);

  // Cinematic camera state
  const [cinematicActive, setCinematicActive] = useState(false);
  const [cinematicEvent, setCinematicEvent] = useState<
    "mars_flyby" | "perihelion" | "jupiter_approach" | null
  >(null);

  // Auto fly-by zoom states
  const [focusBody, setFocusBody] = useState<string | null>(null);
  const [focusUntil, setFocusUntil] = useState<number>(0);

  // Animation ref
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  // Helper function to get body position at index
  function bodyPositionAt(trajectory: any[] | undefined, idx: number) {
    if (!trajectory || trajectory.length === 0) return null;
    // Clamp index to valid range (no modulo wrapping!)
    const clampedIdx = Math.min(Math.floor(idx), trajectory.length - 1);
    const f = trajectory[clampedIdx];
    if (!f) return null;
    return new THREE.Vector3(f.position.x, f.position.z, -f.position.y);
  }

  // Load trajectory data
  useEffect(() => {
    async function loadData() {
      try {
        console.log("🚀 Starting data load...");
        // Load trajectory data
        const trajectoryResponse = await fetch("/data/trajectory_static.json");
        console.log("📡 Trajectory response:", trajectoryResponse.status);
        if (!trajectoryResponse.ok) {
          throw new Error("Failed to load trajectory data");
        }
        const trajectoryJson = await trajectoryResponse.json();
        console.log("✅ Trajectory data loaded:", Object.keys(trajectoryJson));
        setTrajectoryData(trajectoryJson);

        // Load events
        const eventsResponse = await fetch("/data/timeline_events.json");
        console.log("📡 Events response:", eventsResponse.status);
        if (!eventsResponse.ok) {
          throw new Error("Failed to load events data");
        }
        const eventsJson = await eventsResponse.json();
        console.log("✅ Events data loaded:", eventsJson.events?.length || 0);
        setEvents(eventsJson.events);

        // Load planet data using existing infrastructure
        console.log("🪐 Loading planet data...");
        const planetObjects: SolarSystemObjectKey[] = [
          "sun",
          "mercury",
          "venus",
          "earth",
          "mars",
          "jupiter",
          "saturn",
          "uranus",
          "neptune",
        ];

        const solarSystemData = await fetchSolarSystemData(
          planetObjects,
          "2025-07-01",
          "2026-03-31",
          "1d"
        );

        console.log("✅ Planet data loaded:", Object.keys(solarSystemData));
        setPlanetData(solarSystemData);

        console.log("🎉 All data loaded successfully!");
        setLoading(false);
      } catch (err) {
        console.error("❌ Error loading data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
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
    const atlasData = trajectoryData.atlas || trajectoryData["3iatlas"];
    if (!atlasData || atlasData.length === 0) {
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = now;

      setCurrentIndex((prevIndex) => {
        const increment = speed * deltaTime * 2.0;
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
    const atlasData = trajectoryData.atlas || trajectoryData["3iatlas"];
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
      {
        name: "Mars",
        pos: bodyPositionAt(trajectoryData.mars, currentIndex / 4),
        r: 0.2,
      },
      {
        name: "Earth",
        pos: bodyPositionAt(trajectoryData.earth, currentIndex / 4),
        r: 0.15,
      },
      {
        name: "Jupiter",
        pos: bodyPositionAt(trajectoryData.jupiter, currentIndex / 8),
        r: 0.4,
      },
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
  }, [
    trajectoryData,
    currentFrame,
    currentIndex,
    focusBody,
    focusUntil,
    setCinematicEvent,
  ]);

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
      position: [cameraPosition.x, cameraPosition.y, cameraPosition.z] as [
        number,
        number,
        number
      ],
      target: [cometPos.x, cometPos.y, cometPos.z] as [number, number, number],
    };
  }, [viewMode, currentFrame]);

  // Check if we're near perihelion for glow effect
  const isPerihelion = useMemo(() => {
    if (!currentFrame || !trajectoryData) return false;
    const perihelionDate = new Date("2025-10-29");
    const currentDate = new Date(currentFrame.date);
    const daysDiff = Math.abs(
      (currentDate.getTime() - perihelionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff < 3; // Within 3 days of perihelion
  }, [currentFrame, trajectoryData]);

  // Loading state
  const missionHighlights = useMemo(() => {
    const missionDates: Record<string, string> = {
      discovery: "Jun 30",
      perihelion: "Oct 28",
      mars_flyby: "Oct 2",
      jupiter_approach: "Mar 15",
    };

    const formatDate = (value: string | undefined, fallback: string) => {
      if (!value) return fallback;
      try {
        const formatted = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(new Date(value));
        return formatted;
      } catch (err) {
        console.warn("Failed to format date", value, err);
        return fallback;
      }
    };

    const lookup = (id: string) => {
      const event = events.find((entry) => entry.id === id);
      return formatDate(event?.date, missionDates[id] ?? "—");
    };

    return {
      discovery: lookup("discovery"),
      perihelion: lookup("perihelion"),
      marsFlyby: lookup("mars_flyby"),
      jupiterApproach: lookup("jupiter_approach"),
    };
  }, [events]);

  const missionRowOne = useMemo(
    () => [
      {
        id: "discovery" as MissionId,
        label: "DISCOVERY",
        date: missionHighlights.discovery,
      },
      {
        id: "perihelion" as MissionId,
        label: "PERIHELION",
        date: missionHighlights.perihelion,
      },
    ],
    [missionHighlights.discovery, missionHighlights.perihelion]
  );

  const missionRowTwo = useMemo(
    () => [
      {
        id: "mars_flyby" as MissionId,
        label: "MARS FLYBY",
        date: missionHighlights.marsFlyby,
      },
      {
        id: "jupiter_approach" as MissionId,
        label: "JUPITER APPROACH",
        date: missionHighlights.jupiterApproach,
      },
    ],
    [missionHighlights.jupiterApproach, missionHighlights.marsFlyby]
  );

  const zoomEnabled = viewMode === "true-scale" || viewMode === "ride-atlas";

  const cameraRowOne: Array<{ label: string }> = [
    { label: "Left Click + Drag: Rotate" },
    { label: "Right Click + Drag: Pan" },
  ];

  const cameraRowTwo: Array<{ label: string; dim?: boolean }> = [
    { label: "Scroll Wheel: Zoom In/Out" },
    { label: "+/- Buttons: Zoom Controls", dim: !zoomEnabled },
  ];

  const handleMissionSelect = useCallback(
    (id: MissionId) => {
      if (!trajectoryData) return;
      const atlasData = trajectoryData.atlas || trajectoryData["3iatlas"] || [];
      if (!atlasData.length) return;

      const mission = events.find((event) => event.id === id);
      if (!mission) return;

      const missionDate = new Date(mission.date);
      const eventIndex = atlasData.findIndex(
        (frame) => new Date(frame.date) >= missionDate
      );
      if (eventIndex === -1) return;

      setCurrentIndex(eventIndex);
      setIsPlaying(false);

      const isSpecial =
        id === "mars_flyby" || id === "perihelion" || id === "jupiter_approach";
      if (isSpecial) {
        setCinematicEvent(
          id as "mars_flyby" | "perihelion" | "jupiter_approach"
        );
        setCinematicActive(true);
      }

      setFocusBody(mission.name);
      setFocusUntil(performance.now() + 2000);
    },
    [events, trajectoryData]
  );

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
          <div className="text-sm">{error || "Unknown error"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-black text-white">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
          <div>Mission Timeline</div>
          <div>Camera Controls</div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-sm">
          {missionRowOne.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleMissionSelect(item.id)}
              className="group rounded-lg  bg-white/5 px-3 sm:px-4 py-2 text-left font-semibold tracking-wide text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition  hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black"
            >
              {item.label}
              <span className="ml-2 font-normal text-white/70 group-hover:text-emerald-200">
                {item.date}
              </span>
            </button>
          ))}
          {cameraRowOne.map((item) => (
            <div
              key={item.label}
              className="text-right text-white/80 pr-2 sm:pr-0"
            >
              {item.label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-sm">
          {missionRowTwo.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleMissionSelect(item.id)}
              className="group rounded-lg  bg-white/5 px-3 sm:px-4 py-2 text-left font-semibold tracking-wide text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition  hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black"
            >
              {item.label}
              <span className="ml-2 font-normal text-white/70 group-hover:text-emerald-200">
                {item.date}
              </span>
            </button>
          ))}
          {cameraRowTwo.map((item) => (
            <div
              key={item.label}
              className={`text-right pr-2 sm:pr-0 ${
                item.dim ? "text-white/40" : "text-white/80"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-[65vh] min-h-[500px] w-full overflow-hidden rounded-2xl bg-black">
        <TexturePreloader />
        <Canvas
          className="absolute inset-0 h-full w-full"
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.3} />
          <PerspectiveCamera
            makeDefault
            position={viewMode === "true-scale" ? [2, 2, 5] : [6, 4, 6]}
            fov={viewMode === "true-scale" ? 45 : 50}
          />

          {/* Enhanced lighting for perihelion comet visibility and solar interaction */}
          <directionalLight position={[10, 5, 10]} intensity={2.2} color="#fff8e1" />
          <pointLight position={[0, 0, 0]} intensity={3.5} distance={25} color="#ffd180" />
          <spotLight position={[0, 10, 10]} intensity={1.6} angle={0.3} penumbra={0.4} color="#b388ff" />

          <Suspense fallback={null}>
            <SceneContent
              trajectoryData={trajectoryData}
              planetData={planetData}
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

            {/* Post-processing effects for cinematic quality */}
            <EffectComposer>
              <Bloom
                intensity={1.1}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
              />
              <Vignette eskil={false} offset={0.1} darkness={0.8} />
            </EffectComposer>
          </Suspense>
        </Canvas>

        <TelemetryHUD
          currentFrame={currentFrame}
          variant="overlay"
          className="absolute left-6 top-6 w-64"
        />
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
  );
}
