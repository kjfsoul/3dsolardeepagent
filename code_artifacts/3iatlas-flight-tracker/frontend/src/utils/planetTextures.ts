// src/utils/planetTextures.ts
import * as THREE from "three";

export type PlanetTextureSet = {
  map?: THREE.Texture | null;      // surface/diffuse
  normal?: THREE.Texture | null;   // normal map (optional; Earth)
  clouds?: THREE.Texture | null;   // alpha cloud layer (Earth)
  rings?: THREE.Texture | null;    // alpha ring texture (Saturn)
};

const manager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(manager);

// resolve null if missing; set web-friendly defaults if found
function loadTextureSafe(path: string | null): Promise<THREE.Texture | null> {
  if (!path) return Promise.resolve(null);
  return new Promise((resolve) => {
    loader.load(
      path,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace; // r159+
        tex.anisotropy = 8;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        resolve(tex);
      },
      undefined,
      () => resolve(null) // swallow 404s; return null
    );
  });
}

/**
 * Filename map (put these in /public/textures/)
 * You already have most; add missing ones as needed.
 */
const FILES: Record<string, { map?: string; normal?: string; clouds?: string; rings?: string }> = {
  sun:       { map: "/textures/sun.jpg" },
  mercury:   { map: "/textures/mercury.jpg" },
  venus:     { map: "/textures/venus.jpg" },
  earth:     { map: "/textures/earth_diffuse.jpg", normal: "/textures/earth_normal.jpg", clouds: "/textures/earth_clouds.png" },
  mars:      { map: "/textures/mars.jpg" },
  jupiter:   { map: "/textures/jupiter.jpg" },
  saturn:    { map: "/textures/saturn.jpg", rings: "/textures/saturn_rings.png" },
  uranus:    { map: "/textures/uranus.jpg" },
  neptune:   { map: "/textures/neptune.jpg" },
  pluto:     { map: "/textures/pluto.jpg" },
  // small bodies (optional)
  ceres:     { map: "/textures/ceres.jpg" },
  vesta:     { map: "/textures/vesta.jpg" },
  pallas:    { map: "/textures/pallas.jpg" },
};

const cache = new Map<string, PlanetTextureSet>();

export async function fetchPlanetTextures(name: string): Promise<PlanetTextureSet> {
  const key = name.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const files = FILES[key] || {};
  const [map, normal, clouds, rings] = await Promise.all([
    loadTextureSafe(files.map ?? null),
    loadTextureSafe(files.normal ?? null),
    loadTextureSafe(files.clouds ?? null),
    loadTextureSafe(files.rings ?? null),
  ]);

  const set = { map, normal, clouds, rings };
  cache.set(key, set);
  return set;
}
