/**
 * Performance Utilities
 * Tools for monitoring and optimizing application performance
 */

import * as THREE from 'three';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private frameTime = 0;
  private renderTime = 0;

  constructor() {
    this.reset();
  }

  update(): PerformanceMetrics {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    
    this.frameCount++;
    this.frameTime = deltaTime;
    this.fps = 1000 / deltaTime;
    
    this.lastTime = now;

    return {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.renderTime,
    };
  }

  setRenderTime(time: number): void {
    this.renderTime = time;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  reset(): void {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.frameTime = 0;
    this.renderTime = 0;
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.renderTime,
    };
  }
}

export const createPerformanceMonitor = () => new PerformanceMonitor();

/**
 * Throttle function calls to improve performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function calls to improve performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Additional exports for compatibility
export class MemoryManager {
  constructor() {
    // Memory management implementation
  }
  
  allocate(size: number) {
    return new ArrayBuffer(size);
  }
  
  deallocate(buffer: ArrayBuffer) {
    // Cleanup logic
  }
}

export const usePerformanceMonitor = () => {
  const monitor = new PerformanceMonitor();
  return monitor.getMetrics();
};

// Geometry pools for performance optimization
export const sphereGeometryPool = {
  get: () => new THREE.SphereGeometry(),
  release: (geometry: THREE.SphereGeometry) => {
    geometry.dispose();
  }
};

export const bufferGeometryPool = {
  get: () => new THREE.BufferGeometry(),
  release: (geometry: THREE.BufferGeometry) => {
    geometry.dispose();
  }
};

export const lineBasicMaterialPool = {
  get: () => new THREE.LineBasicMaterial(),
  release: (material: THREE.LineBasicMaterial) => {
    material.dispose();
  }
};

export const meshStandardMaterialPool = {
  get: () => new THREE.MeshStandardMaterial(),
  release: (material: THREE.MeshStandardMaterial) => {
    material.dispose();
  }
};
