
/**
 * CelestialBodies Component
 * =============================
 * Renders Sun, planets, and their labels
 */

import { VectorData } from '@/types/trajectory';
import { Text, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
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

export function Sun({ radius = 0.1, viewMode = 'explorer' }: SunProps) {
  const brightness = viewMode === 'true-scale' ? 0.3 : viewMode === 'ride-atlas' ? 0.12 : 1.0;
  const glow = viewMode === 'true-scale' ? 0.08 : viewMode === 'ride-atlas' ? 0.02 : 0.25;

  // Optional texture; if not found, material still looks good.
  const tex = useTexture(
    { color: '/textures/sun.jpg' },
    (t) => {
      if (t && typeof t === 'object' && 'color' in t) {
        const colorTex = t.color as THREE.Texture;
        colorTex.wrapS = colorTex.wrapT = THREE.RepeatWrapping;
        colorTex.anisotropy = 8;
      }
    }
  ).color as THREE.Texture | undefined;

  // Animated UV scroll to fake convection cells
  const surfRef = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (surfRef.current && tex) {
      const mat = surfRef.current.material as THREE.MeshStandardMaterial;
      if (mat.map) {
        mat.map.offset.x = (mat.map.offset.x + dt * 0.01) % 1;
        mat.map.offset.y = (mat.map.offset.y + dt * 0.006) % 1;
      }
    }
  });

  // Corona sprite
  const corona = useMemo(() => {
    const size = radius * 4.0;
    const c = new THREE.SpriteMaterial({
      color: new THREE.Color(0xffaa00),
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: glow * 0.9,
      depthWrite: false,
    });
    const s = new THREE.Sprite(c);
    s.scale.set(size, size, 1);
    return s;
  }, [radius, glow]);

  return (
    <group>
      {/* photosphere */}
      <mesh ref={surfRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={tex ?? undefined}
          color={tex ? undefined : '#ff7a18'}
          emissive={'#ff6a00'}
          emissiveIntensity={brightness * 0.75}
          metalness={0}
          roughness={1}
        />
      </mesh>

      {/* hot core bloom */}
      <mesh>
        <sphereGeometry args={[radius * 0.65, 32, 32]} />
        <meshBasicMaterial color="#ffffff" opacity={brightness * 0.35} transparent />
      </mesh>

      {/* corona sprite */}
      <primitive object={corona} />

      {/* light */}
      <pointLight color="#fff7e6" intensity={24} distance={0} decay={2} />

      <Text
        position={[0, radius * 2.5, 0]}
        fontSize={0.2}
        color="#ffaa00"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
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
