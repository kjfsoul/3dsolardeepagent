/**
 * AsteroidBelt Component
 * =============================
 * Fast instanced asteroid belt between Mars and Jupiter
 * Fixed: Proper setMatrixAt/setColorAt API (no attribute warnings)
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AsteroidBeltProps {
  count?: number;
  innerRadius?: number;
  outerRadius?: number;
  thickness?: number;
  scale?: number;
}

export function AsteroidBelt({
  count = 1200,
  innerRadius = 2.2,
  outerRadius = 3.2,
  thickness = 0.25,
  scale = 0.02,
}: AsteroidBeltProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Reuse one temp object to avoid allocations
  const tempObj = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b7b09f",
        roughness: 0.95,
        metalness: 0.0,
        emissive: "#0d0d0d",
        emissiveIntensity: 0.05,
      }),
    []
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < count; i++) {
      const r =
        innerRadius + (outerRadius - innerRadius) * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * thickness;

      const s = scale * (0.4 + Math.pow(Math.random(), 2) * 1.6);

      tempObj.position.set(r * Math.cos(theta), y, r * Math.sin(theta));
      tempObj.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      tempObj.scale.setScalar(s);
      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);

      // Per-instance color (supported API)
      const tint = 0.85 + Math.random() * 0.25; // 0.85–1.10
      tempColor.setRGB(0.73 * tint, 0.69 * tint, 0.63 * tint);
      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, innerRadius, outerRadius, thickness, scale, tempObj, tempColor]);

  useFrame((_, dt) => {
    if (meshRef.current) meshRef.current.rotation.y += dt * 0.01;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}
