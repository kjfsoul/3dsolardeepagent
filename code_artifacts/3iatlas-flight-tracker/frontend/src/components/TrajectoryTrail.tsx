
/**
 * TrajectoryTrail Component
 * =============================
 * Renders the green hyperbolic path line showing the comet's trajectory
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { VectorData } from '@/types/trajectory';

interface TrajectoryTrailProps {
  trajectoryData: VectorData[];
  currentIndex: number;
  color?: string;
  opacity?: number;
  lineWidth?: number;
}

export function TrajectoryTrail({
  trajectoryData,
  currentIndex,
  color = '#00ff88',
  opacity = 0.8,
  lineWidth = 2,
}: TrajectoryTrailProps) {
  // Generate points for the trail up to current position
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const endIndex = Math.min(
      Math.floor(currentIndex) + 1,
      trajectoryData.length
    );

    let prevX = 0;
    let prevY = 0;
    let prevZ = 0;

    for (let i = 0; i < endIndex; i++) {
      const frame = trajectoryData[i];
      if (frame) {
        const { x, y, z } = frame.position;

        // Frame-skip guard: validate finite values
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          continue;
        }

        // Frame-skip guard: skip outliers (sudden teleports > 5M km)
        if (i > 0 && Math.abs(x - prevX) > 5e6) {
          continue;
        }

        // Convert from Horizons coordinates to Three.js coordinates
        // Horizons: X, Y, Z -> Three.js: X, Z, -Y
        pts.push(new THREE.Vector3(x, z, -y));

        // Store for next iteration
        prevX = x;
        prevY = y;
        prevZ = z;
      }
    }

    return pts;
  }, [trajectoryData, currentIndex]);

  if (points.length < 2) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        opacity={opacity}
        transparent
        linewidth={lineWidth}
      />
    </line>
  );
}

/**
 * FullTrajectoryLine Component
 * =============================
 * Renders the full trajectory path (dimmer, for context)
 */

interface FullTrajectoryLineProps {
  trajectoryData: VectorData[];
  color?: string;
  opacity?: number;
}

export function FullTrajectoryLine({
  trajectoryData,
  color = '#00ff88',
  opacity = 0.3,
}: FullTrajectoryLineProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    let prevX = 0;
    let prevY = 0;
    let prevZ = 0;

    for (let i = 0; i < trajectoryData.length; i++) {
      const frame = trajectoryData[i];
      const { x, y, z } = frame.position;

      // Frame-skip guard: validate finite values
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        continue;
      }

      // Frame-skip guard: skip outliers (sudden teleports > 5M km)
      if (i > 0 && Math.abs(x - prevX) > 5e6) {
        continue;
      }

      pts.push(new THREE.Vector3(x, z, -y));

      // Store for next iteration
      prevX = x;
      prevY = y;
      prevZ = z;
    }

    return pts;
  }, [trajectoryData]);

  if (points.length < 2) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        opacity={opacity}
        transparent
        linewidth={1}
      />
    </line>
  );
}
