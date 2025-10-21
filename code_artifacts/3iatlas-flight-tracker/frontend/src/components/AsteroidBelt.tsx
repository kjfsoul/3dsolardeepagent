/**
 * AsteroidBelt Component
 * =============================
 * Fast instanced asteroid belt between Mars and Jupiter
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

  const { geom, mat, matrices } = useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: "#b5ae9f",
      roughness: 0.9,
      metalness: 0.0,
      emissive: "#111",
      emissiveIntensity: 0.05,
    });

    const matrices: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const r = innerRadius + (outerRadius - innerRadius) * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * thickness;
      const s = scale * (0.4 + Math.pow(Math.random(), 2) * 1.6);

      const pos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
      const rot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const quat = new THREE.Quaternion().setFromEuler(rot);
      const sc = new THREE.Vector3(s, s, s);
      matrices.push(new THREE.Matrix4().compose(pos, quat, sc));
    }
    return { geom, mat, matrices };
  }, [count, innerRadius, outerRadius, thickness, scale]);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    for (let i = 0; i < matrices.length; i++) m.setMatrixAt(i, matrices[i]);
    m.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  useFrame((_, dt) => {
    if (meshRef.current) meshRef.current.rotation.y += dt * 0.01;
  });

  return <instancedMesh ref={meshRef} args={[geom, mat, matrices.length]} />;
}
