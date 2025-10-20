import { useCallback, useEffect, useState } from 'react';
import { setFps, shouldDegrade, shouldRestore } from '../components/utils/frame-guard';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  frameDrops: number;
}

export interface AdaptiveQualityState {
  starCount: number;
  geometryDetail: number;
  shadowMapSize: number;
  pixelRatio: number;
}

export function useAdaptiveQuality() {
  const [quality, setQuality] = useState<AdaptiveQualityState>({
    starCount: 10000,
    geometryDetail: 64,
    shadowMapSize: 2048,
    pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 16.67,
    frameDrops: 0,
  });

  const [fpsHistory, setFpsHistory] = useState<number[]>([]);

  const handleMetricsUpdate = useCallback((newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
    
    // Update FPS history for adaptive quality decisions
    setFpsHistory(prev => {
      const updated = [...prev, newMetrics.fps];
      return updated.slice(-120); // Keep last 2 seconds at 60fps
    });

    // Update global FPS telemetry
    setFps(newMetrics.fps);

    // Adaptive quality scaling based on FPS performance
    let newQuality = { ...quality };

    if (shouldDegrade(fpsHistory)) {
      // Low performance - reduce quality
      newQuality.starCount = Math.max(2000, quality.starCount * 0.7);
      newQuality.geometryDetail = Math.max(16, quality.geometryDetail * 0.7);
      newQuality.shadowMapSize = Math.max(512, quality.shadowMapSize * 0.7);
      newQuality.pixelRatio = Math.max(0.5, quality.pixelRatio * 0.8);
    } else if (shouldRestore(fpsHistory)) {
      // Good performance - increase quality
      newQuality.starCount = Math.min(20000, quality.starCount * 1.1);
      newQuality.geometryDetail = Math.min(128, quality.geometryDetail * 1.1);
      newQuality.shadowMapSize = Math.min(4096, quality.shadowMapSize * 1.1);
      newQuality.pixelRatio = Math.min(2, quality.pixelRatio * 1.05);
    }

    setQuality(newQuality);
  }, [quality, fpsHistory]);

  // Initialize performance telemetry
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize performance telemetry object
      (window as any).__AE_HEALTH__ = {
        fps: metrics.fps,
        memoryUsage: metrics.memoryUsage,
        renderTime: metrics.renderTime,
        frameDrops: metrics.frameDrops,
        quality: {
          starCount: quality.starCount,
          geometryDetail: quality.geometryDetail,
          shadowMapSize: quality.shadowMapSize,
          pixelRatio: quality.pixelRatio,
        },
        timestamp: Date.now(),
        version: '1.0.0',
      };

      // Update telemetry periodically
      const interval = setInterval(() => {
        if ((window as any).__AE_HEALTH__) {
          (window as any).__AE_HEALTH__ = {
            ...(window as any).__AE_HEALTH__,
            fps: metrics.fps,
            memoryUsage: metrics.memoryUsage,
            renderTime: metrics.renderTime,
            frameDrops: metrics.frameDrops,
            quality: {
              starCount: quality.starCount,
              geometryDetail: quality.geometryDetail,
              shadowMapSize: quality.shadowMapSize,
              pixelRatio: quality.pixelRatio,
            },
            timestamp: Date.now(),
          };
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [metrics, quality]);

  return { quality, metrics, handleMetricsUpdate };
}
