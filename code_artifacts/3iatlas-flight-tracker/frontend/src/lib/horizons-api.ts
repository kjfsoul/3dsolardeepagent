/**
 * NASA Horizons API Integration
 * Real-time ephemeris data for 3I/ATLAS
 *
 * API Documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
 * No authentication required for Horizons APIs
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface VectorData {
  jd: number;           // Julian Date
  date: string;         // ISO 8601 date string
  position: {
    x: number;          // X coordinate in AU
    y: number;          // Y coordinate in AU
    z: number;          // Z coordinate in AU
  };
  velocity: {
    x: number;          // X velocity in AU/day
    y: number;          // Y velocity in AU/day
    z: number;          // Z velocity in AU/day
  };
}

export interface HorizonsLookupResult {
  count: number;
  signature: {
    source: string;
    version: string;
  };
  result?: Array<{
    name: string;
    type: string;
    pdes: string | null;
    spkid: string;
    alias: string[];
  }>;
}

export interface HorizonsQueryParams {
  COMMAND: string;
  EPHEM_TYPE: 'VECTOR' | 'OBSERVER';
  CENTER: string;
  START_TIME: string;
  STOP_TIME: string;
  STEP_SIZE: string;
  format: 'json' | 'text';
  OUT_UNITS?: 'AU-D' | 'KM-S';
  REF_SYSTEM?: 'ICRF' | 'J2000';
  VEC_TABLE?: '1' | '2' | '3';
  CSV_FORMAT?: 'YES' | 'NO';
  OBJ_DATA?: 'YES' | 'NO';
}

export interface HorizonsResponse {
  signature: {
    source: string;
    version: string;
  };
  result: string[];
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Use the main 3iatlas repo's API routes (they're working!)
const HORIZONS_LOOKUP_ENDPOINT = 'https://3iatlas.vercel.app/api/horizons/lookup';
const HORIZONS_MAIN_ENDPOINT = 'https://3iatlas.vercel.app/api/horizons/ephemeris';

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class HorizonsAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiResponse?: unknown
  ) {
    super(message);
    this.name = 'HorizonsAPIError';
  }
}

// ============================================================================
// CACHING LAYER
// ============================================================================

/**
 * In-memory cache to avoid unnecessary API calls
 * Cache expires after 7 days (604800000 ms)
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const horizonsCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = horizonsCache.get(key);
  if (!entry) return null;

  // Check if cache expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    horizonsCache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  horizonsCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Look up an object in the Horizons database by name or designation
 * Returns SPK-ID and aliases
 */
