"use client";

/**
 * 3I/ATLAS Enhanced 3D Orbital Tracker
 * - Time unit unified to "days" (1x = 1 simulated day / real second)
 * - Single interpolation used for meshes, cameras, labels, telemetry
 * - No synthetic/orbital-angle placement (NASA data only)
 * - Fixed-timestep integration to eliminate boundary jitter/skips
 * - Ride camera uses sun-aware lateral offset to avoid occlusion
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Replace with your actual loader that returns arrays like data['earth'] = [{position:{x,y,z}}, ...]
import {
  fetchSolarSystemData,
  SOLAR_SYSTEM_OBJECTS,
  type SolarSystemObjectKey,
} from "@/lib/solar-system-data";

// ---------- Types & Helpers ----------

type VectorData = {
  // AU, heliocentric ecliptic (J2000)
  position: { x: number; y: number; z: number };
};

type CameraView = "default" | "followComet" | "closeup" | "rideComet";

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

// Hermite-smoothed interpolation across daily samples
function getInterpolatedSample(vectors: VectorData[], idxFloat: number) {
  const total = vectors.length;
  const s = mod(idxFloat, total);
  const base = Math.floor(s);
  const next = (base + 1) % total;
  const t = s - base;
  const smoothT = t * t * (3 - 2 * t);

  const a = vectors[base].position;
  const b = vectors[next].position;

  return {
    x: a.x + (b.x - a.x) * smoothT,
    y: a.y + (b.y - a.y) * smoothT,
    z: a.z + (b.z - a.z) * smoothT,
  };
}

// Scene convention: (x, z, -y)
function toR3F(p: { x: number; y: number; z: number }) {
  return new THREE.Vector3(p.x, p.z, -p.y);
}

// ---------- Minimal Comet3D scaffold (inline) ----------

type CometStage = "baseline" | "antiTailDominant" | "sunPlume";

const CometStages: Record<
  CometStage,
  {
    nucleusScale: number;
    comaKm: number;
    antiTailKm: number;
    dustKm: number;
    emissive: number;
    metallic: number;
  }
> = {
  baseline: {
    nucleusScale: 1.0,
    comaKm: 12000,
    antiTailKm: 0,
    dustKm: 75000,
    emissive: 0.35,
    metallic: 0.15,
  },
  antiTailDominant: {
    nucleusScale: 1.2,
    comaKm: 18000,
    antiTailKm: 250000,
    dustKm: 95000,
    emissive: 0.4,
    metallic: 0.18,
  },
  sunPlume: {
    nucleusScale: 1.4,
    comaKm: 22000,
    antiTailKm: 180000,
    dustKm: 120000,
    emissive: 0.45,
    metallic: 0.2,
  },
};

function makeComet3D(stage: CometStage) {
  const group = new THREE.Group();
  group.name = "atlas_comet3D";

  const s = CometStages[stage];

  // Nucleus
  {
    const geom = new THREE.IcosahedronGeometry(1, 2);
    const mat = new THREE.MeshStandardMaterial({
      color: "#888",
      metalness: 0.3,
      roughness: 0.8,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.scale.set(
      s.nucleusScale * 0.06,
      s.nucleusScale * 0.04,
      s.nucleusScale * 0.05
    );
    group.add(mesh);
  }

  // Coma (glow shell)
  {
    const geom = new THREE.SphereGeometry(1, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(0x66ffee),
      emissiveIntensity: s.emissive,
      transparent: true,
      opacity: 0.65,
      metalness: s.metallic,
      roughness: 0.35,
    });
    const mesh = new THREE.Mesh(geom, mat);
    const scale = s.comaKm * 1e-5;
    mesh.scale.set(scale, scale, scale);
    group.add(mesh);
  }

  // Anti-tail (billboard)
  {
    const w = Math.max(s.antiTailKm * 1e-5, 0.001);
    const h = Math.max(s.antiTailKm * 0.4e-5, 0.001);
    const geom = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.4,
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);
  }

  // Dust tail (thin cylinder placeholder)
  {
    const L = Math.max(s.dustKm * 1e-5, 0.001);
    const geom = new THREE.CylinderGeometry(0.02, 0.4, L, 12, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
    });
    const mesh = new THREE.Mesh(geom, mat);
    // Aim along +X by default
    mesh.rotation.z = Math.PI / 2;
    group.add(mesh);
  }

  return group;
}

// ---------- Component ----------

interface Props {
  startDate?: string;
  endDate?: string;
  stepSize?: "1h" | "6h" | "12h" | "1d";
  autoPlay?: boolean;
  playbackSpeed?: number; // 1x == 1 day/sec
  className?: string;
}

export default function Atlas3DTrackerEnhanced({
  startDate = "2025-07-01",
  endDate = "2026-03-31",
  stepSize = "1d",
  autoPlay = true,
  playbackSpeed = 10,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    objects: Map<string, THREE.Object3D>;
  } | null>(null);

  const [cameraView, setCameraView] = useState<CameraView>("default");
  const [isReady, setIsReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Playback
  const isPlayingRef = useRef<boolean>(autoPlay);
  const speedRef = useRef<number>(playbackSpeed);

  // Data cache
  const solarSystemDataRef = useRef<Record<string, VectorData[]>>({});
  const objectEntriesRef = useRef<[string, VectorData[]][]>([]);
  const maxFrameCountRef = useRef<number>(275);

  // Init THREE
  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000");

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.001,
      5000
    );
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Sun (origin)
    {
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffcc55 })
      );
      sun.name = "sun";
      scene.add(sun);
    }

    const objects = new Map<string, THREE.Object3D>();
    sceneRef.current = { scene, renderer, camera, controls, objects };

    const onResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (sceneRef.current) {
        const { renderer } = sceneRef.current;
        renderer.dispose();
        containerRef.current?.removeChild(renderer.domElement);
        sceneRef.current = null;
      }
    };
  }, []);

  // Fetch data & build meshes
  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await fetchSolarSystemData({ startDate, endDate, stepSize });
      if (!mounted || !sceneRef.current) return;

      solarSystemDataRef.current = data;

      // Build entries in SOLAR_SYSTEM_OBJECTS order
      const entries: [string, VectorData[]][] = [];
      let maxLen = 0;
      (Object.keys(SOLAR_SYSTEM_OBJECTS) as SolarSystemObjectKey[]).forEach(
        (key) => {
          const arr = data[key];
          if (arr && arr.length) {
            entries.push([key, arr]);
            if (arr.length > maxLen) maxLen = arr.length;
          }
        }
      );
      objectEntriesRef.current = entries;
      maxFrameCountRef.current = maxLen || 275;

      // Create meshes
      const { scene, objects } = sceneRef.current;
      // clear existing (hot-reload safe)
      objects.forEach((obj) => scene.remove(obj));
      objects.clear();

      for (const key of Object.keys(
        SOLAR_SYSTEM_OBJECTS
      ) as SolarSystemObjectKey[]) {
        const arr = data[key];
        if (!arr || !arr.length) continue;

        const color = key === "atlas" ? 0x66ffee : 0xffffff;
        const radius = key === "atlas" ? 0.05 : 0.07;

        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 24, 24),
          new THREE.MeshStandardMaterial({ color })
        );
        mesh.name = key;
        scene.add(mesh);
        objects.set(key, mesh);

        if (key === "atlas") {
          const cometGroup = makeComet3D("baseline");
          scene.add(cometGroup);
          objects.set("atlas_comet3D", cometGroup);
        }
      }

      setIsReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [startDate, endDate, stepSize]);

  // Animation loop (1x = 1 day/sec, fixed timestep)
  useEffect(() => {
    if (!sceneRef.current || !isReady) return;

    const { scene, camera, renderer, controls, objects } = sceneRef.current;

    let animationId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const SIM_DT = 1 / 60; // seconds per sim step
    let localIndex = currentIndex || 0; // fractional day index
    isPlayingRef.current = true;
    speedRef.current = playbackSpeed;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlayingRef.current) {
        accumulator += Math.min(dt, 0.1); // cap huge tab-suspend jumps
        while (accumulator >= SIM_DT) {
          const maxFrames = maxFrameCountRef.current || 275;
          const daysPerSecond = speedRef.current * 1.0; // 1x => 1 day/sec
          localIndex += SIM_DT * daysPerSecond;

          if (localIndex >= maxFrames) localIndex -= maxFrames;
          if (localIndex < 0) localIndex += maxFrames;

          accumulator -= SIM_DT;
        }
      }

      // Position bodies (NASA positions ONLY)
      const entries = objectEntriesRef.current;
      for (let i = 0; i < entries.length; i++) {
        const [key, vectors] = entries[i];
        const obj = objects.get(key);
        if (!obj || !vectors || vectors.length === 0) continue;

        const sample = getInterpolatedSample(vectors, localIndex);
        const pos3 = toR3F(sample);
        if (key === "sun") {
          obj.position.set(0, 0, 0);
        } else {
          obj.position.copy(pos3);
        }

        if (key === "atlas") {
          const comet = objects.get("atlas_comet3D");
          if (comet) comet.position.copy(pos3);
        }
      }

      // Camera
      switch (cameraView) {
        case "followComet": {
          const atlas = solarSystemDataRef.current["atlas"];
          if (atlas?.length) {
            const s = getInterpolatedSample(atlas, localIndex);
            const comet = toR3F(s);
            const distance = 2.2;
            const height = 0.6;
            const smoothing = 0.08;
            const offset = new THREE.Vector3(1, 0, 0)
              .normalize()
              .multiplyScalar(distance);
            offset.y += height;

            const ideal = comet.clone().add(offset);
            const d = camera.position.distanceTo(ideal);
            camera.position.lerp(ideal, d > 1 ? smoothing * 3 : smoothing);
            camera.lookAt(comet);
          }
          break;
        }

        case "closeup": {
          const atlas = solarSystemDataRef.current["atlas"];
          if (atlas?.length) {
            const s = getInterpolatedSample(atlas, localIndex);
            const comet = toR3F(s);
            const toSun = new THREE.Vector3(0, 0, 0).sub(comet).normalize();

            camera.position.copy(comet.clone().add(toSun.multiplyScalar(2.0)));
            camera.lookAt(comet);
            camera.fov = 60;
            camera.near = 0.001;
            camera.far = 5000;
            camera.updateProjectionMatrix();
          }
          break;
        }

        case "rideComet": {
          const atlas = solarSystemDataRef.current["atlas"];
          if (atlas?.length) {
            const a = getInterpolatedSample(atlas, localIndex);
            const b = getInterpolatedSample(atlas, localIndex + 1e-2); // tiny lookahead
            const A = toR3F(a);
            const B = toR3F(b);

            const dir = new THREE.Vector3().subVectors(B, A).normalize();
            const toSun = new THREE.Vector3(0, 0, 0).sub(A).normalize();
            const lateral = new THREE.Vector3()
              .crossVectors(dir, toSun)
              .normalize();

            const baseBack = dir.clone().multiplyScalar(-0.1);
            const baseUp = new THREE.Vector3(0, 1, 0).multiplyScalar(0.05);

            // Adaptive push if nearly collinear with the Sun
            const cosAng = THREE.MathUtils.clamp(dir.dot(toSun), -1, 1);
            const ang = (Math.acos(cosAng) * 180) / Math.PI;
            const latMag = ang < 5 ? 0.35 : ang < 10 ? 0.2 : 0.12;

            const camPos = A.clone()
              .add(baseBack)
              .add(baseUp)
              .add(lateral.multiplyScalar(latMag));
            camera.position.copy(camPos);
            camera.fov = 60;
            camera.near = 0.001;
            camera.far = 5000;
            camera.updateProjectionMatrix();
            camera.lookAt(A);
          }
          break;
        }

        case "default":
        default: {
          camera.position.set(8, 5, 8);
          camera.lookAt(0, 0, 0);
          camera.fov = 60;
          camera.near = 0.001;
          camera.far = 5000;
          camera.updateProjectionMatrix();
        }
      }

      // Controls & render
      sceneRef.current.controls.update();

      // Commit index once per frame (no mid-frame setState)
      const idx = Math.floor(mod(localIndex, maxFrameCountRef.current || 275));
      if (idx !== currentIndex) setCurrentIndex(idx);

      sceneRef.current.renderer.render(
        sceneRef.current.scene,
        sceneRef.current.camera
      );
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isReady, cameraView, playbackSpeed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={className} style={{ position: "relative" }}>
      {/* Minimal inline controls for debugging (optional) */}
      <div
        style={{
          position: "absolute",
          zIndex: 5,
          top: 8,
          left: 8,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={() => (isPlayingRef.current = !isPlayingRef.current)}
          style={{ padding: "6px 10px" }}
          title="Play/Pause"
        >
          {isPlayingRef.current ? "Pause" : "Play"}
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Speed (x):
          <input
            type="number"
            defaultValue={playbackSpeed}
            step={1}
            min={1}
            max={100}
            onChange={(e) =>
              (speedRef.current = Math.max(
                1,
                Math.min(100, Number(e.target.value) || 1)
              ))
            }
            style={{ width: 64 }}
          />
        </label>
        <label>
          View:{" "}
          <select
            value={cameraView}
            onChange={(e) => setCameraView(e.target.value as CameraView)}
          >
            <option value="default">Default</option>
            <option value="followComet">Follow 3I/ATLAS</option>
            <option value="closeup">Perihelion Closeup</option>
            <option value="rideComet">Ride with 3I/ATLAS</option>
          </select>
        </label>
        <span style={{ color: "#aaa" }}>
          t = {currentIndex} / {(maxFrameCountRef.current || 275) - 1} (days)
        </span>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} style={{ width: "100%", height: "600px" }} />
    </div>
  );
}
