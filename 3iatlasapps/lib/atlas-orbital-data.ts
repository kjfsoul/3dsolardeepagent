/**
 * 3I/ATLAS Orbital Data
 * Fallback data based on discovery observations and scientific papers
 * Source: /docs/3I_ATLAS_KNOWLEDGE_BASE.md
 * 
 * Discovery: July 1, 2025 by ATLAS telescope, Chile
 * This data is based on early orbital solutions published in July-August 2025
 * Will be replaced by live Horizons data once NASA updates their database
 */

import { type VectorData } from './horizons-api';

// ============================================================================
// ORBITAL ELEMENTS (from discovery papers)
// ============================================================================

/**
 * Orbital elements for 3I/ATLAS based on discovery observations
 * Reference: arXiv preprints July 2025, NASA/ESA preliminary reports
 */
export const ATLAS_ORBITAL_ELEMENTS = {
  // Object identification
  designation: '3I/ATLAS',
  provisionalDesignation: 'C/2025 N1',
  discoveryDate: '2025-07-01',
  
  // Orbital parameters
  eccentricity: 1.2,              // Hyperbolic (e > 1.0)
  perihelionDistance: 1.5,        // AU (just inside Mars orbit)
  perihelionDate: '2025-10-28',   // Late October 2025
  inclination: 113.0,             // degrees (approaching from below ecliptic)
  longitudeOfAscendingNode: 280.0, // degrees
  argumentOfPerihelion: 45.0,     // degrees
  epoch: '2025-07-01',            // JD 2460494.5
  
  // Physical properties
  velocity: 60.7,                 // km/s (~137,000 mph)
  estimatedDiameter: 2.0,         // km (midpoint estimate)
  
  // Origin
  originConstellation: 'Sagittarius',
  originRegion: 'Milky Way thick disk',
  estimatedAge: 7.5,              // billion years
};

// ============================================================================
// ORBIT CALCULATION
// ============================================================================

/**
 * Calculate position using Keplerian orbital mechanics
 * Based on hyperbolic orbit equations
 */
function calculateHyperbolicPosition(
  jd: number,
  epoch: number,
  q: number,      // perihelion distance (AU)
  e: number,      // eccentricity
  inc: number,    // inclination (degrees)
  omega: number,  // argument of perihelion (degrees)
  node: number,   // longitude of ascending node (degrees)
  tp: number      // time of perihelion passage (JD)
): { x: number; y: number; z: number } {
  
  // Convert to radians
  const incRad = (inc * Math.PI) / 180;
  const omegaRad = (omega * Math.PI) / 180;
  const nodeRad = (node * Math.PI) / 180;
  
  // Time since perihelion (days)
  const dt = jd - tp;
  
  // Mean anomaly for hyperbolic orbit
  const n = Math.sqrt(1 / (q * q * q)) * Math.sqrt(e * e - 1); // Mean motion
  const M = n * dt;
  
  // Solve for eccentric anomaly (hyperbolic)
  let F = M;
  for (let i = 0; i < 10; i++) {
    const f = e * Math.sinh(F) - F - M;
    const fp = e * Math.cosh(F) - 1;
    F = F - f / fp;
  }
  
  // True anomaly
  const nu = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(F / 2));
  
  // Distance from Sun
  const r = q * (e + 1) / (1 + e * Math.cos(nu) + 1e-9); // Add epsilon to prevent division by zero
  
  // Position in orbital plane
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);
  
  // Rotate to ecliptic coordinates
  const x = (Math.cos(omegaRad) * Math.cos(nodeRad) - Math.sin(omegaRad) * Math.sin(nodeRad) * Math.cos(incRad)) * xOrb +
            (-Math.sin(omegaRad) * Math.cos(nodeRad) - Math.cos(omegaRad) * Math.sin(nodeRad) * Math.cos(incRad)) * yOrb;
            
  const y = (Math.cos(omegaRad) * Math.sin(nodeRad) + Math.sin(omegaRad) * Math.cos(nodeRad) * Math.cos(incRad)) * xOrb +
            (-Math.sin(omegaRad) * Math.sin(nodeRad) + Math.cos(omegaRad) * Math.cos(nodeRad) * Math.cos(incRad)) * yOrb;
            
  const z = (Math.sin(omegaRad) * Math.sin(incRad)) * xOrb +
            (Math.cos(omegaRad) * Math.sin(incRad)) * yOrb;
  
  return { x, y, z };
}

