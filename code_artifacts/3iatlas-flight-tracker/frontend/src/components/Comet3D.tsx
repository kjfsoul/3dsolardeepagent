
/**
 * Comet3D Component
 * =============================
 * 3D model of 3I/ATLAS with nucleus and tail
 * Tail points away from the Sun (solar wind), not opposite velocity
 */

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeBufferGeometries } from "three-stdlib";

interface Comet3DProps {
  position: [number, number, number];
  velocity: [number, number, number]; // kept for telemetry (not used for tail)
  scale?: number;
  tailLength?: number;
  sunPosition?: [number, number, number]; // NEW: world pos of Sun (0,0,0 in your scene)
}

export function Comet3D({
  position,
  velocity: _velocity, // kept for telemetry (not used for tail)
  scale = 0.3,
  tailLength = 2.0,
  sunPosition = [0, 0, 0],
}: Comet3DProps) {
  const groupRef = useRef<THREE.Group>(null!);

  // Build a single geometry: elongated ellipsoid + open cone
  const mergedGeo = useMemo(() => {
    const head = new THREE.SphereGeometry(scale * 0.8, 24, 24);
    // make it slightly ellipsoidal
    head.scale(1.0, 1.2, 1.0);

    const tail = new THREE.ConeGeometry(scale * 0.42, tailLength * 0.9, 24, 1, true);
    // shift tail so it attaches behind the head
    tail.translate(0, -tailLength * 0.45, 0);
    // rotate to align with +Y forward (we'll orient group later)
    tail.rotateX(Math.PI / 2);

    const g = mergeBufferGeometries([head, tail], true)!;
    return g;
  }, [scale, tailLength]);

  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#e6f1ff'),
      emissive: new THREE.Color('#bcdcff'),
      emissiveIntensity: 0.35,
      roughness: 0.4,
      transmission: 0.0,
      transparent: true,
      opacity: 0.95,
    });
    return m;
  }, []);

  // tiny particle glow for tail (cheap)
  const tailGlow = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 180;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const t = Math.random();
      const r = (1 - t) * scale * 0.6;
      const ang = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = r * Math.cos(ang);
      positions[i * 3 + 1] = -t * tailLength; // stretch back
      positions[i * 3 + 2] = r * Math.sin(ang);
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({
      size: scale * 0.1,
      color: '#d6ecff',
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Points(g, m);
  }, [scale, tailLength]);

  // orient by vector from Sun → comet (tail points away from Sun)
  useFrame(() => {
    if (!groupRef.current) return;
    const comet = new THREE.Vector3(...position);
    const sun = new THREE.Vector3(...sunPosition);
    const awayFromSun = comet.clone().sub(sun).normalize();
    // lookAt along the tail direction (back of the comet)
    groupRef.current.lookAt(comet.clone().add(awayFromSun));
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={mergedGeo} material={mat} />
      <primitive object={tailGlow} />
      <Text
        position={[0, scale * 1.8, 0]}
        fontSize={Math.max(0.12, scale * 0.5)}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        3I/ATLAS
      </Text>
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
