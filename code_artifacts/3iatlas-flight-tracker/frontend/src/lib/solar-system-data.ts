/**
 * Solar System Data Integration - Tracker Version
 * Simplified version for the Vite tracker project
 */

import { type VectorData } from '@/types/trajectory';
import { get3IAtlasVectors, getEphemerisVectors, parseVectorData, type HorizonsQueryParams } from './horizons-api';

// ============================================================================
// SOLAR SYSTEM OBJECTS (NASA Horizons COMMAND codes)
// ============================================================================

export const SOLAR_SYSTEM_OBJECTS = {
  // Inner Planets
  mercury: { command: '199', name: 'Mercury', color: 0x8c7853, size: 0.025 },
  venus: { command: '299', name: 'Venus', color: 0xffc649, size: 0.038 },
  earth: { command: '399', name: 'Earth', color: 0x2266ff, size: 0.04 },
  mars: { command: '499', name: 'Mars', color: 0xff6644, size: 0.034 },

  // Outer Planets
  jupiter: { command: '599', name: 'Jupiter', color: 0xd4a574, size: 0.12 },
  saturn: { command: '699', name: 'Saturn', color: 0xfad5a5, size: 0.10 },
  uranus: { command: '799', name: 'Uranus', color: 0x4fd0e7, size: 0.07 },
  neptune: { command: '899', name: 'Neptune', color: 0x4166f5, size: 0.07 },

  // Dwarf Planets
  pluto: { command: '999', name: 'Pluto', color: 0xccaa88, size: 0.02 },

  // 3I/ATLAS
  atlas: { command: '1004083', name: '3I/ATLAS', color: 0x00ff88, size: 0.06 },
};

export type SolarSystemObjectKey = keyof typeof SOLAR_SYSTEM_OBJECTS;

// ============================================================================
// FETCH MULTIPLE OBJECTS FROM HORIZONS
// ============================================================================

/**
 * Fetch position data for multiple objects at once
 * Returns synchronized timeline for all objects
 */
export async function fetchSolarSystemData(
  objects: SolarSystemObjectKey[],
  startDate: string,
  endDate: string,
  stepSize: string = "6h"
): Promise<Record<string, VectorData[]>> {
  const results: Record<string, VectorData[]> = {};
  const stepHours = normalizeStepHours(stepSize);

  await Promise.all(
    objects.map((objKey) =>
      loadObjectData({
        objKey,
        startDate,
        endDate,
        stepHours,
        results,
      })
    )
  );

  return results;
}

interface LoadObjectParams {
  objKey: SolarSystemObjectKey;
  startDate: string;
  endDate: string;
  stepHours: number;
  results: Record<string, VectorData[]>;
}

async function loadObjectData({
  objKey,
  startDate,
  endDate,
  stepHours,
  results,
}: LoadObjectParams): Promise<void> {
  const obj = SOLAR_SYSTEM_OBJECTS[objKey];
  if (!obj) return;

  try {
    console.log(`[Solar System] 🌌 Fetching real NASA data for ${obj.name}...`);
    
    let vectors: VectorData[] = [];
    
    if (objKey === 'atlas') {
      // Special handling for 3I/ATLAS - use the dedicated function
      vectors = await get3IAtlasVectors(startDate, endDate, `${stepHours}h`);
    } else {
      // Standard planets - use direct command
      const stepSize = `${stepHours}h`;
      const ephemerisParams: HorizonsQueryParams = {
        COMMAND: obj.command,
        EPHEM_TYPE: 'VECTOR',
        CENTER: '@sun',
        START_TIME: startDate,
        STOP_TIME: endDate,
        STEP_SIZE: stepSize,
        format: 'json',
        OUT_UNITS: 'AU-D',
        REF_SYSTEM: 'ICRF',
        VEC_TABLE: '2',
        OBJ_DATA: 'YES',
      };

      const response = await getEphemerisVectors(ephemerisParams);
      vectors = parseVectorData(response.result);
    }
    
    if (vectors.length > 0) {
      results[objKey] = vectors;
      console.log(
        `[Solar System] ✅ Got ${vectors.length} real positions for ${obj.name} from NASA Horizons`
      );
    } else {
      throw new Error('No data returned from NASA Horizons');
    }
  } catch (error) {
    console.warn(`[Solar System] ⚠️ NASA Horizons failed for ${obj.name}, using fallback:`, error);
    
    // Fallback to generated data if NASA API fails
    const fallbackData = createMinimalFallbackData(
      objKey,
      startDate,
      endDate,
      stepHours
    );
    if (fallbackData.length > 0) {
      results[objKey] = fallbackData;
      console.log(
        `[Solar System] ✅ Generated ${fallbackData.length} fallback positions for ${obj.name}`
      );
    }
  }
}

