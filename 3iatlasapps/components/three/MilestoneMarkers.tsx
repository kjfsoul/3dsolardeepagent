"use client";

/**
 * MilestoneMarkers Component - Interactive 3D Milestone Markers
 * 
 * Features:
 * - Render 3D markers at milestone positions
 * - Glowing spheres or icons with pulsing animation
 * - Color-coded: Discovery (blue), JWST (purple), Mars Flyby (red), Perihelion (orange)
 * - Clickable with hover effects
 * - Labels using HTML overlays
 */

import { Html } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import React, { useRef, useState } from "react";
import * as THREE from "three";

export interface Milestone {
  name: string;
  date: string;
  description: string;
  position: number[]; // [x, y, z]
}

export interface MilestoneMarkersProps {
  milestones: Milestone[];
  onMilestoneClick?: (milestone: Milestone) => void;
  scale?: number;
  orbitScale?: number;
}

interface MarkerProps {
  milestone: Milestone;
  onClick?: (milestone: Milestone) => void;
  scale: number;
  orbitScale: number;
}

// Color mapping for different milestones
const MILESTONE_COLORS: Record<string, string> = {
  Discovery: "#3b82f6", // Blue
  "JWST Observation": "#a855f7", // Purple
  "Mars Flyby": "#ef4444", // Red
  Perihelion: "#f97316", // Orange
};

const MilestoneMarker: React.FC<MarkerProps> = ({
  milestone,
  onClick,
  scale,
  orbitScale,
}) => {
  const markerRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Get color for this milestone
  const color = MILESTONE_COLORS[milestone.name] || "#ffffff";
  const colorObj = new THREE.Color(color);

  // Position marker at milestone location
  const position = new THREE.Vector3(
    milestone.position[0] * orbitScale,
    milestone.position[2] * orbitScale,
    -milestone.position[1] * orbitScale
  );

  // Pulsing animation
  useFrame((state) => {
    if (markerRef.current) {
      const time = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(time * 2.0) * 0.2;
      markerRef.current.scale.setScalar(scale * pulse * (hovered ? 1.3 : 1.0));
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setClicked(true);
    onClick?.(milestone);
    setTimeout(() => setClicked(false), 300);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={markerRef} position={position}>
      {/* Main marker sphere */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={clicked ? 3.0 : hovered ? 2.0 : 1.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.4 : 0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label - Always visible */}
      <Html
        position={[0, 0.5, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          className={`bg-black/80 backdrop-blur-sm border rounded-lg px-3 py-1.5 transition-all duration-200 ${
            hovered ? "scale-110" : "scale-100"
          }`}
          style={{
            borderColor: color,
            minWidth: "120px",
          }}
        >
          <div className="text-white font-semibold text-xs text-center whitespace-nowrap">
            {milestone.name}
          </div>
          <div className="text-white/60 text-[10px] text-center">
            {milestone.date}
          </div>
        </div>
      </Html>

      {/* Detailed info on hover */}
      {hovered && (
        <Html
          position={[0, -0.8, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div
            className="bg-black/90 backdrop-blur-sm border rounded-lg px-4 py-2 max-w-[250px]"
            style={{
              borderColor: color,
            }}
          >
            <div className="text-white text-xs">{milestone.description}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

const MilestoneMarkers: React.FC<MilestoneMarkersProps> = ({
  milestones,
  onMilestoneClick,
  scale = 1.0,
  orbitScale = 1.0,
}) => {
  return (
    <group>
      {milestones.map((milestone, index) => (
        <MilestoneMarker
          key={`${milestone.name}-${index}`}
          milestone={milestone}
          onClick={onMilestoneClick}
          scale={scale}
          orbitScale={orbitScale}
        />
      ))}
    </group>
  );
};

export default MilestoneMarkers;