export async function lookupObject(
  searchString: string,
  group?: "ast" | "com" | "pln" | "sat" | "sct" | "mb" | "sb"
): Promise<HorizonsLookupResult> {
  // Check cache first
  const cacheKey = `lookup:${searchString}:${group || "all"}`;
  const cached = getCached<HorizonsLookupResult>(cacheKey);
  if (cached) return cached;
  const params = new URLSearchParams({
    sstr: searchString,
    format: "json",
  });

  if (group) {
    params.append("group", group);
  }

  const url = `${HORIZONS_LOOKUP_ENDPOINT}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new HorizonsAPIError(
        `Horizons Lookup API returned status ${response.status}`,
        response.status
      );
    }

    const data: HorizonsLookupResult = await response.json();

    // Cache the result
    setCache(cacheKey, data);

    return data;
  } catch (error) {
    if (error instanceof HorizonsAPIError) {
      throw error;
    }
    throw new HorizonsAPIError(
      `Failed to lookup object "${searchString}": ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get ephemeris vectors for an object from Horizons
 * Returns position and velocity data over specified time range
 */
export async function getEphemerisVectors(
  params: HorizonsQueryParams
): Promise<HorizonsResponse> {
  // Check cache first
  const cacheKey = `ephemeris:${params.COMMAND}:${params.START_TIME}:${params.STOP_TIME}:${params.STEP_SIZE}`;
  const cached = getCached<HorizonsResponse>(cacheKey);
  if (cached) return cached;

  const queryParams = new URLSearchParams();

  // Add all parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });

  const url = `${HORIZONS_MAIN_ENDPOINT}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new HorizonsAPIError(
        `Horizons API returned status ${response.status}`,
        response.status
      );
    }

    const data: HorizonsResponse = await response.json();

    // Cache the result
    setCache(cacheKey, data);

    return data;
  } catch (error) {
    if (error instanceof HorizonsAPIError) {
      throw error;
    }
    throw new HorizonsAPIError(
      `Failed to fetch ephemeris data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ============================================================================
// DATA PARSING
// ============================================================================

/**
 * Parse Horizons vector output into structured data
 * Handles both VEC_TABLE=2 (position + velocity) format
 */
export function parseVectorData(horizonsResult: string[]): VectorData[] {
  const vectors: VectorData[] = [];
  const resultText = horizonsResult.join('\n');
  const lines = resultText.split('\n');

  let inDataSection = false;
  let currentJD = 0;
  let currentDate = '';
  let currentPosition: { x: number; y: number; z: number } | null = null;

  for (const line of lines) {
    // Start of data section
    if (line.includes('$$SOE')) {
      inDataSection = true;
      continue;
    }

    // End of data section
    if (line.includes('$$EOE')) {
      break;
    }

    if (!inDataSection) continue;

    // Parse Julian Date and calendar date
    // Format: "2459854.500000000 = A.D. 2025-Oct-01 00:00:00.0000 TDB"
    const jdMatch = line.match(/^(\d+\.\d+)\s*=\s*A\.D\.\s*(.+?)\s+TDB/);
    if (jdMatch) {
      currentJD = parseFloat(jdMatch[1]);
      currentDate = jdMatch[2].trim();
      continue;
    }

    // Parse position line
    // Format: " X = 1.234567890123456E+00 Y = -2.345678901234567E+00 Z = 3.456789012345678E-01"
    const posMatch = line.match(/^\s*X\s*=\s*([\-\d.E+]+)\s+Y\s*=\s*([\-\d.E+]+)\s+Z\s*=\s*([\-\d.E+]+)/);
    if (posMatch) {
      currentPosition = {
        x: parseFloat(posMatch[1]),
        y: parseFloat(posMatch[2]),
        z: parseFloat(posMatch[3]),
      };
      continue;
    }

    // Parse velocity line
    // Format: " VX= 1.234567890123E-02 VY= 2.345678901234E-02 VZ= 3.456789012345E-03"
    const velMatch = line.match(/^\s*VX\s*=\s*([\-\d.E+]+)\s+VY\s*=\s*([\-\d.E+]+)\s+VZ\s*=\s*([\-\d.E+]+)/);
    if (velMatch && currentPosition) {
      vectors.push({
        jd: currentJD,
        date: convertHorizonsDateToISO(currentDate),
        position: currentPosition,
        velocity: {
          x: parseFloat(velMatch[1]),
          y: parseFloat(velMatch[2]),
          z: parseFloat(velMatch[3]),
        },
      });
      currentPosition = null; // Reset for next iteration
    }
  }

  return vectors;
}

/**
 * Smooth ephemeris data discontinuities for problematic date ranges
 * Interpolates position vectors for Sept 7 and Nov 14 data gaps
 */
export function smoothEphemerisData<T extends { date: string; position: { x: number; y: number; z: number } }>(vectors: T[]): T[] {
  const SMOOTH_DATES = ['2025-09-07', '2025-11-14'];

  for (let i = 1; i < vectors.length; i++) {
    const prev = vectors[i - 1];
    const curr = vectors[i];

    // Extract date portion (handle both ISO format and space-separated format)
    const prevDate = prev.date.split("T")[0].split(" ")[0];
    const currDate = curr.date.split("T")[0].split(" ")[0];

    const dx = Math.abs(curr.position.x - prev.position.x);
    const dy = Math.abs(curr.position.y - prev.position.y);
    const dz = Math.abs(curr.position.z - prev.position.z);
    const delta = Math.max(dx, dy, dz);

    // Smooth if date matches known gaps OR sudden jump detected (> 0.3 AU)
    if (
      SMOOTH_DATES.includes(prevDate) ||
      SMOOTH_DATES.includes(currDate) ||
      delta > 0.3
    ) {
      vectors[i].position.x = (curr.position.x + prev.position.x) / 2;
      vectors[i].position.y = (curr.position.y + prev.position.y) / 2;
      vectors[i].position.z = (curr.position.z + prev.position.z) / 2;
      console.warn(
        "[Horizons] Smoothed discontinuity near",
        prevDate,
        "→",
        currDate,
        `(Δ=${delta.toFixed(3)} AU)`
      );
    }
  }

  return vectors;
}

/**
 * Convert Horizons date format to ISO 8601
 * Input: "2025-Oct-01 00:00:00.0000"
 * Output: "2025-10-01T00:00:00.000Z"
 */
function convertHorizonsDateToISO(horizonsDate: string): string {
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    May: '05', Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };

  // Parse "2025-Oct-01 00:00:00.0000"
  const match = horizonsDate.match(/^(\d{4})-(\w{3})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    return new Date().toISOString(); // Fallback
  }

  const [, year, monthName, day, hours, minutes, seconds] = match;
  const month = months[monthName] || '01';

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}

// ============================================================================
// HIGH-LEVEL FUNCTIONS
// ============================================================================

/**
 * Complete workflow to get vector data for 3I/ATLAS
 * 1. Look up object to get SPK-ID
 * 2. Fetch ephemeris vectors
 * 3. Parse and return structured data
 *
 * 3I/ATLAS (C/2025 N1) - Third confirmed interstellar object
 * Discovered: July 1, 2025 by ATLAS telescope, Chile
 * Perihelion: Late October 2025
 * This is a REAL interstellar object in the Horizons database
 */
export async function get3IAtlasVectors(
  startDate: string,
  endDate: string,
  stepSize: string = '6h'
): Promise<VectorData[]> {
  // Step 1: Look up 3I/ATLAS to get SPK-ID
  // Official designations for the third interstellar object
  const possibleNames = [
    '3I/ATLAS',         // Official interstellar designation
    'C/2025 N1',        // Provisional comet designation
    '3I',               // Short interstellar designation
    '2025 N1',          // Short provisional designation
  ];

  let lookupResult: HorizonsLookupResult | null = null;

  for (const name of possibleNames) {
    try {
      const result = await lookupObject(name, 'com');
      if (result.count > 0) {
        lookupResult = result;
        console.log(`[Horizons] Found 3I/ATLAS using designation: "${name}"`);
        console.log(`[Horizons] Object name: ${result.result?.[0]?.name}`);
        break;
      }
    } catch (error) {
      console.warn(`[Horizons] Failed to lookup "${name}":`, error);
    }
  }

  if (!lookupResult || !lookupResult.result || lookupResult.result.length === 0) {
    throw new HorizonsAPIError(
      '3I/ATLAS (C/2025 N1) not found in Horizons database. Tried: 3I/ATLAS, C/2025 N1, 3I, 2025 N1'
    );
  }

  const spkid = lookupResult.result[0].spkid;
  const cometName = lookupResult.result[0].name;
  console.log(`[Horizons] Using SPK-ID: ${spkid} for ${cometName}`);

  // Step 2: Fetch ephemeris vectors
  const ephemerisParams: HorizonsQueryParams = {
    COMMAND: `DES=${spkid};`,
    EPHEM_TYPE: 'VECTOR',
    CENTER: '@sun',           // Heliocentric (Sun-centered)
    START_TIME: startDate,
    STOP_TIME: endDate,
    STEP_SIZE: stepSize,
    format: 'json',
    OUT_UNITS: 'AU-D',       // Astronomical Units, Days
    REF_SYSTEM: 'ICRF',      // International Celestial Reference Frame
    VEC_TABLE: '2',          // Position + Velocity
    OBJ_DATA: 'YES',         // Include object metadata
  };

  const ephemerisResponse = await getEphemerisVectors(ephemerisParams);

  // Step 3: Parse and return
  const vectors = parseVectorData(ephemerisResponse.result);

  console.log(`[Horizons] Parsed ${vectors.length} vector data points`);

  return vectors;
}

/**
 * Get current position of 3I/ATLAS (single data point)
 */
export async function get3IAtlasCurrentPosition(): Promise<VectorData | null> {
  const now = new Date();
  const nowStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  try {
    const vectors = await get3IAtlasVectors(nowStr, tomorrowStr, '1h');
    return vectors.length > 0 ? vectors[0] : null;
  } catch (error) {
    console.error('[Horizons] Failed to get current position:', error);
    return null;
  }
}
