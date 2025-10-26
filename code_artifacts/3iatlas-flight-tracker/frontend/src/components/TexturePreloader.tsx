/**
 * TexturePreloader Component
 * =============================
 * Preloads all planet textures on mount to ensure they're available immediately
 */

import { useEffect } from 'react';
import * as THREE from 'three';

const PLANET_TEXTURES = [
  '/textures/sun.jpg',
  '/textures/mercury.jpg',
  '/textures/venus.jpg',
  '/textures/earth_diffuse.jpg',
  '/textures/earth_normal.jpg',
  '/textures/earth_clouds.png',
  '/textures/mars.jpg',
  '/textures/jupiter.jpg',
  '/textures/saturn.jpg',
  '/textures/saturn_rings.png',
  '/textures/uranus.jpg',
  '/textures/neptune.jpg',
  '/textures/pluto.jpg',
  '/textures/ceres.jpg',
  '/textures/vesta.jpg',
  '/textures/pallas.jpg',
];

export function TexturePreloader() {
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let loadedCount = 0;
    const totalCount = PLANET_TEXTURES.length;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalCount) {
        console.log('All textures preloaded successfully');
      }
    };

    const onError = (url: string) => {
      console.warn(`Failed to preload texture: ${url}`);
      loadedCount++;
      if (loadedCount === totalCount) {
        console.log('Texture preloading completed (some failed)');
      }
    };

    // Start preloading all textures
    PLANET_TEXTURES.forEach(url => {
      loader.load(url, onLoad, undefined, () => onError(url));
    });
  }, []);

  return null; // This component doesn't render anything
}
