
/**
 * TelemetryHUD Component
 * =============================
 * Real-time telemetry display overlay
 */

import { VectorData } from '@/types/trajectory';
import { useMemo } from 'react';

type TelemetryVariant = 'panel' | 'overlay';

interface TelemetryHUDProps {
  currentFrame: VectorData | null;
  className?: string;
  variant?: TelemetryVariant;
}

const AU_TO_KM = 149597870.7;

export function TelemetryHUD({ currentFrame, className = '', variant = 'panel' }: TelemetryHUDProps) {
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

  const containerClass =
    variant === 'overlay'
      ? `bg-black/70 backdrop-blur-md text-white rounded-lg font-mono text-xs border border-white/30 shadow-lg p-3 ${className}`
      : `w-full bg-black/70 backdrop-blur-md text-white p-4 rounded-lg font-mono text-sm border border-emerald-400/30 ${className}`;

  const headerClass = variant === 'overlay' ? 'text-sm font-bold mb-2 text-white' : 'text-lg font-bold mb-3 text-green-400';
  const labelClass = variant === 'overlay' ? 'text-white/70' : 'text-green-300';
  const distanceLabelClass = variant === 'overlay' ? 'text-white/70' : 'text-blue-300';
  const velocityLabelClass = variant === 'overlay' ? 'text-white/70' : 'text-yellow-300';
  const indentClass = variant === 'overlay' ? 'ml-3 mt-1' : 'ml-4 mt-1';
  const footerClass = variant === 'overlay' ? 'mt-2 pt-2 border-t border-white/20 text-[0.65rem] text-white/60' : 'mt-3 pt-3 border-t border-gray-600 text-xs text-gray-400';

  return (
    <div className={containerClass}>
      <h3 className={headerClass}>3I/ATLAS TELEMETRY</h3>

      <div className="space-y-2">
        <div>
          <span className={labelClass}>Date:</span>{' '}
          <span className="text-white font-semibold">
            {new Date(telemetry.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div>
          <span className={distanceLabelClass}>Distance from Sun:</span>
          <div className={`${indentClass}`}>
            <div className="text-white font-semibold">
              {telemetry.distanceAU.toFixed(3)} AU
            </div>
            <div className="text-white/70 text-[0.7rem]">
              {(telemetry.distanceKm / 1e6).toFixed(2)} million km
            </div>
          </div>
        </div>

        <div>
          <span className={velocityLabelClass}>Velocity:</span>
          <div className={`${indentClass}`}>
            <div className="text-white font-semibold">
              {telemetry.velocityKmS.toFixed(2)} km/s
            </div>
            <div className="text-white/70 text-[0.7rem]">
              {telemetry.velocityKmH.toFixed(0)} km/h
            </div>
          </div>
        </div>
      </div>

      <div className={footerClass}>Real-time trajectory data</div>
    </div>
  );
}
