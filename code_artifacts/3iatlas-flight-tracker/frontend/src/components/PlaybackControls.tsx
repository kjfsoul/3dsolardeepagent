
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

  const dispatchZoomEvent = (type: 'zoom-in' | 'zoom-out') => {
    window.dispatchEvent(new CustomEvent(type));
  };

  const handleScrubStart = () => {
    if (isPlaying) {
      onPlayPause();
    }
  };

  return (
    <div className={containerClassName} style={containerStyle}>
      <div className={innerWrapperClass}>
        {/* Timeline Slider */}
        <div className={`mb-4 ${isFloating ? "" : "max-w-4xl mx-auto"}`}>
          <input
            type="range"
            min="0"
            max={maxIndex}
            value={currentIndex}
            onMouseDown={handleScrubStart}
            onTouchStart={handleScrubStart}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            onMouseUp={() => {/* Keep paused or resume with another call */}}
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
        <div className={`flex items-center justify-center gap-3 flex-wrap ${isFloating ? "" : "max-w-4xl mx-auto"}`}>
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

          {/* Zoom Controls */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs text-gray-300 font-medium">Zoom</div>
            <div className="flex gap-1">
              <button
                onClick={() => dispatchZoomEvent('zoom-out')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                title="Zoom Out"
              >
                ➖
              </button>
              <button
                onClick={() => dispatchZoomEvent('zoom-in')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
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
