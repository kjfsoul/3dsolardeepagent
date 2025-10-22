// src/hooks/usePlanetTextures.ts
import { fetchPlanetTextures, PlanetTextureSet } from "@/utils/planetTextures";
import { useEffect, useState } from "react";
import type * as THREE from "three";

export function usePlanetTextures(name: string) {
  const [textures, setTextures] = useState<PlanetTextureSet>({});

  useEffect(() => {
    let alive = true;
    fetchPlanetTextures(name).then((set) => {
      if (!alive) return;
      setTextures(set);
    });
    return () => { alive = false; };
  }, [name]);

  return textures as {
    map?: THREE.Texture | null;
    normal?: THREE.Texture | null;
    clouds?: THREE.Texture | null;
    rings?: THREE.Texture | null;
  };
}
