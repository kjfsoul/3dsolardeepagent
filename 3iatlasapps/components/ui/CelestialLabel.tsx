"use client";

import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";

interface CelestialLabelProps {
  position: [number, number, number];
  label: string;
  color?: string;
  fontSize?: number;
  offset?: [number, number, number];
  visible?: boolean;
}

const CelestialLabel: React.FC<CelestialLabelProps> = ({
  position,
  label,
  color = "#ffffff",
  fontSize = 0.5,
  offset = [0, 1, 0],
  visible = true,
}) => {
  const textRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (textRef.current && visible) {
      // Make the text always face the camera
      textRef.current.lookAt(camera.position);
    }
  });

  if (!visible) return null;

  const [x, y, z] = position;
  const [offsetX, offsetY, offsetZ] = offset;

  return (
    <Text
      ref={textRef}
      position={[x + offsetX, y + offsetY, z + offsetZ]}
      color={color}
      fontSize={fontSize}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor="#000000"
    >
      {label}
    </Text>
  );
};

export default CelestialLabel;
