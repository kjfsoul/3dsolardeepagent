"use client";

/**
 * Starfield Component - Animated Background Stars
 * 
 * Features:
 * - 10,000+ stars with varying sizes and brightness
 * - Subtle rotation/parallax effect for depth
 * - Dark space background
 * - Performance optimized with instancing
 */

import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

export interface StarfieldProps {
  count?: number;
  radius?: number;
  depth?: number;
  parallaxSpeed?: number;
  quality?: { starCount: number };
}

const Starfield: React.FC<StarfieldProps> = ({
  count,
  radius = 200,
  depth = 100,
  parallaxSpeed = 0.05,
  quality,
}) => {
  const starsRef = useRef<THREE.Points>(null);
  
  // Use quality setting if provided, otherwise use count
  const starCount = quality?.starCount || count || 15000;

  // Generate star positions and attributes
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Random position in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius + Math.random() * depth;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Star colors - mostly white with some blue/yellow tint
      const colorVariation = Math.random();
      if (colorVariation < 0.7) {
        // White stars (70%)
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else if (colorVariation < 0.85) {
        // Blue stars (15%)
        colors[i * 3] = 0.7 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i * 3 + 2] = 1.0;
      } else {
        // Yellow/orange stars (15%)
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.6 + Math.random() * 0.3;
      }

      // Varying star sizes (brightness)
      const sizeRandom = Math.random();
      if (sizeRandom < 0.7) {
        // Small stars (70%)
        sizes[i] = 1.0 + Math.random() * 1.5;
      } else if (sizeRandom < 0.9) {
        // Medium stars (20%)
        sizes[i] = 2.5 + Math.random() * 2.0;
      } else {
        // Large bright stars (10%)
        sizes[i] = 4.5 + Math.random() * 3.0;
      }
    }

    return { positions, colors, sizes };
  }, [starCount, radius, depth]);

  // Subtle rotation animation for parallax effect
  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * parallaxSpeed * 0.01;
      starsRef.current.rotation.x += delta * parallaxSpeed * 0.005;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={starCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={starCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
};

export default Starfield;