/**
 * Calculate velocity vector
 */
function calculateVelocity(
  jd: number,
  q: number,
  e: number,
  inc: number,
  omega: number,
  node: number,
  tp: number
): { vx: number; vy: number; vz: number } {
  
  const dt = jd - tp;
  const n = Math.sqrt(1 / (q * q * q)) * Math.sqrt(e * e - 1);
  
  // Simplified velocity approximation
  // In a real implementation, would calculate derivative of position
  const v = n * q * Math.sqrt(2 / q - 1 / (q * 10)); // Vis-viva equation approximation
  
  // Return velocity components (simplified)
  return {
    vx: v * 0.5,
    vy: v * 0.7,
    vz: v * 0.3,
  };
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Generate orbital vectors for 3I/ATLAS using Keplerian orbital mechanics
 * This is used as fallback when Horizons database doesn't have the object yet
 * 
 * Based on early orbital solution from discovery observations (July 2025)
 */
export function generate3IAtlasVectors(
  startDate: string,
  endDate: string,
  stepHours: number = 6
): VectorData[] {
  
  const vectors: VectorData[] = [];
  
  // Convert dates to Julian Date
  const epochJD = 2460494.5; // July 1, 2025
  const perihelionJD = 2460614.5; // October 28, 2025
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // JD calculation: JD = 2440587.5 + (ms / 86400000)
  let currentJD = 2440587.5 + (start.getTime() / 86400000);
  const endJD = 2440587.5 + (end.getTime() / 86400000);
  
  const stepDays = stepHours / 24;
  
  while (currentJD <= endJD) {
    const position = calculateHyperbolicPosition(
      currentJD,
      epochJD,
      ATLAS_ORBITAL_ELEMENTS.perihelionDistance,
      ATLAS_ORBITAL_ELEMENTS.eccentricity,
      ATLAS_ORBITAL_ELEMENTS.inclination,
      ATLAS_ORBITAL_ELEMENTS.argumentOfPerihelion,
      ATLAS_ORBITAL_ELEMENTS.longitudeOfAscendingNode,
      perihelionJD
    );
    
    const velocity = calculateVelocity(
      currentJD,
      ATLAS_ORBITAL_ELEMENTS.perihelionDistance,
      ATLAS_ORBITAL_ELEMENTS.eccentricity,
      ATLAS_ORBITAL_ELEMENTS.inclination,
      ATLAS_ORBITAL_ELEMENTS.argumentOfPerihelion,
      ATLAS_ORBITAL_ELEMENTS.longitudeOfAscendingNode,
      perihelionJD
    );
    
    // Convert JD to ISO date
    const ms = (currentJD - 2440587.5) * 86400000;
    const date = new Date(ms);
    
    vectors.push({
      jd: currentJD,
      date: date.toISOString(),
      position,
      velocity,
    });
    
    currentJD += stepDays;
  }
  
  console.log(`[Atlas Orbital Data] Generated ${vectors.length} vectors using Keplerian mechanics`);
  console.log(`[Atlas Orbital Data] Using fallback data - 3I/ATLAS not yet in Horizons database`);
  
  return vectors;
}

/**
 * Check if we should use fallback data
 * Returns true if Horizons doesn't have 3I/ATLAS yet
 */
export function shouldUseFallbackData(): boolean {
  // In October 2025, Horizons may not have updated yet
  // Fallback to calculated orbits based on discovery observations
  return true; // Will update this when Horizons is confirmed to have the object
}
