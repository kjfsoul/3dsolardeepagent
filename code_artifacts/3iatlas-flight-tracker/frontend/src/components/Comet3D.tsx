
/**
 * Comet3D Component
 * =============================
 * 3D model of 3I/ATLAS with nucleus and tail
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface Comet3DProps {
  position: [number, number, number];
  velocity: [number, number, number];
  scale?: number;
  tailLength?: number;
}

export function Comet3D({
  position,
  velocity,
  scale = 0.05,
  tailLength = 0.5,
}: Comet3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Orient comet tail opposite to velocity direction
  useFrame(() => {
    if (groupRef.current) {
      const velocityVec = new THREE.Vector3(...velocity).normalize();

      // Tail points opposite to velocity
      const tailDirection = velocityVec.clone().negate();

      // Orient the group
      groupRef.current.lookAt(
        groupRef.current.position.clone().add(tailDirection)
      );
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Single Unified Comet Body - Elongated ellipsoid */}
      <mesh scale={[1, 1, 2]}>
        <sphereGeometry args={[scale * 0.6, 32, 32]} />
        <meshStandardMaterial
          color="#00ffaa"
          emissive="#00ff88"
          emissiveIntensity={1.2}
          roughness={0.2}
        />
      </mesh>

      {/* Single Coma - Seamless glow around nucleus */}
      <mesh scale={[1, 1, 2]}>
        <sphereGeometry args={[scale * 1.2, 32, 32]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Single Integrated Tail - Flows seamlessly from body */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -tailLength * 0.4, 0]}>
        <coneGeometry args={[scale * 0.4, tailLength, 16, 1, true]} />
        <meshBasicMaterial
          color="#00ff66"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Comet Label */}
      <Text
        position={[0, scale * 3, 0]}
        fontSize={scale * 2}
        color="#00ff88"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        3I/ATLAS
      </Text>
    </group>
  );
}

/**
 * HighlightGlow Component
 * =============================
 * Perihelion glow effect (activated during perihelion event)
 */

interface HighlightGlowProps {
  position: [number, number, number];
  intensity?: number;
  visible?: boolean;
}

export function HighlightGlow({
  position,
  intensity = 5.0,
  visible = false,
}: HighlightGlowProps) {
  if (!visible) return null;

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Middle glow */}
      <mesh>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshBasicMaterial
          color="#ffdd00"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Point light for illumination */}
      <pointLight color="#ffaa00" intensity={intensity} distance={5} />
    </group>
  );
}
