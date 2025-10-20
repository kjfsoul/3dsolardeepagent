/**
 * Swiss Ephemeris bridge
 *
 * The original integration targeted Swiss Ephemeris, but we can satisfy the
 * contract by delegating to our Horizons-backed solar-system loader. This keeps
 * the DailyOrbitalUpdater working without introducing a new dependency.
 */

import {
  fetchSolarSystemData,
  SOLAR_SYSTEM_OBJECTS,
  type SolarSystemObjectKey,
} from './solar-system-data';
import { type VectorData } from './horizons-api';

type SolarSystemResult = Record<string, VectorData[]>;

const DEFAULT_OBJECTS: string[] = [
  'atlas',
  'sun',
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
];

async function getAllSolarSystemData(
  startDate: string,
  endDate: string,
  stepSize: string = '6h',
  objects: string[] = DEFAULT_OBJECTS,
): Promise<SolarSystemResult> {
  const recognizedObjects = objects.filter(
    (key): key is SolarSystemObjectKey => key in SOLAR_SYSTEM_OBJECTS,
  );

  const results = await fetchSolarSystemData(
    recognizedObjects,
    startDate,
    endDate,
    stepSize,
  );

  if (objects.includes('sun')) {
    results.sun = generateStaticSunVectors(startDate, endDate, stepSize);
  }

  return results;
}

function generateStaticSunVectors(
  startDate: string,
  endDate: string,
  stepSize: string,
): VectorData[] {
  const vectors: VectorData[] = [];
  const stepHours = parseStepHours(stepSize);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalHours =
    (end.getTime() - start.getTime()) / (1000 * 60 * 60) || stepHours;
  const steps = Math.max(1, Math.ceil(totalHours / stepHours));

  for (let i = 0; i < steps; i++) {
    const time = new Date(start.getTime() + i * stepHours * 60 * 60 * 1000);
    vectors.push({
      jd: time.getTime() / (1000 * 60 * 60 * 24) + 2440587.5,
      date: time.toISOString(),
      position: { x: 0, y: 0, z: 0 },
      velocity: { vx: 0, vy: 0, vz: 0 },
    });
  }

  return vectors;
}

function parseStepHours(stepSize: string): number {
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

export const swissEphemerisCalculator = {
  getAllSolarSystemData,
};

export type SwissEphemerisCalculator = typeof swissEphemerisCalculator;
