/**
 * PlaybackControls Component
 * =============================
 * User controls for playback, speed, and camera
 */

import { useEffect, useState } from "react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  speed: number;
  currentIndex: number;
  maxIndex: number;
  viewMode: 'explorer' | 'true-scale' | 'ride-atlas';
  onPlayPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (index: number) => void;
  onViewModeChange: (mode: 'explorer' | 'true-scale' | 'ride-atlas') => void;
  layout?: 'floating' | 'inline';
}

const SPEED_OPTIONS = [1, 10, 25];
const VIEW_OPTIONS: Array<{ mode: 'true-scale' | 'ride-atlas'; label: string }> = [
  { mode: 'true-scale', label: 'True Scale' },
  { mode: 'ride-atlas', label: 'Ride With 3I/ATLAS' },
];
const VIEW_MODE_LABELS = {
  explorer: "Explorer",
  "true-scale": "True Scale",
  "ride-atlas": "Ride With 3I/ATLAS",
};

export function PlaybackControls({
  isPlaying,
  speed,
  currentIndex,
  maxIndex,
  viewMode,
  onPlayPause,
  onReset,
  onSpeedChange,
  onSeek,
  onViewModeChange,
  layout = 'floating',
}: PlaybackControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const isFloating = layout === 'floating';
  const containerClassName = isFloating
    ? "playback-controls relative fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-md text-white rounded-lg shadow-2xl"
    : "playback-controls relative w-full rounded-xl border border-emerald-400/20 bg-black/70 backdrop-blur";
  const containerStyle = isFloating
    ? {
        minWidth: "320px", // Reduced from 500px for mobile
        maxWidth: "90vw",
        border: "1px solid rgba(0, 255, 136, 0.3)",
        zIndex: 99999,
        pointerEvents: "auto" as const,
        margin: "0 16px", // Add horizontal margin
      }
    : {
        pointerEvents: "auto" as const,
        margin: "0 16px", // Add horizontal margin for non-floating
      };
  const innerWrapperClass = isFloating ? "p-2 sm:p-3" : "mx-auto w-full max-w-5xl px-2 sm:px-4 py-3 sm:py-4";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.playback-controls')) {
        setShowSpeedMenu(false);
        setShowViewMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!SPEED_OPTIONS.includes(speed)) {
      onSpeedChange(SPEED_OPTIONS[0]);
    }
  }, [speed, onSpeedChange]);

  const dispatchZoomEvent = (type: 'zoom-in' | 'zoom-out') => {
    window.dispatchEvent(new Event(type));
  };

  const handleScrubStart = () => {
    if (isPlaying) {
      onPlayPause();
    }
  };

  const progressPercent = maxIndex > 0 ? Math.floor((currentIndex / maxIndex) * 100) : 0;
  const zoomEnabled = viewMode === 'true-scale';

  return (
    <div className={containerClassName} style={containerStyle}>
      <div className={innerWrapperClass}>
        {/* Timeline Slider Row */}
        <div className={`mb-4 sm:mb-6 ${isFloating ? '' : 'max-w-4xl mx-auto'}`}>
          <div className="flex items-center gap-2 sm:gap-4 text-xs text-white/70">
            <span className="w-16 text-left sm:w-24 md:w-32 text-xs sm:text-sm">July 1, 2025</span>
            <input
              type="range"
              min="0"
              max={maxIndex}
              value={currentIndex}
              onMouseDown={handleScrubStart}
              onTouchStart={handleScrubStart}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-700"
              style={{ accentColor: '#00ff88' }}
            />
            <span className="w-16 text-right sm:w-24 md:w-32 text-xs sm:text-sm">March 31, 2026</span>
          </div>
          <div className="mt-1 sm:mt-2 text-center text-xs sm:text-sm font-semibold text-white">
            {progressPercent}%
          </div>
        </div>

        {/* Control Buttons */}
        <div className={`flex flex-wrap items-center justify-center gap-1 sm:gap-2 md:gap-3 ${isFloating ? '' : 'max-w-full mx-auto px-4 sm:px-6 md:px-8'}`}>
          <button
            type="button"
            onClick={onReset}
            className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
            title="Reset to beginning"
          >
            ⏮️ Reset
          </button>

          <button
            type="button"
            onClick={onPlayPause}
            className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors font-semibold text-xs sm:text-sm whitespace-nowrap"
          >
            {isPlaying ? "⏸️ Pause" : "▶️ Play"}
          </button>

          {/* Speed Control */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSpeedMenu((prev) => !prev);
                setShowViewMenu(false);
              }}
              className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              Speed: {speed}x
            </button>

            {showSpeedMenu && (
              <div className="absolute left-1/2 bottom-full z-[1000] mb-2 w-32 sm:w-40 -translate-x-1/2 overflow-hidden rounded-lg border border-gray-600 bg-gray-800 shadow-xl">
                {SPEED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onSpeedChange(option);
                      setShowSpeedMenu(false);
                    }}
                    className={`block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm transition hover:bg-gray-700 ${
                      speed === option ? 'bg-green-600 text-white' : 'text-white'
                    }`}
                  >
                    {option}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowViewMenu((prev) => !prev);
                setShowSpeedMenu(false);
              }}
              className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
              title="Change view scale"
            >
              <span className="hidden sm:inline">View: </span>{VIEW_MODE_LABELS[viewMode]}
            </button>

            {showViewMenu && (
              <div className="absolute left-1/2 bottom-full z-[1000] mb-2 w-40 sm:w-52 -translate-x-1/2 overflow-hidden rounded-lg border border-gray-600 bg-gray-800 shadow-xl">
                {VIEW_OPTIONS.map(({ mode, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      onViewModeChange(mode);
                      setShowViewMenu(false);
                    }}
                    className={`block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm transition hover:bg-gray-700 ${
                      viewMode === mode ? 'bg-green-600 text-white' : 'text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex flex-col items-center gap-0.5">
            <div className={`text-xs font-medium ${zoomEnabled ? 'text-white' : 'text-gray-400'}`}>
              <span className="hidden sm:inline">Zoom</span>
              <span className="sm:hidden">Z</span>
            </div>
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => zoomEnabled && dispatchZoomEvent('zoom-out')}
                className={`px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded-lg border transition-colors text-xs sm:text-sm ${
                  zoomEnabled
                    ? 'border-emerald-400 bg-gray-800 text-white hover:bg-emerald-500/20'
                    : 'border-gray-700 bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                title="Zoom Out"
              >
                ➖
              </button>
              <button
                type="button"
                onClick={() => zoomEnabled && dispatchZoomEvent('zoom-in')}
                className={`px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded-lg border transition-colors text-xs sm:text-sm ${
                  zoomEnabled
                    ? 'border-emerald-400 bg-gray-800 text-white hover:bg-emerald-500/20'
                    : 'border-gray-700 bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                title="Zoom In"
              >
                ➕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
