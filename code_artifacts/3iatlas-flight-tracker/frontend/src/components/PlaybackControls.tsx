
/**
 * PlaybackControls Component
 * =============================
 * User controls for playback, speed, and camera
 */

import { useState } from 'react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  speed: number;
  currentIndex: number;
  maxIndex: number;
  followMode: boolean;
  viewMode: 'explorer' | 'true-scale' | 'ride-atlas';
  onPlayPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (index: number) => void;
  onFollowModeToggle: () => void;
  onViewModeChange: (mode: 'explorer' | 'true-scale' | 'ride-atlas') => void;
}

export function PlaybackControls({
  isPlaying,
  speed,
  currentIndex,
  maxIndex,
  followMode,
  viewMode,
  onPlayPause,
  onReset,
  onSpeedChange,
  onSeek,
  onFollowModeToggle,
  onViewModeChange,
}: PlaybackControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const speedOptions = [0.5, 1, 2, 5, 10, 25];
  const viewModeLabels = {
    'explorer': 'Explorer',
    'true-scale': 'True Scale', 
    'ride-atlas': 'Ride With ATLAS'
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md text-white p-4 rounded-lg z-10"
      style={{
        minWidth: '600px',
        border: '1px solid rgba(0, 255, 136, 0.3)',
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
            accentColor: '#00ff88',
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>July 1, 2025</span>
          <span>
            {Math.floor((currentIndex / maxIndex) * 100)}%
          </span>
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
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>

        {/* Speed Control */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Speed: {speed}x
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {speedOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onSpeedChange(s);
                    setShowSpeedMenu(false);
                  }}
                  className={`block w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                    speed === s ? 'bg-green-600' : ''
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
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

          {showViewMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {Object.entries(viewModeLabels).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => {
                    onViewModeChange(mode as 'explorer' | 'true-scale' | 'ride-atlas');
                    setShowViewMenu(false);
                  }}
                  className={`block w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                    viewMode === mode ? 'bg-green-600' : ''
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Follow Mode Toggle */}
        <button
          onClick={onFollowModeToggle}
          className={`px-4 py-2 rounded-lg transition-colors ${
            followMode
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Toggle 'Riding with ATLAS' camera"
        >
          {followMode ? '🎥 Following' : '🎥 Free Cam'}
        </button>
      </div>
    </div>
  );
}