function normalizeStepHours(stepSize: string): number {
  if (stepSize.endsWith('h')) {
    const value = parseInt(stepSize.slice(0, -1), 10);
    return Number.isFinite(value) && value > 0 ? value : 6;
  }

  if (stepSize.endsWith('d')) {
    const value = parseInt(stepSize.slice(0, -1), 10);
    return Number.isFinite(value) && value > 0 ? value * 24 : 24;
  }

  const numeric = parseInt(stepSize, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 6;
}

// ============================================================================
// FALLBACK DATA GENERATION
// ============================================================================

/**
 * Create minimal fallback data for objects when NASA API fails
 */
function createMinimalFallbackData(
  objectKey: SolarSystemObjectKey,
  startDate: string,
  endDate: string,
  stepHours: number
): VectorData[] {
  const obj = SOLAR_SYSTEM_OBJECTS[objectKey];
  if (!obj) return [];

  // Realistic orbital positions with proper periods
  const orbitalData: Record<string, { distance: number; period: number; phase: number }> = {
    mercury: { distance: 0.39, period: 88, phase: 0 },      // 88 days
    venus: { distance: 0.72, period: 225, phase: Math.PI/3 }, // 225 days
    earth: { distance: 1.0, period: 365, phase: Math.PI/2 },  // 365 days
    mars: { distance: 1.52, period: 687, phase: Math.PI },    // 687 days
    jupiter: { distance: 5.2, period: 4333, phase: Math.PI/4 }, // 4333 days
    saturn: { distance: 9.5, period: 10759, phase: Math.PI/6 }, // 10759 days
    uranus: { distance: 19.2, period: 30687, phase: Math.PI/8 },
    neptune: { distance: 30.1, period: 60190, phase: Math.PI/10 },
    pluto: { distance: 39.5, period: 90560, phase: Math.PI/12 },
    atlas: { distance: 1.5, period: 365, phase: 0 },
  };

  const orbit = orbitalData[objectKey] || { distance: 1.0, period: 365, phase: 0 };
  const hours = Number.isFinite(stepHours) && stepHours > 0 ? stepHours : 6;
  const startTime = new Date(startDate);
  const endTime = new Date(endDate);
  const totalHours =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const numSteps = Math.ceil(totalHours / hours);

  const vectors: VectorData[] = [];

  for (let i = 0; i < numSteps; i++) {
    const time = new Date(startTime.getTime() + i * hours * 60 * 60 * 1000);
    const daysSinceStart = (time.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);

    // Realistic orbital motion with proper periods
    const angle = (daysSinceStart / orbit.period) * 2 * Math.PI + orbit.phase;
    const x = orbit.distance * Math.cos(angle);
    const y = orbit.distance * Math.sin(angle);
    const z = 0; // Simplified to ecliptic plane

    // Add some orbital inclination for realism
    const inclination = Math.sin(angle * 0.1) * 0.1;
    const finalZ = z + inclination;

    vectors.push({
      jd: time.getTime() / (1000 * 60 * 60 * 24) + 2440587.5, // Convert to Julian Date
      date: time.toISOString(),
      position: { x, y, z: finalZ },
      velocity: { x: 0, y: 0, z: 0 }, // Simplified
    });
  }

  return vectors;
}
