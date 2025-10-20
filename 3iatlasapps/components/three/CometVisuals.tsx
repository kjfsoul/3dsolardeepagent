"use client";

/**
 * CometVisuals Component - Enhanced Comet Visualization
 * 
 * Features:
 * - Nucleus: Dark gray-green sphere
 * - Coma: Particle system with greenish glow (5,000 particles)
 * - Tail: Greenish cone extending behind comet
 * - Dynamic Activity: Scale coma and tail based on distance from Sun
 * 
 * Interstellar aesthetic with mysterious greenish color scheme
 */

import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

export interface CometVisualsProps {
  position?: THREE.Vector3;
  velocity?: THREE.Vector3;
  distanceFromSun?: number;
  quality?: { geometryDetail: number };
  scale?: number;
}

// Vertex shader for coma particles with glow effect
const comaVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  varying float vDistance;
  
  void main() {
    vColor = customColor;
    vDistance = length(position);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader for coma particles with glow effect
const comaFragmentShader = `
  varying vec3 vColor;
  varying float vDistance;
  
  void main() {
    // Create circular particles
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    // Glow effect - brighter in center
    float alpha = 1.0 - (dist * 2.0);
    alpha = pow(alpha, 2.0);
    
    // Fade particles based on distance from nucleus
    float fadeFactor = 1.0 - (vDistance / 0.5);
    fadeFactor = clamp(fadeFactor, 0.0, 1.0);
    
    gl_FragColor = vec4(vColor, alpha * fadeFactor * 0.6);
  }
`;

const CometVisuals: React.FC<CometVisualsProps> = ({
  position = new THREE.Vector3(0, 0, 0),
  velocity = new THREE.Vector3(0, 0, 0),
  distanceFromSun = 1.0,
  quality = { geometryDetail: 64 },
  scale = 1.0,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const comaRef = useRef<THREE.Points>(null);

  // Calculate activity level based on distance from Sun
  // Closer to Sun = more active (larger coma and tail)
  const activityLevel = useMemo(() => {
    // Peak activity at perihelion (~0.5 AU), scale from 0.5 to 2.0
    const minDistance = 0.5;
    const maxDistance = 5.0;
    const clamped = Math.max(minDistance, Math.min(maxDistance, distanceFromSun));
    const normalized = (maxDistance - clamped) / (maxDistance - minDistance);
    return 0.5 + normalized * 1.5; // Range: 0.5 to 2.0
  }, [distanceFromSun]);

  // Create coma particle system
  const comaParticles = useMemo(() => {
    const particleCount = Math.floor(5000 * (quality.geometryDetail / 64));
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color1 = new THREE.Color(0x00ff88); // Bright green
    const color2 = new THREE.Color(0x88ffaa); // Light green

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a sphere around nucleus
      const radius = Math.random() * 0.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Gradient from center (bright) to edge (lighter)
      const colorMix = radius / 0.4;
      const color = color1.clone().lerp(color2, colorMix);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Larger particles near center
      sizes[i] = (1.0 - colorMix) * 8.0 + 2.0;
    }

    return { positions, colors, sizes, count: particleCount };
  }, [quality.geometryDetail]);

  // Update comet orientation and scale based on velocity and activity
  useFrame((state, delta) => {
    if (!groupRef.current || !tailRef.current) return;

    // Orient tail opposite to velocity direction
    if (velocity.length() > 0) {
      const velocityDir = velocity.clone().normalize();
      const tailDir = velocityDir.clone().negate();
      
      // Calculate rotation to align tail with velocity direction
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, tailDir);
      
      tailRef.current.quaternion.copy(quaternion);
    }

    // Scale tail based on velocity and activity
    const velocityMagnitude = velocity.length();
    const tailScale = activityLevel * (1.0 + velocityMagnitude * 2.0);
    tailRef.current.scale.setY(tailScale);

    // Scale coma based on activity
    if (comaRef.current) {
      const comaScale = activityLevel * scale;
      comaRef.current.scale.setScalar(comaScale);
    }

    // Subtle rotation animation for coma
    if (comaRef.current) {
      comaRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Nucleus - Dark gray-green sphere */}
      <mesh>
        <sphereGeometry args={[0.08 * scale, quality.geometryDetail / 2, quality.geometryDetail / 2]} />
        <meshStandardMaterial
          color="#2d4a3e"
          roughness={0.9}
          metalness={0.1}
          emissive="#1a3d2e"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Coma - Particle system with glow */}
      <points ref={comaRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={comaParticles.count}
            array={comaParticles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-customColor"
            count={comaParticles.count}
            array={comaParticles.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={comaParticles.count}
            array={comaParticles.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={comaVertexShader}
          fragmentShader={comaFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Tail - Greenish cone */}
      <mesh ref={tailRef} position={[0, -1.0 * scale, 0]}>
        <coneGeometry args={[0.15 * scale, 2.0 * scale, quality.geometryDetail / 4, 1, true]} />
        <meshBasicMaterial
          color="#00ff66"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Additional tail glow effect */}
      <mesh ref={tailRef} position={[0, -1.0 * scale, 0]}>
        <coneGeometry args={[0.25 * scale, 2.5 * scale, quality.geometryDetail / 4, 1, true]} />
        <meshBasicMaterial
          color="#00ff66"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default CometVisuals;
