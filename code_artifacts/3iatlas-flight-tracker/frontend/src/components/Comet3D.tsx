/**
 * Comet3D Component
 * =============================
 * 3D model of 3I/ATLAS with nucleus and tail
 * Tail points away from the Sun (solar wind), not opposite velocity
 */

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

interface Comet3DProps {
  position: [number, number, number];
  velocity: [number, number, number]; // kept for telemetry if you want later
  scale?: number;
  tailLength?: number;
  sunPosition?: [number, number, number];
}

export function Comet3D({
  position,
  velocity: _velocity,
  scale = 0.3,
  tailLength = 2.0,
  sunPosition = [0, 0, 0],
}: Comet3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const geom = useMemo(() => {
    const head = new THREE.SphereGeometry(scale * 0.8, 24, 24);
    head.scale(1.0, 1.12, 1.25); // ellipsoid

    const tail = new THREE.ConeGeometry(scale * 0.45, tailLength, 24, 1, true);
    tail.translate(0, -tailLength * 0.5, 0);
    tail.rotateX(Math.PI / 2);

    const merged = BufferGeometryUtils.mergeGeometries([head, tail], true)!;
    merged.computeVertexNormals();
    return merged;
  }, [scale, tailLength]);

  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#cfe8ff",
        emissive: "#a9d0ff",
        emissiveIntensity: 0.28,
        roughness: 0.35,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Align tail AWAY from Sun (solar radiation), not opposite velocity
  useFrame(() => {
    if (!groupRef.current) return;
    const comet = new THREE.Vector3(...position);
    const sun = new THREE.Vector3(...sunPosition);
    const awayFromSun = comet.clone().sub(sun).normalize();
    groupRef.current.lookAt(comet.clone().add(awayFromSun));

    // Distance-reactive emissive intensity (near Sun = brighter)
    const dist = Math.max(0.2, comet.distanceTo(sun));
    const mesh = groupRef.current.children[0] as THREE.Mesh;
    const m = mesh.material as THREE.MeshPhysicalMaterial;
    m.emissiveIntensity = THREE.MathUtils.clamp(2 / dist, 0.25, 1.25);
  });

  // Very cheap dust particles
  const dust = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 160;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const t = Math.random();
      const r = (1 - t) * scale * 0.6;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = r * Math.cos(a);
      positions[i * 3 + 1] = -t * tailLength;
      positions[i * 3 + 2] = r * Math.sin(a);
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({
      size: scale * 0.09,
      color: "#d6ecff",
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Points(g, m);
  }, [scale, tailLength]);

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={geom} material={mat} />

      {/* Inner glow core */}
      <mesh>
        <sphereGeometry args={[scale * 0.6, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <primitive object={dust} />
      <Billboard
        follow
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, scale * 2.0, 0]}
      >
        <Text
          fontSize={Math.max(0.12, scale * 0.5)}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000"
        >
          3I/ATLAS
        </Text>
      </Billboard>
    </group>
  );
}

/**
 * HighlightGlow Component
 * =============================
 * Perihelion glow effect (activated during perihelion event)
 */

interface HighlightGlowProps {
  position: [number, number, number];
  intensity?: number;
  visible?: boolean;
}

export function HighlightGlow({
  position,
  intensity = 5.0,
  visible = false,
}: HighlightGlowProps) {
  if (!visible) return null;

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Middle glow */}
      <mesh>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshBasicMaterial
          color="#ffdd00"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Point light for illumination */}
      <pointLight color="#ffaa00" intensity={intensity} distance={5} />
    </group>
  );
}
