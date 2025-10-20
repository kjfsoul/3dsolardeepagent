/**
 * Daily Orbital Data Updater
 * 
 * This system updates orbital data once per day and stores it in a database
 * Perfect for the limited-time landing page opportunity
 * 
 * Based on Mystic Arcana's approach: local calculations with daily updates
 */

import { swissEphemerisCalculator } from './swiss-ephemeris-calculator';
import { VectorData } from './horizons-api';

// Database schema for orbital data
export interface OrbitalDataRecord {
  id: string;
  objectName: string;
  date: string; // YYYY-MM-DD format
  positions: VectorData[];
  createdAt: string;
  updatedAt: string;
}

// Cache for orbital data
const orbitalDataCache = new Map<string, OrbitalDataRecord>();

export class DailyOrbitalUpdater {
  private lastUpdateDate: string | null = null;
  private updateInProgress = false;

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize cache from localStorage or database
   */
  private initializeCache() {
    try {
      const cachedData = localStorage.getItem('orbitalDataCache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        Object.entries(parsed).forEach(([key, value]) => {
          orbitalDataCache.set(key, value as OrbitalDataRecord);
        });
        console.log('[Daily Updater] ✅ Cache initialized with', orbitalDataCache.size, 'records');
      }
    } catch (error) {
      console.warn('[Daily Updater] ⚠️ Failed to initialize cache:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCache() {
    try {
      const cacheObject = Object.fromEntries(orbitalDataCache);
      localStorage.setItem('orbitalDataCache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('[Daily Updater] ⚠️ Failed to save cache:', error);
    }
  }

  /**
   * Check if data needs updating
   */
  private needsUpdate(): boolean {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (this.lastUpdateDate === today) {
      return false; // Already updated today
    }

    // Check if we have data for today
    const todayKey = `atlas_${today}`;
    return !orbitalDataCache.has(todayKey);
  }

  /**
   * Generate date range for 3I/ATLAS observation period
   */
  private getObservationPeriod(): { start: string; end: string } {
    const today = new Date();
    const startDate = new Date('2025-07-01'); // Discovery date
    const endDate = new Date('2026-12-31'); // End of observation period
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  }

  /**
   * Update orbital data for today
   */
  async updateTodayData(): Promise<void> {
    if (this.updateInProgress) {
      console.log('[Daily Updater] ⏳ Update already in progress');
      return;
    }

    if (!this.needsUpdate()) {
      console.log('[Daily Updater] ✅ Data is up to date');
      return;
    }

    this.updateInProgress = true;
    const today = new Date().toISOString().split('T')[0];

    try {
      console.log('[Daily Updater] 🚀 Updating orbital data for', today);

      // Calculate data for the next 7 days (buffer for smooth visualization)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get orbital data using Swiss Ephemeris
      const orbitalData = await swissEphemerisCalculator.getAllSolarSystemData(
        today,
        endDateStr,
        '6h' // 6-hour intervals
      );

      // Store data in cache
      for (const [objectName, positions] of Object.entries(orbitalData) as Array<[
        string,
        VectorData[],
      ]>) {
        const record: OrbitalDataRecord = {
          id: `${objectName}_${today}`,
          objectName,
          date: today,
          positions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        orbitalDataCache.set(record.id, record);
      }

      // Save cache
      this.saveCache();
      this.lastUpdateDate = today;

      console.log('[Daily Updater] ✅ Successfully updated orbital data for', today);
      console.log('[Daily Updater] 📊 Generated data for objects:', Object.keys(orbitalData));

    } catch (error) {
      console.error('[Daily Updater] ❌ Failed to update orbital data:', error);
    } finally {
      this.updateInProgress = false;
    }
  }

  /**
   * Get orbital data for a specific date range
   */
  async getOrbitalData(
    startDate: string,
    endDate: string,
    objects: string[] = ['atlas', 'sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn']
  ): Promise<Record<string, VectorData[]>> {
    // First, ensure we have today's data
    await this.updateTodayData();

    const results: Record<string, VectorData[]> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Generate data for each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      for (const objectName of objects) {
        const cacheKey = `${objectName}_${dateStr}`;
        let record = orbitalDataCache.get(cacheKey);

        // If no cached data, generate it
        if (!record) {
          console.log(`[Daily Updater] 🔄 Generating data for ${objectName} on ${dateStr}`);
          
          try {
            const dayData = await swissEphemerisCalculator.getAllSolarSystemData(
              dateStr,
              dateStr,
              '6h'
            );

            const positions = dayData[objectName] as VectorData[] | undefined;

            if (positions) {
              record = {
                id: cacheKey,
                objectName,
                date: dateStr,
                positions,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              orbitalDataCache.set(cacheKey, record);
            }
          } catch (error) {
            console.error(`[Daily Updater] ❌ Failed to generate data for ${objectName} on ${dateStr}:`, error);
          }
        }

        // Add positions to results
        if (record && record.positions) {
          if (!results[objectName]) {
            results[objectName] = [];
          }
          results[objectName].push(...record.positions);
        }
      }
    }

    // Save updated cache
    this.saveCache();

    return results;
  }

  /**
   * Get cached orbital data (fast, no calculations)
   */
  getCachedData(startDate: string, endDate: string, objects: string[]): Record<string, VectorData[]> {
    const results: Record<string, VectorData[]> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      for (const objectName of objects) {
        const cacheKey = `${objectName}_${dateStr}`;
        const record = orbitalDataCache.get(cacheKey);

        if (record && record.positions) {
          if (!results[objectName]) {
            results[objectName] = [];
          }
          results[objectName].push(...record.positions);
        }
      }
    }

    return results;
  }

  /**
   * Clear old cache data (keep only last 30 days)
   */
  cleanupCache(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

    let removedCount = 0;
    for (const [key, record] of orbitalDataCache.entries()) {
      if (record.date < cutoffDate) {
        orbitalDataCache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`[Daily Updater] 🧹 Cleaned up ${removedCount} old cache entries`);
      this.saveCache();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalRecords: number; objects: string[]; dateRange: { start: string; end: string } } {
    const objects = new Set<string>();
    let earliestDate = '9999-12-31';
    let latestDate = '0000-01-01';

    for (const record of orbitalDataCache.values()) {
      objects.add(record.objectName);
      if (record.date < earliestDate) earliestDate = record.date;
      if (record.date > latestDate) latestDate = record.date;
    }

    return {
      totalRecords: orbitalDataCache.size,
      objects: Array.from(objects),
      dateRange: { start: earliestDate, end: latestDate },
    };
  }
}

// Export singleton instance
export const dailyOrbitalUpdater = new DailyOrbitalUpdater();

// Auto-update on page load
if (typeof window !== 'undefined') {
  // Run update in background
  dailyOrbitalUpdater.updateTodayData().catch(console.error);
  
  // Cleanup cache weekly
  setInterval(() => {
    dailyOrbitalUpdater.cleanupCache();
  }, 7 * 24 * 60 * 60 * 1000); // 7 days
}
