/**
 * AsteroidBelt Component
 * =============================
 * Fast instanced asteroid belt between Mars and Jupiter
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface AsteroidBeltProps {
  count?: number;
  innerRadius?: number; // AU
  outerRadius?: number; // AU
  thickness?: number;   // AU (vertical)
  scale?: number;       // visual scale factor
}

export function AsteroidBelt({
  count = 1200,
  innerRadius = 2.2,
  outerRadius = 3.2,
  thickness = 0.25,
  scale = 0.02,
}: AsteroidBeltProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const { geom, mat, matrices } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 0);
    const m = new THREE.MeshStandardMaterial({
      color: '#b5ae9f',
      roughness: 0.9,
      metalness: 0.0,
      emissive: '#111111',
      emissiveIntensity: 0.05,
    });

    const mats: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
      const r = innerRadius + (outerRadius - innerRadius) * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * thickness;

      const s = scale * (0.4 + Math.pow(Math.random(), 2) * 1.6);
      
      dummy.position.set(r * Math.cos(theta), y, r * Math.sin(theta));
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      
      mats.push(dummy.matrix.clone());
    }
    return { geom: g, mat: m, matrices: mats };
  }, [count, innerRadius, outerRadius, thickness, scale]);

  // Apply instance matrices
  useMemo(() => {
    if (meshRef.current) {
      matrices.forEach((matrix, i) => {
        meshRef.current.setMatrixAt(i, matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    // gentle belt drift
    meshRef.current.rotation.y += dt * 0.01;
  });

  return (
    <instancedMesh ref={meshRef} args={[geom, mat, matrices.length]} />
  );
}

