
/**
 * CelestialBodies Component
 * =============================
 * Renders Sun, planets, and their labels
 */

import { VectorData } from '@/types/trajectory';
import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface CelestialBodyProps {
  name: string;
  position: [number, number, number];
  radius: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  showLabel?: boolean;
}

export function CelestialBody({
  name,
  position,
  radius,
  color,
  emissive,
  emissiveIntensity = 0,
  showLabel = true,
}: CelestialBodyProps) {
  const { camera } = useThree();

  // Fade labels with distance to camera to reduce clutter
  const labelOpacity = useMemo(() => {
    const camPos = camera.position;
    const d = camPos.distanceTo(new THREE.Vector3(...position));
    // fade from 1 at close to 0.15 at far
    return THREE.MathUtils.clamp(2.5 / d, 0.15, 1.0);
  }, [camera.position, position]);

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive || color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.7}
        />
      </mesh>

      {showLabel && (
        <Text
          position={[0, radius * 1.5, 0]}
          fontSize={0.15}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          fillOpacity={labelOpacity}
        >
          {name}
        </Text>
      )}
    </group>
  );
}

interface SunProps {
  radius?: number;
  viewMode?: 'explorer' | 'true-scale' | 'ride-atlas';
}

export function Sun({ radius = 2.0, viewMode = "explorer" }: SunProps) {
  // Graceful texture loading (no Suspense, no crash on 404)
  const [sunTex, setSunTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let mounted = true;
    new THREE.TextureLoader().load(
      "/textures/sun_4k.jpg",
      (tex) => {
        if (!mounted) return;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = 8;
        setSunTex(tex);
      },
      undefined,
      () => {
        // optional: console.info("Sun texture not found; using procedural material.");
        if (mounted) setSunTex(null);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  // Mode-based brightness
  const { brightness, coronaOpacity } = useMemo(() => {
    const b = viewMode === "true-scale" ? 0.25 : viewMode === "ride-atlas" ? 0.15 : 1.0;
    const c = viewMode === "true-scale" ? 0.08 : viewMode === "ride-atlas" ? 0.04 : 0.2;
    return { brightness: b, coronaOpacity: c };
  }, [viewMode]);

  // Animated UV scroll to fake convection
  const surfRef = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    const mat = surfRef.current?.material as THREE.MeshStandardMaterial | undefined;
    if (mat?.map) {
      mat.map.offset.x = (mat.map.offset.x + dt * 0.01) % 1;
      mat.map.offset.y = (mat.map.offset.y + dt * 0.006) % 1;
    }
  });

  return (
    <group>
      {/* Light source */}
      <pointLight color="#fff5cc" intensity={25} distance={0} decay={2} />

      {/* Photosphere */}
      <mesh ref={surfRef}>
        <sphereGeometry args={[radius * 0.95, 64, 64]} />
        {sunTex ? (
          <meshStandardMaterial
            map={sunTex}
            emissive="#ff9900"
            emissiveIntensity={brightness * 1.2}
            roughness={0.5}
          />
        ) : (
          <meshStandardMaterial
            color="#ff7a18"
            emissive="#ff6a00"
            emissiveIntensity={brightness * 0.9}
            roughness={0.8}
          />
        )}
      </mesh>

      {/* Core bloom */}
      <mesh>
        <sphereGeometry args={[radius * 0.65, 32, 32]} />
        <meshBasicMaterial color="#ffffff" opacity={brightness * 0.35} transparent />
      </mesh>

      {/* Soft corona shells (cheap + reliable) */}
      <mesh>
        <sphereGeometry args={[radius * 1.25, 64, 64]} />
        <meshBasicMaterial
          color="#ffcc66"
          transparent
          opacity={coronaOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.6, 64, 64]} />
        <meshBasicMaterial
          color="#ffd27a"
          transparent
          opacity={coronaOpacity * 0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, radius * 2.1, 0]}
        fontSize={radius * 0.18}
        color="#ffcc66"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        Sun
      </Text>
    </group>
  );
}

interface PlanetProps {
  name: string;
  trajectoryData: VectorData[];
  currentIndex: number;
  radius: number;
  color: string;
  showOrbit?: boolean;
}

export function Planet({
  name,
  trajectoryData,
  currentIndex,
  radius,
  color,
  showOrbit = true,
}: PlanetProps) {
  if (trajectoryData.length === 0) return null;

  // Get current position
  const frameIndex = Math.floor(currentIndex) % trajectoryData.length;
  const frame = trajectoryData[frameIndex];

  if (!frame) return null;

  const position: [number, number, number] = [
    frame.position.x,
    frame.position.z,
    -frame.position.y,
  ];

  return (
    <>
      <CelestialBody
        name={name}
        position={position}
        radius={radius}
        color={color}
      />

      {/* Orbital path (simplified) */}
      {showOrbit && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trajectoryData.length}
              array={
                new Float32Array(
                  trajectoryData.flatMap((d) => [
                    d.position.x,
                    d.position.z,
                    -d.position.y,
                  ])
                )
              }
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={color}
            opacity={0.2}
            transparent
            linewidth={1}
          />
        </line>
      )}
    </>
  );
}
