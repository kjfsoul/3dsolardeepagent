/**
 * FollowCamera Component
 * =============================
 * Implements a camera that follows the comet with a trailing offset,
 * creating the immersive "riding with ATLAS" perspective.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface FollowCameraProps {
  target: THREE.Vector3;
  enabled: boolean;
  offset?: THREE.Vector3;
  smoothness?: number;
}

export function FollowCamera({
  target,
  enabled,
  offset = new THREE.Vector3(5, 3, 5),
  smoothness = 0.05,
}: FollowCameraProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    // Initialize camera position
    if (enabled) {
      targetPosition.current.copy(target).add(offset);
      camera.position.copy(targetPosition.current);
      currentLookAt.current.copy(target);
      camera.lookAt(target);
    }
  }, [enabled]);

  useFrame(() => {
    if (!enabled) return;

    // Calculate desired camera position (behind and above comet)
    targetPosition.current.copy(target).add(offset);

    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, smoothness);

    // Smoothly interpolate look-at point
    currentLookAt.current.lerp(target, smoothness);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

/**
 * CinematicCamera Component
 * =============================
 * Handles cinematic camera transitions for key events
 */

interface CinematicCameraProps {
  active: boolean;
  eventType: 'mars_flyby' | 'perihelion' | 'jupiter_approach' | null;
  target: THREE.Vector3;
  onComplete?: () => void;
}

export function CinematicCamera({
  active,
  eventType,
  target,
  onComplete,
}: CinematicCameraProps) {
  const { camera } = useThree();
  const animationProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    if (active && eventType) {
      // Store starting position
      startPosition.current.copy(camera.position);
      startLookAt.current.copy(target);
      animationProgress.current = 0;
    }
  }, [active, eventType]);

  useFrame((_, delta) => {
    if (!active || !eventType) return;

    // Increment animation progress
    animationProgress.current += delta * 0.5; // 2 second transition

    if (animationProgress.current >= 1.0) {
      animationProgress.current = 1.0;
      if (onComplete) onComplete();
      return;
    }

    // Ease in-out function
    const t = animationProgress.current;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // Define camera positions for each event
    let endPosition = new THREE.Vector3();
    let endLookAt = new THREE.Vector3();

    switch (eventType) {
      case 'mars_flyby':
        // Zoom in to show Mars and comet together
        endPosition.set(target.x + 2, target.y + 1.5, target.z + 2);
        endLookAt.copy(target);
        break;

      case 'perihelion':
        // Close-up view near the Sun
        endPosition.set(target.x + 1, target.y + 1, target.z + 1);
        endLookAt.copy(target);
        break;

      case 'jupiter_approach':
        // Wide view showing Jupiter and comet
        endPosition.set(target.x + 8, target.y + 5, target.z + 8);
        endLookAt.copy(target);
        break;
    }

    // Interpolate camera position and look-at
    camera.position.lerpVectors(startPosition.current, endPosition, eased);
    const lookAt = new THREE.Vector3().lerpVectors(
      startLookAt.current,
      endLookAt,
      eased
    );
    camera.lookAt(lookAt);
  });

  return null;
}
