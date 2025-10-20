"use client";

/**
 * View Selector Component - Navigation between 3I/ATLAS Views
 * CORRECTED: This version forces a system font for the icons to ensure they are visible.
 */

import React, { useState } from "react";

export type ViewType =
  | "historical"
  | "currentMoment"
  | "speedSimulation"
  | "perihelionEvent"
  | "trajectoryPlotter";

interface ViewSelectorProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
  disabled?: boolean;
}

interface ViewConfig {
  id: ViewType;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  hoverColor: string;
}

const VIEWS: ViewConfig[] = [
  {
    id: "historical",
    name: "Historical Flight",
    description: "Timeline from discovery to current",
    icon: "🕐",
    color: "text-green-400",
    bgColor: "bg-green-600",
    hoverColor: "hover:bg-green-700",
  },
  {
    id: "currentMoment",
    name: "Current Moment",
    description: "Super-lens view at Oct 8, 2025",
    icon: "🔍",
    color: "text-blue-400",
    bgColor: "bg-blue-600",
    hoverColor: "hover:bg-blue-700",
  },
  {
    id: "speedSimulation",
    name: "Speed Simulation",
    description: "Experience velocity from comet POV",
    icon: "⚡",
    color: "text-purple-400",
    bgColor: "bg-purple-600",
    hoverColor: "hover:bg-purple-700",
  },
  {
    id: "perihelionEvent",
    name: "Perihelion Event",
    description: "Closest solar approach Oct 28-29",
    icon: "⭐",
    color: "text-orange-400",
    bgColor: "bg-orange-600",
    hoverColor: "hover:bg-orange-700",
  },
  {
    id: "trajectoryPlotter",
    name: "Trajectory Plotter",
    description: "Interactive path modification",
    icon: "📊",
    color: "text-red-400",
    bgColor: "bg-red-600",
    hoverColor: "hover:bg-red-700",
  },
];

const ViewSelector: React.FC<ViewSelectorProps> = ({
  activeView,
  onViewChange,
  className = "",
  disabled = false,
}) => {
  const [focusedView, setFocusedView] = useState<ViewType | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent, viewId: ViewType) => {
    if (disabled) return;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        onViewChange(viewId);
        break;
      case "ArrowLeft":
      case "ArrowRight":
        event.preventDefault();
        const currentIndex = VIEWS.findIndex((v) => v.id === viewId);
        const nextIndex =
          event.key === "ArrowRight"
            ? (currentIndex + 1) % VIEWS.length
            : (currentIndex - 1 + VIEWS.length) % VIEWS.length;
        onViewChange(VIEWS[nextIndex].id);
        break;
    }
  };

  return (
    <div
      data-testid="view-selector"
      className={`bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 ${className}`}
    >
      <div className="text-white font-semibold text-sm mb-3">
        3I/ATLAS Views
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col gap-2">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            onClick={() => !disabled && onViewChange(view.id)}
            onKeyDown={(e) => handleKeyDown(e, view.id)}
            onFocus={() => setFocusedView(view.id)}
            onBlur={() => setFocusedView(null)}
            disabled={disabled}
            className={`
              flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left
              ${
                activeView === view.id
                  ? `${view.bgColor} text-white shadow-lg transform scale-105`
                  : `bg-white/10 text-white/80 ${view.hoverColor} hover:text-white`
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${focusedView === view.id ? "ring-2 ring-white/50" : ""}
            `}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-current={activeView === view.id ? "page" : undefined}
            aria-label={`Switch to ${view.name} view`}
          >
            {/* THE FIX: Added `font-sans` to force a font that supports emojis */}
            <div className="text-2xl font-sans">{view.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-sm">{view.name}</div>
              <div className="text-xs opacity-80">{view.description}</div>
            </div>
            {activeView === view.id && (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => !disabled && onViewChange(view.id)}
              onKeyDown={(e) => handleKeyDown(e, view.id)}
              onFocus={() => setFocusedView(view.id)}
              onBlur={() => setFocusedView(null)}
              disabled={disabled}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-lg min-w-[80px] transition-all duration-200
                ${
                  activeView === view.id
                    ? `${view.bgColor} text-white shadow-lg transform scale-105`
                    : `bg-white/10 text-white/80 ${view.hoverColor} hover:text-white`
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${focusedView === view.id ? "ring-2 ring-white/50" : ""}
              `}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-current={activeView === view.id ? "page" : undefined}
              aria-label={`Switch to ${view.name} view`}
            >
              {/* THE FIX: Added `font-sans` to force a font that supports emojis */}
              <div className="text-xl font-sans">{view.icon}</div>
              <div className="text-xs font-medium text-center">{view.name}</div>
            </button>
          ))}
        </div>

        {/* Active View Description */}
        <div className="mt-3 p-2 bg-white/10 rounded">
          <div
            className={`text-xs font-medium ${
              VIEWS.find((v) => v.id === activeView)?.color
            }`}
          >
            {VIEWS.find((v) => v.id === activeView)?.name}
          </div>
          <div className="text-xs text-white/60 mt-1">
            {VIEWS.find((v) => v.id === activeView)?.description}
          </div>
        </div>
      </div>

      {/* Keyboard Navigation Help */}
      <div className="mt-4 text-xs text-white/50">
        <div className="font-medium mb-1">Keyboard Navigation:</div>
        <div className="space-y-1">
          <div>• Tab to navigate views</div>
          <div>• Enter/Space to select</div>
          <div>• Arrow keys to navigate</div>
        </div>
      </div>
    </div>
  );
};

export default ViewSelector;
