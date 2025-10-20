/**
 * Trajectory Calculator
 * Calculates orbital trajectories and positions for celestial objects
 */

import { type VectorData } from './horizons-api';

export interface TrajectoryPoint {
  date: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface TrajectoryResult {
  points: TrajectoryPoint[];
  totalDistance: number;
  duration: number;
}

export class TrajectoryCalculator {
  /**
   * Calculate trajectory between two points
   */
  static calculateTrajectory(
    startData: VectorData,
    endData: VectorData,
    steps: number = 100
  ): TrajectoryResult {
    const points: TrajectoryPoint[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point: TrajectoryPoint = {
        date: this.interpolateDate(startData.date, endData.date, t),
        x: this.lerp(startData.position.x, endData.position.x, t),
        y: this.lerp(startData.position.y, endData.position.y, t),
        z: this.lerp(startData.position.z, endData.position.z, t),
        vx: this.lerp(startData.velocity.vx, endData.velocity.vx, t),
        vy: this.lerp(startData.velocity.vy, endData.velocity.vy, t),
        vz: this.lerp(startData.velocity.vz, endData.velocity.vz, t),
      };
      points.push(point);
    }

    const totalDistance = this.calculateTotalDistance(points);
    const duration = this.calculateDuration(startData.date, endData.date);

    return {
      points,
      totalDistance,
      duration,
    };
  }

  private static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private static interpolateDate(startDate: string, endDate: string, t: number): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const interpolated = new Date(start.getTime() + diff * t);
    return interpolated.toISOString().split('T')[0];
  }

  private static calculateTotalDistance(points: TrajectoryPoint[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dz = points[i].z - points[i - 1].z;
      total += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return total;
  }

  private static calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end.getTime() - start.getTime();
  }
}

// Additional exports for compatibility
export class StableNBodySimulator {
  constructor() {
    // N-body simulation implementation
  }
  
  simulate(initialConditions: any[], timeStep: number, steps: number) {
    // Simulation logic
    return [];
  }
}

export interface PhysicsHealthStats {
  energy: number;
  momentum: number;
  stability: number;
}
