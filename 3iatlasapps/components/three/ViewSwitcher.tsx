"use client";

/**
 * ViewSwitcher Component - UI for Switching Camera Views
 * 
 * Provides a clean UI for users to switch between different camera perspectives
 */

import React from "react";
import { CameraViewMode } from "./CameraController";

interface ViewSwitcherProps {
  currentView: CameraViewMode;
  onViewChange: (view: CameraViewMode) => void;
  className?: string;
}

const VIEW_OPTIONS: Array<{
  value: CameraViewMode;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    value: "RIDE_WITH_ATLAS",
    label: "Ride with ATLAS",
    icon: "🚀",
    description: "Follow the comet closely",
  },
  {
    value: "SOLAR_SYSTEM_OVERVIEW",
    label: "Solar System",
    icon: "🌍",
    description: "Wide view of full trajectory",
  },
  {
    value: "PERIHELION_CLOSEUP",
    label: "Perihelion",
    icon: "☀️",
    description: "Dramatic Sun approach",
  },
  {
    value: "MARS_FLYBY",
    label: "Mars Flyby",
    icon: "🔴",
    description: "View centered on Mars",
  },
  {
    value: "FREE_CAMERA",
    label: "Free Camera",
    icon: "🎥",
    description: "User-controlled view",
  },
];

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  className = "",
}) => {
  return (
    <div
      className={`absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-2xl ${className}`}
    >
      <div className="text-white font-semibold text-xs mb-2 border-b border-white/20 pb-2">
        CAMERA VIEW
      </div>
      <div className="space-y-1">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onViewChange(option.value)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
              currentView === option.value
                ? "bg-green-600 text-white shadow-lg"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
            title={option.description}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{option.icon}</span>
              <div>
                <div className="font-semibold">{option.label}</div>
                <div className="text-[10px] text-white/60">
                  {option.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewSwitcher;
