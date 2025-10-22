
/**
 * PlaybackControls Component
 * =============================
 * User controls for playback, speed, and camera
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';

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
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

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
  onZoomIn,
  onZoomOut,
}: PlaybackControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const speedOptions = [0.5, 1, 2, 5, 10, 25];
  const viewModeLabels = {
    explorer: "Explorer",
    "true-scale": "True Scale",
    "ride-atlas": "Ride With ATLAS",
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white p-4 rounded-lg shadow-2xl"
      style={{
        minWidth: "600px",
        border: "1px solid rgba(0, 255, 136, 0.3)",
        zIndex: 9999, // Very high z-index to ensure controls are above everything
      }}
    >
      {/* Timeline Slider */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={maxIndex}
          value={currentIndex}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            accentColor: "#00ff88",
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>July 1, 2025</span>
          <span>{Math.floor((currentIndex / maxIndex) * 100)}%</span>
          <span>March 31, 2026</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4">
        {/* Reset Button */}
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          title="Reset to beginning"
        >
          ⏮️ Reset
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors font-semibold"
        >
          {isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>

        {/* Speed Control */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Speed: {speed}x
          </button>

          {showSpeedMenu &&
            createPortal(
              <div
                className="fixed bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                style={{
                  zIndex: 999999,
                  pointerEvents: "auto",
                  bottom: "120px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  minWidth: "150px",
                }}
              >
                {speedOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onSpeedChange(s);
                      setShowSpeedMenu(false);
                    }}
                    className={`block w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                      speed === s ? "bg-green-600" : ""
                    }`}
                    style={{ pointerEvents: "auto", zIndex: 1000000 }}
                  >
                    {s}x
                  </button>
                ))}
              </div>,
              document.body
            )}
        </div>

        {/* View Mode Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowViewMenu(!showViewMenu)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Change view scale"
          >
            View: {viewModeLabels[viewMode]}
          </button>

          {showViewMenu &&
            createPortal(
              <div
                className="fixed bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                style={{
                  zIndex: 999999,
                  pointerEvents: "auto",
                  bottom: "120px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  minWidth: "200px",
                }}
              >
                {Object.entries(viewModeLabels).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => {
                      onViewModeChange(
                        mode as "explorer" | "true-scale" | "ride-atlas"
                      );
                      setShowViewMenu(false);
                    }}
                    className={`block w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                      viewMode === mode ? "bg-green-600" : ""
                    }`}
                    style={{ pointerEvents: "auto", zIndex: 1000000 }}
                  >
                    {label}
                  </button>
                ))}
              </div>,
              document.body
            )}
        </div>

        {/* Zoom Controls */}
        {onZoomIn && onZoomOut && (
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs text-gray-300 font-medium">Zoom</div>
            <div className="flex gap-2">
              <button
                onClick={onZoomOut}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Zoom Out"
              >
                ➖
              </button>
              <button
                onClick={onZoomIn}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Zoom In"
              >
                ➕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
