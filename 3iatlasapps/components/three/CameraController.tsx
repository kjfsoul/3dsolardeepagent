"use client";

/**
 * CameraController Component - Manages Multiple Camera Views
 * 
 * Implements 5 camera view modes:
 * 1. RIDE_WITH_ATLAS: Close follow perspective (primary mode)
 * 2. SOLAR_SYSTEM_OVERVIEW: Wide view showing full trajectory
 * 3. PERIHELION_CLOSEUP: Dramatic view of Sun approach
 * 4. MARS_FLYBY: Fixed view centered on Mars during Oct 3 event
 * 5. FREE_CAMERA: User-controlled OrbitControls
 * 
 * Features smooth transitions between views (1-2 second animations)
 */

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FollowCamera, FollowMode } from "./FollowCamera";

export type CameraViewMode =
  | "RIDE_WITH_ATLAS"
  | "SOLAR_SYSTEM_OVERVIEW"
  | "PERIHELION_CLOSEUP"
  | "MARS_FLYBY"
  | "FREE_CAMERA";

export interface CameraControllerProps {
  viewMode: CameraViewMode;
  cometRef: React.RefObject<THREE.Group | THREE.Mesh>;
  marsRef?: React.RefObject<THREE.Group | THREE.Mesh>;
  sunPosition?: THREE.Vector3;
  cometVelocity?: THREE.Vector3;
  transitionDuration?: number; // seconds
  enableControls?: boolean;
}

interface CameraPreset {
  position: THREE.Vector3;
  target: THREE.Vector3;
  followMode?: FollowMode;
}

const CameraController: React.FC<CameraControllerProps> = ({
  viewMode,
  cometRef,
  marsRef,
  sunPosition = new THREE.Vector3(0, 0, 0),
  cometVelocity,
  transitionDuration = 1.5,
  enableControls = true,
}) => {
  const { camera, gl } = useThree();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentFollowMode, setCurrentFollowMode] = useState<FollowMode>("follow");
  const [useOrbitControls, setUseOrbitControls] = useState(false);
  
  const transitionProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const orbitControlsRef = useRef<any>(null);

  // Get camera presets based on view mode
  const getCameraPreset = (): CameraPreset | null => {
    switch (viewMode) {
      case "SOLAR_SYSTEM_OVERVIEW":
        return {
          position: new THREE.Vector3(0, 50, 50),
          target: sunPosition,
          followMode: "disabled" as FollowMode,
        };
      
      case "PERIHELION_CLOSEUP":
        if (cometRef.current) {
          // Position camera between Sun and comet for dramatic view
          const cometPos = cometRef.current.position;
          const dirToComet = new THREE.Vector3()
            .subVectors(cometPos, sunPosition)
            .normalize();
          
          return {
            position: new THREE.Vector3()
              .copy(sunPosition)
              .add(dirToComet.multiplyScalar(2.5))
              .add(new THREE.Vector3(0, 1.5, 0)),
            target: sunPosition,
            followMode: "disabled" as FollowMode,
          };
        }
        return null;
      
      case "MARS_FLYBY":
        if (marsRef?.current) {
          const marsPos = marsRef.current.position;
          return {
            position: new THREE.Vector3(
              marsPos.x + 3,
              marsPos.y + 2,
              marsPos.z + 3
            ),
            target: marsPos,
            followMode: "disabled" as FollowMode,
          };
        }
        return null;
      
      case "RIDE_WITH_ATLAS":
        return {
          position: camera.position.clone(), // Will be controlled by FollowCamera
          target: cometRef.current?.position || new THREE.Vector3(),
          followMode: "follow",
        };
      
      case "FREE_CAMERA":
        return {
          position: camera.position.clone(),
          target: new THREE.Vector3(0, 0, 0),
          followMode: "disabled" as FollowMode,
        };
      
      default:
        return null;
    }
  };

  // Start transition to new view
  useEffect(() => {
    const preset = getCameraPreset();
    if (!preset) return;

    // Store current camera state
    startPosition.current.copy(camera.position);
    
    // Calculate current lookAt target
    const lookAtDir = new THREE.Vector3(0, 0, -1);
    lookAtDir.applyQuaternion(camera.quaternion);
    startTarget.current.copy(camera.position).add(lookAtDir.multiplyScalar(10));

    // Set target state
    targetPosition.current.copy(preset.position);
    targetLookAt.current.copy(preset.target);

    // Update follow mode and controls state
    setCurrentFollowMode(preset.followMode || "disabled");
    setUseOrbitControls(viewMode === "FREE_CAMERA");

    // Start transition (except for RIDE_WITH_ATLAS which uses FollowCamera)
    if (viewMode !== "RIDE_WITH_ATLAS") {
      setIsTransitioning(true);
      transitionProgress.current = 0;
    }
  }, [viewMode]);

  // Animate camera transition
  useFrame((state, delta) => {
    if (isTransitioning && viewMode !== "RIDE_WITH_ATLAS") {
      transitionProgress.current += delta / transitionDuration;

      if (transitionProgress.current >= 1.0) {
        // Transition complete
        transitionProgress.current = 1.0;
        setIsTransitioning(false);
      }

      // Smooth easing function (ease-in-out)
      const t = transitionProgress.current;
      const easedT = t < 0.5 
        ? 2 * t * t 
        : -1 + (4 - 2 * t) * t;

      // Interpolate camera position
      camera.position.lerpVectors(
        startPosition.current,
        targetPosition.current,
        easedT
      );

      // Interpolate lookAt target
      const currentTarget = new THREE.Vector3().lerpVectors(
        startTarget.current,
        targetLookAt.current,
        easedT
      );

      // Update camera rotation
      const lookAtMatrix = new THREE.Matrix4().lookAt(
        camera.position,
        currentTarget,
        camera.up
      );
      const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
      camera.quaternion.slerp(targetQuaternion, 0.1);
    }
  });

  return (
    <>
      {/* Follow camera for RIDE_WITH_ATLAS mode */}
      {viewMode === "RIDE_WITH_ATLAS" && (
        <FollowCamera
          targetRef={cometRef}
          mode={currentFollowMode}
          velocity={cometVelocity}
        />
      )}

      {/* Orbit controls for FREE_CAMERA mode */}
      {useOrbitControls && enableControls && (
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={100}
          minDistance={1}
          enableDamping={true}
          dampingFactor={0.05}
        />
      )}
    </>
  );
};

export default CameraController;
