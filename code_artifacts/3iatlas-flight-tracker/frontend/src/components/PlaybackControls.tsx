
/**
 * PlaybackControls Component
 * =============================
 * User controls for playback, speed, and camera
 */

import { useEffect, useRef, useState } from "react";
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
  layout?: 'floating' | 'inline';
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
  layout = 'floating',
}: PlaybackControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [speedMenuPos, setSpeedMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [viewMenuPos, setViewMenuPos] = useState<{ x: number; y: number } | null>(null);
  const speedButtonRef = useRef<HTMLButtonElement | null>(null);
  const viewButtonRef = useRef<HTMLButtonElement | null>(null);

  const isFloating = layout === 'floating';
  const containerClassName = isFloating
    ? "playback-controls fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-md text-white rounded-lg shadow-2xl"
    : "playback-controls w-full rounded-xl border border-emerald-400/20 bg-black/70 backdrop-blur";
  const containerStyle = isFloating
    ? {
        minWidth: "500px",
        maxWidth: "90vw",
        border: "1px solid rgba(0, 255, 136, 0.3)",
        zIndex: 99999,
        pointerEvents: "auto" as const,
      }
    : {
        pointerEvents: "auto" as const,
      };
  const innerWrapperClass = isFloating ? "p-3" : "mx-auto w-full max-w-5xl px-4 py-4";

  const updateSpeedMenuPosition = () => {
    if (!speedButtonRef.current) return;
    const rect = speedButtonRef.current.getBoundingClientRect();
    setSpeedMenuPos({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
  };

  const updateViewMenuPosition = () => {
    if (!viewButtonRef.current) return;
    const rect = viewButtonRef.current.getBoundingClientRect();
    setViewMenuPos({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.playback-controls') &&
        !target.closest('.playback-dropdown')
      ) {
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
    if (showSpeedMenu) {
      updateSpeedMenuPosition();
    } else {
      setSpeedMenuPos(null);
    }
  }, [showSpeedMenu]);

  useEffect(() => {
    if (showViewMenu) {
      updateViewMenuPosition();
    } else {
      setViewMenuPos(null);
    }
  }, [showViewMenu]);

  useEffect(() => {
    if (!showSpeedMenu && !showViewMenu) return;
    const handleReposition = () => {
      if (showSpeedMenu) updateSpeedMenuPosition();
      if (showViewMenu) updateViewMenuPosition();
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [showSpeedMenu, showViewMenu]);

  const speedOptions = [0.5, 1, 2, 5, 10, 25];
  const viewModeLabels = {
    explorer: "Explorer",
    "true-scale": "True Scale",
    "ride-atlas": "Ride With ATLAS",
  };

  const progressPercent = maxIndex > 0 ? Math.floor((currentIndex / maxIndex) * 100) : 0;

  const handleScrubStart = () => {
    if (isPlaying) {
      onPlayPause();
    }
  };

  return (
    <div className={containerClassName} style={containerStyle}>
      <div className={innerWrapperClass}>
        {/* Timeline Slider Row */}
        <div className={`mb-6 ${isFloating ? '' : 'max-w-4xl mx-auto'}`}>
          <div className="flex items-center gap-4 text-xs text-white/70">
            <span className="w-24 text-left sm:w-32">July 1, 2025</span>
            <input
              type="range"
              min="0"
              max={maxIndex}
              value={currentIndex}
              onMouseDown={handleScrubStart}
              onTouchStart={handleScrubStart}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              onMouseUp={() => {/* Keep paused or resume with another call */}}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-700"
              style={{ accentColor: '#00ff88' }}
            />
            <span className="w-24 text-right sm:w-32">March 31, 2026</span>
          </div>
          <div className="mt-2 text-center text-sm font-semibold text-white">
            {progressPercent}%
          </div>
        </div>

        {/* Control Buttons */}
        <div className={`flex flex-wrap items-center justify-center gap-3 ${isFloating ? '' : 'max-w-4xl mx-auto'}`}>
          {/* Reset Button */}
          <button
            onClick={onReset}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm whitespace-nowrap"
            title="Reset to beginning"
          >
            ⏮️ Reset
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={onPlayPause}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors font-semibold text-sm whitespace-nowrap"
          >
            {isPlaying ? "⏸️ Pause" : "▶️ Play"}
          </button>

          {/* Speed Control */}
          <div className="relative">
            <button
              ref={speedButtonRef}
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowViewMenu(false);
              }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              Speed: {speed}x
            </button>

            {showSpeedMenu && speedMenuPos &&
              createPortal(
                <div
                  className="playback-dropdown fixed bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-600"
                  style={{
                    zIndex: 999999,
                    pointerEvents: "auto",
                    top: speedMenuPos.y,
                    left: speedMenuPos.x,
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
              ref={viewButtonRef}
              onClick={() => {
                setShowViewMenu(!showViewMenu);
                setShowSpeedMenu(false);
              }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm whitespace-nowrap"
              title="Change view scale"
            >
              View: {viewModeLabels[viewMode]}
            </button>

            {showViewMenu && viewMenuPos &&
              createPortal(
                <div
                  className="playback-dropdown fixed bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-600"
                  style={{
                    zIndex: 999999,
                    pointerEvents: "auto",
                    top: viewMenuPos.y,
                    left: viewMenuPos.x,
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
        </div>
      </div>
    </div>
  );
}
