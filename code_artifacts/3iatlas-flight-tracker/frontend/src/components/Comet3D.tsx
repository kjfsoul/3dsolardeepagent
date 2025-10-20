
/**
 * Comet3D Component
 * =============================
 * 3D model of 3I/ATLAS with nucleus and tail
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
      {/* Nucleus - greenish sphere for mysterious interstellar object */}
      <mesh>
        <sphereGeometry args={[scale, 32, 32]} />
        <meshStandardMaterial
          color="#00ffaa"
          emissive="#00ff88"
          emissiveIntensity={2.0}
          roughness={0.5}
        />
      </mesh>

      {/* Coma - glowing sphere around nucleus */}
      <mesh>
        <sphereGeometry args={[scale * 1.8, 32, 32]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Tail - cone shape pointing away from velocity */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -tailLength / 2, 0]}>
        <coneGeometry args={[scale * 1.2, tailLength, 16, 1, true]} />
        <meshBasicMaterial
          color="#00ff66"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
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
