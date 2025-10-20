"use client";

/**
 * AtlasFlightTrackerContainer - Container for Enhanced Flight Tracker
 * 
 * Manages:
 * - Trajectory data loading
 * - Playback state (play/pause, speed, position)
 * - Animation loop
 * - Data validation
 */

import React, { useEffect, useRef, useState } from "react";
import HistoricalFlightViewEnhanced from "./HistoricalFlightViewEnhanced";

interface VectorData {
  jd?: number;
  date: string;
  position: number[] | { x: number; y: number; z: number };
  velocity: number[] | { vx: number; vy: number; vz: number };
}

interface Milestone {
  name: string;
  date: string;
  description: string;
  position: number[];
}

interface TrajectoryData {
  atlas: VectorData[];
  earth: VectorData[];
  mars: VectorData[];
  jupiter: VectorData[];
  milestones: Milestone[];
}

const AtlasFlightTrackerContainer: React.FC = () => {
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryData | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Educational panel state
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Load trajectory data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load enhanced trajectory data first
        let response = await fetch("/trajectory_enhanced.json");
        
        if (!response.ok) {
          // Fallback to original trajectory data
          console.warn("Enhanced data not found, falling back to original");
          response = await fetch("/trajectory.json");
        }

        if (!response.ok) {
          throw new Error("Failed to load trajectory data");
        }

        const data = await response.json();

        // Validate data structure
        if (!data.atlas || data.atlas.length === 0) {
          throw new Error("Invalid trajectory data structure");
        }

        setTrajectoryData(data as TrajectoryData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading trajectory data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !trajectoryData) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (currentTime: number) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = currentTime;
      }

      const deltaTime = currentTime - lastUpdateTimeRef.current;

      // Update at 60 FPS base rate, adjusted by speed
      if (deltaTime >= 16.67 / speed) {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= trajectoryData.atlas.length) {
            setIsPlaying(false);
            return trajectoryData.atlas.length - 1;
          }
          return next;
        });
        lastUpdateTimeRef.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed, trajectoryData]);

  // Handlers
  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
    lastUpdateTimeRef.current = 0;
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    lastUpdateTimeRef.current = 0;
  };

  const handleIndexChange = (index: number) => {
    setIsPlaying(false);
    setCurrentIndex(index);
    lastUpdateTimeRef.current = 0;
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    lastUpdateTimeRef.current = 0;
  };

  // Educational panel handlers
  const handleMilestoneClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone.name);
    setIsPanelOpen(true);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-400 mx-auto mb-6"></div>
          <p className="text-white text-xl font-semibold">
            Loading 3I/ATLAS Flight Tracker...
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Initializing trajectory data and 3D visualization
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !trajectoryData) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 border border-red-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-red-400 mb-2">
              Failed to Load Flight Tracker
            </h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HistoricalFlightViewEnhanced
      trajectoryData={trajectoryData}
      isPlaying={isPlaying}
      speed={speed}
      currentIndex={currentIndex}
      onPlayPause={handlePlayPause}
      onReset={handleReset}
      onIndexChange={handleIndexChange}
      onSpeedChange={handleSpeedChange}
      selectedMilestone={selectedMilestone}
      isPanelOpen={isPanelOpen}
      onMilestoneClick={handleMilestoneClick}
      onPanelClose={handlePanelClose}
    />
  );
};

export default AtlasFlightTrackerContainer;
