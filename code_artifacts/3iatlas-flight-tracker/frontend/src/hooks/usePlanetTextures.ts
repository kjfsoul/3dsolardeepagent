// src/hooks/usePlanetTextures.ts
import { fetchPlanetTextures, PlanetTextureSet } from "@/utils/planetTextures";
import { useEffect, useState } from "react";
import type * as THREE from "three";

export function usePlanetTextures(name: string) {
  const [textures, setTextures] = useState<PlanetTextureSet>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);

    fetchPlanetTextures(name).then((set) => {
      if (!alive) return;
      console.log(`Loaded textures for ${name}:`, set);
      setTextures(set);
      setIsLoading(false);
    });

    return () => {
      alive = false;
      setIsLoading(false);
    };
  }, [name]);

  return {
    ...textures,
    isLoading,
  } as {
    map?: THREE.Texture | null;
    normal?: THREE.Texture | null;
    clouds?: THREE.Texture | null;
    rings?: THREE.Texture | null;
    isLoading: boolean;
  };
}
