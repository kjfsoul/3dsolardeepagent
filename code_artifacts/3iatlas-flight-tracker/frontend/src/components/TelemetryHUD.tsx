
/**
 * TelemetryHUD Component
 * =============================
 * Real-time telemetry display overlay
 */

import { VectorData } from '@/types/trajectory';
import { useMemo } from 'react';

interface TelemetryHUDProps {
  currentFrame: VectorData | null;
  className?: string;
}

const AU_TO_KM = 149597870.7;

export function TelemetryHUD({ currentFrame, className = '' }: TelemetryHUDProps) {
  const telemetry = useMemo(() => {
    if (!currentFrame) {
      return {
        date: 'Loading...',
        distanceAU: 0,
        distanceKm: 0,
        velocityKmS: 0,
        velocityKmH: 0,
      };
    }

    // Calculate distance from Sun (origin)
    const { position, velocity } = currentFrame;
    const distanceAU = Math.sqrt(
      position.x * position.x + position.y * position.y + position.z * position.z
    );

    // Calculate velocity magnitude
    const velocityAUPerDay = Math.sqrt(
      velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z
    );

    // Convert to km/s (AU/day -> km/s)
    const velocityKmS = (velocityAUPerDay * AU_TO_KM) / 86400;
    const velocityKmH = velocityKmS * 3600;

    return {
      date: currentFrame.date,
      distanceAU,
      distanceKm: distanceAU * AU_TO_KM,
      velocityKmS,
      velocityKmH,
    };
  }, [currentFrame]);

  return (
    <div
      className={`fixed bottom-4 left-4 bg-black/70 backdrop-blur-md text-white p-4 rounded-lg font-mono text-sm z-30 ${className}`}
      style={{
        minWidth: '280px',
        border: '1px solid rgba(0, 255, 136, 0.3)',
      }}
    >
      <h3 className="text-lg font-bold mb-3 text-green-400">
        3I/ATLAS TELEMETRY
      </h3>

      <div className="space-y-2">
        <div>
          <span className="text-green-300">Date:</span>{' '}
          <span className="text-white font-semibold">
            {new Date(telemetry.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div>
          <span className="text-blue-300">Distance from Sun:</span>
          <div className="ml-4 mt-1">
            <div className="text-white font-semibold">
              {telemetry.distanceAU.toFixed(3)} AU
            </div>
            <div className="text-gray-400 text-xs">
              {(telemetry.distanceKm / 1e6).toFixed(2)} million km
            </div>
          </div>
        </div>

        <div>
          <span className="text-yellow-300">Velocity:</span>
          <div className="ml-4 mt-1">
            <div className="text-white font-semibold">
              {telemetry.velocityKmS.toFixed(2)} km/s
            </div>
            <div className="text-gray-400 text-xs">
              {telemetry.velocityKmH.toFixed(0)} km/h
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-400">
        Real-time trajectory data
      </div>
    </div>
  );
}
