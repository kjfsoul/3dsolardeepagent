"use client";

import { type ViewType } from "@/lib/view-manager";
import dynamic from "next/dynamic";
import React from "react"; // FIXED THE TYPO
import ControlPanel from "./ControlPanel";
import ViewSelector from "./ViewSelector";

const HistoricalFlightView = dynamic(() => import("./HistoricalFlightView"), {
  loading: () => <ViewLoadingFallback />,
  ssr: false,
});
const CurrentMomentView = dynamic(() => import("./CurrentMomentView"), {
  loading: () => <ViewLoadingFallback />,
  ssr: false,
});
// ... other view imports

interface AtlasViewsContainerProps {
  atlasData: any[];
  solarSystemData: Record<string, any[]>;
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onSpeedChange: (speed: number) => void;
  onTrajectoryChange: (trajectory: any) => void;
  onPlayPause: () => void;
  onReset: () => void;
  onIndexChange: (index: number) => void;
  dailyPosition: any;
  observerMetrics: any;
  currentDate: string;
  className?: string;
}

const AtlasViewsContainer: React.FC<AtlasViewsContainerProps> = (props) => {
  const {
    currentView,
    onViewChange,
    isPlaying,
    onPlayPause,
    onReset,
    currentDate,
    speed,
  } = props;

  const renderActiveView = () => {
    switch (currentView) {
      case "historical":
        return <HistoricalFlightView {...props} />;
      case "currentMoment":
        return (
          <div className="text-white p-4">
            Current Moment View
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center text-white">
            Select a view
          </div>
        );
    }
  };

  return (
    <div
      className={`w-full h-full bg-black grid grid-cols-[256px_1fr_256px] gap-4 p-4 ${props.className}`}
    >
      <div className="max-h-full overflow-y-auto">
        <ViewSelector activeView={currentView} onViewChange={onViewChange} />
      </div>
      <div className="relative w-full h-full rounded-xl overflow-hidden">
        {renderActiveView()}
      </div>
      <div className="max-h-full overflow-y-auto space-y-4">
        <ControlPanel
          title="Status"
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onReset={onReset}
        >
          {currentDate && (
            <div className="text-center">
              <div className="text-white/60 text-xs">Current Date</div>
              <div className="text-white font-mono text-sm">{currentDate}</div>
            </div>
          )}
        </ControlPanel>
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="text-white font-semibold text-sm mb-3">
            Performance
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-green-400 text-xs">FPS: 60</div>
            <div className="text-blue-400 text-xs">Speed: {speed}x</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-full bg-black">
    <p className="text-white">Loading View...</p>
  </div>
);

export default AtlasViewsContainer;
