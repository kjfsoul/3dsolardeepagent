// src/components/SunTextured.tsx
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";

type ViewMode = "explorer" | "true-scale" | "ride-atlas";

export function SunTextured({
  radius = 2.0,
  viewMode = "explorer",
}: {
  radius?: number;
  viewMode?: ViewMode;
}) {
  // textures: add these to /public/textures (any good CC0 solar textures work)
  // - sun_color.jpg (albedo)
  // - sun_emissive.jpg (bright areas)
  // - corona.png (soft radial sprite)
  const [colorMap, emissiveMap, coronaMap] = useTexture([
    "/textures/sun_color.jpg",
    "/textures/sun_emissive.jpg",
    "/textures/corona.png",
  ]);
  const coreRef = useRef<THREE.Mesh>(null!);
  const surfaceRef = useRef<THREE.Mesh>(null!);
  const coronaRef = useRef<THREE.Sprite>(null!);

  // Dim for true-scale / ride modes
  const brightness =
    viewMode === "true-scale" ? 0.35 : viewMode === "ride-atlas" ? 0.18 : 1.0;

  // Slow texture drift to avoid "static ball" look
  useFrame((_, dt) => {
    const t = (performance.now() * 0.00003) % 1;
    if (surfaceRef.current) {
      const mat = surfaceRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        1.5 * brightness,
        0.05
      );
    }
    if (coreRef.current) coreRef.current.rotation.y += dt * 0.02;
    if (coronaRef.current)
      coronaRef.current.material.rotation = t * Math.PI * 2;
  });

  // Corona sprite material
  const coronaMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: coronaMap,
        color: new THREE.Color("#ffaa33"),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: viewMode === "true-scale" ? 0.18 : 0.35,
      }),
    [coronaMap, viewMode]
  );

  return (
    <group>
      {/* Hot white core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[radius * 0.7, 64, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          opacity={0.9 * brightness}
          transparent
        />
      </mesh>

      {/* Granular surface with emissive */}
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[radius, 96, 96]} />
        <meshPhysicalMaterial
          map={colorMap}
          emissiveMap={emissiveMap}
          emissive={"#ff7a00"}
          emissiveIntensity={1.2 * brightness}
          roughness={0.6}
          metalness={0}
          clearcoat={0.3}
        />
      </mesh>

      {/* Additive corona sprite (billboard) */}
      <sprite ref={coronaRef} scale={[radius * 3.2, radius * 3.2, 1]}>
        <primitive object={coronaMat} attach="material" />
      </sprite>

      {/* Real light for scene */}
      <pointLight
        color="#fff6e0"
        intensity={28 * brightness}
        distance={0}
        decay={2}
      />
    </group>
  );
}
