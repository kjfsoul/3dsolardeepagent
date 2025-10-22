// src/hooks/usePlanetTextures.ts
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function usePlanetTextures(name: string) {
  const nl = name.toLowerCase();
  
  // Use Suspense-aware useTexture for immediate loading
  const map = useTexture(`/textures/${nl}.jpg`);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const normal = nl === 'earth'
    ? useTexture('/textures/earth_normal.jpg')
    : null;
  if (normal) { 
    normal.colorSpace = THREE.SRGBColorSpace; 
    normal.anisotropy = 8; 
  }

  const clouds = nl === 'earth'
    ? useTexture('/textures/earth_clouds.png')
    : null;
  if (clouds) clouds.anisotropy = 8;

  const rings = nl === 'saturn'
    ? useTexture('/textures/saturn_rings.png')
    : null;
  if (rings) rings.anisotropy = 8;

  return { map, normal, clouds, rings };
}
