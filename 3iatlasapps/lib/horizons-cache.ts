/**
 * Caching layer for Horizons API data
 * Reduces API load and improves performance
 * 
 * Why cache:
 * - Orbital data is deterministic (doesn't change)
 * - Reduces server load (good API citizenship)
 * - Enables offline functionality
 * - Improves page load performance
 */

import { generate3IAtlasVectors } from './atlas-orbital-data';
import { type VectorData, get3IAtlasVectors } from './horizons-api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CachedVectorData {
  data: VectorData[];
  timestamp: number;
  params: {
    startDate: string;
    endDate: string;
    stepSize: string;
  };
  version: string; // Cache version for invalidation
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CACHE_VERSION = '1.0';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_KEY_PREFIX = 'horizons_atlas_';

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

function generateCacheKey(
  startDate: string,
  endDate: string,
  stepSize: string
): string {
  return `${CACHE_KEY_PREFIX}${startDate}_${endDate}_${stepSize}`;
}

// ============================================================================
// CACHE VALIDATION
// ============================================================================

function isCacheValid(cached: CachedVectorData): boolean {
  // Check version
  if (cached.version !== CACHE_VERSION) {
    console.log('[Cache] Version mismatch, invalidating cache');
    return false;
  }

  // Check age
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_DURATION_MS) {
    console.log('[Cache] Data expired, invalidating cache');
    return false;
  }

  // Check data integrity
  if (!Array.isArray(cached.data) || cached.data.length === 0) {
    console.log('[Cache] Invalid data structure, invalidating cache');
    return false;
  }

  return true;
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function getFromLocalStorage(key: string): CachedVectorData | null {
  if (typeof window === 'undefined') {
    return null; // SSR safety
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return null;
    }

    const parsed = JSON.parse(item) as CachedVectorData;
    return parsed;
  } catch (error) {
    console.error('[Cache] Failed to read from localStorage:', error);
    return null;
  }
}

function saveToLocalStorage(key: string, data: CachedVectorData): void {
  if (typeof window === 'undefined') {
    return; // SSR safety
  }

  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    console.log(`[Cache] Saved ${data.data.length} vectors to cache`);
  } catch (error) {
    console.error('[Cache] Failed to save to localStorage:', error);
    
    // Handle QuotaExceededError
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('[Cache] Storage quota exceeded, clearing old caches');
      clearOldCaches();
      
      // Try again after clearing
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        console.error('[Cache] Still failed after clearing:', retryError);
      }
    }
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear all Horizons caches older than specified age
 */
function clearOldCaches(maxAge: number = CACHE_DURATION_MS): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    const horizonKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

    let clearedCount = 0;
    for (const key of horizonKeys) {
      try {
        const cached = getFromLocalStorage(key);
        if (cached && Date.now() - cached.timestamp > maxAge) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      } catch (error) {
        // If we can't parse it, remove it
        localStorage.removeItem(key);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      console.log(`[Cache] Cleared ${clearedCount} old cache entries`);
    }
  } catch (error) {
    console.error('[Cache] Error clearing old caches:', error);
  }
}

/**
 * Clear all Horizons caches
 */
export function clearAllHorizonsCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    const horizonKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

    for (const key of horizonKeys) {
      localStorage.removeItem(key);
    }

    console.log(`[Cache] Cleared all ${horizonKeys.length} Horizons cache entries`);
  } catch (error) {
    console.error('[Cache] Error clearing all caches:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  count: number;
  totalSize: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
} {
  if (typeof window === 'undefined') {
    return { count: 0, totalSize: 0, oldestTimestamp: null, newestTimestamp: null };
  }

  try {
    const keys = Object.keys(localStorage);
    const horizonKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

    let totalSize = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (const key of horizonKeys) {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;

        try {
          const cached = JSON.parse(item) as CachedVectorData;
          if (oldestTimestamp === null || cached.timestamp < oldestTimestamp) {
            oldestTimestamp = cached.timestamp;
          }
          if (newestTimestamp === null || cached.timestamp > newestTimestamp) {
            newestTimestamp = cached.timestamp;
          }
        } catch {
          // Skip invalid entries
        }
      }
    }

    return {
      count: horizonKeys.length,
      totalSize,
      oldestTimestamp,
      newestTimestamp,
    };
  } catch (error) {
    console.error('[Cache] Error getting cache stats:', error);
    return { count: 0, totalSize: 0, oldestTimestamp: null, newestTimestamp: null };
  }
}

// ============================================================================
// MAIN CACHE FUNCTION
// ============================================================================

/**
 * Get 3I/ATLAS vectors with caching
 * Returns cached data if valid, otherwise fetches fresh data
 */
export async function getCached3IAtlasVectors(
  startDate: string,
  endDate: string,
  stepSize: string = '6h'
): Promise<VectorData[]> {
  const cacheKey = generateCacheKey(startDate, endDate, stepSize);

  // Try to get from cache
  const cached = getFromLocalStorage(cacheKey);

  if (cached && isCacheValid(cached)) {
    console.log('[Cache] Using cached data');
    return cached.data;
  }

  // Cache miss or invalid - fetch fresh data
  console.log('[Cache] Fetching fresh data from Horizons API');

  try {
    const vectors = await get3IAtlasVectors(startDate, endDate, stepSize);

    // Save to cache
    const cacheData: CachedVectorData = {
      data: vectors,
      timestamp: Date.now(),
      params: { startDate, endDate, stepSize },
      version: CACHE_VERSION,
    };

    saveToLocalStorage(cacheKey, cacheData);

    return vectors;
  } catch (error) {
    console.warn('[Cache] Horizons API failed, attempting fallback orbital calculation');
    
    // If fetch fails and we have expired cache, return it anyway
    if (cached && cached.data.length > 0) {
      console.warn('[Cache] Using expired cache as fallback');
      return cached.data;
    }

    // If no cache available, use calculated orbital data
    // Based on discovery observations and published orbital elements
    console.log('[Cache] Generating 3I/ATLAS vectors using Keplerian orbital mechanics');
    console.log('[Cache] Using orbital elements from July 2025 discovery papers');
    
    const stepHours = parseInt(stepSize.replace('h', '')) || 6;
    const fallbackVectors = generate3IAtlasVectors(startDate, endDate, stepHours);
    
    if (fallbackVectors.length > 0) {
      // Cache the generated data
      const cacheData: CachedVectorData = {
        data: fallbackVectors,
        timestamp: Date.now(),
        params: { startDate, endDate, stepSize },
        version: CACHE_VERSION,
      };

      saveToLocalStorage(cacheKey, cacheData);
      
      return fallbackVectors;
    }

    throw error;
  }
}

/**
 * Prefetch and cache data for a date range
 * Useful for preloading data in the background
 */
export async function prefetch3IAtlasVectors(
  startDate: string,
  endDate: string,
  stepSize: string = '6h'
): Promise<void> {
  try {
    await getCached3IAtlasVectors(startDate, endDate, stepSize);
    console.log('[Cache] Prefetch complete');
  } catch (error) {
    console.error('[Cache] Prefetch failed:', error);
  }
}

// ============================================================================
// AUTO-CLEANUP
// ============================================================================

// Automatically clear old caches on module load (client-side only)
if (typeof window !== 'undefined') {
  // Run cleanup after a short delay to avoid blocking initial page load
  setTimeout(() => {
    clearOldCaches();
  }, 2000);
}
