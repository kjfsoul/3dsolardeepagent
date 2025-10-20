
/**
 * CelestialBodies Component
 * =============================
 * Renders Sun, planets, and their labels
 */

import { VectorData } from '@/types/trajectory';
import { Text } from '@react-three/drei';
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
          position={[0, radius * 2, 0]}
          fontSize={0.2}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {name}
        </Text>
      )}
    </group>
  );
}

interface SunProps {
  radius?: number;
}

export function Sun({ radius = 0.1 }: SunProps) {
  return (
    <group position={[0, 0, 0]}>
      {/* Sun sphere */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>

      {/* Sun glow */}
      <mesh>
        <sphereGeometry args={[radius * 2, 32, 32]} />
        <meshBasicMaterial
          color="#ffff00"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Sun light */}
      <pointLight color="#ffffff" intensity={25} distance={0} decay={2} />

      {/* Label */}
      <Text
        position={[0, radius * 3, 0]}
        fontSize={0.25}
        color="#ffff00"
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
