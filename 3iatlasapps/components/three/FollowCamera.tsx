"use client";

/**
 * FollowCamera Component - "Ride with ATLAS" Camera Perspective
 * Implements smooth camera following with velocity-aware positioning
 * 
 * Features:
 * - Smooth interpolation using lerp for position and lookAt
 * - Velocity-aware positioning (camera adjusts based on comet speed)
 * - Multiple follow modes: follow (close), chase (medium), orbit (far)
 * - Configurable trailing offset (slightly behind and above comet)
 */

import { useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export type FollowMode = "follow" | "chase" | "orbit" | "disabled";

export interface FollowCameraProps {
  targetRef: React.RefObject<THREE.Group | THREE.Mesh>;
  mode?: FollowMode;
  followDistance?: number; // Distance behind target
  followHeight?: number; // Height above target
  followSide?: number; // Offset to the side
  smoothness?: number; // 0 = instant, 1 = very smooth (0.9 recommended)
  velocity?: THREE.Vector3; // Current velocity of target for velocity-aware positioning
}

const FOLLOW_PRESETS = {
  follow: {
    distance: 0.5,
    height: 0.3,
    side: 0.2,
    smoothness: 0.92,
  },
  chase: {
    distance: 1.5,
    height: 0.8,
    side: 0.5,
    smoothness: 0.85,
  },
  orbit: {
    distance: 3.0,
    height: 1.5,
    side: 1.0,
    smoothness: 0.8,
  },
};

export const FollowCamera: React.FC<FollowCameraProps> = ({
  targetRef,
  mode = "follow",
  followDistance,
  followHeight,
  followSide,
  smoothness,
  velocity,
}) => {
  const { camera } = useThree();
  const lastTargetPosition = useRef(new THREE.Vector3());
  const cameraVelocity = useRef(new THREE.Vector3());

  // Get preset values or use custom ones
  const preset = mode !== "disabled" ? FOLLOW_PRESETS[mode] : null;
  const distance = followDistance ?? preset?.distance ?? 1.0;
  const height = followHeight ?? preset?.height ?? 0.5;
  const side = followSide ?? preset?.side ?? 0.3;
  const smooth = smoothness ?? preset?.smoothness ?? 0.9;

  // Disable mode
  if (mode === "disabled") {
    return null;
  }

  useFrame((state, delta) => {
    if (!targetRef.current) return;

    const targetPosition = targetRef.current.position;

    // Calculate target direction (from Sun to comet)
    const directionToTarget = new THREE.Vector3()
      .copy(targetPosition)
      .normalize();

    // Calculate velocity-aware offset
    let velocityFactor = 1.0;
    if (velocity && velocity.length() > 0) {
      // Scale offset based on velocity (faster = further back)
      velocityFactor = 1.0 + Math.min(velocity.length() * 0.5, 2.0);
    }

    // Calculate ideal camera position (behind and above the target)
    const offset = new THREE.Vector3(
      -directionToTarget.x * distance * velocityFactor + side,
      height * velocityFactor,
      -directionToTarget.z * distance * velocityFactor
    );

    const idealPosition = new THREE.Vector3()
      .copy(targetPosition)
      .add(offset);

    // Smooth camera position using lerp
    const lerpFactor = 1 - Math.pow(smooth, delta * 60); // Frame-rate independent
    camera.position.lerp(idealPosition, lerpFactor);

    // Smooth camera lookAt
    const lookAtTarget = new THREE.Vector3().copy(targetPosition);
    
    // Calculate the direction from camera to target
    const lookDirection = new THREE.Vector3()
      .subVectors(lookAtTarget, camera.position)
      .normalize();
    
    // Create a quaternion for the target rotation
    const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(camera.position, lookAtTarget, camera.up)
    );
    
    // Smoothly interpolate rotation
    camera.quaternion.slerp(targetQuaternion, lerpFactor * 0.5);

    // Store last target position for velocity calculation
    lastTargetPosition.current.copy(targetPosition);
  });

  return null;
};

export default FollowCamera;
