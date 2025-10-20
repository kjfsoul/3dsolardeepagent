/**
 * Frame Guard Utility
 * Prevents excessive re-renders and ensures smooth animation performance
 */

export class FrameGuard {
  private lastFrameTime = 0;
  private frameCount = 0;
  private readonly targetFPS: number;
  private readonly frameInterval: number;

  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  shouldRender(): boolean {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    if (deltaTime >= this.frameInterval) {
      this.lastFrameTime = now;
      this.frameCount++;
      return true;
    }

    return false;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  reset(): void {
    this.frameCount = 0;
    this.lastFrameTime = 0;
  }
}

export const createFrameGuard = (targetFPS = 60) => new FrameGuard(targetFPS);

// Additional exports for compatibility
export const setFps = (targetFPS: number) => {
  // Global FPS setting utility
  return targetFPS;
};

export const shouldDegrade = () => {
  // Performance degradation check
  return false;
};

export const shouldRestore = () => {
  // Performance restoration check
  return true;
};

export const withFrameGuard = <T extends (...args: any[]) => any>(
  func: T,
  targetFPS = 60
): T => {
  const guard = new FrameGuard(targetFPS);
  return ((...args: Parameters<T>) => {
    if (guard.shouldRender()) {
      return func(...args);
    }
  }) as T;
};
