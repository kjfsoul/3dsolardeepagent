// src/hooks/usePlanetTextures.ts
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

type TextureRecord = {
  map?: string;
  normal?: string;
  clouds?: string;
  rings?: string;
};

const FILES: Record<string, TextureRecord> = {
  sun: { map: "/textures/sun.jpg" },
  mercury: { map: "/textures/mercury.jpg" },
  venus: { map: "/textures/venus.jpg" },
  earth: {
    map: "/textures/earth_diffuse.jpg",
    normal: "/textures/earth_normal.jpg",
    clouds: "/textures/earth_clouds.png",
  },
  mars: { map: "/textures/mars.jpg" },
  jupiter: { map: "/textures/jupiter.jpg" },
  saturn: { map: "/textures/saturn.jpg", rings: "/textures/saturn_rings.png" },
  uranus: { map: "/textures/uranus.jpg" },
  neptune: { map: "/textures/neptune.jpg" },
  pluto: { map: "/textures/pluto.jpg" },
  ceres: { map: "/textures/ceres.jpg" },
  vesta: { map: "/textures/vesta.jpg" },
  pallas: { map: "/textures/pallas.jpg" },
};

type PlanetTextureSet = {
  map?: THREE.Texture | null;
  normal?: THREE.Texture | null;
  clouds?: THREE.Texture | null;
  rings?: THREE.Texture | null;
  isLoading: boolean;
};

const EMPTY_SET: PlanetTextureSet = { isLoading: false };

export function usePlanetTextures(name: string): PlanetTextureSet {
  const key = name.toLowerCase();
  const files = FILES[key];

  if (!files) {
    return EMPTY_SET;
  }

  const entries = (Object.entries(files) as Array<[keyof TextureRecord, string]>).map(
    ([slot, url]) => ({ slot, url })
  );

  const textures = useLoader(
    TextureLoader,
    entries.map((entry) => entry.url),
    (loader) => {
      loader.setCrossOrigin?.("anonymous");
    }
  );

  const result: PlanetTextureSet = { isLoading: false };

  entries.forEach(({ slot }, index) => {
    const tex = textures[index];
    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      if (slot === "rings") {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
      } else {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
      }

      if (slot === "map") result.map = tex;
      if (slot === "normal") result.normal = tex;
      if (slot === "clouds") result.clouds = tex;
      if (slot === "rings") result.rings = tex;
    }
  });

  return result;
}
