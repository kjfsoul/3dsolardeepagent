"use client";

import React from "react";

interface TelemetryHUDProps {
  distanceFromSun: number;
  currentVelocity: number;
  currentDate: string;
  cameraViewMode?: string;
  playbackSpeed?: number;
  nextMilestone?: {
    name: string;
    date: string;
    daysUntil: number;
  };
  className?: string;
}

const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  distanceFromSun,
  currentVelocity,
  currentDate,
  cameraViewMode,
  playbackSpeed,
  nextMilestone,
  className = "",
}) => {
  // Format distance with appropriate units
  const formatDistance = (distance: number): string => {
    const distanceInKm = distance * 149597870.7;
    if (distance >= 1) {
      return `${distance.toFixed(3)} AU (${(distanceInKm / 1e6).toFixed(1)}M km)`;
    } else {
      return `${distance.toFixed(3)} AU (${distanceInKm.toFixed(0)} km)`;
    }
  };

  // Format velocity with appropriate units
  const formatVelocity = (velocity: number): string => {
    return `${velocity.toFixed(2)} km/s`;
  };

  // Format date to readable format with time
  const formatDate = (dateString: string): string => {
    if (!dateString) return "Loading...";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")} ${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")} UTC`;
    } catch {
      return dateString;
    }
  };

  // Format camera view mode for display
  const formatViewMode = (mode?: string): string => {
    if (!mode) return "Unknown";
    return mode
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div
      className={`absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-4 font-mono text-sm shadow-2xl max-w-sm ${className}`}
    >
      {/* Title */}
      <div className="text-green-400 font-bold text-base mb-3 border-b border-white/20 pb-2">
        3I/ATLAS TELEMETRY
      </div>

      {/* Main telemetry data */}
      <div className="space-y-2.5">
        <div className="flex flex-col gap-1">
          <span className="text-green-400 text-xs">Mission Time:</span>
          <span className="text-white text-xs">{formatDate(currentDate)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-blue-400 text-xs">Distance from Sun:</span>
          <span className="text-white text-xs font-semibold">
            {formatDistance(distanceFromSun)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-yellow-400 text-xs">Velocity:</span>
          <span className="text-white text-xs font-semibold">
            {formatVelocity(currentVelocity)}
          </span>
        </div>

        {/* Camera view mode */}
        {cameraViewMode && (
          <div className="flex flex-col gap-1 pt-2 border-t border-white/10">
            <span className="text-purple-400 text-xs">Camera View:</span>
            <span className="text-white text-xs">
              {formatViewMode(cameraViewMode)}
            </span>
          </div>
        )}

        {/* Playback speed */}
        {playbackSpeed !== undefined && (
          <div className="flex flex-col gap-1">
            <span className="text-pink-400 text-xs">Playback Speed:</span>
            <span className="text-white text-xs">{playbackSpeed}x</span>
          </div>
        )}

        {/* Next milestone countdown */}
        {nextMilestone && (
          <div className="flex flex-col gap-1 pt-2 border-t border-white/10">
            <span className="text-orange-400 text-xs">Next Milestone:</span>
            <span className="text-white text-xs font-semibold">
              {nextMilestone.name}
            </span>
            <span className="text-white/60 text-[10px]">
              {nextMilestone.daysUntil > 0
                ? `in ${nextMilestone.daysUntil.toFixed(1)} days`
                : "NOW"}
            </span>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="mt-3 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-[10px]">TRACKING ACTIVE</span>
        </div>
      </div>
    </div>
  );
};

export default TelemetryHUD;
